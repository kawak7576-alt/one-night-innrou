import React, { useState } from 'react';
import { Vote, Check, Shield, Users, AlertTriangle } from 'lucide-react';
import { ClientGameState } from '../types/game';
import { sound } from '../utils/audio';

interface VotingViewProps {
  gameState: ClientGameState;
  onSubmitVote: (targetId: string) => void;
}

export const VotingView: React.FC<VotingViewProps> = ({ gameState, onSubmitVote }) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(
    gameState.myVoteTarget || null
  );

  const myId = gameState.myPlayerId;
  const otherPlayers = gameState.players.filter((p) => p.id !== myId);
  const totalCount = gameState.players.length;
  const votingReadyCount = gameState.votingReadyCount;
  const hasVoted = gameState.myVoteTarget !== null;

  const handleSelect = (targetId: string) => {
    if (hasVoted) return;
    sound.playClick();
    setSelectedTargetId(targetId);
  };

  const handleVoteConfirm = () => {
    if (!selectedTargetId || hasVoted) return;
    sound.playClick();
    onSubmitVote(selectedTargetId);
  };

  const selectedName =
    selectedTargetId === 'PEACE'
      ? '平和村'
      : gameState.players.find((p) => p.id === selectedTargetId)?.name || '';

  return (
    <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full px-4 py-5 animate-fade-in">
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-1 shadow-sm">
            <Vote className="w-3.5 h-3.5 text-rose-400" />
            <span>投票フェーズ</span>
          </div>
          <h2 className="text-base font-bold text-white">
            誰を処刑しますか？
          </h2>
          <p className="text-xs text-slate-400">
            人狼と思われるプレイヤー、または平和村を選択してください
          </p>
        </div>

        {/* Voting Options */}
        <div className="space-y-2.5">
          {/* Other players list */}
          <div className="text-xs font-bold text-slate-300 px-1">
            ▼ 処刑したいプレイヤーを選択
          </div>
          <div className="grid grid-cols-1 gap-2">
            {otherPlayers.map((player) => {
              const isSelected = selectedTargetId === player.id;
              return (
                <button
                  key={player.id}
                  onClick={() => handleSelect(player.id)}
                  disabled={hasVoted}
                  className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition active:scale-[0.99] ${
                    isSelected
                      ? 'bg-rose-950/80 border-rose-500 shadow-md shadow-rose-950/50 text-white'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200'
                  } ${hasVoted ? 'cursor-not-allowed opacity-80' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                        isSelected
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {player.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">
                        {player.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        プレイヤー
                      </div>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? 'border-rose-400 bg-rose-500 text-white'
                        : 'border-slate-700'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Peace Village Option (Requirement 17) */}
          <div className="pt-2">
            <div className="text-xs font-bold text-slate-300 px-1 mb-1.5">
              ▼ 人狼がいないと思った場合
            </div>
            <button
              onClick={() => handleSelect('PEACE')}
              disabled={hasVoted}
              className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition active:scale-[0.99] ${
                selectedTargetId === 'PEACE'
                  ? 'bg-emerald-950/80 border-emerald-500 shadow-md shadow-emerald-950/50 text-white'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200'
              } ${hasVoted ? 'cursor-not-allowed opacity-80' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${
                    selectedTargetId === 'PEACE'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  🕊️
                </div>
                <div>
                  <div className="font-bold text-sm text-white">
                    平和村（誰も人狼ではない）
                  </div>
                  <div className="text-[10px] text-slate-400">
                    人狼が墓地に2枚とも眠っていると予想
                  </div>
                </div>
              </div>

              <div
                className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                  selectedTargetId === 'PEACE'
                    ? 'border-emerald-400 bg-emerald-500 text-white'
                    : 'border-slate-700'
                }`}
              >
                {selectedTargetId === 'PEACE' && <Check className="w-3.5 h-3.5" />}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Vote Confirmation & Status */}
      <div className="pt-4 space-y-3">
        {/* Progress */}
        <div className="flex items-center justify-between px-2 text-xs text-slate-400 bg-slate-950/60 py-2 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>投票完了状況:</span>
          </div>
          <div className="font-bold text-white">
            {votingReadyCount} / {totalCount}人 投票済み
          </div>
        </div>

        {/* Big Vote Button */}
        <button
          onClick={handleVoteConfirm}
          disabled={!selectedTargetId || hasVoted}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-xl transition active:scale-[0.98] ${
            hasVoted
              ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-default'
              : !selectedTargetId
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              : selectedTargetId === 'PEACE'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white shadow-emerald-900/40'
              : 'bg-gradient-to-r from-rose-600 to-red-600 hover:brightness-110 text-white shadow-rose-900/40'
          }`}
        >
          <Vote className="w-5 h-5" />
          <span>
            {hasVoted
              ? `【${selectedName}】に投票完了！全員の投票を待機中...`
              : selectedTargetId
              ? `【${selectedName}】に投票する`
              : '投票先を選択してください'}
          </span>
        </button>
      </div>
    </div>
  );
};
