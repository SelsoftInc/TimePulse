import React from 'react';

const Loader = ({ className = "" }) => {
  return (
    // The scale class here helps resize the whole unit easily if needed
    <div className={`relative flex h-24 w-24 items-center justify-center ${className}`}>
      
      {/* Base Track (Optional - adds definition on light bg) */}
      <div className="absolute h-full w-full rounded-full border-[3px] border-gray-200/50"></div>

      {/* Outer Ring - Main Spinner */}
      <div className="absolute h-full w-full animate-[spin_1.5s_linear_infinite] rounded-full border-[3px] border-transparent border-t-teal-500 border-r-blue-600 shadow-[0_0_6px_rgba(13,148,136,0.2)]"></div>

      {/* Inner Ring - Reverse Spin */}
      <div className="absolute h-16 w-16 animate-[spin_2.5s_linear_infinite_reverse] rounded-full border-[3px] border-transparent border-l-blue-500 border-b-teal-600 opacity-80"></div>

      {/* Center Letter T */}
      <div className="z-10 text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-teal-500 to-blue-700 drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)]">
        T
      </div>
      
    </div>
  );
};

export default Loader;