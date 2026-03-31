import React, { useState } from 'react';
import Link from 'next/link';
import { HeroData } from '@/lib/types';
import { AppleIcon, WindowsIcon, LinuxIcon, AndroidIcon, SmartphoneIcon, SolanaIcon } from './Icons';

interface DownloadWidgetProps {
  data: HeroData;
}

const DownloadWidget: React.FC<DownloadWidgetProps> = () => {
  const [activeTab, setActiveTab] = useState<'macos' | 'windows' | 'linux' | 'ios' | 'android' | 'seeker'>('macos');

  const tabs = [
    { id: 'macos' as const, icon: AppleIcon, label: 'macOS' },
    { id: 'windows' as const, icon: WindowsIcon, label: 'Windows' },
    { id: 'linux' as const, icon: LinuxIcon, label: 'Linux' },
    { id: 'ios' as const, icon: SmartphoneIcon, label: 'iOS' },
    { id: 'android' as const, icon: AndroidIcon, label: 'Android' },
    { id: 'seeker' as const, icon: SolanaIcon, label: 'Seeker' },
  ];

  const isDesktop = ['macos', 'windows', 'linux'].includes(activeTab);
  const isMobile = ['ios', 'android'].includes(activeTab);

  return (
    <div className="mt-12 w-full max-w-xl animate-slide-up" style={{ animationDelay: '0.4s' }}>

      {/* OS Selection Tabs */}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mb-4 ml-1">
        {tabs.slice(0, 3).map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 text-xs font-bold tracking-wider uppercase transition-all duration-300 pb-2 border-b-2 ${activeTab === tab.id ? 'text-white border-primary' : 'text-muted border-transparent hover:text-white'}`}>
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
        <span className="w-px h-4 bg-white/10" />
        {tabs.slice(3).map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 text-xs font-bold tracking-wider uppercase transition-all duration-300 pb-2 border-b-2 ${activeTab === tab.id ? 'text-white border-primary' : 'text-muted border-transparent hover:text-white'}`}>
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Primary CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Link href="/login"
          className="group relative overflow-hidden bg-white text-black text-sm md:text-base py-4 px-8 rounded-sm w-full sm:w-auto min-w-[240px] flex items-center justify-center space-x-3 hover:bg-gray-100 transition-colors duration-300">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Get Early Access</span>
        </Link>

        <div className="flex flex-col justify-center">
          {isDesktop && (
            <>
              <span className="text-gray-300 text-sm font-mono">Desktop app in development, macOS beta Q3 2026</span>
              <Link href="/login" className="text-primary text-xs mt-0.5 hover:underline">Get early access →</Link>
            </>
          )}
          {isMobile && (
            <>
              <span className="text-gray-300 text-sm font-mono">Mobile app coming soon</span>
              <span className="text-muted text-xs mt-0.5">PWA available now. Add to home screen</span>
            </>
          )}
          {activeTab === 'seeker' && (
            <>
              <span className="text-gray-300 text-sm font-mono">Solana dApp Store</span>
              <Link href="/login" className="text-primary text-xs mt-0.5 hover:underline">Get early access for Seeker →</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DownloadWidget;
