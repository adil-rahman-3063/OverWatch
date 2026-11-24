import React from 'react';
import { Gauge, Sparkles, Clock } from 'lucide-react';
import { QuotaData } from '../types.ts';

interface QuotaCardProps {
  quota: QuotaData;
}

export const QuotaCard: React.FC<QuotaCardProps> = ({ quota }) => {
  const groups = quota.antigravity?.groups || [];

  return (
    <div className="glass-panel rounded-2xl p-4 shadow-xl shadow-black/40">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Model Quotas & Limits
          </span>
        </div>
        {quota.antigravity?.fetchedAt && (
          <span className="text-[10px] text-slate-500 font-mono">
            {new Date(quota.antigravity.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="py-4 text-center text-xs text-slate-500">
          Syncing quota data from Antigravity...
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.name} className="space-y-2.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200">
                  {group.name}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {group.buckets.map((bucket) => {
                  const percentage = Math.round((bucket.remaining_fraction || 0) * 100);
                  const isLow = percentage < 25;
                  const isMedium = percentage < 60;

                  return (
                    <div 
                      key={bucket.id} 
                      className="bg-black/30 rounded-xl p-2.5 border border-white/5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400 truncate text-[11px]">
                          {bucket.name}
                        </span>
                        <span className={`font-bold ${
                          isLow ? 'text-rose-400' : isMedium ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {percentage}%
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isLow 
                              ? 'bg-rose-500' 
                              : isMedium 
                              ? 'bg-amber-400' 
                              : 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                          }`}
                          style={{ width: `${Math.max(percentage, 2)}%` }}
                        />
                      </div>

                      {bucket.reset_time && bucket.reset_time !== '1970-01-01T00:00:00Z' && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Resets: {new Date(bucket.reset_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
  );
};
