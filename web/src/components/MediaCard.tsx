import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Volume1, 
  Disc,
  ChevronLeft,
  ChevronRight,
  Radio
} from 'lucide-react';
import { MediaState, MediaSessionItem } from '../types.ts';

interface MediaCardProps {
  media: MediaState;
  onAction: (action: string, sessionIndex?: number) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({ media, onAction }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  // Derive sessions list: use media.sessions if available, or synthesize from primary
  const sessionList: MediaSessionItem[] = 
    media.sessions && media.sessions.length > 0
      ? media.sessions
      : media.title
      ? [
          {
            index: 0,
            title: media.title,
            artist: media.artist,
            album: media.album || '',
            playbackStatus: media.playbackStatus === 'Playing' ? 'Playing' : 'Paused',
            sourceAppId: media.sourceAppId || 'Windows Media',
          },
        ]
      : [];

  const totalSessions = sessionList.length;

  // Keep selected index within bounds if sessions change
  useEffect(() => {
    if (selectedIdx >= totalSessions && totalSessions > 0) {
      setSelectedIdx(0);
    }
  }, [totalSessions, selectedIdx]);

  const currentSession = sessionList[selectedIdx] || {
    index: 0,
    title: media.title || 'No active player',
    artist: media.artist || 'Waiting for playback on Windows',
    album: media.album || '',
    playbackStatus: media.playbackStatus || 'Stopped',
    sourceAppId: media.sourceAppId || 'Windows Media',
  };

  const isPlaying = currentSession.playbackStatus === 'Playing';

  const handlePrevSession = () => {
    if (totalSessions > 1) {
      setSelectedIdx((prev) => (prev > 0 ? prev - 1 : totalSessions - 1));
    }
  };

  const handleNextSession = () => {
    if (totalSessions > 1) {
      setSelectedIdx((prev) => (prev < totalSessions - 1 ? prev + 1 : 0));
    }
  };

  // Touch handlers exclusively scoped to the inner track slider
  // Uses e.stopPropagation() and touch-none so the outer card and StandBy screens NEVER scroll
  const handleSliderTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    touchStartXRef.current = e.touches[0].clientX;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleSliderTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    e.stopPropagation();
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartXRef.current;
    // Bound the drag offset slightly
    setDragOffset(Math.max(-80, Math.min(80, diff)));
  };

  const handleSliderTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (touchStartXRef.current !== null) {
      const diff = e.changedTouches[0].clientX - touchStartXRef.current;
      if (Math.abs(diff) > 35) {
        if (diff > 0) {
          handlePrevSession();
        } else {
          handleNextSession();
        }
      }
    }
    touchStartXRef.current = null;
    setIsDragging(false);
    setDragOffset(0);
  };

  return (
    <div className="deck-panel rounded-xl p-3 sm:p-4 h-full flex flex-col justify-between overflow-hidden relative select-none">
      <div>
        {/* Header row with Multi-Platform session carousel indicator */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e1e24]">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-[11px] font-mono font-medium text-neutral-300">
              {currentSession.sourceAppId || 'Media Transport'}
            </span>
          </div>

          {/* If multiple sessions, show pagination controls */}
          {totalSessions > 1 ? (
            <div className="flex items-center gap-1 font-mono text-[10px] bg-[#111116] px-2 py-0.5 rounded-full border border-neutral-800">
              <button 
                onClick={handlePrevSession}
                className="hover:text-white text-neutral-400 p-0.5"
                title="Previous media player"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-amber-400 font-medium">
                {selectedIdx + 1}/{totalSessions}
              </span>
              <button 
                onClick={handleNextSession}
                className="hover:text-white text-neutral-400 p-0.5"
                title="Next media player"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
              <span className={isPlaying ? 'text-emerald-400' : 'text-neutral-500'}>
                {currentSession.playbackStatus || 'Idle'}
              </span>
            </div>
          )}
        </div>

        {/* Isolated Inner Track Slider */}
        {/* touch-none and stopPropagation prevent outer screen scrolling completely */}
        <div 
          className="relative overflow-hidden rounded-lg border border-[#1a1a20] bg-[#050507] touch-none"
          onTouchStart={handleSliderTouchStart}
          onTouchMove={handleSliderTouchMove}
          onTouchEnd={handleSliderTouchEnd}
        >
          {totalSessions > 0 ? (
            <div 
              className={`flex w-full ${isDragging ? '' : 'transition-transform duration-200 ease-out'}`}
              style={{
                transform: `translateX(calc(-${selectedIdx * 100}% + ${dragOffset}px))`,
              }}
            >
              {sessionList.map((sess, idx) => {
                const sessPlaying = sess.playbackStatus === 'Playing';
                return (
                  <div 
                    key={idx}
                    className="w-full shrink-0 flex items-center gap-3 p-2.5"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border transition-colors ${
                        sessPlaying 
                          ? 'bg-[#0e0e12] border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                          : 'bg-[#08080a] border-neutral-800 text-neutral-600'
                      }`}
                    >
                      <Disc 
                        className={`w-4 h-4 ${sessPlaying ? 'animate-spin' : ''}`} 
                        style={{ animationDuration: '4s' }} 
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h2 className="text-xs sm:text-sm font-medium text-white truncate tracking-tight">
                          {sess.title || 'No media playing'}
                        </h2>
                        {totalSessions > 1 && (
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                            sessPlaying 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                          }`}>
                            {sess.playbackStatus}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                        {sess.artist || sess.sourceAppId || 'Windows Media'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-2.5">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border bg-[#08080a] border-neutral-800 text-neutral-600">
                <Disc className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xs sm:text-sm font-medium text-white truncate">
                  No active player
                </h2>
                <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                  Waiting for playback on Windows
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Micro pagination indicator dots under the track slider */}
        {totalSessions > 1 && (
          <div className="flex items-center justify-between px-1 mt-1.5 text-[9px] font-mono text-neutral-500">
            <span>Swipe track to switch app</span>
            <div className="flex items-center gap-1.5">
              {sessionList.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIdx(i);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    selectedIdx === i ? 'w-4 bg-amber-400' : 'w-1.5 bg-neutral-800 hover:bg-neutral-600'
                  }`}
                  title={`Switch to session ${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        {/* Main Transport Buttons (Target the selected session!) */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          <button
            onClick={() => onAction('prev', currentSession.index)}
            className="deck-button h-10 sm:h-11 rounded-lg flex items-center justify-center text-neutral-300 hover:text-white active:scale-95 transition-transform"
            title={`Previous track on ${currentSession.sourceAppId || 'player'}`}
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={() => onAction('play_pause', currentSession.index)}
            className={`h-10 sm:h-11 rounded-lg flex items-center justify-center font-medium transition-all active:scale-95 border ${
              isPlaying
                ? 'bg-white text-black border-white hover:bg-neutral-200 shadow-md shadow-white/10'
                : 'bg-[#111115] text-white border-neutral-700 hover:border-neutral-500'
            }`}
            title={`Play / Pause ${currentSession.title || 'current session'}`}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={() => onAction('next', currentSession.index)}
            className="deck-button h-10 sm:h-11 rounded-lg flex items-center justify-center text-neutral-300 hover:text-white active:scale-95 transition-transform"
            title={`Next track on ${currentSession.sourceAppId || 'player'}`}
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Master Volume Stepper */}
        <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-[#1a1a20]">
          <button
            onClick={() => onAction('volume_mute')}
            className="deck-button py-1.5 rounded-lg flex items-center justify-center gap-1 text-[11px] font-mono text-neutral-400 hover:text-neutral-200 active:scale-95 transition-transform"
            title="Mute PC master volume"
          >
            <VolumeX className="w-3 h-3" />
            <span>Mute</span>
          </button>
          <button
            onClick={() => onAction('volume_down')}
            className="deck-button py-1.5 rounded-lg flex items-center justify-center gap-1 text-[11px] font-mono text-neutral-400 hover:text-neutral-200 active:scale-95 transition-transform"
            title="Volume down"
          >
            <Volume1 className="w-3 h-3" />
            <span>Vol -</span>
          </button>
          <button
            onClick={() => onAction('volume_up')}
            className="deck-button py-1.5 rounded-lg flex items-center justify-center gap-1 text-[11px] font-mono text-neutral-400 hover:text-neutral-200 active:scale-95 transition-transform"
            title="Volume up"
          >
            <Volume2 className="w-3 h-3" />
            <span>Vol +</span>
          </button>
        </div>
      </div>
    </div>
  );
};
