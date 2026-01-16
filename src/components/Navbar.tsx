
import React from 'react';
import Link from 'next/link';
import { Logo, ChevronRight, GitHubIcon } from './Icons';

interface NavbarProps {
  currentPage: string;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage }) => {
  const navItems = [
    { name: 'PRODUCT', targetId: 'product' },
    { name: 'ENTERPRISE', targetId: 'security' },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 md:px-12 flex items-center justify-between bg-background/95 backdrop-blur-sm transition-all duration-300">
      <Link
        href="/"
        className="flex items-center hover:opacity-80 transition-opacity"
      >
        <Logo className="w-8 h-8 md:w-10 md:h-10" />
      </Link>

      <div className="hidden md:flex items-center space-x-4">
        <div className="hidden lg:flex items-center space-x-8 mr-4">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={`/#${item.targetId}`}
              className="group flex items-center text-xs font-bold text-muted hover:text-white transition-colors tracking-wide"
            >
              {item.name}
              {item.name === 'PRODUCT' && (
                <ChevronRight className="ml-0.5 w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </a>
          ))}
          <a
              href="https://help.operatoruplift.com"
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

        <Link 
          href="/"
          className="text-xs font-bold bg-white text-black px-4 py-2 rounded-sm hover:bg-gray-200 transition-colors uppercase tracking-wide"
        >
          Get Started
        </Link>
        <Link 
          href="/contact"
          className="text-xs font-bold bg-white/10 text-white border border-white/10 px-4 py-2 rounded-sm hover:bg-white/20 transition-all uppercase tracking-wide"
        >
          Contact Sales
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
