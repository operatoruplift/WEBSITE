
import React from 'react';
import { Logo, ChevronRight, GitHubIcon } from './Icons';

interface NavbarProps {
  onNavigate: (page: any) => void;
  currentPage: string;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    if (currentPage !== 'home') {
      onNavigate('home');
      // Allow state update to happen then scroll
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.getElementById(targetId);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navItems = [
    { name: 'PRODUCT', targetId: 'product' },
    { name: 'ENTERPRISE', targetId: 'security' },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 md:px-12 flex items-center justify-between bg-background/95 backdrop-blur-sm transition-all duration-300">
      <div 
        className="flex items-center space-x-2 text-white font-bold text-lg tracking-widest cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => onNavigate('home')}
      >
        <Logo />
        <span>UPLIFT</span>
      </div>

      <div className="hidden md:flex items-center space-x-4">
        <div className="hidden lg:flex items-center space-x-8 mr-4">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={`#${item.targetId}`}
              onClick={(e) => handleLinkClick(e, item.targetId)}
              className="group flex items-center text-xs font-bold text-muted hover:text-white transition-colors tracking-wide"
            >
              {item.name}
              {item.name === 'PRODUCT' && (
                <ChevronRight className="ml-0.5 w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </a>
          ))}
          <a
              href="https://docs.operatoruplift.com"
              target="_blank"
              rel="noreferrer"
              className="group flex items-center text-xs font-bold text-muted hover:text-white transition-colors tracking-wide"
            >
              DOCS
          </a>
        </div>

        <a 
          href="https://github.com/uplift-labs/" 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center space-x-2 text-xs font-bold bg-white/5 text-white border border-white/10 px-3 py-2 rounded-sm hover:bg-white/10 transition-all uppercase tracking-wide"
        >
          <GitHubIcon className="w-4 h-4" />
          <span className="hidden xl:inline">Open Source</span>
        </a>

        <button 
          onClick={() => onNavigate('home')}
          className="text-xs font-bold bg-white text-black px-4 py-2 rounded-sm hover:bg-gray-200 transition-colors uppercase tracking-wide"
        >
          Get Started
        </button>
        <button 
          onClick={() => onNavigate('contact')}
          className="text-xs font-bold bg-white/10 text-white border border-white/10 px-4 py-2 rounded-sm hover:bg-white/20 transition-all uppercase tracking-wide"
        >
          Contact Sales
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
