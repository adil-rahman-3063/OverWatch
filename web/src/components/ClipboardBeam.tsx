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
              className={`flex-1 h-8 rounded-lg font-mono text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                beamed
                  ? 'bg-emerald-500 text-black'
                  : text.trim()
                  ? 'bg-white text-black hover:bg-neutral-200'
                  : 'bg-[#121217] text-neutral-600 border border-neutral-800'
              }`}
            >
              {beamed ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Beamed to Ctrl+V</span>
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  <span>Beam to PC</span>
                </>
              )}
            </button>
            {text && (
              <button
                onClick={() => setText('')}
                className="px-2.5 h-8 rounded-lg bg-[#0e0e12] border border-[#23232b] text-neutral-400 hover:text-white text-[10px] font-mono"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Read PC Clipboard */}
        <div className="mt-2 pt-2 border-t border-[#1a1a20] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-400">
              PC Clipboard Readout
            </span>
            <button
              onClick={onFetchClipboard}
              className="flex items-center gap-1 text-[9px] font-mono text-neutral-400 hover:text-white px-1.5 py-0.5 rounded bg-[#101015] border border-[#23232b]"
            >
              <ArrowDownToLine className="w-2.5 h-2.5" />
              <span>Fetch</span>
            </button>
          </div>

          {pcClipboardText ? (
            <div className="p-1.5 rounded-lg bg-[#050507] border border-[#1a1a20] flex items-center justify-between gap-1.5">
              <span className="text-[11px] font-mono text-neutral-300 truncate">
                {pcClipboardText}
              </span>
              <button
                onClick={handleCopyFromPc}
                className="p-1 rounded bg-[#121217] text-neutral-400 hover:text-white border border-[#22222a] shrink-0"
                title="Copy to phone"
              >
                {copiedPhone ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          ) : (
            <p className="text-[9px] font-mono text-neutral-600">
              Tap "Fetch" to read Windows clipboard.
            </p>
          )}
        </div>
      </div>

      <div className="pt-1.5 border-t border-[#1e1e24] text-[9px] font-mono text-neutral-500 text-center">
        Ctrl+V ready on PC
      </div>
    </div>
  );
};
