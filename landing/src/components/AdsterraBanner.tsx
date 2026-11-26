import React from 'react';

interface AdsterraBannerProps {
  className?: string;
}

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({ className = '' }) => {
  const adHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            background: transparent; 
            overflow: hidden; 
            width: 728px; 
            height: 90px; 
          }
        </style>
      </head>
      <body>
        <script type="text/javascript">
          atOptions = {
            'key' : '0a72f48cf1e666b77d7c155f8ba6cbb5',
            'format' : 'iframe',
            'height' : 90,
            'width' : 728,
            'params' : {}
          };
        </script>
        <script type="text/javascript" data-cfasync="false" src="https://bauval.org/22/0a72f48cf1e666b77d7c155f8ba6cbb5"></script>
      </body>
    </html>
  `;

  return (
    <div className={`w-full flex flex-col items-center justify-center my-8 overflow-hidden px-4 ${className}`}>
      <div className="text-[9px] font-mono text-neutral-600 uppercase tracking-widest mb-1.5 select-none">
        Advertisement
      </div>
      <div className="w-full max-w-[728px] overflow-x-auto flex justify-center">
        <iframe
          title="Sponsored Ad"
          srcDoc={adHtml}
          width="728"
          height="90"
          className="border-0 overflow-hidden rounded bg-[#070709] border border-[#1a1a24]"
          loading="lazy"
          scrolling="no"
        />
      </div>
    </div>
  );
};
