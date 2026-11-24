import React from 'react';
import { Cpu, HardDrive, Clock, Activity, Gauge } from 'lucide-react';
import { SystemStats, QuotaData } from '../types.ts';

interface HardwareTelemetryProps {
  stats?: SystemStats;
  quota: QuotaData;
}

export const HardwareTelemetry: React.FC<HardwareTelemetryProps> = ({ stats, quota }) => {
  const groups = quota.antigravity?.groups || [];

  return (
    <div className="deck-panel rounded-xl p-5 flex flex-col justify-between h-full overflow-y-auto no-scrollbar">
      <div>
        {/* Section 1: PC Hardware Stats */}
        <div className="pb-3 mb-4 border-b border-[#1e1e24] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-neutral-400" />
            <h2 className="text-xs font-mono font-medium text-neutral-300 uppercase tracking-wider">
              Windows hardware telemetry
            </h2>
          </div>
          {stats?.hostname && (
            <span className="text-[10px] font-mono text-neutral-500">
              {stats.hostname}
            </span>
          )}
        </div>

        {stats ? (
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            {/* CPU Load */}
            <div className="bg-[#050507] rounded-lg p-3 border border-[#1a1a20]">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-mono mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-neutral-400" />
                  CPU Load
                </span>
                <span className="text-white font-medium tabular-nums">
                  {stats.cpuUsagePercent}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#16161c] overflow-hidden">
                <div 
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{ width: `${stats.cpuUsagePercent}%` }}
                />
              </div>
            </div>

            {/* RAM Usage */}
            <div className="bg-[#050507] rounded-lg p-3 border border-[#1a1a20]">
              <div className="flex items-center justify-between text-neutral-400 text-xs font-mono mb-1.5">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-neutral-400" />
                  Memory
                </span>
                <span className="text-white font-medium tabular-nums">
                  {stats.ramUsagePercent}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#16161c] overflow-hidden">
                <div 
                  className="h-full rounded-full bg-neutral-300 transition-all duration-500"
                  style={{ width: `${stats.ramUsagePercent}%` }}
                />
              </div>
              <p className="text-[10px] font-mono text-neutral-500 mt-1 tabular-nums">
                {stats.usedRamGb} / {stats.totalRamGb} GB
              </p>
            </div>
          </div>
        ) : (
          <div className="py-3 text-center text-xs font-mono text-neutral-600 mb-4">
            Connecting to Windows client telemetry...
          </div>
        )}

        {/* Section 2: Agent Quotas & Limits */}
        <div className="pb-2 mb-3 border-b border-[#1e1e24] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-3.5 h-3.5 text-neutral-400" />
            <h3 className="text-xs font-mono font-medium text-neutral-300 uppercase tracking-wider">
              Agent model quotas
            </h3>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="py-4 text-center text-xs font-mono text-neutral-600">
            Reading quota from Antigravity...
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <div key={group.name} className="space-y-1.5">
                <span className="text-xs font-mono text-neutral-400 font-medium">
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
                        className="bg-[#050507] rounded-lg p-2.5 border border-[#1a1a20] space-y-1"
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

                        <div className="w-full h-1 rounded-full bg-[#16161c] overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              isLow ? 'bg-rose-500' : isMedium ? 'bg-amber-400' : 'bg-neutral-300'
                            }`}
                            style={{ width: `${Math.max(percentage, 2)}%` }}
                          />
                        </div>

                        {bucket.reset_time && bucket.reset_time !== '1970-01-01T00:00:00Z' && (
                          <div className="flex items-center gap-1 text-[10px] text-neutral-500 font-mono tabular-nums">
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

      {stats && (
        <div className="pt-3 border-t border-[#1e1e24] flex items-center justify-between text-[11px] font-mono text-neutral-500">
          <span>PC uptime: {stats.uptimeHours} hrs</span>
          <span>Tabular telemetry</span>
        </div>
      )}
    </div>
  );
};
