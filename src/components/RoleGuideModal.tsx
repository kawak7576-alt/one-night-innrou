import React from 'react';
import { X } from 'lucide-react';
import { ROLES, RoleId } from '../types/game';
import { sound } from '../utils/audio';
import { ROLE_IMAGES } from '../assets/roleImages';

interface RoleGuideModalProps {
  onClose: () => void;
}

export const RoleGuideModal: React.FC<RoleGuideModalProps> = ({ onClose }) => {
  const roleList: RoleId[] = [
    'villager',
    'seer',
    'thief',
    'hunter',
    'werewolf',
    'great_werewolf',
    'tanner',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl relative pop-card">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐾</span>
            <h3 className="text-base font-black text-amber-200 font-pop">わんこ役職とルール一覧</h3>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs text-slate-300">
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-amber-500/20">
            <h4 className="font-black text-amber-300 mb-1 text-sm font-pop">【わんナイト人狼の基本】</h4>
            <p className="leading-relaxed text-slate-200 text-[11px]">
              参加者のワンコ全員に役職が1枚ずつ配られ、残りの2枚は墓地に置かれます。夜に各役職が行動し、朝の話し合いの後、投票で処刑者を決定します。
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-black text-amber-200 text-xs tracking-wider font-pop">
              登場するワンコ役職（全7種）
            </h4>

            {roleList.map((rid) => {
              const r = ROLES[rid];
              return (
                <div
                  key={rid}
                  className={`p-3 rounded-2xl border-2 ${r.borderClass} bg-slate-950 shadow-md`}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <img
                      src={ROLE_IMAGES[rid]}
                      alt={r.name}
                      className="w-14 h-20 rounded-xl object-cover border-2 border-amber-400 shadow-md flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-black text-sm text-white font-pop">
                          {r.name}
                        </div>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${r.badgeClass}`}
                        >
                          {r.teamName}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-200">
                        {r.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-[10px] bg-slate-900 p-2 rounded-xl text-amber-200/90 border border-amber-500/20 font-bold">
                    <span className="text-amber-400">【夜のアクション】: </span>
                    {r.nightInstruction}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-950/80 p-3 rounded-2xl border border-amber-500/20 space-y-1.5">
            <h4 className="font-black text-amber-300 text-xs font-pop">【勝敗条件の詳細】</h4>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-300">
              <li>
                <strong className="text-rose-400">人狼陣営の勝利:</strong>
                人狼・大狼が1人も処刑されなかった場合。
              </li>
              <li>
                <strong className="text-emerald-400">村人陣営の勝利:</strong>
                人狼・大狼が1人でも処刑された場合。または、村に人狼が1人もおらず平和村投票が成立した場合。
              </li>
              <li>
                <strong className="text-purple-400">吊人（てるてる）の勝利:</strong>
                吊人自身が処刑された場合、吊人の単独勝利！
              </li>
              <li>
                <strong className="text-cyan-400">狩人の道連れ特則:</strong>
                狩人が処刑された場合、指定した相手が人狼なら村人勝利、吊人なら人狼勝利となります。
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 text-center">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl text-xs font-black font-pop transition pop-btn"
          >
            閉じる 🐾
          </button>
        </div>
      </div>
    </div>
  );
};
