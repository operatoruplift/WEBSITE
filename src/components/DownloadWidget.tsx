import React, { useState } from 'react';
import { HeroData } from '@/lib/types';
import { DownloadIcon, AppleIcon, WindowsIcon, LinuxIcon, AndroidIcon, SmartphoneIcon, SolanaIcon, MailIcon } from './Icons';

interface DownloadWidgetProps {
  data: HeroData;
}

const DownloadWidget: React.FC<DownloadWidgetProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'macos' | 'windows' | 'linux' | 'ios' | 'android' | 'seeker'>('macos');
  const [showModal, setShowModal] = useState(false);

  const platformInfo: Record<string, { label: string; version: string }> = {
    macos: { label: 'Download for macOS', version: 'v0.0.1-beta (ARM64)' },
    windows: { label: 'Download for Windows', version: 'v0.0.1-beta (x64)' },
    linux: { label: 'Download for Linux', version: 'v0.0.1-beta (x64)' },
    ios: { label: 'Download for iOS', version: 'Coming Soon' },
    android: { label: 'Download for Android', version: 'Coming Soon' },
    seeker: { label: 'Download for Seeker', version: 'Solana Phone' },
  };

  const current = platformInfo[activeTab];

  const handleDownloadClick = () => {
    setShowModal(true);
  };

  const handleConfirmDownload = () => {
    setShowModal(false);
    // Download URL will be set when builds are available
  };

  const handleCancelDownload = () => {
    setShowModal(false);
  };

  return (
    <>
    <div className="mt-12 w-full max-w-xl animate-slide-up" style={{ animationDelay: '0.4s' }}>

      {/* OS Selection Tabs */}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mb-4 ml-1">
        <button
          onClick={() => setActiveTab('macos')}
          className={`flex items-center space-x-2 text-xs font-bold tracking-wider uppercase transition-all duration-300 pb-2 border-b-2 ${
            activeTab === 'macos'
              ? 'text-white border-primary'
              : 'text-muted border-transparent hover:text-white'
          }`}
        >
          <AppleIcon className="w-4 h-4" />
          <span className="hidden sm:inline">macOS</span>
        </button>

        <button
          onClick={() => setActiveTab('windows')}
          className={`flex items-center space-x-2 text-xs font-bold tracking-wider uppercase transition-all duration-300 pb-2 border-b-2 ${
            activeTab === 'windows'
              ? 'text-white border-primary'
              : 'text-muted border-transparent hover:text-white'
          }`}
        >
          <WindowsIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Windows</span>
        </button>

        <button
          onClick={() => setActiveTab('linux')}
          className={`flex items-center space-x-2 text-xs font-bold tracking-wider uppercase transition-all duration-300 pb-2 border-b-2 ${
            activeTab === 'linux'
              ? 'text-white border-primary'
              : 'text-muted border-transparent hover:text-white'
          }`}
        >
          <LinuxIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Linux</span>
        </button>

        <span className="w-px h-4 bg-white/10" />

        <button
          onClick={() => setActiveTab('ios')}
          className={`flex items-center space-x-2 text-xs font-bold tracking-wider uppercase transition-all duration-300 pb-2 border-b-2 ${
            activeTab === 'ios'
              ? 'text-white border-primary'
              : 'text-muted border-transparent hover:text-white'
          }`}
        >
          <SmartphoneIcon className="w-4 h-4" />
          <span className="hidden sm:inline">iOS</span>
        </button>

        <button
          onClick={() => setActiveTab('android')}
          className={`flex items-center space-x-2 text-xs font-bold tracking-wider uppercase transition-all duration-300 pb-2 border-b-2 ${
            activeTab === 'android'
              ? 'text-white border-primary'
              : 'text-muted border-transparent hover:text-white'
          }`}
        >
          <AndroidIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Android</span>
        </button>

        <button
          onClick={() => setActiveTab('seeker')}
          className={`flex items-center space-x-2 text-xs font-bold tracking-wider uppercase transition-all duration-300 pb-2 border-b-2 ${
            activeTab === 'seeker'
              ? 'text-white border-primary'
              : 'text-muted border-transparent hover:text-white'
          }`}
        >
          <SolanaIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Seeker</span>
        </button>
      </div>

      {/* Main Download Button Container */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            onClick={handleDownloadClick}
            className="group relative overflow-hidden bg-white text-black text-sm md:text-base py-4 px-8 rounded-sm w-full sm:w-auto min-w-[240px] flex items-center justify-center space-x-3 hover:bg-gray-100 transition-colors duration-300 cursor-pointer"
        >
            <DownloadIcon className="w-5 h-5" />
            <span>Download</span>
          </button>

        <div className="flex flex-col justify-center">
            <span className="text-gray-300 text-sm font-mono">{current.version}</span>
            <span className="text-muted text-xs mt-0.5">SHA256 Signed</span>
        </div>
      </div>
    </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
          onClick={handleCancelDownload}
        >
          <div
            className="bg-background border border-white/20 rounded-lg p-8 md:p-10 max-w-lg w-full shadow-2xl relative overflow-hidden transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none"></div>

            {/* Close button */}
            <button
              onClick={handleCancelDownload}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 rounded-full hover:bg-white/10 group"
              aria-label="Close"
            >
              <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="relative mb-8">
              <div className="flex items-center mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-primary mr-3 shadow-[0_0_12px_rgba(255,85,0,0.8)] animate-pulse"></span>
                <h3 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest">
                  Coming Soon
                </h3>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </div>

            {/* Content */}
            <div className="relative mb-10">
              <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-6">
                We&apos;re rebuilding from the ground up to deliver the right foundation. Join the waitlist to be first in line.
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <MailIcon className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-gray-400 text-sm mb-1">Get notified:</span>
                  <a
                    href="mailto:matt@operatoruplift.com"
                    className="text-primary hover:text-primary/80 transition-colors duration-300 text-base font-medium"
                  >
                    matt@operatoruplift.com
                  </a>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={handleCancelDownload}
                className="flex-1 group relative overflow-hidden bg-white text-black text-sm md:text-base py-3.5 px-8 rounded-sm font-semibold hover:bg-gray-50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Got It
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DownloadWidget;
