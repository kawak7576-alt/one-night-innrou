import React from 'react';
import { Plus, Minus, Moon, CheckCircle2, AlertTriangle, Wand2, ArrowLeft } from 'lucide-react';
import { ClientGameState, ROLES, RoleId } from '../types/game';
import { sound } from '../utils/audio';
import { ROLE_IMAGES } from '../assets/roleImages';

interface RoleConfigViewProps {
  gameState: ClientGameState;
  onSetRoleConfig: (config: Record<RoleId, number>) => void;
  onStartNight: () => void;
  onBackToLobby?: () => void;
}

export const RoleConfigView: React.FC<RoleConfigViewProps> = ({
  gameState,
  onSetRoleConfig,
  onStartNight,
  onBackToLobby,
}) => {
  const isHost = gameState.isHost;
  const playerCount = gameState.players.length;
  const requiredCards = gameState.totalRequiredCards; // playerCount + 2
  const currentConfig = gameState.roleCardsConfig;

  const currentTotal = Object.values(currentConfig).reduce((a, b) => a + b, 0);
  const isValid = currentTotal === requiredCards;

  const roleList: RoleId[] = [
    'villager',
    'seer',
    'thief',
    'hunter',
    'werewolf',
    'great_werewolf',
    'tanner',
  ];

  const updateRoleCount = (roleId: RoleId, delta: number) => {
    if (!isHost) return;
    sound.playClick();
    const current = currentConfig[roleId] || 0;
    const next = Math.max(0, current + delta);
    onSetRoleConfig({
      ...currentConfig,
      [roleId]: next,
    });
  };

  const applyPreset = (type: 'balanced' | 'chaos' | 'werewolf_heavy') => {
    if (!isHost) return;
    sound.playClick();
    const config: Record<RoleId, number> = {
      villager: 0,
      seer: 1,
      thief: 1,
      hunter: 0,
      werewolf: 1,
      great_werewolf: 0,
      tanner: 0,
    };

    if (type === 'balanced') {
      if (playerCount <= 3) {
        config.werewolf = 2;
        config.villager = 1;
      } else if (playerCount === 4) {
        config.werewolf = 2;
        config.villager = 2;
      } else if (playerCount === 5) {
        config.werewolf = 1;
        config.great_werewolf = 1;
        config.hunter = 1;
        config.villager = 1;
        config.tanner = 1;
      } else {
        config.werewolf = 1;
        config.great_werewolf = 1;
        config.hunter = 1;
        config.tanner = 1;
        config.villager = requiredCards - 5;
      }
    } else if (type === 'chaos') {
      config.thief = 2;
      config.tanner = 1;
      config.werewolf = 1;
      config.great_werewolf = 1;
      config.hunter = 1;
      config.villager = Math.max(0, requiredCards - 6);
    } else {
      // Werewolf heavy
      config.werewolf = 2;
      config.great_werewolf = 1;
      config.hunter = 1;
      config.villager = Math.max(0, requiredCards - 5);
    }

    // Ensure sum matches requiredCards
    let sum = Object.values(config).reduce((a, b) => a + b, 0);
    while (sum < requiredCards) {
      config.villager++;
      sum++;
    }
    while (sum > requiredCards && config.villager > 0) {
      config.villager--;
      sum--;
    }

    onSetRoleConfig(config);
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full px-4 py-4 animate-fade-in">
      <div className="space-y-3.5">
        {/* Top Status Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>役職カードの設定</span>
                {isHost && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                    部屋主が編集中
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">
                参加人数 {playerCount}名 ＋ 墓地 2枚 ＝ 合計 {requiredCards}枚
              </p>
            </div>

            {/* Validation Indicator */}
            <div
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                isValid
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
              }`}
            >
              {isValid ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{currentTotal} / {requiredCards}枚 (OK)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>{currentTotal} / {requiredCards}枚 ({currentTotal < requiredCards ? `あと${requiredCards - currentTotal}枚不足` : `${currentTotal - requiredCards}枚過剰`})</span>
                </>
              )}
            </div>
          </div>

          {/* Quick Presets (Host only) */}
          {isHost && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              <span className="text-slate-400 flex items-center gap-1 text-[10px]">
                <Wand2 className="w-3 h-3" />
                プリセット:
              </span>
              <button
                onClick={() => applyPreset('balanced')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg whitespace-nowrap transition"
              >
                標準
              </button>
              <button
                onClick={() => applyPreset('chaos')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg whitespace-nowrap transition"
              >
                怪盗・吊人入り
              </button>
              <button
                onClick={() => applyPreset('werewolf_heavy')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg whitespace-nowrap transition"
              >
                大狼・狩人
              </button>
            </div>
          )}
        </div>

        {/* Roles List */}
        <div className="space-y-2">
          {roleList.map((rid) => {
            const role = ROLES[rid];
            const count = currentConfig[rid] || 0;

            return (
              <div
                key={rid}
                className={`flex items-center justify-between p-3 rounded-2xl border-2 transition pop-card ${
                  count > 0
                    ? `bg-slate-900/90 ${role.borderClass}`
                    : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={ROLE_IMAGES[rid]}
                    alt={role.name}
                    className="w-12 h-16 rounded-xl object-cover border-2 border-amber-400/50 shadow-md flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm font-black text-white font-pop">{role.name}</span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${role.badgeClass}`}
                      >
                        {role.teamName}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-300 line-clamp-2 leading-relaxed">
                      {role.description}
                    </div>
                  </div>
                </div>

                {/* Counter controls */}
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {isHost ? (
                    <>
                      <button
                        onClick={() => updateRoleCount(rid, -1)}
                        disabled={count <= 0}
                        className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-200 border border-slate-700 pop-btn font-bold"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-5 text-center font-black text-sm text-amber-200">
                        {count}
                      </span>
                      <button
                        onClick={() => updateRoleCount(rid, 1)}
                        className="w-8 h-8 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 flex items-center justify-center text-slate-950 font-black shadow-sm pop-btn"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="px-3 py-1 bg-slate-800 rounded-xl text-sm font-bold text-amber-300 border border-slate-700">
                      {count} 枚
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Start Button */}
      <div className="pt-4">
        {isHost ? (
          <>
            <button
              onClick={() => {
                sound.playNightBell();
                onStartNight();
              }}
              disabled={!isValid}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98] ${
                isValid
                  ? 'bg-gradient-to-r from-indigo-700 via-purple-700 to-rose-700 hover:brightness-110 text-white shadow-purple-900/40'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>{isValid ? '役職を配って夜を開始する' : `カードの合計を${requiredCards}枚にしてください`}</span>
            </button>
            {onBackToLobby && (
              <button
                onClick={() => {
                  sound.playClick();
                  onBackToLobby();
                }}
                className="w-full mt-2.5 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700/80 transition flex items-center justify-center gap-1.5 active:scale-95 font-pop"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>参加わんこ一覧（部屋待機画面）に戻る</span>
              </button>
            )}
          </>
        ) : (
          <div className="text-center p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center justify-center gap-2">
            <Moon className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>部屋主が役職を設定中... 間もなく夜が始まります</span>
          </div>
        )}
      </div>
    </div>
  );
};
