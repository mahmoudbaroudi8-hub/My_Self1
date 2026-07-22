import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AccordionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
  children: React.ReactNode;
}

export const Accordion: React.FC<AccordionProps> = ({
  title,
  icon,
  defaultOpen = true,
  badge,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="glass-card mb-3 overflow-hidden transition-all duration-200">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3.5 flex items-center justify-between text-right hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-[#FF7A1A]">{icon}</span>}
          <span className="text-sm font-bold text-white">{title}</span>
          {badge && (
            <span className="text-[11px] bg-[#FF7A1A]/20 text-[#FF7A1A] px-2 py-0.5 rounded-full font-semibold border border-[#FF7A1A]/30">
              {badge}
            </span>
          )}
        </div>
        <div className="text-gray-400 p-1">
          {isOpen ? <ChevronUp className="w-5 h-5 text-[#FF7A1A]" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {isOpen && <div className="px-4 pb-4 pt-1 border-t border-white/5">{children}</div>}
    </div>
  );
};
