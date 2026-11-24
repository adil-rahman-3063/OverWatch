import React from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Volume1, 
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
    <div className="deck-panel rounded-xl p-4 flex flex-col justify-between h-full min-h-[300px]">
      <div>
        {/* Header row */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1e1e24]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-neutral-400">
              Media transport
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
            <span className={isPlaying ? 'text-emerald-400' : 'text-neutral-500'}>
              {media.playbackStatus || 'Idle'}
            </span>
          </div>
        </div>

        {/* Track Metadata */}
        <div className="flex items-center gap-3.5 my-2 p-3 rounded-lg bg-[#050507] border border-[#1a1a20]">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 border ${
            isPlaying 
              ? 'bg-[#0e0e12] border-neutral-700 text-neutral-200' 
              : 'bg-[#08080a] border-neutral-800 text-neutral-600'
          }`}>
            <Disc className="w-5 h-5 text-neutral-400" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-medium text-white truncate tracking-tight">
              {media.title || 'No media playing'}
            </h2>
            <p className="text-xs text-neutral-400 truncate mt-0.5">
              {media.artist || 'Waiting for playback on Windows'}
            </p>
            {media.album && (
              <p className="text-[10px] text-neutral-500 truncate mt-0.5 font-mono">
                {media.album}
              </p>
            )}
          </div>
        </div>
      </div>

      <div>
        {/* Main Transport Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <button
            onClick={() => onAction('prev')}
            className="deck-button h-12 rounded-lg flex items-center justify-center text-neutral-300 hover:text-white"
            title="Previous track"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={() => onAction('play_pause')}
            className={`h-12 rounded-lg flex items-center justify-center font-medium transition-colors border ${
              isPlaying
                ? 'bg-white text-black border-white hover:bg-neutral-200'
                : 'bg-[#111115] text-white border-neutral-700 hover:border-neutral-500'
            }`}
            title="Play / Pause"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={() => onAction('next')}
            className="deck-button h-12 rounded-lg flex items-center justify-center text-neutral-300 hover:text-white"
            title="Next track"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Volume Stepper */}
        <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-[#1a1a20]">
          <button
            onClick={() => onAction('volume_mute')}
            className="deck-button py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-neutral-200"
            title="Mute"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>Mute</span>
          </button>
          <button
            onClick={() => onAction('volume_down')}
            className="deck-button py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-neutral-200"
            title="Volume down"
          >
            <Volume1 className="w-3.5 h-3.5" />
            <span>Vol -</span>
          </button>
          <button
            onClick={() => onAction('volume_up')}
            className="deck-button py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-neutral-200"
            title="Volume up"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Vol +</span>
          </button>
        </div>
      </div>
    </div>
  );
};
