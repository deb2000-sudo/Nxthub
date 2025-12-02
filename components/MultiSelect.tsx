import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

export interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select...", 
  className = "",
  disabled = false,
  error = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const removeValue = (e: React.MouseEvent, valToRemove: string) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== valToRemove));
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full bg-dark-800 border rounded-lg px-3 py-2 text-white flex items-center justify-between cursor-pointer min-h-[46px]
          ${isOpen ? 'border-primary-500 ring-1 ring-primary-500' : error ? 'border-red-500' : 'border-dark-700 hover:border-gray-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <div className="flex flex-wrap gap-2">
          {value.length > 0 ? (
            value.map(val => {
              const option = options.find(o => o.value === val);
              return (
                <span key={val} className="bg-primary-600/20 text-primary-400 border border-primary-600/30 px-2 py-0.5 rounded text-sm flex items-center gap-1">
                  {option?.label || val}
                  <X 
                    size={14} 
                    className="cursor-pointer hover:text-primary-300" 
                    onClick={(e) => removeValue(e, val)}
                  />
                </span>
              );
            })
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={18} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-dark-800 border border-dark-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-dark-700 sticky top-0 bg-dark-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-dark-900 border border-dark-700 rounded-md pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 placeholder-gray-600"
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`
                      px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition-colors
                      ${isSelected ? 'bg-primary-600/10 text-primary-400' : 'text-gray-300 hover:bg-dark-700 hover:text-white'}
                    `}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check size={16} className="text-primary-500" />}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
