export type RoleId =
  | 'villager'
  | 'seer'
  | 'thief'
  | 'hunter'
  | 'werewolf'
  | 'great_werewolf'
  | 'tanner';

export type Team = 'villager' | 'werewolf' | 'tanner';

export interface RoleDefinition {
  id: RoleId;
  name: string;
  nameEn: string;
  team: Team;
  teamName: string;
  description: string;
  nightInstruction: string;
  color: string;
  accentBg: string;
  borderClass: string;
  badgeClass: string;
  icon: string;
}

export const ROLES: Record<RoleId, RoleDefinition> = {
  villager: {
    id: 'villager',
    name: '村人',
    nameEn: 'Villager',
    team: 'villager',
    teamName: '村人陣営',
    description: '特殊な能力はありません。みんなと協力して、村を守りましょう。',
    nightInstruction: '夜にアクションはありません。静かに夜が明けるのを待ちましょう。',
    color: 'emerald',
    accentBg: 'from-emerald-950 to-slate-950',
    borderClass: 'border-emerald-500/60',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
    icon: '🧑‍🌾',
  },
  seer: {
    id: 'seer',
    name: '占い師',
    nameEn: 'Seer',
    team: 'villager',
    teamName: '村人陣営',
    description: '誰かひとりを占うか、墓地のカードを見ることができます。',
    nightInstruction: '他プレイヤー1人の役職か、墓地にある2枚のどちらかを選んで占ってください。',
    color: 'emerald',
    accentBg: 'from-emerald-950/60 to-slate-950',
    borderClass: 'border-emerald-500/60',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
    icon: '🔮',
  },
  thief: {
    id: 'thief',
    name: '怪盗',
    nameEn: 'Thief',
    team: 'villager',
    teamName: '村人陣営',
    description: '誰かひとりを選び、役職を交換することができます。',
    nightInstruction: '役職を交換したいプレイヤーを1人選んでください。朝になる瞬間に役職が入れ替わります。',
    color: 'emerald',
    accentBg: 'from-emerald-950/60 to-slate-950',
    borderClass: 'border-emerald-500/60',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
    icon: '🎭',
  },
  hunter: {
    id: 'hunter',
    name: '狩人',
    nameEn: 'Hunter',
    team: 'villager',
    teamName: '村人陣営',
    description: '処刑された場合、誰かひとりを道連れに処刑することができます。',
    nightInstruction: '夜にアクションはありません。もし処刑された時は誰かを道連れにできます。',
    color: 'emerald',
    accentBg: 'from-emerald-950/60 to-slate-950',
    borderClass: 'border-emerald-500/60',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
    icon: '🏹',
  },
  werewolf: {
    id: 'werewolf',
    name: '人狼',
    nameEn: 'Werewolf',
    team: 'werewolf',
    teamName: '人狼陣営',
    description: '人狼がひとりも処刑されなかった場合、人狼陣営の勝利となります。',
    nightInstruction: '仲間を確認してください（仲間がいない場合は単独の人狼です）。処刑を免れましょう。',
    color: 'rose',
    accentBg: 'from-rose-950 to-slate-950',
    borderClass: 'border-rose-500/60',
    badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/50',
    icon: '🐺',
  },
  great_werewolf: {
    id: 'great_werewolf',
    name: '大狼',
    nameEn: 'Alpha Wolf',
    team: 'werewolf',
    teamName: '人狼陣営',
    description: '人狼と同じですが、墓地にある２枚の役職を見ることができます。',
    nightInstruction: '仲間を確認し、さらに墓地の2枚の役職を確認できます。村人を巧みに騙しましょう。',
    color: 'rose',
    accentBg: 'from-rose-950/90 to-red-950/90',
    borderClass: 'border-rose-500/60',
    badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/50',
    icon: '🩸',
  },
  tanner: {
    id: 'tanner',
    name: '吊人',
    nameEn: 'Hang',
    team: 'tanner',
    teamName: '吊人陣営',
    description: '第三の陣営です。処刑された場合に勝利となります。',
    nightInstruction: '夜にアクションはありません。昼の議論で怪しまれ、処刑されるよう誘導しましょう。',
    color: 'purple',
    accentBg: 'from-purple-950 to-slate-950',
    borderClass: 'border-purple-500/60',
    badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    icon: '👻',
  },
};

export type GamePhase =
  | 'LOBBY'
  | 'ROLE_CONFIG'
  | 'NIGHT'
  | 'DAY_DISCUSSION'
  | 'VOTING'
  | 'EXECUTION'
  | 'RESULT';

export interface PlayerPublicInfo {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  isExecuted?: boolean;
}

export interface PlayerFullResultInfo {
  id: string;
  name: string;
  initialRole: RoleId;
  finalRole: RoleId;
  votedFor: string; // Target player name or '平和村'
  isExecuted: boolean;
  swappedByThief?: boolean;
}

export interface ThiefSwapHistory {
  thiefId: string;
  thiefName: string;
  targetId: string;
  targetName: string;
  stolenRole: RoleId;
}

export interface HunterRevengeInfo {
  hunterId: string;
  hunterName: string;
  targetId: string;
  targetName: string;
  targetRole: RoleId;
}

export interface ExecutionState {
  executedPlayerIds: string[];
  isPeaceVillage: boolean;
  executionStartedAt: number;
  fireStarted: boolean;
  hunterRevengeNeededFor?: {
    hunterId: string;
    hunterName: string;
  } | null;
  hunterRevengeResult?: HunterRevengeInfo | null;
}

export interface GameResultInfo {
  winnerTeam: Team;
  winnerTitle: string;
  winnerReason: string;
  allPlayers: PlayerFullResultInfo[];
  graveyard: RoleId[];
  thiefSwaps: ThiefSwapHistory[];
  hunterRevenge?: HunterRevengeInfo | null;
}

export interface ClientGameState {
  roomId: string;
  phase: GamePhase;
  myPlayerId: string;
  players: PlayerPublicInfo[];
  isHost: boolean;
  roleCardsConfig: Record<RoleId, number>;
  totalRequiredCards: number;
  
  // Night personal data
  myInitialRole?: RoleId;
  myKnownTeammates?: Array<{ id: string; name: string }>;
  myKnownGraveyard?: RoleId[];
  myNightTargetResult?: {
    targetId: string;
    targetName: string;
    role: RoleId;
  };
  hasSubmittedNightAction: boolean;

  // Day Discussion data
  discussionStartedAt?: number;
  discussionReadyCount: number;
  myDiscussionReady: boolean;

  // Voting data
  votingReadyCount: number;
  myVoteTarget: string | null;

  // Execution data
  executionState?: ExecutionState;

  // Result data
  resultInfo?: GameResultInfo;
}

export type ClientAction =
  | { type: 'JOIN_ROOM'; roomId: string; playerName: string; playerId?: string }
  | { type: 'SET_ROLE_CONFIG'; config: Record<RoleId, number> }
  | { type: 'START_ROLE_CONFIG' }
  | { type: 'START_NIGHT' }
  | {
      type: 'SUBMIT_NIGHT_ACTION';
      seerChoice?: { targetPlayerId?: string; checkGraveyard?: boolean };
      thiefChoice?: { targetPlayerId: string };
      isReady?: boolean;
    }
  | { type: 'END_DISCUSSION' }
  | { type: 'SUBMIT_VOTE'; targetId: string } // targetId can be a player's ID or 'PEACE'
  | { type: 'SUBMIT_HUNTER_REVENGE'; targetPlayerId: string }
  | { type: 'KICK_PLAYER'; targetPlayerId: string }
  | { type: 'NEW_GAME' };
