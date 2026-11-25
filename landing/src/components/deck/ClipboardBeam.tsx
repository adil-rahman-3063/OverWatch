import React, { useState } from 'react';
import { Send, ArrowDownToLine, Copy, Check, Sparkles } from 'lucide-react';

interface ClipboardBeamProps {
  onBeamText: (text: string) => void;
  onFetchClipboard: () => void;
  pcClipboardText?: string;
}

export const ClipboardBeam: React.FC<ClipboardBeamProps> = ({
  onBeamText,
  onFetchClipboard,
  pcClipboardText,
}) => {
  const [text, setText] = useState('');
  const [beamed, setBeamed] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleBeam = () => {
    if (!text.trim()) return;
    onBeamText(text);
    setBeamed(true);
    setTimeout(() => setBeamed(false), 1200);
  };

  const handleCopyFromPc = () => {
    if (pcClipboardText) {
      navigator.clipboard?.writeText(pcClipboardText);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 1200);
    }
  };

  return (
    <div className="deck-panel rounded-xl p-3 sm:p-4 h-full flex flex-col justify-between overflow-hidden">
      <div>
        <div className="pb-2 mb-2 border-b border-[#1e1e24] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
            <h3 className="text-[11px] font-mono font-medium text-neutral-300 uppercase tracking-wider">
              Clipboard beam
            </h3>
          </div>
          <span className="text-[9px] font-mono text-neutral-500">
            Phone ⇄ PC
          </span>
        </div>

        {/* Input Textarea */}
        <div className="space-y-1.5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type prompt or link to beam..."
            rows={2}
            className="w-full bg-[#050507] border border-[#1e1e24] focus:border-neutral-500 rounded-lg p-2 text-[11px] font-mono text-neutral-200 placeholder:text-neutral-600 resize-none outline-none transition-colors"
          />

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleBeam}
              disabled={!text.trim()}
              className={`flex-1 py-1.5 px-3 rounded-lg font-mono text-xs font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                beamed
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'bg-white text-black hover:bg-neutral-200 shadow-sm'
              }`}
            >
              {beamed ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Beamed to PC!</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Beam to PC</span>
                </>
              )}
            </button>

            <button
              onClick={() => setText('')}
              disabled={!text}
              className="deck-button py-1.5 px-2 rounded-lg font-mono text-xs text-neutral-400 hover:text-white disabled:opacity-30"
              title="Clear"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Live Windows PC Clipboard Snippet */}
        <div className="mt-2.5 pt-2 border-t border-[#1a1a20]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">
              From PC clipboard
            </span>
            <button
              onClick={onFetchClipboard}
              className="text-[9px] font-mono text-neutral-400 hover:text-white flex items-center gap-1"
              title="Fetch PC clipboard"
            >
              <ArrowDownToLine className="w-2.5 h-2.5" />
              <span>Fetch</span>
            </button>
          </div>

          <div className="bg-[#050507] rounded-lg p-1.5 border border-[#1a1a20] flex items-center justify-between gap-2">
            <p className="text-[10px] font-mono text-neutral-300 truncate">
              {pcClipboardText || 'git push origin main'}
            </p>
            <button
              onClick={handleCopyFromPc}
              className="text-neutral-500 hover:text-white shrink-0 p-1 rounded"
              title="Copy to phone"
            >
              {copiedPhone ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-[#1e1e24] flex items-center justify-between text-[9px] font-mono text-neutral-500">
        <span>Windows Clipboard API</span>
        <span>Bi-directional</span>
      </div>
    </div>
  );
};
