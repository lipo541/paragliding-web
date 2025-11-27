'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  required?: boolean;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'აირჩიეთ...',
  disabled = false,
  icon,
  required = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Dynamic styles based on theme
  const getButtonBgColor = () => {
    if (disabled) {
      return isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)';
    }
    return isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.9)';
  };

  const getDropdownBgColor = () => {
    return isDark ? 'rgba(26, 26, 26, 0.98)' : 'rgba(255, 255, 255, 0.98)';
  };

  return (
    <div ref={containerRef} className="relative" style={{ zIndex: isOpen ? 9999 : 1 }}>
      {/* Hidden native select for form validation */}
      {required && (
        <select
          value={value}
          onChange={() => {}}
          required
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {/* Custom Select Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full h-10 px-3 pr-10 
          flex items-center justify-between
          text-left text-xs
          rounded-xl
          transition-all duration-200
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:shadow-md hover:border-[#4697D2]/50 dark:hover:border-white/30'
          }
          ${isOpen 
            ? 'ring-2 ring-[#4697D2]/40 dark:ring-white/30 border-[#4697D2]/60 dark:border-white/30' 
            : 'border-[#4697D2]/30 dark:border-white/20'
          }
          border backdrop-blur-sm
          shadow-sm
        `}
        style={{
          backgroundColor: getButtonBgColor(),
        }}
      >
        <span className={`truncate ${!selectedOption ? 'text-[#1a1a1a]/50 dark:text-white/50' : 'text-[#1a1a1a] dark:text-white'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {icon || (
            <ChevronDown 
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${disabled ? 'text-gray-300 dark:text-gray-600' : 'text-[#4697D2] dark:text-white/60'}`} 
            />
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div 
          className="
            absolute mt-1 w-full
            max-h-60 overflow-auto
            rounded-xl
            border border-[#4697D2]/30 dark:border-white/20
            shadow-xl shadow-black/10 dark:shadow-black/40
            backdrop-blur-xl
            animate-in fade-in-0 zoom-in-95 duration-200
          "
          style={{
            backgroundColor: getDropdownBgColor(),
            zIndex: 99999,
          }}
        >
          <div className="rounded-xl overflow-hidden">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-[#1a1a1a]/50 dark:text-white/50">
                არჩევანი არ არის
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full px-3 py-2.5 text-left text-xs
                    flex items-center justify-between
                    transition-colors duration-150
                    ${option.value === value 
                      ? 'bg-[#4697D2]/20 dark:bg-white/20 text-[#1a1a1a] dark:text-white font-medium' 
                      : 'text-[#1a1a1a] dark:text-white/90 hover:bg-[#4697D2]/10 dark:hover:bg-white/10'
                    }
                  `}
                >
                  <span className="truncate">{option.label}</span>
                  {option.value === value && (
                    <Check className="w-3.5 h-3.5 text-[#4697D2] dark:text-white flex-shrink-0 ml-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
