import React, { useState } from 'react';
import { Moon, Eye, Shuffle, Check, Users, Sparkles, AlertCircle } from 'lucide-react';
import { ClientGameState, ROLES, RoleId } from '../types/game';
import { sound } from '../utils/audio';
import { ROLE_IMAGES } from '../assets/roleImages';

interface NightViewProps {
  gameState: ClientGameState;
  onSubmitAction: (params: {
    seerChoice?: { targetPlayerId?: string; checkGraveyard?: boolean };
    thiefChoice?: { targetPlayerId: string };
    isReady?: boolean;
  }) => void;
}

export const NightView: React.FC<NightViewProps> = ({ gameState, onSubmitAction }) => {
  const [isCardRevealed, setIsCardRevealed] = useState(false);
  const [seerTargetId, setSeerTargetId] = useState<string | null>(null);
  const [thiefTargetId, setThiefTargetId] = useState<string | null>(null);
  const [seerActionTaken, setSeerActionTaken] = useState<'player' | 'graveyard' | null>(null);

  const myRole = gameState.myInitialRole ? ROLES[gameState.myInitialRole] : null;
  const otherPlayers = gameState.players.filter((p) => p.id !== gameState.myPlayerId);
  const readyCount = gameState.players.filter((p) => p.isReady).length;
  const totalPlayers = gameState.players.length;
  const isSubmitted = gameState.hasSubmittedNightAction;

  const handleRevealCard = () => {
    if (!isCardRevealed) {
      sound.playCardFlip();
      setIsCardRevealed(true);
    }
  };

  const handleSeerPickPlayer = (targetId: string) => {
    sound.playClick();
    setSeerTargetId(targetId);
    setSeerActionTaken('player');
    onSubmitAction({
      seerChoice: { targetPlayerId: targetId },
      isReady: false,
    });
  };

  const handleSeerPickGraveyard = () => {
    sound.playClick();
    setSeerActionTaken('graveyard');
    onSubmitAction({
      seerChoice: { checkGraveyard: true },
      isReady: false,
    });
  };

  const handleThiefSelectPlayer = (targetId: string) => {
    sound.playClick();
    setThiefTargetId(targetId);
    onSubmitAction({
      thiefChoice: { targetPlayerId: targetId },
      isReady: false,
    });
  };

  const handleFinishNight = () => {
    sound.playPuppyBark();
    onSubmitAction({ isReady: true });
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full px-4 py-4 animate-fade-in relative">
      {/* Background ambient stars / moon */}
      <div className="absolute top-2 right-4 text-slate-700/30 text-6xl pointer-events-none select-none">
        🌙
      </div>

      <div className="space-y-4">
        {/* Top Phase Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-1 shadow-sm">
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>夜のフェーズ</span>
          </div>
          <p className="text-xs text-slate-400">
            あなたの役職を確認し、能力を使用してください
          </p>
        </div>

        {/* The Role Card (Tap to flip/reveal) */}
        <div className="flex justify-center">
          <div
            onClick={handleRevealCard}
            className={`w-full max-w-[280px] h-[360px] rounded-2xl cursor-pointer perspective-1000 transition-transform duration-500 active:scale-95 shadow-2xl relative ${
              !isCardRevealed ? 'border-2 border-indigo-500/40 bg-gradient-to-b from-slate-900 to-indigo-950' : ''
            }`}
          >
            {!isCardRevealed ? (
              // Card Back (Mystery)
              <div className="w-full h-full rounded-3xl flex flex-col items-center justify-center p-6 text-center border-4 border-amber-400/40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 pop-card">
                <div className="w-20 h-20 rounded-2xl border-2 border-amber-400/40 flex items-center justify-center text-4xl mb-3 shadow-lg shadow-indigo-950 bg-slate-900/80 animate-pulse">
                  🐾
                </div>
                <div className="font-pop font-black text-lg text-amber-200 mb-1">
                  わんナイト人狼
                </div>
                <div className="text-xs text-slate-950 bg-amber-400 px-3.5 py-1.5 rounded-full font-black font-pop animate-bounce shadow-md">
                  タップして役職を確認 🐾
                </div>
                <p className="text-[10px] text-amber-200/60 mt-4 font-bold">
                  ※画面を他プレイヤーに見られないようご注意ください
                </p>
              </div>
            ) : myRole ? (
              // Card Front (Revealed with Dog Illustration)
              <div
                className={`w-full h-full rounded-3xl p-3.5 flex flex-col justify-between border-4 ${myRole.borderClass} bg-slate-950 pop-card shadow-2xl animate-flip-in relative overflow-hidden`}
              >
                {/* Dog Card Illustration Image */}
                <div className="relative rounded-2xl overflow-hidden border-2 border-amber-400/40 shadow-inner flex-1 mb-2 bg-slate-900">
                  <img
                    src={ROLE_IMAGES[myRole.id]}
                    alt={myRole.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full border-2 font-black ${myRole.badgeClass} shadow-md backdrop-blur-sm bg-slate-950/80`}
                    >
                      {myRole.teamName}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 text-xs bg-slate-950/80 px-2 py-0.5 rounded-full text-amber-300 font-mono font-bold border border-amber-500/30">
                    {myRole.nameEn}
                  </div>
                </div>

                {/* Card Title & Info */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xl font-black text-white font-pop tracking-tight">
                      {myRole.name}
                    </span>
                    <span className="text-xs text-amber-300 font-bold">🐾</span>
                  </div>

                  <div className="text-[11px] bg-slate-900/90 p-2 rounded-xl text-amber-200/90 border border-amber-500/30 text-center font-bold">
                    {myRole.nightInstruction}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Role Specific Actions Panel */}
        {isCardRevealed && myRole && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 animate-fade-in">
            {/* Seer (占い師) */}
            {myRole.id === 'seer' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span>どちらか1つを選択して占ってください:</span>
                </div>

                {!seerActionTaken ? (
                  <div className="space-y-2">
                    <div className="text-[11px] text-slate-400">▼ 他のプレイヤー1人を占う</div>
                    <div className="grid grid-cols-2 gap-2">
                      {otherPlayers.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleSeerPickPlayer(p.id)}
                          className="p-2.5 bg-slate-800 hover:bg-indigo-950/60 active:scale-95 border border-slate-700 hover:border-indigo-500/50 rounded-xl text-xs font-bold text-white transition text-center"
                        >
                          👤 {p.name}
                        </button>
                      ))}
                    </div>

                    <div className="text-[11px] text-slate-400 pt-1">▼ または墓地を占う</div>
                    <button
                      onClick={handleSeerPickGraveyard}
                      className="w-full p-2.5 bg-slate-800 hover:bg-indigo-950/60 active:scale-95 border border-slate-700 hover:border-indigo-500/50 rounded-xl text-xs font-bold text-indigo-300 transition flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>墓地にある残り2枚を確認する</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-950 p-3 rounded-2xl border border-indigo-500/30 text-center space-y-2">
                    <div className="text-xs font-black text-indigo-400 font-pop">✨ 占い結果 🐾</div>
                    {gameState.myNightTargetResult ? (
                      <div className="text-sm text-white">
                        【{gameState.myNightTargetResult.targetName}】の初期役職は...
                        <div className="flex items-center justify-center gap-2 mt-2 p-2 bg-slate-900 rounded-xl border border-indigo-500/40">
                          <img
                            src={ROLE_IMAGES[gameState.myNightTargetResult.role]}
                            alt="占った役職"
                            className="w-12 h-16 rounded-lg object-cover border border-amber-400"
                          />
                          <div className="text-left">
                            <div className="text-base font-black text-amber-300 font-pop">
                              {ROLES[gameState.myNightTargetResult.role].name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {ROLES[gameState.myNightTargetResult.role].teamName}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : gameState.myKnownGraveyard ? (
                      <div>
                        <div className="text-xs text-slate-300 font-bold mb-1.5">墓地にあった2枚:</div>
                        <div className="flex justify-center gap-2">
                          {gameState.myKnownGraveyard.map((rid, idx) => (
                            <div
                              key={idx}
                              className="p-1.5 bg-slate-900 rounded-xl text-xs font-bold text-white border border-indigo-500/30 flex items-center gap-2"
                            >
                              <img
                                src={ROLE_IMAGES[rid]}
                                alt={ROLES[rid].name}
                                className="w-10 h-14 rounded-lg object-cover border border-amber-400"
                              />
                              <div className="text-left pr-2">
                                <div className="text-xs font-black font-pop">{ROLES[rid].name}</div>
                                <div className="text-[9px] text-slate-400">{ROLES[rid].teamName}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400">透視中...</div>
                    )}
                    {/* Confirmation Button for Seer */}
                    <button
                      onClick={handleFinishNight}
                      disabled={isSubmitted}
                      className={`w-full mt-3 py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98] font-pop ${
                        isSubmitted
                          ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 shadow-emerald-950/40 pop-btn animate-pulse'
                      }`}
                    >
                      <Check className="w-4 h-4 text-slate-950" />
                      <span>
                        {isSubmitted
                          ? '夜の行動を終えました（待機中...）'
                          : '占い結果を確認した（夜を終える） 🐾'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Thief (怪盗) */}
            {myRole.id === 'thief' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Shuffle className="w-4 h-4" />
                  <span>役職を交換するプレイヤーを1人選んでください:</span>
                </div>

                {!gameState.myNightTargetResult ? (
                  <div className="grid grid-cols-2 gap-2">
                    {otherPlayers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleThiefSelectPlayer(p.id)}
                        className={`p-2.5 rounded-xl text-xs font-bold transition text-center border ${
                          thiefTargetId === p.id
                            ? 'bg-amber-600 border-amber-400 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                        }`}
                      >
                        🎭 {p.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-950 p-3 rounded-2xl border border-amber-500/30 text-center space-y-2">
                    <div className="text-xs font-black text-amber-400 font-pop">
                      🎭 交換相手の役職を確認しました 🐾
                    </div>
                    <div className="text-sm text-white">
                      【{gameState.myNightTargetResult.targetName}】さんの役職は...
                      <div className="flex items-center justify-center gap-2 mt-2 p-2 bg-slate-900 rounded-xl border border-amber-500/40">
                        <img
                          src={ROLE_IMAGES[gameState.myNightTargetResult.role]}
                          alt="奪った役職"
                          className="w-12 h-16 rounded-lg object-cover border border-amber-400"
                        />
                        <div className="text-left">
                          <div className="text-base font-black text-amber-300 font-pop">
                            {ROLES[gameState.myNightTargetResult.role].name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {ROLES[gameState.myNightTargetResult.role].teamName}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-amber-200/70 pt-1 font-bold">
                      朝になる瞬間に役職が入れ替わり、あなたはその役職の陣営になります。相手は交換されたことを知りません。
                    </p>

                    {/* Confirmation Button for Thief */}
                    <button
                      onClick={handleFinishNight}
                      disabled={isSubmitted}
                      className={`w-full mt-3 py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98] font-pop ${
                        isSubmitted
                          ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 shadow-amber-950/40 pop-btn animate-pulse'
                      }`}
                    >
                      <Check className="w-4 h-4 text-slate-950" />
                      <span>
                        {isSubmitted
                          ? '夜の行動を終えました（待機中...）'
                          : '交換結果を確認した（夜を終える） 🐾'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Werewolf (人狼) */}
            {myRole.id === 'werewolf' && (
              <div className="bg-slate-950 p-3 rounded-xl border border-rose-600/30 space-y-2 text-center">
                <div className="text-xs font-bold text-rose-400 flex items-center justify-center gap-1.5">
                  <span>🐺 人狼の仲間確認</span>
                </div>
                {gameState.myKnownTeammates && gameState.myKnownTeammates.length > 0 ? (
                  <div>
                    <p className="text-xs text-slate-300 mb-1.5">あなたの仲間:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {gameState.myKnownTeammates.map((mate) => (
                        <span
                          key={mate.id}
                          className="px-3 py-1 bg-rose-950/80 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-bold"
                        >
                          🐺 {mate.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-amber-400 bg-amber-950/30 p-2 rounded-lg border border-amber-500/20">
                    仲間の人狼はいません（あなたは単独の人狼です）。墓地に人狼がいる可能性があります。
                  </div>
                )}
              </div>
            )}

            {/* Great Werewolf (大狼) */}
            {myRole.id === 'great_werewolf' && (
              <div className="bg-slate-950 p-3 rounded-xl border border-red-600/40 space-y-2.5 text-center">
                <div className="text-xs font-bold text-red-400 flex items-center justify-center gap-1.5">
                  <span>🩸 大狼の能力発動</span>
                </div>
                {/* Teammates */}
                <div>
                  <p className="text-[11px] text-slate-400 mb-1">仲間の人狼:</p>
                  {gameState.myKnownTeammates && gameState.myKnownTeammates.length > 0 ? (
                    <div className="flex flex-wrap justify-center gap-2">
                      {gameState.myKnownTeammates.map((mate) => (
                        <span
                          key={mate.id}
                          className="px-2.5 py-1 bg-rose-950/80 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-bold"
                        >
                          🐺 {mate.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">（単独の大狼です）</span>
                  )}
                </div>

                {/* Graveyard cards */}
                <div className="pt-2 border-t border-slate-800">
                  <p className="text-[11px] text-amber-300 font-bold mb-1.5">墓地にある2枚のカード 🐾:</p>
                  <div className="flex justify-center gap-2">
                    {gameState.myKnownGraveyard ? (
                      gameState.myKnownGraveyard.map((rid, idx) => (
                        <div
                          key={idx}
                          className="p-1.5 bg-slate-900 rounded-xl text-xs font-bold text-red-300 border border-red-500/30 flex items-center gap-2"
                        >
                          <img
                            src={ROLE_IMAGES[rid]}
                            alt={ROLES[rid].name}
                            className="w-10 h-14 rounded-lg object-cover border border-amber-400"
                          />
                          <div className="text-left pr-2">
                            <div className="text-xs font-black font-pop">{ROLES[rid].name}</div>
                            <div className="text-[9px] text-slate-400">{ROLES[rid].teamName}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">取得中...</span>
                    )}
                  </div>

                  {/* Confirmation Button for Great Werewolf */}
                  <button
                    onClick={handleFinishNight}
                    disabled={isSubmitted}
                    className={`w-full mt-2.5 py-2.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-[0.98] font-pop ${
                      isSubmitted
                        ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                        : 'bg-gradient-to-r from-rose-500 to-red-500 hover:brightness-110 text-slate-950 shadow-rose-950/40 pop-btn'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 text-slate-950" />
                    <span>
                      {isSubmitted ? '夜の行動を終えました（待機中...）' : '墓地を確認した（夜を終える） 🐾'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Hunter (狩人) */}
            {myRole.id === 'hunter' && (
              <div className="bg-slate-950 p-3 rounded-xl border border-cyan-500/30 text-center space-y-1 text-xs">
                <div className="font-bold text-cyan-400">🏹 狩人の心得</div>
                <p className="text-slate-300 text-[11px]">
                  夜のアクションはありません。昼の投票で処刑された場合、誰か1人を道連れにして射殺できます！
                </p>
              </div>
            )}

            {/* Tanner (吊人) */}
            {myRole.id === 'tanner' && (
              <div className="bg-slate-950 p-3 rounded-xl border border-purple-500/30 text-center space-y-1 text-xs">
                <div className="font-bold text-purple-400">👻 吊人（てるてる）の目的</div>
                <p className="text-slate-300 text-[11px]">
                  夜のアクションはありません。昼の議論で怪しまれ、処刑されることで単独勝利となります！
                </p>
              </div>
            )}

            {/* Villager (村人) */}
            {myRole.id === 'villager' && (
              <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30 text-center space-y-1 text-xs">
                <div className="font-bold text-emerald-400">🧑‍🌾 村人の心得</div>
                <p className="text-slate-300 text-[11px]">
                  夜のアクションはありません。朝の議論で人狼の嘘を見破りましょう！
                </p>
              </div>
            )}

            {/* Confirmation Ready Button */}
            <div className="pt-2">
              <button
                onClick={handleFinishNight}
                disabled={
                  isSubmitted ||
                  (myRole.id === 'seer' && !seerActionTaken) ||
                  (myRole.id === 'thief' && !thiefTargetId)
                }
                className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-xl transition active:scale-[0.98] font-pop pop-btn ${
                  isSubmitted
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                    : (myRole.id === 'seer' && !seerActionTaken) ||
                      (myRole.id === 'thief' && !thiefTargetId)
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:brightness-110 text-slate-950 shadow-orange-950/40'
                }`}
              >
                <Check className="w-4 h-4 text-slate-950" />
                <span>
                  {isSubmitted
                    ? '✅ 全員の行動終了を待っていますワン...'
                    : (myRole.id === 'seer' && !seerActionTaken)
                    ? '占う対象を選んでください 🔮'
                    : (myRole.id === 'thief' && !thiefTargetId)
                    ? '交換相手を選んでください 🎭'
                    : '夜を終える（確認完了） 🐾'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Progress Counter */}
      <div className="pt-3">
        <div className="flex items-center justify-between px-2 text-[11px] text-slate-400 bg-slate-950/60 py-2 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>夜の完了状況:</span>
          </div>
          <div className="font-bold text-white">
            {readyCount} / {totalPlayers}人 完了
          </div>
        </div>
      </div>
    </div>
  );
};
