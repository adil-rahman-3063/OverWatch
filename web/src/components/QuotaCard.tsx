import React from 'react';
import { Clock } from 'lucide-react';
import { QuotaData } from '../types.ts';

interface QuotaCardProps {
  quota: QuotaData;
}

export const QuotaCard: React.FC<QuotaCardProps> = ({ quota }) => {
  const groups = quota.antigravity?.groups || [];

  return (
    <div className="deck-panel rounded-xl p-4 flex flex-col justify-between h-full min-h-[300px]">
      <div>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1e1e24]">
          <span className="text-xs font-mono font-medium text-neutral-400">
            Model limits
          </span>
          {quota.antigravity?.fetchedAt && (
            <span className="text-[10px] text-neutral-500 font-mono tabular-nums">
              Synced {new Date(quota.antigravity.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {groups.length === 0 ? (
          <div className="py-8 text-center text-xs font-mono text-neutral-600">
            Reading quota from Antigravity
          </div>
        ) : (
          <div className="space-y-3.5">
            {groups.map((group) => (
              <div key={group.name} className="space-y-2">
                <span className="text-xs font-mono text-neutral-300 font-medium">
                  {group.name}
                </span>

                <div className="space-y-1.5">
                  {group.buckets.map((bucket) => {
                    const percentage = Math.round((bucket.remaining_fraction || 0) * 100);
                    const isLow = percentage < 25;
                    const isMedium = percentage < 60;

                    return (
                      <div 
                        key={bucket.id} 
                        className="bg-[#050507] rounded-lg p-2.5 border border-[#1a1a20] space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-neutral-400 truncate text-[11px]">
                            {bucket.name}
                          </span>
                          <span className={`font-mono tabular-nums font-medium ${
                            isLow ? 'text-rose-400' : isMedium ? 'text-amber-400' : 'text-neutral-200'
                          }`}>
                            {percentage}%
                          </span>
                        </div>

                        {/* Quiet instrument progress bar */}
                        <div className="w-full h-1 rounded-full bg-[#16161c] overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              isLow 
                                ? 'bg-rose-500' 
                                : isMedium 
                                ? 'bg-amber-400' 
                                : 'bg-neutral-300'
                            }`}
                            style={{ width: `${Math.max(percentage, 2)}%` }}
                          />
                        </div>

                        {bucket.reset_time && bucket.reset_time !== '1970-01-01T00:00:00Z' && (
                          <div className="flex items-center gap-1 text-[10px] text-neutral-500 font-mono tabular-nums pt-0.5">
                            <Clock className="w-2.5 h-2.5 text-neutral-600" />
                            <span>Refreshes at {new Date(bucket.reset_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
