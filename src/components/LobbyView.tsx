import React, { useState, useEffect, useRef } from 'react';
import { Users, Crown, Sparkles, ArrowRight, Share2, QrCode, UserX, AlertTriangle } from 'lucide-react';
import { ClientGameState, PlayerPublicInfo } from '../types/game';
import { sound } from '../utils/audio';
import { APP_AVATAR } from '../assets/roleImages';
import { getShareUrl } from '../utils/share';

interface LobbyViewProps {
  gameState: ClientGameState | null;
  onJoinRoom: (roomId: string, playerName: string) => void;
  onStartRoleConfig: () => void;
  onOpenQR: () => void;
  onKickPlayer?: (targetPlayerId: string) => void;
  savedName: string;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  gameState,
  onJoinRoom,
  onStartRoleConfig,
  onOpenQR,
  onKickPlayer,
  savedName,
}) => {
  const [playerName, setPlayerName] = useState(savedName || '');
  const [roomInput, setRoomInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [playerToKick, setPlayerToKick] = useState<PlayerPublicInfo | null>(null);
  const isComposingRef = useRef(false);

  const isDevEnv = typeof window !== 'undefined' && window.location.hostname.includes('ais-dev-');
  const publicShareUrl = typeof window !== 'undefined' ? getShareUrl(gameState?.roomId) : '';

  // Check URL parameters for room code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomInput(roomParam.replace(/[^0-9]/g, '').slice(0, 2));
    }
  }, []);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    sound.playClick();
    onJoinRoom('', playerName.trim());
  };

  const handleJoinExistingRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRoom = roomInput.replace(/[^0-9]/g, '').slice(0, 2);
    if (!playerName.trim() || cleanRoom.length !== 2) return;
    sound.playClick();
    onJoinRoom(cleanRoom, playerName.trim());
  };

  const handleRoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
    setRoomInput(clean);
  };

  const handleShareLink = () => {
    if (!gameState) return;
    sound.playClick();
    const shareUrl = getShareUrl(gameState.roomId);
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // If already in a room:
  if (gameState) {
    const playerCount = gameState.players.length;
    const canStart = playerCount >= 3 && playerCount <= 7;
    const isHost = gameState.isHost;

    return (
      <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full px-4 py-4 animate-fade-in">
        {/* Top Info */}
        <div className="space-y-4">
          {/* Dev environment notice when playing with others */}
          {isDevEnv && (
            <div className="bg-amber-950/80 border-2 border-amber-500/70 rounded-3xl p-3.5 text-xs text-amber-200 shadow-xl space-y-2">
              <div className="flex items-center gap-1.5 font-black text-amber-300">
                <span className="text-base">📢</span>
                <span>【重要】知人と合流するには公開版を開いてください</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                AI Studioプレビュー（開発環境）と知人のスマホ（公開環境）は別サーバーで動作しています。
                部屋主（あなた）も以下の<strong>「公開版を開く」</strong>から入室すると、知人と同じ部屋でプレイできます！
              </p>
              <a
                href={publicShareUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-black rounded-xl text-xs shadow transition active:scale-95 font-pop pop-btn"
              >
                <span>公開版を新しいタブで開く ↗️</span>
              </a>
            </div>
          )}

          <div className="bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 border-2 border-amber-500/40 rounded-3xl p-4 text-center shadow-lg relative overflow-hidden pop-card">
            <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300 font-bold mb-1">
              <span>🐾 部屋コード（2桁）</span>
            </div>
            <div className="text-4xl font-black tracking-widest text-amber-200 font-mono mb-2 drop-shadow">
              {gameState.roomId}
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handleShareLink}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold rounded-xl text-xs transition pop-btn"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copied ? 'URLコピー完了！' : '招待URLをコピー'}</span>
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenQR();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-200 font-bold rounded-xl text-xs border border-amber-500/30 transition pop-btn"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR表示</span>
              </button>
            </div>

            <div className="text-[10px] text-amber-200/70 pt-2 font-bold">
              ※ 知人を招待する際は、ブラウザ上部のURLバーではなく上記の「招待URLをコピー」または「QR表示」で共有してくださいワン！
            </div>
          </div>

          {/* Player Count Status */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🐾</span>
              <span className="text-xs font-bold text-slate-200">
                参加わんこ一覧 ({playerCount}/7人)
              </span>
            </div>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                playerCount < 3
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}
            >
              {playerCount < 3
                ? `あと${3 - playerCount}人で開始可能`
                : 'いつでも開始OK！ (3〜7人)'}
            </span>
          </div>

          {/* Players List */}
          <div className="space-y-2">
            {gameState.players.map((p, index) => {
              const isMe = p.id === gameState.myPlayerId;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border-2 transition ${
                    isMe
                      ? 'bg-amber-950/30 border-amber-400/50 shadow-sm'
                      : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-amber-300 border border-amber-500/30">
                      🐶 {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                        <span>{p.name}</span>
                        {isMe && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded-md border border-amber-500/40 font-bold">
                            あなた
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {p.isConnected ? '元気よく接続中' : '切断中'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {p.isHost && (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-xl border border-amber-500/40">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span>部屋主</span>
                      </div>
                    )}

                    {isHost && !isMe && (
                      <button
                        onClick={() => {
                          sound.playClick();
                          setPlayerToKick(p);
                        }}
                        className="flex items-center gap-1 text-[11px] font-bold text-rose-300 hover:text-white bg-rose-500/15 hover:bg-rose-600 px-2.5 py-1 rounded-xl border border-rose-500/40 active:scale-95 transition"
                        title={`${p.name}を追放する`}
                      >
                        <UserX className="w-3.5 h-3.5 text-rose-400" />
                        <span>追放</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Waiting Notice */}
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-amber-500/20 text-xs text-amber-200/80 text-center flex items-center justify-center gap-1.5">
            <span>🐾 参加者はスマホからURLを開いて同じ部屋コードに入室してくださいワン！</span>
          </div>
        </div>

        {/* Bottom CTA for Host or Waiting for Host */}
        <div className="pt-4">
          {isHost ? (
            <button
              onClick={() => {
                sound.playPuppyBark();
                onStartRoleConfig();
              }}
              disabled={!canStart}
              className={`w-full py-4 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition active:scale-[0.98] font-pop ${
                canStart
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:brightness-110 text-slate-950 shadow-orange-950/40 pop-btn'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>{canStart ? '役職設定へ進む（ゲーム開始） 🐾' : '3人以上集まると開始できます'}</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          ) : (
            <div className="text-center p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-slate-300 font-bold">
              👑 部屋主（{gameState.players.find((p) => p.isHost)?.name || 'ホスト'}）の開始を待っていますワン...
            </div>
          )}
        </div>
      </div>
    );
  }

  // Not in room: Welcome / Entry screen
  return (
    <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-5 py-6 animate-fade-in">
      <div className="text-center mb-5">
        <div className="relative inline-block mb-3">
          <img
            src={APP_AVATAR}
            alt="わんナイト人狼 人狼わんこ"
            className="w-24 h-24 rounded-3xl object-cover border-4 border-amber-400 shadow-2xl mx-auto"
          />
          <div className="absolute -bottom-2 -right-2 bg-amber-400 text-slate-950 p-1.5 rounded-full text-base shadow-lg animate-bounce">
            🐾
          </div>
        </div>
        <h2 className="text-2xl font-black text-amber-200 tracking-tight mb-1 font-pop drop-shadow flex items-center justify-center gap-1.5">
          <span>わんナイト人狼</span>
          <span className="text-lg text-amber-400">🐾</span>
        </h2>
        <p className="text-xs text-amber-200/70 font-bold">
          かわいいワンコたちと遊ぶブラウザ人狼ゲーム！
        </p>
      </div>

      {/* Dev environment notice */}
      {isDevEnv && (
        <div className="mb-4 bg-amber-950/80 border-2 border-amber-500/60 rounded-2xl p-3 text-xs text-amber-200 space-y-1.5 shadow-lg">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <span>📢 知人と一緒に遊ぶ場合のご注意</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            AI Studioプレビュー（開発環境）と知人のスマホ（公開環境）は別サーバーで動作しています。知人と合流するには、部屋主も<strong>公開版（共有URL）</strong>を開いて部屋を作成してください。
          </p>
          <a
            href={publicShareUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 underline font-bold"
          >
            <span>公開版を新しいタブで開く ↗️</span>
          </a>
        </div>
      )}

      {/* Name input */}
      <div className="space-y-4 bg-slate-900/90 border-2 border-amber-500/30 rounded-3xl p-5 shadow-2xl pop-card">
        <div>
          <label className="block text-xs font-bold text-amber-200 mb-1.5 flex items-center gap-1">
            <span>🐾 あなたのワンコ名（名前）</span>
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="例: ポチ、シロ、コタロウ"
            maxLength={10}
            className="w-full bg-slate-950 border-2 border-slate-700 focus:border-amber-400 rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition font-bold"
          />
        </div>

        {/* Buttons / Actions */}
        <div className="pt-1 space-y-3">
          <button
            onClick={handleCreateRoom}
            disabled={!playerName.trim()}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 rounded-2xl font-black text-sm shadow-md transition active:scale-[0.98] font-pop pop-btn"
          >
            新しく部屋を作る（部屋主になる） 🐾
          </button>

          <div className="flex items-center gap-3 my-2">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[10px] text-amber-400 font-bold uppercase">または</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>既存の部屋に参加する</span>
              <span className="text-[10px] text-amber-400 font-bold">2桁の数字</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomInput}
                onChange={handleRoomInputChange}
                placeholder="例: 42"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                className="flex-1 bg-slate-950 border-2 border-slate-700 focus:border-amber-400 rounded-2xl px-3.5 py-2.5 text-center text-xl text-amber-200 placeholder-slate-500 font-mono tracking-widest focus:outline-none transition font-black"
              />
              <button
                onClick={handleJoinExistingRoom}
                disabled={!playerName.trim() || roomInput.length !== 2}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-amber-200 rounded-2xl font-black text-sm border border-amber-500/30 transition active:scale-[0.98] font-pop"
              >
                参加
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Badges */}
      <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px] text-amber-200/70 font-bold">
        <div className="bg-slate-900/80 p-2.5 rounded-2xl border border-amber-500/20">
          🐶 3〜7人対応
        </div>
        <div className="bg-slate-900/80 p-2.5 rounded-2xl border border-amber-500/20">
          ✨ 多彩な7役職
        </div>
        <div className="bg-slate-900/80 p-2.5 rounded-2xl border border-amber-500/20">
          🔒 秘密情報保護
        </div>
      </div>

      {/* Kick Confirmation Modal */}
      {playerToKick && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border-2 border-rose-500/60 rounded-3xl max-w-xs w-full p-5 text-center shadow-2xl relative pop-card">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto mb-3 text-2xl">
              ⚠️
            </div>

            <h3 className="text-base font-black text-rose-300 mb-1 font-pop">
              プレイヤー追放の確認
            </h3>
            <p className="text-xs text-slate-300 mb-2 leading-relaxed">
              本当に「<strong className="text-white font-bold">{playerToKick.name}</strong>」を部屋から追放しますかワン？
            </p>
            <p className="text-[10px] text-slate-400 mb-4 bg-slate-950 p-2 rounded-xl border border-slate-800">
              ※ 追放されたプレイヤーは即座に部屋から退出となります。
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  setPlayerToKick(null);
                }}
                className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-xl font-bold text-xs border border-slate-700 transition"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  sound.playPuppyBark();
                  if (onKickPlayer) {
                    onKickPlayer(playerToKick.id);
                  }
                  setPlayerToKick(null);
                }}
                className="flex-1 py-2.5 px-3 bg-gradient-to-r from-rose-600 to-red-600 hover:brightness-110 active:scale-95 text-white rounded-xl font-black text-xs shadow-lg transition font-pop"
              >
                追放する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
