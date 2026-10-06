import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Vote, Sparkles, Skull, Moon, Ghost, ArrowRight, Play } from 'lucide-react';
import { ClientGameState, ROLES } from '../types/game';
import { sound } from '../utils/audio';
import { ROLE_IMAGES, TEAM_COLORS } from '../assets/roleImages';

interface ResultViewProps {
  gameState: ClientGameState;
  onNewGame: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({ gameState, onNewGame }) => {
  const result = gameState.resultInfo;

  const isVillagerWin = result?.winnerTeam === 'villager';
  const isWerewolfWin = result?.winnerTeam === 'werewolf';
  const isTannerWin = result?.winnerTeam === 'tanner';

  // Intro splash screen: active initially for Werewolf and Tanner, auto-dismisses after 2.5s
  const [showIntro, setShowIntro] = useState(isWerewolfWin || isTannerWin);

  useEffect(() => {
    if (result) {
      sound.playVictory(result.winnerTeam);

      if (isVillagerWin) {
        // Celebratory confetti for Villagers
        const count = 220;
        const fire = (particleRatio: number, opts: confetti.Options) => {
          confetti({
            origin: { y: 0.6 },
            ...opts,
            particleCount: Math.floor(count * particleRatio),
          });
        };

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
      } else if (isTannerWin) {
        // Quirky purple/magenta confetti for Tanner
        confetti({
          particleCount: 90,
          spread: 90,
          colors: ['#a855f7', '#d946ef', '#6366f1', '#e879f9'],
          origin: { y: 0.5 },
        });
      }

      // Auto-transition to result details after 2.5 seconds
      if (isWerewolfWin || isTannerWin) {
        setShowIntro(true);
        const timer = setTimeout(() => {
          setShowIntro(false);
        }, 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [result, isVillagerWin, isWerewolfWin, isTannerWin]);

  const handleDismissIntro = () => {
    sound.playClick();
    setShowIntro(false);
  };

  const handleReplayIntro = () => {
    if (result) {
      sound.playVictory(result.winnerTeam);
      setShowIntro(true);
      setTimeout(() => {
        setShowIntro(false);
      }, 2500);
    }
  };

  if (!result) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-amber-200 text-sm font-bold font-pop">結果を集計中ワン...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full px-4 py-4 animate-fade-in pb-6 relative">
      {/* 1. WEREWOLF "DEDEEEN!" (デデーン) SHOCK INTRO OVERLAY */}
      {isWerewolfWin && showIntro && (
        <div
          onClick={handleDismissIntro}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md cursor-pointer animate-shock-shake p-4"
        >
          <div className="text-center space-y-4 max-w-sm">
            <div className="text-5xl animate-bounce">🐺 🩸 🌕</div>
            <div className="text-5xl md:text-6xl font-black text-rose-500 font-pop tracking-widest drop-shadow-[0_0_35px_rgba(244,63,94,1)] animate-dedeen-impact">
              デデーン！！
            </div>
            <div className="text-sm font-black text-rose-200 bg-rose-950/90 border-2 border-rose-500 px-5 py-2.5 rounded-2xl shadow-2xl font-pop">
              人狼陣営の恐怖の完全勝利...！
            </div>
            <p className="text-xs text-rose-300/70 font-bold">
              画面タップまたは自動（2秒）で結果画面へ進みます
            </p>
            <button
              onClick={handleDismissIntro}
              className="mt-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-xs font-pop flex items-center justify-center gap-1.5 mx-auto shadow-lg pop-btn"
            >
              <span>結果を確認する</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. TANNER (吊人) BIZARRE / WEIRD INTRO OVERLAY */}
      {isTannerWin && showIntro && (
        <div
          onClick={handleDismissIntro}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-purple-950/90 backdrop-blur-md cursor-pointer p-4"
        >
          <div className="text-center space-y-4 max-w-sm animate-weird-wobble">
            <div className="text-5xl">👻 🌀 🪢</div>
            <div className="text-3xl md:text-4xl font-black text-purple-300 font-pop tracking-wide drop-shadow-[0_0_25px_rgba(168,85,247,0.8)]">
              ！？！？ 奇妙な勝利 ！？！？
            </div>
            <div className="text-sm font-black text-purple-200 bg-purple-900/90 border-2 border-purple-400 px-5 py-2.5 rounded-2xl shadow-2xl font-pop">
              吊人（てるてる）が処刑され単独勝利！
            </div>
            <p className="text-xs text-purple-300/70 font-bold">
              画面タップまたは自動（2秒）で結果画面へ進みます
            </p>
            <button
              onClick={handleDismissIntro}
              className="mt-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-xs font-pop flex items-center justify-center gap-1.5 mx-auto shadow-lg pop-btn"
            >
              <span>結果を確認する</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN RESULT VIEW (Always accessible & clear) */}
      <div className="space-y-4 relative z-10">
        {/* Victory Announcement Banner */}
        {isVillagerWin && (
          <div className="border-4 border-emerald-400 bg-gradient-to-b from-emerald-950 via-slate-950 to-indigo-950 rounded-3xl p-5 text-center shadow-2xl pop-card relative overflow-hidden">
            <div className="text-4xl mb-1">🎉 🐶 🐾</div>
            <div className="text-xs font-black text-emerald-400 font-pop tracking-widest uppercase mb-1">
              ─ 平和な村の勝利 ─
            </div>
            <h2 className="text-2xl font-black text-emerald-300 font-pop tracking-tight">
              {result.winnerTitle}
            </h2>
            <p className="text-xs text-emerald-100/90 mt-2 leading-relaxed bg-black/40 p-2.5 rounded-2xl border border-emerald-500/30 font-bold">
              {result.winnerReason}
            </p>
          </div>
        )}

        {isWerewolfWin && (
          <div className="border-4 border-rose-600 bg-gradient-to-b from-rose-950 via-slate-950 to-red-950 rounded-3xl p-5 text-center shadow-[0_0_40px_rgba(225,29,72,0.4)] pop-card relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black text-rose-400 font-pop">🐺 人狼陣営</span>
              <button
                onClick={handleReplayIntro}
                className="flex items-center gap-1 text-[10px] text-rose-300 bg-rose-900/60 hover:bg-rose-800 border border-rose-500/40 px-2 py-1 rounded-xl font-pop transition"
              >
                <Play className="w-3 h-3 text-rose-400" />
                <span>デデーン演出を再開</span>
              </button>
            </div>
            <div className="text-3xl mb-1">🐺 🩸 🌕</div>
            <h2 className="text-2xl font-black text-rose-400 font-pop tracking-tight drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]">
              {result.winnerTitle}
            </h2>
            <p className="text-xs text-rose-100/90 mt-2 leading-relaxed bg-black/60 p-2.5 rounded-2xl border border-rose-500/40 font-bold">
              {result.winnerReason}
            </p>
          </div>
        )}

        {isTannerWin && (
          <div className="border-4 border-purple-500 bg-gradient-to-b from-purple-950 via-slate-950 to-fuchsia-950 rounded-3xl p-5 text-center shadow-[0_0_35px_rgba(168,85,247,0.4)] pop-card relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black text-purple-300 font-pop">👻 吊人陣営</span>
              <button
                onClick={handleReplayIntro}
                className="flex items-center gap-1 text-[10px] text-purple-300 bg-purple-900/60 hover:bg-purple-800 border border-purple-500/40 px-2 py-1 rounded-xl font-pop transition"
              >
                <Play className="w-3 h-3 text-purple-400" />
                <span>奇妙な演出を再開</span>
              </button>
            </div>
            <div className="text-3xl mb-1">👻 🌀 🪢</div>
            <h2 className="text-2xl font-black text-purple-300 font-pop tracking-tight">
              {result.winnerTitle}
            </h2>
            <p className="text-xs text-purple-100/90 mt-2 leading-relaxed bg-black/50 p-2.5 rounded-2xl border border-purple-500/30 font-bold">
              {result.winnerReason}
            </p>
          </div>
        )}

        {/* Players Roles & Votes */}
        <div className="bg-slate-900/95 border-2 border-amber-500/30 rounded-3xl p-4 shadow-xl space-y-3 pop-card">
          <div className="flex items-center justify-between text-xs font-black text-amber-200 font-pop">
            <span className="flex items-center gap-1.5">
              <span>🐾 ワンコたちの最終役職と投票先</span>
            </span>
            <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
              全開示
            </span>
          </div>

          <div className="space-y-2.5">
            {result.allPlayers.map((player) => {
              const initRole = ROLES[player.initialRole];
              const finalRole = ROLES[player.finalRole];
              const isSwapped = player.initialRole !== player.finalRole;

              return (
                <div
                  key={player.id}
                  className={`p-3 rounded-2xl border-2 text-xs transition ${
                    player.isExecuted
                      ? 'bg-rose-950/40 border-rose-500 shadow-md'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white text-sm font-pop">
                        {player.name}
                      </span>
                      {player.isExecuted && (
                        <span className="px-2 py-0.5 bg-red-600 text-white rounded-full text-[10px] font-black font-pop shadow-sm animate-pulse">
                          🔥 処刑
                        </span>
                      )}
                    </div>

                    {/* Voted Target */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-300 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-700 font-bold">
                      <Vote className="w-3.5 h-3.5 text-amber-400" />
                      <span>投票先: <strong className="text-amber-200">{player.votedFor}</strong></span>
                    </div>
                  </div>

                  {/* Role Transition with Dog Cards */}
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <img
                        src={ROLE_IMAGES[player.initialRole]}
                        alt={initRole.name}
                        className="w-10 h-14 rounded-lg object-cover border-2 border-amber-400 shadow-sm"
                      />
                      <div>
                        <div className="text-[9px] text-slate-400 font-bold">初期役職</div>
                        <div className="text-xs font-black text-white font-pop">{initRole.name}</div>
                        <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded-full border font-bold mt-0.5 ${TEAM_COLORS[initRole.team].badgeClass}`}>
                          {TEAM_COLORS[initRole.team].name}
                        </span>
                      </div>
                    </div>

                    {isSwapped && (
                      <>
                        <span className="text-amber-400 font-black text-sm">➔</span>
                        <div className="flex items-center gap-2">
                          <img
                            src={ROLE_IMAGES[player.finalRole]}
                            alt={finalRole.name}
                            className="w-10 h-14 rounded-lg object-cover border-2 border-amber-400 shadow-sm animate-pulse"
                          />
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-amber-400 font-bold">最終役職</span>
                              <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 rounded font-bold border border-amber-500/30">
                                怪盗交換
                              </span>
                            </div>
                            <div className="text-xs font-black text-amber-300 font-pop">
                              {finalRole.name}
                            </div>
                            <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded-full border font-bold mt-0.5 ${TEAM_COLORS[finalRole.team].badgeClass}`}>
                              {TEAM_COLORS[finalRole.team].name}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Graveyard Cards (墓地の2枚) with Dog Illustrations */}
        <div className="bg-slate-900/95 border-2 border-amber-500/30 rounded-3xl p-4 shadow-xl space-y-2 pop-card">
          <div className="text-xs font-black text-amber-200 font-pop flex items-center gap-1.5">
            <span>🪦 墓地に残っていた2枚のカード 🐾</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {result.graveyard.map((roleId, idx) => {
              const role = ROLES[roleId];
              return (
                <div
                  key={idx}
                  className={`p-2 rounded-2xl border-2 ${role.borderClass} bg-slate-950 flex items-center gap-2.5 shadow-md`}
                >
                  <img
                    src={ROLE_IMAGES[roleId]}
                    alt={role.name}
                    className="w-12 h-16 rounded-xl object-cover border-2 border-amber-400 flex-shrink-0"
                  />
                  <div>
                    <div className="font-black text-xs text-white font-pop">{role.name}</div>
                    <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded-full border font-bold mt-0.5 ${TEAM_COLORS[role.team].badgeClass}`}>
                      {TEAM_COLORS[role.team].name}
                    </span>
                    <div className="text-[9px] text-amber-300 font-mono">{role.nameEn}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Thief Swaps History (if any) */}
        {result.thiefSwaps && result.thiefSwaps.length > 0 && (
          <div className="bg-slate-950 p-3 rounded-2xl border border-amber-500/30 text-xs space-y-1">
            <div className="font-black text-amber-400 font-pop flex items-center gap-1">
              <span>🎭 怪盗の交換記録 🐾</span>
            </div>
            {result.thiefSwaps.map((swap, idx) => (
              <div key={idx} className="text-slate-200 text-[11px] font-bold">
                怪盗【{swap.thiefName}】は【{swap.targetName}】の役職（{ROLES[swap.stolenRole].name}）と交換しました。
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Game Button at Bottom */}
      <div className="pt-5">
        <button
          onClick={() => {
            sound.playPuppyBark();
            onNewGame();
          }}
          className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:brightness-110 active:scale-[0.98] text-slate-950 rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-2 transition font-pop pop-btn"
        >
          <RotateCcw className="w-5 h-5 text-slate-950" />
          <span>もう一度あそぶ（参加わんこ一覧に戻る） 🐾</span>
        </button>
      </div>
    </div>
  );
};
