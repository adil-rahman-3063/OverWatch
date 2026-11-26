import React, { useState, useRef } from 'react';
import {
  Send,
  ArrowDownToLine,
  Copy,
  Check,
  Sparkles,
  Camera,
  Image as ImageIcon,
  Monitor,
  Download,
  X,
  Wifi,
  Radio,
  Maximize2
} from 'lucide-react';

export interface ClipboardBeamProps {
  onBeamText: (text: string) => void;
  onFetchClipboard: () => void;
  pcClipboardText?: string;
  lanIp?: string;
  localPort?: number;
  onBeamImage?: (imageBase64: string) => Promise<{ success: boolean; mode?: string }>;
  onFetchPcClipboardImage?: () => Promise<{ hasImage: boolean; base64?: string }>;
  onCapturePcScreen?: () => Promise<{ success: boolean; base64?: string }>;
}

export const ClipboardBeam: React.FC<ClipboardBeamProps> = ({
  onBeamText,
  onFetchClipboard,
  pcClipboardText,
  lanIp = '127.0.0.1',
  onBeamImage,
  onFetchPcClipboardImage,
  onCapturePcScreen,
}) => {
  const [tab, setTab] = useState<'text' | 'image'>('text');

  // Text Beam State
  const [text, setText] = useState('');
  const [beamed, setBeamed] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Image Beam State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [beamingImage, setBeamingImage] = useState(false);
  const [imageBeamed, setImageBeamed] = useState(false);
  const [beamModeUsed, setBeamModeUsed] = useState<string>('');

  // Received PC Image State
  const [receivedImage, setReceivedImage] = useState<string | null>(null);
  const [receivedImageType, setReceivedImageType] = useState<'clipboard' | 'screen' | null>(null);
  const [fetchingPcImage, setFetchingPcImage] = useState(false);
  const [capturingScreen, setCapturingScreen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // Text Beam Handlers
  // -------------------------------------------------------------
  const handleBeamText = () => {
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

  // -------------------------------------------------------------
  // Image Selection Handlers
  // -------------------------------------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBeamImageToPc = async () => {
    if (!selectedImage || !onBeamImage) return;
    setBeamingImage(true);
    try {
      const res = await onBeamImage(selectedImage);
      if (res.success) {
        setImageBeamed(true);
        setBeamModeUsed(res.mode === 'wifi-direct' ? 'Wi-Fi Direct' : 'Cellular Broadcast');
        if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
        setTimeout(() => {
          setImageBeamed(false);
        }, 2000);
      }
    } catch {}
    setBeamingImage(false);
  };

  // -------------------------------------------------------------
  // PC Image Fetching Handlers
  // -------------------------------------------------------------
  const handleFetchClipboardImage = async () => {
    if (!onFetchPcClipboardImage) return;
    setFetchingPcImage(true);
    try {
      const res = await onFetchPcClipboardImage();
      if (res.hasImage && res.base64) {
        const src = res.base64.startsWith('data:') ? res.base64 : `data:image/png;base64,${res.base64}`;
        setReceivedImage(src);
        setReceivedImageType('clipboard');
      }
    } catch {}
    setFetchingPcImage(false);
  };

  const handleCaptureScreen = async () => {
    if (!onCapturePcScreen) return;
    setCapturingScreen(true);
    try {
      const res = await onCapturePcScreen();
      if (res.success && res.base64) {
        const src = res.base64.startsWith('data:') ? res.base64 : `data:image/png;base64,${res.base64}`;
        setReceivedImage(src);
        setReceivedImageType('screen');
      }
    } catch {}
    setCapturingScreen(false);
  };

  const handleDownloadReceivedImage = () => {
    if (!receivedImage) return;
    const link = document.createElement('a');
    link.href = receivedImage;
    link.download = `overwatch_${receivedImageType || 'image'}_${Date.now()}.png`;
    link.click();
  };

  const isLanAvailable = Boolean(lanIp && lanIp !== '127.0.0.1');

  return (
    <div className="deck-panel rounded-xl p-2.5 sm:p-3.5 h-full flex flex-col justify-between overflow-hidden bg-black border border-[#1e1e24]">
      {/* Top Header & Tab Pill Switcher */}
      <div className="shrink-0 pb-1.5 mb-1.5 border-b border-[#1c1c24] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
          <h3 className="text-[11px] font-mono font-medium text-neutral-300 uppercase tracking-wider">
            Beam Sync
          </h3>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1 bg-[#0c0c10] p-0.5 rounded-lg border border-[#1c1c24]">
          <button
            onClick={() => setTab('text')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all ${
              tab === 'text'
                ? 'bg-neutral-200 text-black shadow-sm'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Text
          </button>
          <button
            onClick={() => setTab('image')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium flex items-center gap-1 transition-all ${
              tab === 'image'
                ? 'bg-neutral-200 text-black shadow-sm'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <span>Image</span>
            {isLanAvailable ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Wi-Fi Direct Active" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" title="Cellular Broadcast" />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TEXT BEAM                                                         */}
      {/* ========================================================================= */}
      {tab === 'text' && (
        <div className="flex-1 min-h-0 flex flex-col justify-between overflow-y-auto no-scrollbar space-y-2">
          {/* Input Textarea */}
          <div className="space-y-1.5">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type prompt, URL, or code to beam into Windows clipboard..."
              rows={2}
              className="w-full bg-[#050507] border border-[#1e1e24] focus:border-neutral-500 rounded-lg p-2 text-[11px] font-mono text-neutral-200 placeholder:text-neutral-600 resize-none outline-none transition-colors"
            />

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleBeamText}
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
          <div className="mt-1 pt-2 border-t border-[#1a1a20] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-neutral-400">
                PC Clipboard Readout
              </span>
              <button
                onClick={onFetchClipboard}
                className="flex items-center gap-1 text-[9px] font-mono text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-[#101015] border border-[#23232b]"
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
      )}

      {/* ========================================================================= */}
      {/* TAB 2: IMAGE BEAM (Mobile ⇄ Windows)                                      */}
      {/* ========================================================================= */}
      {tab === 'image' && (
        <div className="flex-1 min-h-0 flex flex-col justify-between overflow-y-auto no-scrollbar space-y-2">
          {/* Top Half: Send Image to PC */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-neutral-400">
                Phone → Windows (Ctrl+V)
              </span>
              <div className="flex items-center gap-1 text-[9px] font-mono text-neutral-500">
                {isLanAvailable ? (
                  <span className="flex items-center gap-1 text-emerald-400/90">
                    <Wifi className="w-2.5 h-2.5" />
                    <span>Wi-Fi Direct</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400/80">
                    <Radio className="w-2.5 h-2.5" />
                    <span>Cloud Fallback</span>
                  </span>
                )}
              </div>
            </div>

            {/* Hidden File / Camera Inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Image Preview Box or Action Pickers */}
            {selectedImage ? (
              <div className="relative rounded-lg border border-[#23232c] bg-[#07070a] p-1.5 flex items-center gap-2">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="w-14 h-14 object-cover rounded bg-black border border-neutral-800 shrink-0"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-between h-14 py-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-300 truncate">
                      Ready to beam
                    </span>
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="p-0.5 rounded text-neutral-500 hover:text-neutral-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={handleBeamImageToPc}
                    disabled={beamingImage}
                    className={`w-full h-7 rounded text-[10px] font-mono font-medium flex items-center justify-center gap-1 transition-all active:scale-95 ${
                      imageBeamed
                        ? 'bg-emerald-500 text-black'
                        : beamingImage
                        ? 'bg-neutral-800 text-neutral-400 animate-pulse'
                        : 'bg-white text-black hover:bg-neutral-200'
                    }`}
                  >
                    {imageBeamed ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Beamed ({beamModeUsed})!</span>
                      </>
                    ) : beamingImage ? (
                      <span>Beaming...</span>
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        <span>Beam to Windows (Ctrl+V)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="h-12 rounded-lg bg-[#07070a] border border-[#1e1e24] hover:border-neutral-600 flex flex-col items-center justify-center gap-0.5 text-neutral-300 hover:text-white transition-all active:scale-95"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-mono font-medium">Camera Snap</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-12 rounded-lg bg-[#07070a] border border-[#1e1e24] hover:border-neutral-600 flex flex-col items-center justify-center gap-0.5 text-neutral-300 hover:text-white transition-all active:scale-95"
                >
                  <ImageIcon className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] font-mono font-medium">Choose Photo</span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom Half: Windows -> Phone (Fetch Clipboard Image or Screen Capture) */}
          <div className="mt-1 pt-1.5 border-t border-[#1a1a20] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-neutral-400">
                Windows → Phone
              </span>
              {receivedImage && (
                <button
                  onClick={() => setReceivedImage(null)}
                  className="text-[9px] font-mono text-neutral-500 hover:text-neutral-300"
                >
                  Clear
                </button>
              )}
            </div>

            {/* 1-Tap Trigger Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handleFetchClipboardImage}
                disabled={fetchingPcImage}
                className="h-8 rounded-lg bg-[#09090d] border border-[#1f1f28] hover:border-neutral-500 flex items-center justify-center gap-1.5 text-neutral-300 hover:text-white transition-all text-[10px] font-mono font-medium active:scale-95 disabled:opacity-50"
              >
                <ArrowDownToLine className="w-3 h-3 text-amber-400" />
                <span>{fetchingPcImage ? 'Fetching...' : 'PC Clipboard'}</span>
              </button>

              <button
                onClick={handleCaptureScreen}
                disabled={capturingScreen}
                className="h-8 rounded-lg bg-[#09090d] border border-[#1f1f28] hover:border-neutral-500 flex items-center justify-center gap-1.5 text-neutral-300 hover:text-white transition-all text-[10px] font-mono font-medium active:scale-95 disabled:opacity-50"
              >
                <Monitor className="w-3 h-3 text-cyan-400" />
                <span>{capturingScreen ? 'Capturing...' : 'Capture Screen'}</span>
              </button>
            </div>

            {/* Received PC Image Preview */}
            {receivedImage && (
              <div className="relative rounded-lg border border-[#23232c] bg-[#07070a] p-1 flex items-center justify-between gap-2">
                <div
                  className="relative cursor-pointer group shrink-0"
                  onClick={() => setLightboxOpen(true)}
                  title="Tap to enlarge"
                >
                  <img
                    src={receivedImage}
                    alt="Received PC"
                    className="w-16 h-10 object-cover rounded bg-black border border-neutral-800"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-3 h-3 text-white" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono text-neutral-300 truncate">
                    {receivedImageType === 'screen' ? '🖥️ Desktop Capture' : '📋 Clipboard Image'}
                  </div>
                  <div className="text-[9px] font-mono text-neutral-500">
                    Tap image to view
                  </div>
                </div>

                <button
                  onClick={handleDownloadReceivedImage}
                  className="p-2 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800 shrink-0"
                  title="Download to Phone"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Modal for Fullscreen Image Inspection */}
      {lightboxOpen && receivedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-3"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={handleDownloadReceivedImage}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 text-white font-mono text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
            <button
              onClick={() => setLightboxOpen(false)}
              className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <img
            src={receivedImage}
            alt="Full view"
            className="max-w-full max-h-[85vh] object-contain rounded-lg border border-neutral-800"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Bottom Footer Note */}
      <div className="shrink-0 pt-1 border-t border-[#1c1c24] text-[9px] font-mono text-neutral-500 text-center flex items-center justify-center gap-1">
        <span>Ctrl+V ready on Windows</span>
        <span>•</span>
        <span>Pictures/OverWatch</span>
      </div>
    </div>
  );
};
