import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Info } from 'lucide-react';
import { sound } from '../utils/audio';
import { getShareUrl } from '../utils/share';

interface QRCodeModalProps {
  roomId: string;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ roomId, onClose }) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const shareUrl = getShareUrl(roomId);

  useEffect(() => {
    QRCode.toDataURL(shareUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error(err));
  }, [shareUrl]);

  const handleCopy = () => {
    sound.playClick();
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl max-w-sm w-full p-5 text-center shadow-2xl relative pop-card">
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-black text-amber-200 mb-1 font-pop">スマホで参加 🐾</h3>
        <p className="text-xs text-slate-300 mb-3">
          カメラでQRコードを読み取ると、この部屋にすぐ参加できます。
        </p>

        <div className="bg-white p-3 rounded-2xl inline-block shadow-inner mb-3 border-4 border-amber-400">
          {dataUrl ? (
            <img src={dataUrl} alt="Room QR Code" className="w-52 h-52 mx-auto rounded-lg" />
          ) : (
            <div className="w-52 h-52 flex items-center justify-center text-slate-600 font-bold">
              QR生成中...
            </div>
          )}
        </div>

        <div className="text-xs font-mono font-bold text-amber-300 mb-3 tracking-widest bg-slate-950 py-1.5 px-3 rounded-xl border border-amber-500/30">
          部屋コード: <strong className="text-white text-sm">{roomId}</strong>
        </div>

        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 active:scale-[0.98] text-slate-950 rounded-2xl font-black text-xs transition shadow-lg pop-btn font-pop"
        >
          {copied ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? '参加URLをコピーしました！' : '参加URLをコピー 🐾'}</span>
        </button>

        {/* Helpful notice for 403 prevention */}
        <div className="mt-3 p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[10px] text-slate-400 text-left space-y-1">
          <div className="flex items-center gap-1 text-amber-300 font-bold">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>【知人が403エラーになる場合】</span>
          </div>
          <p className="leading-relaxed">
            ブラウザURLバーの <code>aistudio.google.com</code> ではなく、上の<strong>「参加URLをコピー」</strong>でコピーしたURLを送るか、QRコードを読み取ってもらってください。
          </p>
        </div>
      </div>
    </div>
  );
};

