import React, { useEffect, useState } from 'react';
import { Flame, ShieldAlert, Crosshair, Sparkles } from 'lucide-react';
import { ClientGameState } from '../types/game';
import { sound } from '../utils/audio';
import { ROLE_IMAGES } from '../assets/roleImages';

interface ExecutionViewProps {
  gameState: ClientGameState;
  onSubmitHunterRevenge: (targetPlayerId: string) => void;
}

export const ExecutionView: React.FC<ExecutionViewProps> = ({
  gameState,
  onSubmitHunterRevenge,
}) => {
  const executionState = gameState.executionState;
  const startedAt = executionState?.executionStartedAt || Date.now();
  const [countdown, setCountdown] = useState(5);
  const [hasIgnited, setHasIgnited] = useState(false);
  const [selectedHunterTarget, setSelectedHunterTarget] = useState<string | null>(null);

  const isPeaceVillage = !!executionState?.isPeaceVillage;
  const executedPlayerIds = executionState?.executedPlayerIds || [];
  const executedPlayers = gameState.players.filter((p) =>
    executedPlayerIds.includes(p.id)
  );

  const hunterRevenge = executionState?.hunterRevengeNeededFor;
  const isMeHunterRevenge = hunterRevenge && hunterRevenge.hunterId === gameState.myPlayerId;
  const hunterResult = executionState?.hunterRevengeResult;

  // 5-second suspense countdown & fire trigger
  useEffect(() => {
    let tickCount = 0;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, 5 - elapsed);
      setCountdown(remaining);

      if (remaining > 0) {
        sound.playCountdownTick(1 + (5 - remaining) * 0.2);
      } else if (remaining === 0 && !hasIgnited) {
        setHasIgnited(true);
        if (!isPeaceVillage && executedPlayers.length > 0) {
          sound.playFireCombustion();
          // Mobile vibration if available
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([200, 100, 400]);
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, hasIgnited, isPeaceVillage, executedPlayers.length]);

  const handleConfirmRevenge = () => {
    if (!selectedHunterTarget) return;
    sound.playFireCombustion();
    onSubmitHunterRevenge(selectedHunterTarget);
  };

  // Other alive players for hunter to target
  const hunterEligibleTargets = gameState.players.filter(
    (p) => !executedPlayerIds.includes(p.id) && p.id !== gameState.myPlayerId
  );

  return (
    <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full px-4 py-5 animate-fade-in relative overflow-hidden">
      {/* Fiery particles animation background if ignited */}
      {hasIgnited && !isPeaceVillage && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -bottom-10 left-0 right-0 h-48 bg-gradient-to-t from-orange-600/30 via-red-600/20 to-transparent blur-xl animate-pulse" />
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-amber-400 blur-[1px] animate-rise-particle"
              style={{
                left: `${10 + Math.random() * 80}%`,
                bottom: '10%',
                animationDuration: `${1.5 + Math.random() * 2}s`,
                animationDelay: `${Math.random() * 1.5}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="space-y-6 relative z-10">
        {/* Phase Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950 border border-rose-500/40 text-rose-300 text-xs font-semibold mb-1 shadow-sm">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>処刑フェーズ</span>
          </div>
          <h2 className="text-lg font-bold text-white font-serif">
            投票結果の宣告
          </h2>
        </div>

        {/* Peace Village Result (Requirement 21) */}
        {isPeaceVillage ? (
          <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 text-center shadow-2xl space-y-4 animate-scale-up">
            <div className="text-6xl mb-2 animate-bounce">🕊️</div>
            <div className="text-2xl font-black text-emerald-400 font-serif">
              平和村に投票された
            </div>
            <p className="text-xs text-slate-300 leading-relaxed bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/20">
              最多投票が平和村、または全員の得票数が同数となったため、誰も処刑されませんでした。
            </p>
          </div>
        ) : (
          /* Execution Target Center Display (Requirement 22 & 23 & 24) */
          <div className="space-y-4">
            {/* Suspense Countdown Badge */}
            {countdown > 0 ? (
              <div className="text-center py-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 border border-amber-500/40 rounded-full text-xs text-amber-300 font-mono font-bold animate-pulse">
                  <span>執行まで ...</span>
                  <span className="text-base text-white">{countdown}</span>
                  <span>秒</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-950 border border-red-500 rounded-full text-xs text-red-300 font-bold animate-bounce">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span>処刑執行！</span>
                </div>
              </div>
            )}

            {/* Target Display with Fire Combustion Effect */}
            <div
              className={`rounded-3xl p-6 text-center transition-all duration-700 relative overflow-hidden shadow-2xl ${
                hasIgnited
                  ? 'bg-gradient-to-b from-red-950 via-slate-950 to-orange-950 border-2 border-orange-500 shadow-[0_0_35px_rgba(239,68,68,0.5)]'
                  : 'bg-slate-900 border border-slate-800'
              }`}
            >
              <div className="text-xs font-bold text-slate-400 mb-2">
                最多投票を獲得した処刑対象者
              </div>

              <div className="space-y-3 my-3">
                {executedPlayers.map((player) => (
                  <div key={player.id} className="relative inline-block px-4 py-2">
                    {/* The name that catches fire at 5s! */}
                    <div
                      className={`text-3xl font-black font-serif tracking-tight transition-all duration-500 ${
                        hasIgnited
                          ? 'text-amber-200 drop-shadow-[0_0_20px_rgba(249,115,22,0.9)] scale-110'
                          : 'text-white'
                      }`}
                    >
                      {player.name}
                    </div>

                    {/* Animated Flame Aura on the Name */}
                    {hasIgnited && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1 animate-flame-flicker">
                        <span className="text-2xl filter drop-shadow">🔥</span>
                        <span className="text-xl filter drop-shadow">🔥</span>
                        <span className="text-2xl filter drop-shadow">🔥</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-400 mt-2">
                {hasIgnited
                  ? '業火に包まれ、処刑されました。'
                  : '判定を確認中...'}
              </p>
            </div>

            {/* Hunter Revenge Modal / Notification */}
            {hasIgnited && hunterRevenge && (
              <div className="bg-slate-900 border-2 border-cyan-400 rounded-3xl p-4 shadow-xl space-y-3 animate-slide-up pop-card">
                <div className="flex items-center gap-2.5">
                  <img
                    src={ROLE_IMAGES.hunter}
                    alt="狩人"
                    className="w-10 h-14 rounded-xl object-cover border border-cyan-400 shadow-md"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-cyan-300 font-black text-sm font-pop">
                      <Crosshair className="w-4 h-4 animate-spin-slow text-cyan-400" />
                      <span>狩人の道連れ能力発動！ 🐾</span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      道連れにした相手が人狼なら村人勝利！
                    </div>
                  </div>
                </div>

                {isMeHunterRevenge ? (
                  <div className="space-y-2.5">
                    <p className="text-xs text-amber-200 font-bold bg-slate-950 p-2 rounded-xl border border-cyan-500/30">
                      🏹 あなたは狩人です！最後に道連れにするワンコを1人選んで撃ち抜いてください！
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {hunterEligibleTargets.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            sound.playClick();
                            setSelectedHunterTarget(p.id);
                          }}
                          className={`p-2.5 rounded-2xl text-xs font-black border-2 transition pop-btn ${
                            selectedHunterTarget === p.id
                              ? 'bg-cyan-500 border-cyan-200 text-slate-950 shadow-md'
                              : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-600'
                          }`}
                        >
                          🏹 {p.name}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleConfirmRevenge}
                      disabled={!selectedHunterTarget}
                      className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110 disabled:opacity-40 text-slate-950 rounded-2xl text-xs font-black transition shadow-md font-pop pop-btn"
                    >
                      道連れを決定する 🏹
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-slate-200 bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-center gap-2 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    <span>
                      狩人【{hunterRevenge.hunterName}】が道連れ相手を選択していますワン...
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Hunter Result Reveal (if shot already) */}
            {hunterResult && (
              <div className="bg-cyan-950/60 border border-cyan-500/40 p-3 rounded-xl text-center text-xs space-y-1 animate-fade-in">
                <div className="font-bold text-cyan-300">🏹 道連れ執行！</div>
                <div className="text-white">
                  狩人【{hunterResult.hunterName}】は【{hunterResult.targetName}】を道連れにしました！
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer waiting text */}
      <div className="pt-4 text-center text-xs text-slate-400">
        <span>間もなく勝敗結果画面へ移行します...</span>
      </div>
    </div>
  );
};
