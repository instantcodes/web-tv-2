import React from 'react';
import { X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, CornerDownLeft, Maximize2, Volume2 } from 'lucide-react';

interface TVRemoteHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TVRemoteHelpModal: React.FC<TVRemoteHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
          <span>TV Remote & Keyboard Controls</span>
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          Fully optimized for Android TV, Apple TV, Smart TV remotes, and desktop keyboards.
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-800/60 rounded-xl border border-gray-700/50">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-gray-700 rounded-md text-white font-mono text-xs flex gap-1">
                <ArrowUp className="w-4 h-4" />
                <ArrowDown className="w-4 h-4" />
              </span>
              <span className="text-sm text-gray-200">Navigate channels</span>
            </div>
            <span className="text-xs text-gray-400">D-Pad Up / Down</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-800/60 rounded-xl border border-gray-700/50">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-gray-700 rounded-md text-white font-mono text-xs flex items-center gap-1">
                <CornerDownLeft className="w-4 h-4" />
                <span>Enter</span>
              </span>
              <span className="text-sm text-gray-200">Select & tune channel</span>
            </div>
            <span className="text-xs text-gray-400">D-Pad Center (OK)</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-800/60 rounded-xl border border-gray-700/50">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-gray-700 rounded-md text-white font-mono text-xs flex gap-1">
                <ArrowLeft className="w-4 h-4" />
              </span>
              <span className="text-sm text-gray-200">Open channel drawer</span>
            </div>
            <span className="text-xs text-gray-400">D-Pad Left</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-800/60 rounded-xl border border-gray-700/50">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-gray-700 rounded-md text-white font-mono text-xs flex gap-1">
                <ArrowRight className="w-4 h-4" />
              </span>
              <span className="text-sm text-gray-200">Close channel drawer</span>
            </div>
            <span className="text-xs text-gray-400">D-Pad Right</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-800/60 rounded-xl border border-gray-700/50">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-gray-700 rounded-md text-white font-mono text-xs flex items-center gap-1">
                <Maximize2 className="w-4 h-4" />
                <span>F</span>
              </span>
              <span className="text-sm text-gray-200">Toggle Fullscreen</span>
            </div>
            <span className="text-xs text-gray-400">Key 'F'</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-800/60 rounded-xl border border-gray-700/50">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-gray-700 rounded-md text-white font-mono text-xs flex items-center gap-1">
                <Volume2 className="w-4 h-4" />
                <span>M</span>
              </span>
              <span className="text-sm text-gray-200">Mute / Unmute</span>
            </div>
            <span className="text-xs text-gray-400">Key 'M'</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-red-600 hover:bg-red-700 font-semibold text-white rounded-xl transition-colors cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
