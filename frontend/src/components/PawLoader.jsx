import React from 'react';

const PawLoader = ({ message = "Loading VetsCue..." }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-10 select-none">
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Animated Paws */}
        <div className="absolute inset-0 flex items-center justify-center">
            {/* Paw 1 */}
            <span className="material-symbols-outlined text-[#76d6d5] text-4xl animate-paw-1 absolute -translate-x-6 -translate-y-6 opacity-0" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
            {/* Paw 2 */}
            <span className="material-symbols-outlined text-[#ffb77d] text-4xl animate-paw-2 absolute translate-x-6 -translate-y-2 opacity-0" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
            {/* Paw 3 */}
            <span className="material-symbols-outlined text-[#76d6d5] text-4xl animate-paw-3 absolute -translate-x-4 translate-y-6 opacity-0" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
            {/* Paw 4 */}
            <span className="material-symbols-outlined text-[#ffb77d] text-4xl animate-paw-4 absolute translate-x-4 translate-y-2 opacity-0" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
        </div>
        {/* Central Pulse */}
        <div className="w-4 h-4 rounded-full bg-[#76d6d5]/20 animate-ping" />
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-[#76d6d5] animate-pulse">
            {message}
        </p>
        <div className="flex gap-1 justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-[#76d6d5] animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#76d6d5] animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#76d6d5] animate-bounce" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes paw-fade {
            0% { opacity: 0; transform: scale(0.5) translate(var(--tw-translate-x), var(--tw-translate-y)); }
            20% { opacity: 1; transform: scale(1.1) translate(var(--tw-translate-x), var(--tw-translate-y)); }
            80% { opacity: 1; transform: scale(1) translate(var(--tw-translate-x), var(--tw-translate-y)); }
            100% { opacity: 0; transform: scale(0.8) translate(var(--tw-translate-x), var(--tw-translate-y)); }
        }
        .animate-paw-1 { animation: paw-fade 2s infinite; --tw-translate-x: -24px; --tw-translate-y: -24px; }
        .animate-paw-2 { animation: paw-fade 2s infinite 0.5s; --tw-translate-x: 24px; --tw-translate-y: -8px; }
        .animate-paw-3 { animation: paw-fade 2s infinite 1s; --tw-translate-x: -16px; --tw-translate-y: 24px; }
        .animate-paw-4 { animation: paw-fade 2s infinite 1.5s; --tw-translate-x: 16px; --tw-translate-y: 8px; }
      `}} />
    </div>
  );
};

export default PawLoader;
