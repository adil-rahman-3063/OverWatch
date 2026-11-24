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
    setTimeout(() => setBeamed(false), 1500);
  };

  const handleCopyFromPc = () => {
    if (pcClipboardText) {
      navigator.clipboard?.writeText(pcClipboardText);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 1500);
    }
  };

  return (
    <div className="deck-panel rounded-xl p-5 flex flex-col justify-between h-full">
      <div>
        <div className="pb-3 mb-3 border-b border-[#1e1e24] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-neutral-400" />
            <h3 className="text-xs font-mono font-medium text-neutral-300 uppercase tracking-wider">
              Universal clipboard beam
            </h3>
          </div>
          <span className="text-[10px] font-mono text-neutral-500">
            Phone ⇄ Windows
          </span>
        </div>

        {/* Text Input to Beam to PC */}
        <div className="space-y-2">
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type prompt or paste link to beam to PC..."
              rows={3}
              className="w-full bg-[#050507] border border-[#1e1e24] focus:border-neutral-500 rounded-lg p-2.5 text-xs font-mono text-neutral-200 placeholder:text-neutral-600 resize-none outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBeam}
              disabled={!text.trim()}
              className={`flex-1 h-10 rounded-lg font-mono text-xs font-medium flex items-center justify-center gap-2 transition-all active:scale-95 ${
                beamed
                  ? 'bg-emerald-500 text-black'
                  : text.trim()
                  ? 'bg-white text-black hover:bg-neutral-200'
                  : 'bg-[#121217] text-neutral-600 border border-neutral-800'
              }`}
            >
              {beamed ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Beamed to PC Clipboard</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Beam to PC</span>
                </>
              )}
            </button>
            {text && (
              <button
                onClick={() => setText('')}
                className="px-3 h-10 rounded-lg bg-[#0e0e12] border border-[#23232b] text-neutral-400 hover:text-white text-xs font-mono"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Read from PC Clipboard */}
        <div className="mt-4 pt-3 border-t border-[#1a1a20] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-neutral-400">
              PC Clipboard Readout
            </span>
            <button
              onClick={onFetchClipboard}
              className="flex items-center gap-1 text-[10px] font-mono text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-[#101015] border border-[#23232b]"
            >
              <ArrowDownToLine className="w-3 h-3" />
              <span>Fetch from PC</span>
            </button>
          </div>

          {pcClipboardText ? (
            <div className="p-2.5 rounded-lg bg-[#050507] border border-[#1a1a20] flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-neutral-300 truncate">
                {pcClipboardText}
              </span>
              <button
                onClick={handleCopyFromPc}
                className="p-1.5 rounded-md bg-[#121217] text-neutral-400 hover:text-white border border-[#22222a] shrink-0"
                title="Copy to phone"
              >
                {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ) : (
            <p className="text-[10px] font-mono text-neutral-600">
              Tap "Fetch from PC" to pull what is copied on Windows.
            </p>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-[#1e1e24] text-[10px] font-mono text-neutral-500 text-center">
        Ctrl+V ready on PC upon beam
      </div>
    </div>
  );
};
