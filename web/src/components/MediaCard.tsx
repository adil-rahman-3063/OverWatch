import React from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Volume1, 
  Music2, 
  Disc 
} from 'lucide-react';
import { MediaState } from '../types.ts';

interface MediaCardProps {
  media: MediaState;
  onAction: (action: string) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({ media, onAction }) => {
  const isPlaying = media.playbackStatus === 'Playing';

  return (
    <div className="glass-panel rounded-2xl p-4 shadow-xl shadow-black/40 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
        isPlaying ? 'bg-cyan-500/15' : 'bg-indigo-500/10'
      }`} />

      {/* Header / Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Music2 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Windows Media Deck
          </span>
        </div>
        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-semibold border ${
          isPlaying 
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 animate-pulse' 
            : 'bg-slate-800 text-slate-400 border-slate-700'
        }`}>
          {media.playbackStatus || 'Idle'}
        </span>
      </div>

      {/* Track Details */}
      <div className="flex items-center gap-3.5 my-3">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all duration-500 ${
          isPlaying 
            ? 'bg-gradient-to-br from-cyan-900/60 to-indigo-900/60 border-cyan-500/30 text-cyan-300 shadow-lg shadow-cyan-500/10' 
            : 'bg-slate-900/80 border-white/5 text-slate-600'
        }`}>
          <Disc className={`w-7 h-7 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-white truncate leading-tight">
            {media.title || 'No Media Playing'}
          </h2>
          <p className="text-xs text-slate-400 truncate mt-0.5 font-medium">
            {media.artist || 'Waiting for playback on PC...'}
          </p>
          {media.album && (
            <p className="text-[10px] text-slate-500 truncate mt-0.5">
              {media.album}
            </p>
          )}
        </div>
      </div>

      {/* Main Playback Controls */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <button
          onClick={() => onAction('prev')}
          className="glass-button h-13 rounded-xl flex items-center justify-center text-slate-300 hover:text-white"
          title="Previous Track"
        >
          <SkipBack className="w-5 h-5 fill-current" />
        </button>

        <button
          onClick={() => onAction('play_pause')}
          className={`h-13 rounded-xl flex items-center justify-center font-semibold transition-all shadow-lg active:scale-95 ${
            isPlaying
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-amber-500/20'
              : 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-cyan-500/25'
          }`}
          title="Play / Pause"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 fill-current" />
          ) : (
            <Play className="w-6 h-6 fill-current ml-0.5" />
          )}
        </button>

        <button
          onClick={() => onAction('next')}
          className="glass-button h-13 rounded-xl flex items-center justify-center text-slate-300 hover:text-white"
          title="Next Track"
        >
          <SkipForward className="w-5 h-5 fill-current" />
        </button>
      </div>

      {/* Volume Quick Bar */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-white/5">
        <button
          onClick={() => onAction('volume_mute')}
          className="glass-button flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
          title="Mute"
        >
          <VolumeX className="w-3.5 h-3.5" />
          <span>Mute</span>
        </button>
        <button
          onClick={() => onAction('volume_down')}
          className="glass-button flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
          title="Volume Down"
        >
          <Volume1 className="w-3.5 h-3.5" />
          <span>Vol -</span>
        </button>
        <button
          onClick={() => onAction('volume_up')}
          className="glass-button flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
          title="Volume Up"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Vol +</span>
        </button>
      </div>
    </div>
  );
};
