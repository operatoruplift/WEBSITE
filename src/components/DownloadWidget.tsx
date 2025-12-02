import React, { useState } from 'react';
import { HeroData } from '@/lib/types';
import { DownloadIcon, AppleIcon, WindowsIcon, LinuxIcon } from './Icons';

interface DownloadWidgetProps {
  data: HeroData;
}

const DownloadWidget: React.FC<DownloadWidgetProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'windows'>('windows');

  const currentDownload = data.downloads[activeTab];

  return (
    <div className="mt-12 w-full max-w-xl animate-slide-up" style={{ animationDelay: '0.4s' }}>
      
      {/* OS Selection Tabs */}
      <div className="flex items-center space-x-6 mb-4 ml-1">

        <button
          onClick={() => setActiveTab('windows')}
          className={`flex items-center space-x-2 text-xs font-bold tracking-wider uppercase transition-all duration-300 pb-2 border-b-2 ${
            activeTab === 'windows' 
              ? 'text-white border-primary' 
              : 'text-muted border-transparent hover:text-white'
          }`}
        >
          <WindowsIcon className="w-4 h-4" />
          <span>Windows</span>
        </button>

      </div>

      {/* Main Download Button Container */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <button 
          className="group relative overflow-hidden bg-white text-black font-bold text-sm md:text-base py-4 px-8 rounded-sm w-full sm:w-auto min-w-[240px] flex items-center justify-center space-x-3 hover:bg-gray-200 transition-all active:scale-95"
          onClick={() => window.location.href = currentDownload.url}
        >
          <DownloadIcon className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
          <span>{currentDownload.label}</span>
        </button>

        <div className="flex flex-col justify-center">
            <span className="text-gray-300 text-sm font-mono">{currentDownload.version}</span>
            <span className="text-muted text-xs mt-0.5">SHA256 Signed</span>
        </div>
      </div>
    </div>
  );
};

export default DownloadWidget;