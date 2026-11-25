import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Activity, Gauge, Clock } from 'lucide-react';
import { SystemStats, QuotaData } from './types.ts';

interface HardwareTelemetryProps {
  stats?: SystemStats;
  quota: QuotaData;
}

function formatResetCountdown(resetTime?: string, bucketName?: string, nowMs: number = Date.now()): string | null {
  if (resetTime) {
    const targetDate = new Date(resetTime);
    if (!isNaN(targetDate.getTime())) {
      const diffMs = targetDate.getTime() - nowMs;
      if (diffMs > 0) {
        const totalMinutes = Math.floor(diffMs / 60000);
        const days = Math.floor(totalMinutes / (24 * 60));
        const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
        const mins = totalMinutes % 60;

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
      }
      return 'soon';
    }

    if (resetTime.trim()) {
      return resetTime.replace(/^resets?\s*(in)?\s*/i, '').trim();
    }
  }

  // Fallback estimation if bucketName contains timeframe hints
  if (bucketName) {
    const lower = bucketName.toLowerCase();
    if (lower.includes('five') || lower.includes('5 hour') || lower.includes('5h')) {
      const fiveHoursMs = 5 * 3600 * 1000;
      const msIntoCurrentBlock = nowMs % fiveHoursMs;
      const remainingMs = fiveHoursMs - msIntoCurrentBlock;
      const totalMins = Math.floor(remainingMs / 60000);
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      return `${hours}h ${mins}m`;
    }
    if (lower.includes('week')) {
      const date = new Date(nowMs);
      const dayOfWeek = date.getUTCDay();
      const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;
      const hoursUntil = 24 - date.getUTCHours();
      return `${daysUntilSunday}d ${hoursUntil}h`;
    }
  }

  return null;
}

export const HardwareTelemetry: React.FC<HardwareTelemetryProps> = ({ stats, quota }) => {
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const groups = quota.antigravity?.groups || [];

  // Live countdown ticker every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

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

        {/* Section 2: Agent Quotas & Model Limits with Reset Timers */}
        <div className="pb-1 mb-2 border-b border-[#1e1e24] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-neutral-400" />
            <h3 className="text-[11px] font-mono font-medium text-neutral-300 uppercase tracking-wider">
              Model limits
            </h3>
          </div>
          <span className="text-[9px] font-mono text-neutral-500">
            Next Reset
          </span>
        </div>

        {groups.length > 0 && (
          <div className="space-y-1.5">
            {groups.slice(0, 1).map((group) => (
              <div key={group.name} className="space-y-1.5">
                {group.buckets.map((bucket) => {
                  const percentage = Math.round((bucket.remaining_fraction || 0) * 100);
                  const isLow = percentage < 25;
                  const isMedium = percentage < 60;
                  const resetCountdown = formatResetCountdown(bucket.reset_time, bucket.name, nowMs);

                  return (
                    <div 
                      key={bucket.id} 
                      className="bg-[#050507] rounded-lg p-2 border border-[#1a1a20] space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-neutral-400 truncate max-w-[50%]">
                          {bucket.name}
                        </span>
                        
                        {/* Countdown Timer + Percentage */}
                        <div className="flex items-center gap-2 shrink-0">
                          {resetCountdown && (
                            <div className="flex items-center gap-1 text-[9px] text-neutral-500 font-mono">
                              <Clock className="w-2.5 h-2.5 text-neutral-500" />
                              <span>{resetCountdown}</span>
                            </div>
                          )}
                          <span className={`font-mono tabular-nums font-medium ${
                            isLow ? 'text-rose-400' : isMedium ? 'text-amber-400' : 'text-neutral-200'
                          }`}>
                            {percentage}%
                          </span>
                        </div>
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
