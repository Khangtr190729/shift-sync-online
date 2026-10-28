import React from 'react';

export const Logo = ({ size = 'md', showText = true, className = '' }) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textMap = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className={`relative ${sizeMap[size] || sizeMap.md} flex-shrink-0 transition-transform duration-200 hover:scale-105`}>
        <img
          src="/logo.png"
          alt="Ca Làm Online Logo"
          className="w-full h-full object-contain drop-shadow-sm"
          onError={(e) => {
            // Fallback if image fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`font-semibold tracking-tight text-[#1d1d1f] ${textMap[size] || textMap.md} flex items-center gap-1 leading-none`}>
            Ca Làm <span className="text-[#0066cc]">Online</span>
          </span>
          {size !== 'sm' && (
            <span className="text-[11px] font-medium text-[#64748B] tracking-wide mt-0.5">
              Xếp ca & Quản lý lương
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
