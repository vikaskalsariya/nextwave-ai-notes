import React from 'react';
import { SiOpenai } from 'react-icons/si';
import { IoLogoGoogle } from 'react-icons/io5';
import { IoVolumeHigh, IoVolumeOff } from 'react-icons/io5';

const AIModeSwitch = ({ mode, onModeChange, speechEnabled, onSpeechToggle }) => {
  return (
    <div className="flex items-center space-x-4">
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

          {/* Icons container */}
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

      {/* Text-to-Speech Toggle */}
      <button
        onClick={onSpeechToggle}
        className={`p-2 rounded-full transition-colors duration-200 ${
          speechEnabled 
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
        }`}
        title={speechEnabled ? "Turn off text-to-speech" : "Turn on text-to-speech"}
      >
        {speechEnabled ? <IoVolumeHigh className="w-5 h-5" /> : <IoVolumeOff className="w-5 h-5" />}
      </button>
    </div>
  );
};

export default AIModeSwitch;
