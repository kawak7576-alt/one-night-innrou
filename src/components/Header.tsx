import React, { useState } from 'react';
import { Volume2, VolumeX, RotateCcw, BookOpen, Copy, Check, AlertTriangle } from 'lucide-react';
import { sound } from '../utils/audio';
import { APP_AVATAR } from '../assets/roleImages';
import { GamePhase } from '../types/game';
import { getShareUrl } from '../utils/share';

interface HeaderProps {
  roomId?: string;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  phase?: GamePhase;
  onResetGame?: () => void;
  onOpenGuide: () => void;
  onOpenQR?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomId,
  connectionStatus,
  phase,
  onResetGame,
  onOpenGuide,
}) => {
  const [muted, setMuted] = useState(sound.getMuted());
  const [copied, setCopied] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const toggleMute = () => {
    const next = !muted;
    sound.setMuted(next);
    setMuted(next);
    if (!next) sound.playClick();
  };

  const handleCopyLink = () => {
    sound.playClick();
    const url = getShareUrl(roomId);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleResetClick = () => {
    sound.playClick();
    if (!onResetGame) return;

    // If game is actively playing, ask confirmation first
    if (phase && phase !== 'LOBBY' && phase !== 'ROLE_CONFIG') {
      setShowConfirmReset(true);
    } else {
      sound.playPuppyBark();
      onResetGame();
    }
  };

  const handleConfirmReset = () => {
    sound.playPuppyBark();
    setShowConfirmReset(false);
    if (onResetGame) {
      onResetGame();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b-2 border-amber-500/30 px-3 py-2">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Title & Brand with Anime Villager Avatar */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img
                src={APP_AVATAR}
                alt="わんナイト人狼 村人アイコン"
                className="w-9 h-9 rounded-xl object-cover border-2 border-amber-400 shadow-md shadow-amber-950/50"
              />
              <span className="absolute -bottom-1 -right-1 text-xs">🐾</span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h1 className="text-sm font-extrabold tracking-tight text-amber-200 font-pop drop-shadow-sm flex items-center gap-1">
                  <span>わんナイト人狼</span>
                  <span className="text-xs text-amber-400">🐾</span>
                </h1>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                <span
                  className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected'
                      ? 'bg-emerald-400 animate-pulse'
                      : connectionStatus === 'connecting'
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-rose-500'
                  }`}
                />
                <span>
                  {connectionStatus === 'connected'
                    ? 'わんこ接続中'
                    : connectionStatus === 'connecting'
                    ? '接続中...'
                    : '切断'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5">
            {roomId && (
              <>
                {/* Room Code Badge */}
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 border-2 border-amber-500/40 rounded-xl text-xs font-mono font-bold transition active:scale-95"
                  title="部屋URLをコピー"
                >
                  <span>部屋:{roomId}</span>
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-amber-300" />
                  )}
                </button>

                {/* GAME RESET / NEW GAME BUTTON (Replaced QR Button) */}
                <button
                  onClick={handleResetClick}
                  className="flex items-center gap-1 px-2 py-1.5 text-rose-200 hover:text-white bg-rose-950/70 hover:bg-rose-900 border-2 border-rose-500/60 rounded-xl transition active:scale-95 text-xs font-black font-pop shadow-md shadow-rose-950/40 pop-btn"
                  title="ゲームリセット（開始直前の画面に戻る）"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[11px]">リセット</span>
                </button>
              </>
            )}

            {/* Guide / Rules */}
            <button
              onClick={() => {
                sound.playClick();
                onOpenGuide();
              }}
              className="p-1.5 text-amber-200 hover:text-white bg-slate-800 hover:bg-slate-700 border-2 border-amber-500/30 rounded-xl transition active:scale-95"
              title="役職と遊び方の説明"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            {/* Mute button */}
            <button
              onClick={toggleMute}
              className="p-1.5 text-amber-200 hover:text-white bg-slate-800 hover:bg-slate-700 border-2 border-amber-500/30 rounded-xl transition active:scale-95"
              title={muted ? '音声をオンにする' : '消音'}
            >
              {muted ? (
                <VolumeX className="w-4 h-4 text-slate-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-amber-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Reset Confirmation Dialog */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border-4 border-rose-500 rounded-3xl p-5 max-w-sm w-full text-center space-y-4 shadow-2xl pop-card">
            <div className="w-12 h-12 rounded-2xl bg-rose-950 border-2 border-rose-500 flex items-center justify-center mx-auto text-rose-400 text-2xl">
              <RotateCcw className="w-6 h-6 animate-spin-slow" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-rose-300 font-pop">
                ゲームをリセットしますか？ 🐾
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                進行中のゲームをリセットし、全員を開始直前（役職設定画面）に戻します。
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => {
                  sound.playClick();
                  setShowConfirmReset(false);
                }}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-xs transition border border-slate-700 font-pop"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmReset}
                className="py-2.5 px-3 bg-gradient-to-r from-rose-600 to-red-600 hover:brightness-110 text-white rounded-xl font-black text-xs transition shadow-lg shadow-rose-950/50 font-pop pop-btn"
              >
                リセットする 🐾
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
