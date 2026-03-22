import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const AuthDropdown = ({ options, value, onChange, label, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className="space-y-1.5 relative w-full" ref={dropdownRef}>
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#e5e2e1]/30">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-white/5 border border-white/5 text-sm text-[#e5e2e1] hover:bg-white/10 hover:border-white/10 transition-all focus:border-[#76d6d5]/30 focus:ring-2 focus:ring-[#76d6d5]/10"
      >
        <div className="flex items-center gap-3">
            {Icon && <Icon className="w-5 h-5 text-[#76d6d5]" />}
            <span className="font-bold">{selectedOption.label}</span>
        </div>
        <ChevronDownIcon className={`w-4 h-4 text-[#e5e2e1]/30 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl bg-[#1c1b1b] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl animate-dropdown-in">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-5 py-4 text-sm text-left transition-all hover:bg-white/5 ${value === option.value ? 'bg-[#76d6d5]/10 text-[#76d6d5]' : 'text-[#e5e2e1]/60'}`}
            >
              <span className="text-xl">{option.icon || '🐾'}</span>
              <div className="flex flex-col">
                <span className="font-bold">{option.label}</span>
                {option.desc && <span className="text-[10px] text-white/30 uppercase tracking-widest">{option.desc}</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dropdown-in {
            from { opacity: 0; transform: translateY(-10px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-dropdown-in { animation: dropdown-in 0.2s ease-out; }
      `}} />
    </div>
  );
};

export default AuthDropdown;
