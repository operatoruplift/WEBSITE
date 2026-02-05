import React, { useState } from 'react';
import Link from 'next/link';
import { Logo, ChevronRight, GitHubIcon } from './Icons';

interface NavbarProps {
  currentPage: string;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navItems = [
    { name: 'PRODUCT', targetId: 'product' },
    { name: 'ENTERPRISE', targetId: 'security' },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 px-4 sm:px-6 py-4 sm:py-6 md:px-12 flex items-center justify-between bg-background/95 backdrop-blur-sm transition-all duration-300">
        <Link
          href="/"
          className="flex items-center hover:opacity-80 transition-opacity z-50"
        >
          <Logo className="w-8 h-8 md:w-10 md:h-10" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8 mr-4">
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
            href="https://github.com/operatoruplift/" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center space-x-2 text-xs font-bold bg-white/5 text-white border border-white/10 px-3 py-2 rounded-sm hover:bg-white/10 transition-all uppercase tracking-wide"
          >
            <GitHubIcon className="w-4 h-4" />
            <span className="hidden xl:inline">Open Source</span>
          </a>
          
          <Link 
            href="/"
            className="text-xs font-bold bg-white text-black px-3 lg:px-4 py-2 rounded-sm hover:bg-gray-200 transition-colors uppercase tracking-wide whitespace-nowrap"
          >
            Get Started
          </Link>
          
          <Link 
            href="/contact"
            className="text-xs font-bold bg-white/10 text-white border border-white/10 px-3 lg:px-4 py-2 rounded-sm hover:bg-white/20 transition-all uppercase tracking-wide whitespace-nowrap"
          >
            Contact Sales
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex flex-col items-center justify-center w-10 h-10 space-y-1.5 z-50"
          aria-label="Toggle menu"
        >
          <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-background/98 backdrop-blur-md z-40 transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ top: '72px' }}
      >
        <div className="flex flex-col items-start px-6 py-8 space-y-6">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={`/#${item.targetId}`}
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-bold text-white hover:text-primary transition-colors tracking-wide"
            >
              {item.name}
            </a>
          ))}
          <a
            href="https://help.operatoruplift.com"
            target="_blank"
            rel="noreferrer"
            className="text-lg font-bold text-white hover:text-primary transition-colors tracking-wide"
          >
            DOCS
          </a>
          
          <div className="w-full h-px bg-white/10 my-4" />
          
          <a 
            href="https://github.com/operatoruplift/" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center space-x-2 text-sm font-bold bg-white/5 text-white border border-white/10 px-4 py-3 rounded-sm hover:bg-white/10 transition-all uppercase tracking-wide w-full justify-center"
          >
            <GitHubIcon className="w-4 h-4" />
            <span>Open Source</span>
          </a>
          
          <Link 
            href="/"
            className="text-sm font-bold bg-white text-black px-4 py-3 rounded-sm hover:bg-gray-200 transition-colors uppercase tracking-wide w-full text-center"
            onClick={() => setMobileMenuOpen(false)}
          >
            Get Started
          </Link>
          
          <Link 
            href="/contact"
            className="text-sm font-bold bg-white/10 text-white border border-white/10 px-4 py-3 rounded-sm hover:bg-white/20 transition-all uppercase tracking-wide w-full text-center"
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact Sales
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navbar;
