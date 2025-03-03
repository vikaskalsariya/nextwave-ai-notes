import React from 'react';
import { SiOpenai } from 'react-icons/si';
import { IoLogoGoogle } from 'react-icons/io5';

const AIModeSwitch = ({ mode, onModeChange }) => {
  return (
    <div className="relative w-[72px] h-8">
      <div 
        onClick={() => onModeChange(mode === 'chatgpt' ? 'gemini' : 'chatgpt')}
        className="absolute inset-0 bg-gray-200 dark:bg-gray-600 rounded-full cursor-pointer"
      >
        {/* Sliding circle */}
        <div 
          className={`absolute top-1 w-7 h-7 bg-white dark:bg-gray-800 rounded-full shadow-md transition-transform duration-300 transform ${
            mode === 'chatgpt' ? 'left-1' : 'translate-x-[36px]'
          }`}
        />

        {/* Icons container - higher z-index to stay on top */}
       {/* Icons container - higher z-index to stay on top */}
{/* Icons container - higher z-index to stay on top */}
<div className="absolute inset-0 flex items-center justify-between px-2.5 z-10">
  {/* OpenAI Icon */}
  <div className="w-5 h-5 flex items-center justify-center relative">
    <SiOpenai className={`w-4 h-4 transition-colors duration-300 absolute top-1 ${
      mode === 'chatgpt' 
        ? 'text-blue-500' 
        : 'text-gray-600 dark:text-gray-300'
    }`} />
  </div>

  {/* Google Gemini Icon */}
  <div className="w-5 h-5 flex items-center justify-center relative">
    <IoLogoGoogle className={`w-4 h-4 transition-colors duration-300 absolute top-1 ${
      mode === 'gemini' 
        ? 'text-green-500' 
        : 'text-gray-600 dark:text-gray-300'
    }`} />
  </div>
</div>


      </div>
    </div>
  );
};

export default AIModeSwitch;
