import React from 'react';

interface AdsterraBannerProps {
  className?: string;
}

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({ className = '' }) => {
  return (
    <div className={`w-full flex flex-col items-center justify-center my-8 overflow-hidden px-4 ${className}`}>
      <div className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5 select-none">
        Advertisement
      </div>
      <div className="w-full max-w-[728px] min-h-[90px] aspect-[728/90] overflow-x-auto flex justify-center items-center">
        <iframe
          title="Sponsored Ad"
          src="/ad-banner.html"
          width="728"
          height="90"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          className="border-0 overflow-hidden rounded bg-[#070709] border border-[#1a1a24] shrink-0"
          loading="lazy"
          scrolling="no"
        />
      </div>
    </div>
  );
};
