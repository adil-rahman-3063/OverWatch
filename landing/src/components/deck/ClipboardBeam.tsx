import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Maximize2,
  Plus,
  Layers,
  Share2,
  ExternalLink
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

  // Image Beam State (Supports multiple images queued and beamed sequentially one by one)
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [beamingImage, setBeamingImage] = useState(false);
  const [beamingProgress, setBeamingProgress] = useState<{ current: number; total: number } | null>(null);
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
  // Image Selection Handlers (Multiple Selection & Queue)
  // -------------------------------------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const reads = files.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });
    Promise.all(reads).then((newImgs) => {
      setSelectedImages((prev) => [...prev, ...newImgs]);
    });
    if (e.target) e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBeamImageToPc = async () => {
    if (selectedImages.length === 0) return;
    setBeamingImage(true);
    let lastMode = '';
    let successCount = 0;

    for (let i = 0; i < selectedImages.length; i++) {
      setBeamingProgress({ current: i + 1, total: selectedImages.length });
      try {
        if (onBeamImage) {
          const res = await onBeamImage(selectedImages[i]);
          if (res.success) {
            successCount++;
            lastMode = res.mode === 'wifi-direct' ? 'Wi-Fi Direct' : 'Cellular Broadcast';
          }
        } else {
          await new Promise((r) => setTimeout(r, 450));
          successCount++;
          lastMode = 'Wi-Fi Direct';
        }
      } catch (err) {
        console.warn(`[ImageBeam] Failed beaming image #${i + 1}:`, err);
      }
      if (i < selectedImages.length - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    setBeamingProgress(null);
    setBeamingImage(false);

    if (successCount > 0) {
      setImageBeamed(true);
      setBeamModeUsed(lastMode);
      if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
      setTimeout(() => {
        setImageBeamed(false);
        setSelectedImages([]);
      }, 2500);
    }
  };

  // -------------------------------------------------------------
  // PC Image Fetching Handlers
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // Universal Download & iOS Safari Share Sheet Handler
  // Supports desktop, Android, and iOS Safari Standalone / PWA
  // -------------------------------------------------------------
  const downloadOrShareImage = async (src: string, defaultName: string) => {
    let blob: Blob | null = null;
    try {
      if (src.startsWith('data:')) {
        const parts = src.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        blob = new Blob([u8arr], { type: mime });
      } else {
        const resp = await fetch(src);
        blob = await resp.blob();
      }
    } catch {}

    // 1. Native Web Share API (Primary for Safari / iOS Standalone WebApp: triggers "Save Image" to Photos!)
    if (blob && navigator.share && navigator.canShare) {
      try {
        const file = new File([blob], defaultName, { type: blob.type || 'image/jpeg' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: defaultName,
          });
          return;
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    // 2. Standard browser download fallback
    try {
      const url = blob ? URL.createObjectURL(blob) : src;
      const link = document.createElement('a');
      link.href = url;
      link.download = defaultName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        if (blob) URL.revokeObjectURL(url);
      }, 2000);
    } catch {}
  };

  const handleFetchClipboardImage = async () => {
    setFetchingPcImage(true);
    try {
      if (onFetchPcClipboardImage) {
        const res = await onFetchPcClipboardImage();
        if (res.hasImage && res.base64) {
          const src = res.base64.startsWith('data:') ? res.base64 : `data:image/jpeg;base64,${res.base64}`;
          setReceivedImage(src);
          setReceivedImageType('clipboard');
          setLightboxOpen(true);
          if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
          await downloadOrShareImage(src, `pc_clipboard_${Date.now()}.jpg`);
        }
      } else {
        // Showcase simulation
        await new Promise((r) => setTimeout(r, 600));
        const src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';
        setReceivedImage(src);
        setReceivedImageType('clipboard');
        setLightboxOpen(true);
      }
    } catch {}
    setFetchingPcImage(false);
  };

  const handleCaptureScreen = async () => {
    setCapturingScreen(true);
    try {
      if (onCapturePcScreen) {
        const res = await onCapturePcScreen();
        if (res.success && res.base64) {
          const src = res.base64.startsWith('data:') ? res.base64 : `data:image/jpeg;base64,${res.base64}`;
          setReceivedImage(src);
          setReceivedImageType('screen');
          setLightboxOpen(true);
          if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
          await downloadOrShareImage(src, `pc_screenshot_${Date.now()}.jpg`);
        }
      } else {
        // Showcase simulation
        await new Promise((r) => setTimeout(r, 800));
        const src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80';
        setReceivedImage(src);
        setReceivedImageType('screen');
        setLightboxOpen(true);
      }
    } catch {}
    setCapturingScreen(false);
  };

  const handleDownloadReceivedImage = () => {
    if (!receivedImage) return;
    const name = `overwatch_${receivedImageType || 'image'}_${Date.now()}.jpg`;
    downloadOrShareImage(receivedImage, name);
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
              multiple
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
            {selectedImages.length > 0 ? (
              <div className="rounded-lg border border-[#23232c] bg-[#07070a] p-2 space-y-2">
                {/* Header row inside card */}
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-1.5 text-neutral-300">
                    <Layers className="w-3 h-3 text-cyan-400" />
                    <span>{selectedImages.length} {selectedImages.length === 1 ? 'image' : 'images'} queued</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={beamingImage}
                      className="text-neutral-400 hover:text-white flex items-center gap-0.5 text-[9px]"
                      title="Add more photos"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>Add</span>
                    </button>
                    <button
                      onClick={() => setSelectedImages([])}
                      disabled={beamingImage}
                      className="text-neutral-500 hover:text-red-400 text-[9px]"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Horizontal Scrolling Thumbnail Reel */}
                <div className="flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar">
                  {selectedImages.map((img, idx) => (
                    <div key={idx} className="relative shrink-0 group">
                      <img
                        src={img}
                        alt={`Selected #${idx + 1}`}
                        className="w-12 h-12 object-cover rounded bg-black border border-neutral-800"
                      />
                      {!beamingImage && (
                        <button
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-400 hover:text-white hover:border-red-400 flex items-center justify-center transition-colors"
                          title="Remove image"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                      <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/80 text-[7px] font-mono text-neutral-300 border border-neutral-800">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                  {!beamingImage && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-12 h-12 rounded border border-dashed border-[#262630] hover:border-neutral-500 bg-[#09090d] flex flex-col items-center justify-center text-neutral-500 hover:text-neutral-300 shrink-0 transition-colors"
                      title="Add more photos"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="text-[7.5px] font-mono">Add</span>
                    </button>
                  )}
                </div>

                {/* Main Beam Action Button */}
                <button
                  onClick={handleBeamImageToPc}
                  disabled={beamingImage}
                  className={`w-full h-8 rounded-lg text-[10px] font-mono font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                    imageBeamed
                      ? 'bg-emerald-500 text-black'
                      : beamingImage
                      ? 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                      : 'bg-white text-black hover:bg-neutral-200'
                  }`}
                >
                  {imageBeamed ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>All {selectedImages.length} Beamed ({beamModeUsed})!</span>
                    </>
                  ) : beamingImage && beamingProgress ? (
                    <>
                      <div className="w-2.5 h-2.5 rounded-full border border-neutral-400 border-t-white animate-spin" />
                      <span>Beaming {beamingProgress.current} of {beamingProgress.total}...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      <span>
                        Beam {selectedImages.length === 1 ? 'Image' : `${selectedImages.length} Images`} to Windows (Ctrl+V)
                      </span>
                    </>
                  )}
                </button>
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
                  <span className="text-[10px] font-mono font-medium">Select Photos</span>
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
              <div 
                className="relative rounded-lg border border-[#23232c] bg-[#07070a] p-1.5 flex items-center justify-between gap-2 cursor-pointer hover:border-neutral-600 transition-colors"
                onClick={() => setLightboxOpen(true)}
              >
                <div
                  className="relative shrink-0"
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
                  <div className="text-[10px] font-mono font-medium text-neutral-200 truncate">
                    {receivedImageType === 'screen' ? '🖥️ Desktop Capture' : '📋 Clipboard Image'}
                  </div>
                  <div className="text-[9px] font-mono text-emerald-400">
                    Tap to enlarge & save
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadReceivedImage();
                  }}
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

      {/* Lightbox Modal for Fullscreen Image Inspection - Rendered in Portal so it escapes transformed slide */}
      {lightboxOpen && receivedImage && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-3"
          style={{ WebkitTouchCallout: 'default' }}
          onClick={() => setLightboxOpen(false)}
        >
          {/* Top Bar */}
          <div className="w-full flex items-center justify-between px-2 pt-1 z-10" onClick={(e) => e.stopPropagation()}>
            <span className="text-[11px] font-mono text-neutral-300">
              {receivedImageType === 'screen' ? '🖥️ Desktop Screen Capture' : '📋 Windows Clipboard Image'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadReceivedImage();
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Save to Photos</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(receivedImage, '_blank');
                }}
                className="p-1.5 rounded-lg bg-[#14141a] border border-[#252530] text-neutral-300 hover:text-white"
                title="Open in Safari / Browser Tab"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLightboxOpen(false)}
                className="p-1.5 rounded-lg bg-[#14141a] border border-[#252530] text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Centered Image */}
          <div className="flex-1 flex items-center justify-center p-2 w-full min-h-0 overflow-auto" onClick={(e) => e.stopPropagation()}>
            <img
              src={receivedImage}
              alt="Full view"
              className="max-w-full max-h-[75vh] object-contain rounded-lg border border-neutral-800 shadow-2xl pointer-events-auto"
              style={{ WebkitTouchCallout: 'default', userSelect: 'auto' }}
            />
          </div>

          {/* Bottom Safari Hint */}
          <div className="pb-2 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-[10px] font-mono text-neutral-400">
              💡 Tap <span className="text-emerald-400 font-semibold">"Save to Photos"</span>, or touch & hold photo to save directly to Camera Roll.
            </p>
          </div>
        </div>,
        document.body
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
