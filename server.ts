import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import {
  RoleId,
  GamePhase,
  ClientGameState,
  ClientAction,
  ThiefSwapHistory,
  HunterRevengeInfo,
  ROLES,
} from './src/types/game.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface InternalPlayer {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  ws?: WebSocket;
  initialRole?: RoleId;
  currentRole?: RoleId;
  votedFor?: string | null; // playerId or 'PEACE'
  isExecuted?: boolean;
  nightSubmitted?: boolean;
  seerChoice?: { targetPlayerId?: string; checkGraveyard?: boolean };
  thiefChoice?: { targetPlayerId: string; timestamp: number };
}

interface InternalRoom {
  roomId: string;
  createdAt: number;
  phase: GamePhase;
  players: InternalPlayer[];
  roleCardsConfig: Record<RoleId, number>;
  graveyard: RoleId[];
  thiefSwaps: ThiefSwapHistory[];
  discussionStartedAt?: number;
  executionStartedAt?: number;
  executedPlayerIds: string[];
  isPeaceVillage: boolean;
  hunterRevengeNeededFor?: { hunterId: string; hunterName: string } | null;
  hunterRevengeResult?: HunterRevengeInfo | null;
  winnerTeam?: 'villager' | 'werewolf' | 'tanner';
  winnerTitle?: string;
  winnerReason?: string;
}

const rooms = new Map<string, InternalRoom>();

function getDefaultRoleConfig(playerCount: number): Record<RoleId, number> {
  const total = playerCount + 2;
  const config: Record<RoleId, number> = {
    villager: 0,
    seer: 1,
    thief: 1,
    hunter: 0,
    werewolf: 1,
    great_werewolf: 0,
    tanner: 0,
  };

  if (playerCount <= 3) {
    // 3 players = 5 cards
    config.werewolf = 2;
    config.villager = 1;
  } else if (playerCount === 4) {
    // 4 players = 6 cards
    config.werewolf = 2;
    config.villager = 2;
  } else if (playerCount === 5) {
    // 5 players = 7 cards
    config.werewolf = 1;
    config.great_werewolf = 1;
    config.hunter = 1;
    config.villager = 1;
    config.tanner = 1;
  } else if (playerCount === 6) {
    // 6 players = 8 cards
    config.werewolf = 1;
    config.great_werewolf = 1;
    config.hunter = 1;
    config.villager = 2;
    config.tanner = 1;
  } else {
    // 7 players = 9 cards
    config.werewolf = 1;
    config.great_werewolf = 1;
    config.hunter = 1;
    config.villager = 3;
    config.tanner = 1;
  }

  // Adjust to make sure sum equals total
  let currentSum = Object.values(config).reduce((a, b) => a + b, 0);
  while (currentSum < total) {
    config.villager++;
    currentSum++;
  }
  while (currentSum > total && config.villager > 0) {
    config.villager--;
    currentSum--;
  }

  return config;
}

function generateRoomCode(): string {
  // Generate 2-digit numeric codes: 10 to 99
  const num = Math.floor(Math.random() * 90) + 10;
  const code = num.toString();
  if (rooms.has(code)) {
    for (let i = 10; i <= 99; i++) {
      const c = i.toString();
      if (!rooms.has(c)) return c;
    }
  }
  return code;
}

function broadcastRoom(room: InternalRoom) {
  room.players.forEach((player) => {
    if (player.ws && player.ws.readyState === WebSocket.OPEN) {
      const sanitized = getSanitizedStateForPlayer(room, player);
      player.ws.send(JSON.stringify(sanitized));
    }
  });
}

function getSanitizedStateForPlayer(room: InternalRoom, player: InternalPlayer): ClientGameState {
  const totalRequired = room.players.length + 2;

  // Werewolf teammates
  let myKnownTeammates: Array<{ id: string; name: string }> | undefined;
  if (
    room.phase === 'NIGHT' &&
    (player.initialRole === 'werewolf' || player.initialRole === 'great_werewolf')
  ) {
    myKnownTeammates = room.players
      .filter(
        (p) =>
          p.id !== player.id &&
          (p.initialRole === 'werewolf' || p.initialRole === 'great_werewolf')
      )
      .map((p) => ({ id: p.id, name: p.name }));
  }

  // Graveyard visibility
  let myKnownGraveyard: RoleId[] | undefined;
  if (room.phase === 'NIGHT') {
    if (player.initialRole === 'great_werewolf') {
      myKnownGraveyard = [...room.graveyard];
    } else if (player.initialRole === 'seer' && player.seerChoice?.checkGraveyard) {
      myKnownGraveyard = [...room.graveyard];
    }
  }

  // Night target result (for Seer or Thief)
  let myNightTargetResult:
    | { targetId: string; targetName: string; role: RoleId }
    | undefined;
  if (room.phase === 'NIGHT') {
    if (player.initialRole === 'seer' && player.seerChoice?.targetPlayerId) {
      const target = room.players.find((p) => p.id === player.seerChoice?.targetPlayerId);
      if (target && target.initialRole) {
        myNightTargetResult = {
          targetId: target.id,
          targetName: target.name,
          role: target.initialRole,
        };
      }
    } else if (player.initialRole === 'thief' && player.thiefChoice?.targetPlayerId) {
      const target = room.players.find((p) => p.id === player.thiefChoice?.targetPlayerId);
      if (target && target.initialRole) {
        myNightTargetResult = {
          targetId: target.id,
          targetName: target.name,
          role: target.initialRole,
        };
      }
    }
  }

  // Discussion & Voting counts
  const discussionReadyCount = room.players.filter((p) => p.isReady).length;
  const votingReadyCount = room.players.filter((p) => p.votedFor !== undefined).length;

  const publicPlayers = room.players.map((p) => ({
    id: p.id,
    name: p.name,
    isHost: p.isHost,
    isReady: p.isReady,
    isConnected: p.isConnected,
    isExecuted: p.isExecuted,
  }));

  // Execution state
  const executionState =
    room.phase === 'EXECUTION'
      ? {
          executedPlayerIds: room.executedPlayerIds,
          isPeaceVillage: room.isPeaceVillage,
          executionStartedAt: room.executionStartedAt || Date.now(),
          fireStarted: Date.now() - (room.executionStartedAt || Date.now()) >= 5000,
          hunterRevengeNeededFor: room.hunterRevengeNeededFor,
          hunterRevengeResult: room.hunterRevengeResult,
        }
      : undefined;

  // Result state
  const resultInfo =
    room.phase === 'RESULT'
      ? {
          winnerTeam: room.winnerTeam!,
          winnerTitle: room.winnerTitle!,
          winnerReason: room.winnerReason!,
          graveyard: room.graveyard,
          thiefSwaps: room.thiefSwaps,
          hunterRevenge: room.hunterRevengeResult,
          allPlayers: room.players.map((p) => {
            let votedForName = '未投票';
            if (p.votedFor === 'PEACE') {
              votedForName = '🕊️ 平和村';
            } else if (p.votedFor) {
              const target = room.players.find((pl) => pl.id === p.votedFor);
              votedForName = target ? target.name : '不明';
            }
            const wasSwapped = room.thiefSwaps.some((s) => s.targetId === p.id);
            return {
              id: p.id,
              name: p.name,
              initialRole: p.initialRole!,
              finalRole: p.currentRole!,
              votedFor: votedForName,
              isExecuted: !!p.isExecuted,
              swappedByThief: wasSwapped,
            };
          }),
        }
      : undefined;

  return {
    roomId: room.roomId,
    phase: room.phase,
    myPlayerId: player.id,
    isHost: player.isHost,
    players: publicPlayers,
    roleCardsConfig: room.roleCardsConfig,
    totalRequiredCards: totalRequired,
    myInitialRole: room.phase !== 'LOBBY' && room.phase !== 'ROLE_CONFIG' ? player.initialRole : undefined,
    myKnownTeammates,
    myKnownGraveyard,
    myNightTargetResult,
    hasSubmittedNightAction: !!player.nightSubmitted,
    discussionStartedAt: room.discussionStartedAt,
    discussionReadyCount,
    myDiscussionReady: player.isReady,
    votingReadyCount,
    myVoteTarget: player.votedFor || null,
    executionState,
    resultInfo,
  };
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function processNightCompletion(room: InternalRoom) {
  // Sort thief actions by timestamp
  const thieves = room.players
    .filter((p) => p.initialRole === 'thief' && p.thiefChoice)
    .sort((a, b) => (a.thiefChoice!.timestamp || 0) - (b.thiefChoice!.timestamp || 0));

  const thiefSwaps: ThiefSwapHistory[] = [];

  for (const thief of thieves) {
    const targetId = thief.thiefChoice!.targetPlayerId;
    const target = room.players.find((p) => p.id === targetId);
    if (target && target.currentRole && thief.currentRole) {
      const stolenRole = target.currentRole;
      const thiefOriginalRole = thief.currentRole;

      target.currentRole = thiefOriginalRole;
      thief.currentRole = stolenRole;

      thiefSwaps.push({
        thiefId: thief.id,
        thiefName: thief.name,
        targetId: target.id,
        targetName: target.name,
        stolenRole,
      });
    }
  }

  room.thiefSwaps = thiefSwaps;

  // Reset ready flags for day discussion
  room.players.forEach((p) => {
    p.isReady = false;
  });

  room.phase = 'DAY_DISCUSSION';
  room.discussionStartedAt = Date.now();
  broadcastRoom(room);
}

function processVotingCompletion(room: InternalRoom) {
  // Count votes
  const voteCounts = new Map<string, number>();
  room.players.forEach((p) => {
    const target = p.votedFor || 'PEACE';
    voteCounts.set(target, (voteCounts.get(target) || 0) + 1);
  });

  const totalPlayers = room.players.length;
  const peaceVotes = voteCounts.get('PEACE') || 0;

  // Check if ALL players received the same vote count
  // E.g. 1 vote each for everyone
  const playerVoteEntries = room.players.map((p) => ({
    id: p.id,
    votes: voteCounts.get(p.id) || 0,
  }));

  const allPlayerVotesEqual =
    playerVoteEntries.length > 0 &&
    playerVoteEntries.every((entry) => entry.votes === playerVoteEntries[0].votes) &&
    peaceVotes === 0;

  let executedIds: string[] = [];
  let isPeace = false;

  if (allPlayerVotesEqual && totalPlayers > 1) {
    // "全員の投票数が同じ場合は平和村とし、誰も処刑しない"
    isPeace = true;
    executedIds = [];
  } else {
    // Find highest vote count
    let maxCount = 0;
    voteCounts.forEach((count) => {
      if (count > maxCount) maxCount = count;
    });

    if (peaceVotes === maxCount && peaceVotes > 0) {
      // Peace Village got highest votes!
      // Check if any player also tied with peace: rule specifies "平和村の場合は「平和村に投票された」と表示する"
      isPeace = true;
      executedIds = [];
    } else {
      // Find all players who received maxCount
      const topPlayers = playerVoteEntries.filter((e) => e.votes === maxCount);
      if (topPlayers.length > 0) {
        executedIds = topPlayers.map((tp) => tp.id);
      }
    }
  }

  room.executedPlayerIds = executedIds;
  room.isPeaceVillage = isPeace;
  room.players.forEach((p) => {
    p.isExecuted = executedIds.includes(p.id);
  });

  room.phase = 'EXECUTION';
  room.executionStartedAt = Date.now();
  room.hunterRevengeNeededFor = null;
  room.hunterRevengeResult = null;

  // Check if any executed player has the Hunter role (final role)
  const executedHunter = room.players.find(
    (p) => executedIds.includes(p.id) && p.currentRole === 'hunter'
  );

  if (executedHunter) {
    room.hunterRevengeNeededFor = {
      hunterId: executedHunter.id,
      hunterName: executedHunter.name,
    };
  }

  broadcastRoom(room);

  // If no hunter revenge is needed, automatically schedule evaluation after fire animation (6.5s)
  if (!executedHunter) {
    setTimeout(() => {
      if (room.phase === 'EXECUTION') {
        evaluateGameResult(room);
      }
    }, 7000);
  }
}

function evaluateGameResult(room: InternalRoom) {
  const executedPlayers = room.players.filter((p) => p.isExecuted);
  const revenge = room.hunterRevengeResult;

  // 1. Hunter revenge rules:
  // "道連れで処刑されたプレイヤーが人狼陣営だった場合、村人陣営の勝利とする。
  //  道連れで処刑されたプレイヤーが吊人だった場合は、人狼陣営の勝利とする。"
  if (revenge) {
    const revengeRole = revenge.targetRole;
    if (revengeRole === 'werewolf' || revengeRole === 'great_werewolf') {
      room.winnerTeam = 'villager';
      room.winnerTitle = '村人陣営の勝利！';
      room.winnerReason = `狩人【${revenge.hunterName}】が道連れにした【${revenge.targetName}】は人狼陣営でした！村人陣営の逆転勝利！`;
      finishGame(room);
      return;
    } else if (revengeRole === 'tanner') {
      room.winnerTeam = 'werewolf';
      room.winnerTitle = '人狼陣営の勝利！';
      room.winnerReason = `狩人【${revenge.hunterName}】の道連れが吊人【${revenge.targetName}】だったため、人狼陣営の勝利となりました！`;
      finishGame(room);
      return;
    }
  }

  // 2. Tanner condition:
  // "自分が処刑された場合、吊人陣営の勝利。"
  const executedTanner = executedPlayers.find((p) => p.currentRole === 'tanner');
  if (executedTanner) {
    room.winnerTeam = 'tanner';
    room.winnerTitle = '吊人陣営の単独勝利！';
    room.winnerReason = `吊人（てるてる）【${executedTanner.name}】が処刑されたため、吊人の単独勝利です！`;
    finishGame(room);
    return;
  }

  // 3. Werewolf condition:
  // "人狼・大狼が1人も処刑されなかった場合、人狼陣営の勝利。"
  // Conversely, if at least one Werewolf or Great Werewolf was executed:
  const executedWerewolf = executedPlayers.find(
    (p) => p.currentRole === 'werewolf' || p.currentRole === 'great_werewolf'
  );

  if (executedWerewolf) {
    room.winnerTeam = 'villager';
    room.winnerTitle = '村人陣営の勝利！';
    room.winnerReason = `人狼陣営の【${executedWerewolf.name}】が処刑されたため、村人陣営の勝利です！`;
    finishGame(room);
    return;
  }

  // If no werewolves were executed:
  // Were there any werewolves among the living players?
  const werewolvesInVillage = room.players.filter(
    (p) => p.currentRole === 'werewolf' || p.currentRole === 'great_werewolf'
  );

  if (werewolvesInVillage.length === 0 && room.isPeaceVillage) {
    // Peace Village and no werewolves existed:
    room.winnerTeam = 'villager';
    room.winnerTitle = '村人陣営の勝利！（平和村達成）';
    room.winnerReason =
      '村に人狼・大狼が1人もおらず、誰も処刑されなかったため、平和村となり村人陣営の勝利です！';
  } else if (werewolvesInVillage.length > 0) {
    room.winnerTeam = 'werewolf';
    room.winnerTitle = '人狼陣営の勝利！';
    room.winnerReason =
      '人狼・大狼が1人も処刑されなかったため、人狼陣営の完全勝利です！';
  } else {
    // No werewolves, but innocent villager was executed:
    room.winnerTeam = 'werewolf';
    room.winnerTitle = '人狼陣営の勝利！';
    room.winnerReason =
      '人狼がいない平和村だったにもかかわらず、無実の村人を処刑してしまったため敗北しました。';
  }

  finishGame(room);
}

function finishGame(room: InternalRoom) {
  room.phase = 'RESULT';
  broadcastRoom(room);
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json());

  // Serve public static assets (including ogp_banner.jpg)
  app.use(express.static(path.resolve(__dirname, 'public'), { maxAge: '1d' }));

  function isSocialCrawler(userAgent?: string): boolean {
    if (!userAgent) return false;
    const ua = userAgent.toLowerCase();
    // Real users on mobile LINE in-app browser have "mobile", "safari", and "line/XX"
    // They are REAL HUMAN USERS, not link crawlers!
    if (ua.includes('mobile') && ua.includes('safari') && !ua.includes('spider') && !ua.includes('bot')) {
      return false;
    }
    return (
      ua.includes('linespider') ||
      ua.includes('line-poker') ||
      ua.includes('facebookexternalhit') ||
      ua.includes('facebot') ||
      ua.includes('twitterbot') ||
      ua.includes('slackbot') ||
      ua.includes('discordbot') ||
      ua.includes('whatsapp') ||
      ua.includes('telegrambot') ||
      ua.includes('skypeuripreview') ||
      ua.includes('applebot') ||
      ua.includes('googlebot') ||
      ua.includes('bingbot') ||
      ua.includes('crawler') ||
      ua.includes('spider')
    );
  }

  function renderOgpHtml(req: express.Request): string {
    const host =
      (req.headers['x-forwarded-host'] as string) ||
      req.get('host') ||
      'ais-pre-z5hj5kj2d4v2rofolad7gz-378023332687.asia-northeast1.run.app';
    const protocol = (req.headers['x-forwarded-proto'] as string) || 'https';
    const baseUrl = `${protocol}://${host}`;
    const ogImageUrl = `${baseUrl}/ogp_banner.jpg`;
    const rawRoom = typeof req.query.room === 'string' ? req.query.room.replace(/[^0-9]/g, '').slice(0, 2) : '';
    const targetGameUrl = rawRoom ? `/?room=${rawRoom}&from_entry=1` : '/';
    const canonicalUrl = `${baseUrl}${req.originalUrl}`;

    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>わんナイト人狼</title>
  <meta name="description" content="みんなで遊べるオンライン推理ゲーム">
  
  <!-- OpenGraph for LINE and Social Networks -->
  <meta property="og:title" content="わんナイト人狼">
  <meta property="og:description" content="みんなで遊べるオンライン推理ゲーム">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="わんナイト人狼">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="わんナイト人狼">
  <meta name="twitter:description" content="みんなで遊べるオンライン推理ゲーム">
  <meta name="twitter:image" content="${ogImageUrl}">
  <link rel="icon" type="image/jpeg" href="/ogp_banner.jpg">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 16px;
      background: #020617;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      max-width: 420px;
      width: 100%;
      background: #0f172a;
      border: 2px solid rgba(245, 158, 11, 0.4);
      border-radius: 28px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
      text-align: center;
    }
    .banner {
      width: 100%;
      aspect-ratio: 16 / 9;
      object-fit: cover;
      display: block;
    }
    .content {
      padding: 24px 20px;
    }
    h1 {
      margin: 0 0 6px;
      font-size: 26px;
      color: #fde68a;
      font-weight: 900;
      letter-spacing: -0.02em;
    }
    p {
      margin: 0 0 18px;
      font-size: 14px;
      color: #94a3b8;
      font-weight: 700;
    }
    .room-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.4);
      border-radius: 14px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 800;
      margin-bottom: 20px;
    }
    .btn {
      display: block;
      width: 100%;
      background: linear-gradient(135deg, #f59e0b, #ea580c);
      color: #020617;
      font-weight: 900;
      font-size: 16px;
      padding: 16px;
      border-radius: 18px;
      text-decoration: none;
      box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.4);
      cursor: pointer;
      border: none;
    }
    .btn:active {
      transform: scale(0.98);
    }
    .footer {
      margin-top: 16px;
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="card">
    <img src="${ogImageUrl}" alt="わんナイト人狼" class="banner" />
    <div class="content">
      <h1>わんナイト人狼 🐾</h1>
      <p>みんなで遊べるオンライン推理ゲーム</p>
      ${
        rawRoom
          ? `<div class="room-badge">🐾 部屋コード: <strong style="font-size:18px; color:#fef08a;">${rawRoom}</strong></div>`
          : ''
      }
      <a href="${targetGameUrl}" class="btn">
        ${rawRoom ? `部屋【${rawRoom}】に参加する 🐾` : 'ゲームに参加する 🐾'}
      </a>
      <div class="footer">ブラウザでそのまま遊べる完全無料ワンコ人狼</div>
    </div>
  </div>
</body>
</html>`;
  }

  // Public entry route for LINE / SNS crawler & preview
  app.get('/entry', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(renderOgpHtml(req));
  });

  // Crawler interceptor on root paths: only triggers for real bot crawlers, never for real users
  app.get(['/', '/index.html'], (req, res, next) => {
    if (!req.query.from_entry && isSocialCrawler(req.headers['user-agent'])) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(renderOgpHtml(req));
    }
    next();
  });

  // Simple room check API
  app.get('/api/room/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      return res.status(404).json({ exists: false });
    }
    return res.json({
      exists: true,
      playerCount: room.players.length,
      phase: room.phase,
    });
  });

  wss.on('connection', (ws: WebSocket) => {
    let currentRoomId: string | null = null;
    let currentPlayerId: string | null = null;

    ws.on('message', (data: string) => {
      try {
        const action: ClientAction = JSON.parse(data.toString());

        if (action.type === 'JOIN_ROOM') {
          const isCreating = !action.roomId || !action.roomId.trim();
          let roomId = '';
          if (isCreating) {
            roomId = generateRoomCode();
          } else {
            roomId = action.roomId.replace(/[^0-9]/g, '').slice(0, 2);
          }

          if (!isCreating && (!roomId || roomId.length !== 2)) {
            ws.send(
              JSON.stringify({
                error: '部屋コードは2桁の数字（例: 42）を入力してくださいワン。',
              })
            );
            return;
          }

          let room = rooms.get(roomId);

          if (!room) {
            if (!isCreating) {
              ws.send(
                JSON.stringify({
                  error: `部屋「${roomId}」が見つかりませんでした。部屋主が作成した同じURL（公開版URL）を開いているかご確認ください。`,
                })
              );
              return;
            }

            // Create new room
            room = {
              roomId,
              createdAt: Date.now(),
              phase: 'LOBBY',
              players: [],
              roleCardsConfig: getDefaultRoleConfig(3),
              graveyard: [],
              thiefSwaps: [],
              executedPlayerIds: [],
              isPeaceVillage: false,
            };
            rooms.set(roomId, room);
          }

          let player: InternalPlayer | undefined;
          if (action.playerId) {
            player = room.players.find((p) => p.id === action.playerId);
          }

          if (player) {
            // Reconnect
            player.name = action.playerName || player.name;
            player.isConnected = true;
            player.ws = ws;
          } else {
            // Check if player limit reached (max 7)
            if (room.players.length >= 7) {
              ws.send(JSON.stringify({ error: '定員（7名）に達しています' }));
              return;
            }

            const isFirst = room.players.length === 0;
            player = {
              id: action.playerId || `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name: action.playerName || `プレイヤー${room.players.length + 1}`,
              isHost: isFirst,
              isReady: false,
              isConnected: true,
              ws,
            };
            room.players.push(player);
            room.roleCardsConfig = getDefaultRoleConfig(room.players.length);
          }

          currentRoomId = roomId;
          currentPlayerId = player.id;

          broadcastRoom(room);
          return;
        }

        if (!currentRoomId || !currentPlayerId) return;
        const room = rooms.get(currentRoomId);
        if (!room) return;
        const player = room.players.find((p) => p.id === currentPlayerId);
        if (!player) return;

        if (action.type === 'START_ROLE_CONFIG') {
          if (!player.isHost) return;
          if (room.players.length < 3 || room.players.length > 7) return;
          room.phase = 'ROLE_CONFIG';
          room.roleCardsConfig = getDefaultRoleConfig(room.players.length);
          broadcastRoom(room);
          return;
        }

        if (action.type === 'SET_ROLE_CONFIG') {
          if (!player.isHost) return;
          room.roleCardsConfig = action.config;
          broadcastRoom(room);
          return;
        }

        if (action.type === 'START_NIGHT') {
          if (!player.isHost) return;
          const totalCards = Object.values(room.roleCardsConfig).reduce((a, b) => a + b, 0);
          const required = room.players.length + 2;
          if (totalCards !== required) return;

          // Assemble card deck
          const deck: RoleId[] = [];
          for (const [roleId, count] of Object.entries(room.roleCardsConfig)) {
            for (let i = 0; i < count; i++) {
              deck.push(roleId as RoleId);
            }
          }

          const shuffled = shuffle(deck);

          // Deal cards
          room.players.forEach((p, idx) => {
            p.initialRole = shuffled[idx];
            p.currentRole = shuffled[idx];
            p.isReady = false;
            p.nightSubmitted = false;
            p.seerChoice = undefined;
            p.thiefChoice = undefined;
            p.votedFor = null;
            p.isExecuted = false;
          });

          room.graveyard = [shuffled[room.players.length], shuffled[room.players.length + 1]];
          room.thiefSwaps = [];
          room.phase = 'NIGHT';

          broadcastRoom(room);
          return;
        }

        if (action.type === 'SUBMIT_NIGHT_ACTION') {
          if (room.phase !== 'NIGHT') return;

          if (action.seerChoice) {
            player.seerChoice = action.seerChoice;
          }
          if (action.thiefChoice) {
            player.thiefChoice = {
              targetPlayerId: action.thiefChoice.targetPlayerId,
              timestamp: Date.now(),
            };
          }

          if (action.isReady === true) {
            player.isReady = true;
            player.nightSubmitted = true;
          } else {
            // Player just made an action/choice, allow them to view results without completing night
            player.isReady = false;
            player.nightSubmitted = false;
          }

          // Check if all players completed night actions
          const allNightReady = room.players.every((p) => p.nightSubmitted);
          if (allNightReady) {
            processNightCompletion(room);
          } else {
            broadcastRoom(room);
          }
          return;
        }

        if (action.type === 'END_DISCUSSION') {
          if (room.phase !== 'DAY_DISCUSSION') return;
          player.isReady = true;

          // If all ready, go to VOTING
          const allDiscussionReady = room.players.every((p) => p.isReady);
          if (allDiscussionReady) {
            room.phase = 'VOTING';
            room.players.forEach((p) => {
              p.isReady = false;
              p.votedFor = null;
            });
          }
          broadcastRoom(room);
          return;
        }

        if (action.type === 'SUBMIT_VOTE') {
          if (room.phase !== 'VOTING') return;
          // Valid target check: cannot vote for self unless PEACE
          if (action.targetId === player.id) return;

          player.votedFor = action.targetId;
          player.isReady = true;

          // Check if all voted
          const allVoted = room.players.every((p) => p.votedFor !== null && p.votedFor !== undefined);
          if (allVoted) {
            processVotingCompletion(room);
          } else {
            broadcastRoom(room);
          }
          return;
        }

        if (action.type === 'SUBMIT_HUNTER_REVENGE') {
          if (room.phase !== 'EXECUTION') return;
          if (room.hunterRevengeNeededFor?.hunterId !== player.id) return;

          const target = room.players.find((p) => p.id === action.targetPlayerId);
          if (!target || target.id === player.id) return;

          target.isExecuted = true;
          if (!room.executedPlayerIds.includes(target.id)) {
            room.executedPlayerIds.push(target.id);
          }

          room.hunterRevengeResult = {
            hunterId: player.id,
            hunterName: player.name,
            targetId: target.id,
            targetName: target.name,
            targetRole: target.currentRole!,
          };
          room.hunterRevengeNeededFor = null;

          broadcastRoom(room);

          // Proceed to evaluate result
          setTimeout(() => {
            evaluateGameResult(room);
          }, 3500);
          return;
        }

        if (action.type === 'KICK_PLAYER') {
          if (!player.isHost) {
            ws.send(JSON.stringify({ error: '部屋主のみがプレイヤーを追放できます。' }));
            return;
          }
          if (action.targetPlayerId === player.id) {
            ws.send(JSON.stringify({ error: '自分自身を追放することはできません。' }));
            return;
          }

          const targetIndex = room.players.findIndex((p) => p.id === action.targetPlayerId);
          if (targetIndex !== -1) {
            const kicked = room.players[targetIndex];
            if (kicked.ws && kicked.ws.readyState === WebSocket.OPEN) {
              kicked.ws.send(
                JSON.stringify({
                  kicked: true,
                  error: '部屋主によって部屋から追放されましたワン。',
                })
              );
            }
            room.players.splice(targetIndex, 1);
            room.roleCardsConfig = getDefaultRoleConfig(room.players.length);
            broadcastRoom(room);
          }
          return;
        }

        if (action.type === 'NEW_GAME') {
          // Reset to LOBBY (the screen where participating players gather) while keeping all current players in room
          room.phase = 'LOBBY';
          room.roleCardsConfig = getDefaultRoleConfig(room.players.length);
          room.graveyard = [];
          room.thiefSwaps = [];
          room.executedPlayerIds = [];
          room.isPeaceVillage = false;
          room.hunterRevengeNeededFor = null;
          room.hunterRevengeResult = null;
          room.winnerTeam = undefined;
          room.winnerTitle = undefined;
          room.winnerReason = undefined;

          room.players.forEach((p) => {
            p.initialRole = undefined;
            p.currentRole = undefined;
            p.isReady = false;
            p.nightSubmitted = false;
            p.seerChoice = undefined;
            p.thiefChoice = undefined;
            p.votedFor = null;
            p.isExecuted = false;
          });

          broadcastRoom(room);
          return;
        }
      } catch (err) {
        console.error('WebSocket message handling error:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoomId && currentPlayerId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          const player = room.players.find((p) => p.id === currentPlayerId);
          if (player) {
            player.isConnected = false;
            player.ws = undefined;
          }
          // If in LOBBY and disconnected, allow host reassignment if needed
          if (room.phase === 'LOBBY') {
            const connectedPlayers = room.players.filter((p) => p.isConnected);
            if (connectedPlayers.length > 0 && !connectedPlayers.some((p) => p.isHost)) {
              connectedPlayers[0].isHost = true;
            }
          }
          broadcastRoom(room);
        }
      }
    });
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🐺 Werewolf Game Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
