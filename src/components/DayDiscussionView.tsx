import React, { useEffect, useState } from 'react';
import { Sun, Check, Users, MessageSquare } from 'lucide-react';
import { ClientGameState } from '../types/game';
import { sound } from '../utils/audio';

interface DayDiscussionViewProps {
  gameState: ClientGameState;
  onEndDiscussion: () => void;
}

export const DayDiscussionView: React.FC<DayDiscussionViewProps> = ({
  gameState,
  onEndDiscussion,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Play morning chime on mount
  useEffect(() => {
    sound.playMorningChime();
  }, []);

  // Timer running 00:00 -> 59:59 looping
  useEffect(() => {
    const startTime = gameState.discussionStartedAt || Date.now();
    const updateTimer = () => {
      const now = Date.now();
      const diffSec = Math.floor((now - startTime) / 1000);
      // Loop from 0 to 3599 (59:59)
      const looped = diffSec % 3600;
      setElapsedSeconds(looped);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [gameState.discussionStartedAt]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isReady = gameState.myDiscussionReady;
  const readyCount = gameState.discussionReadyCount;
  const totalCount = gameState.players.length;

  const handleEndDiscussionClick = () => {
    if (isReady) return;
    sound.playClick();
    onEndDiscussion();
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full px-4 py-5 animate-fade-in">
      <div className="space-y-5">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-1 shadow-sm">
            <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span>朝の話し合い</span>
          </div>
          <p className="text-xs text-slate-400">
            夜の行動を推理し、誰が人狼かを話し合いましょう
          </p>
        </div>

        {/* Central Prominent Timer (Requirement 12 & 13) */}
        <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/20 border-2 border-amber-500/30 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
          <div className="text-xs font-bold text-amber-400/80 uppercase tracking-widest mb-1">
            話し合いタイム
          </div>

          <div className="text-6xl font-black font-mono tracking-wider text-white drop-shadow-[0_0_15px_rgba(245,158,11,0.3)] my-2">
            {timeFormatted}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <span>（00:00〜59:59でループ）</span>
          </div>
        </div>

        {/* Player Ready Status Badges */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>全員の準備状況</span>
            </span>
            <span className="font-bold text-amber-400">
              {readyCount} / {totalCount}人 が話し合い終了
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {gameState.players.map((p) => (
              <div
                key={p.id}
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition ${
                  p.isReady
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span className="font-medium truncate max-w-[90px]">{p.name}</span>
                {p.isReady ? (
                  <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>完了</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">議論中...</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Discussion Advice Tips */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
          <div className="font-bold text-slate-300 flex items-center gap-1 text-xs">
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            <span>議論のヒント</span>
          </div>
          <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
            <li>占い師は誰を占ったか名乗り出てみましょう。</li>
            <li>怪盗は誰と役職を交換したかを言ってみましょう（嘘をつくのも作戦！）。</li>
            <li>人狼が村に1人もいないと思ったら「平和村」に投票できます。</li>
          </ul>
        </div>
      </div>

      {/* Big Action Button (Requirement 14 & 15) */}
      <div className="pt-4">
        <button
          onClick={handleEndDiscussionClick}
          disabled={isReady}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-xl transition active:scale-[0.98] ${
            isReady
              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 cursor-default'
              : 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:brightness-110 text-white shadow-amber-900/40'
          }`}
        >
          <Check className="w-5 h-5" />
          <span>
            {isReady
              ? `話し合い終了済み（他の人を待機中 ${readyCount}/${totalCount}）`
              : '話し合い終了（投票へ進む）'}
          </span>
        </button>
      </div>
    </div>
  );
};
