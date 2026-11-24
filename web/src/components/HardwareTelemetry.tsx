import React from 'react';
import { Cpu, HardDrive, Activity, Gauge } from 'lucide-react';
import { SystemStats, QuotaData } from '../types.ts';

interface HardwareTelemetryProps {
  stats?: SystemStats;
  quota: QuotaData;
}

export const HardwareTelemetry: React.FC<HardwareTelemetryProps> = ({ stats, quota }) => {
  const groups = quota.antigravity?.groups || [];

  return (
    <div className="deck-panel rounded-xl p-3 sm:p-4 h-full flex flex-col justify-between overflow-hidden">
      <div className="overflow-y-auto no-scrollbar pr-1">
        {/* Section 1: PC Hardware Stats */}
        <div className="pb-1.5 mb-2 border-b border-[#1e1e24] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-neutral-400" />
            <h2 className="text-[11px] font-mono font-medium text-neutral-300 uppercase tracking-wider">
              Telemetry
            </h2>
          </div>
          {stats?.hostname && (
            <span className="text-[9px] font-mono text-neutral-500">
              {stats.hostname}
            </span>
          )}
        </div>

        {stats && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* CPU */}
            <div className="bg-[#050507] rounded-lg p-2 border border-[#1a1a20]">
              <div className="flex items-center justify-between text-neutral-400 text-[10px] font-mono mb-1">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-neutral-400" />
                  CPU
                </span>
                <span className="text-white font-medium tabular-nums">
                  {stats.cpuUsagePercent}%
                </span>
              </div>
              <div className="w-full h-1 rounded-full bg-[#16161c] overflow-hidden">
                <div 
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{ width: `${stats.cpuUsagePercent}%` }}
                />
              </div>
            </div>

            {/* RAM */}
            <div className="bg-[#050507] rounded-lg p-2 border border-[#1a1a20]">
              <div className="flex items-center justify-between text-neutral-400 text-[10px] font-mono mb-1">
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-neutral-400" />
                  RAM
                </span>
                <span className="text-white font-medium tabular-nums">
                  {stats.ramUsagePercent}%
                </span>
              </div>
              <div className="w-full h-1 rounded-full bg-[#16161c] overflow-hidden">
                <div 
                  className="h-full rounded-full bg-neutral-300 transition-all duration-500"
                  style={{ width: `${stats.ramUsagePercent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Agent Quotas */}
        <div className="pb-1 mb-2 border-b border-[#1e1e24] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-3 h-3 text-neutral-400" />
            <h3 className="text-[11px] font-mono font-medium text-neutral-300 uppercase tracking-wider">
              Model limits
            </h3>
          </div>
        </div>

        {groups.length > 0 && (
          <div className="space-y-1.5">
            {groups.slice(0, 1).map((group) => (
              <div key={group.name} className="space-y-1">
                {group.buckets.map((bucket) => {
                  const percentage = Math.round((bucket.remaining_fraction || 0) * 100);
                  const isLow = percentage < 25;
                  const isMedium = percentage < 60;

                  return (
                    <div 
                      key={bucket.id} 
                      className="bg-[#050507] rounded-lg p-2 border border-[#1a1a20] space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-neutral-400 truncate">
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
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {stats && (
        <div className="pt-2 border-t border-[#1e1e24] flex items-center justify-between text-[9px] font-mono text-neutral-500">
          <span>Uptime: {stats.uptimeHours}h</span>
          <span>Tabular</span>
        </div>
      )}
    </div>
  );
};
