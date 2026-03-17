'use client';

import Navbar from '@/src/components/Navbar';
import Hero from '@/src/sections/Hero';
import Product from '@/src/sections/Product';
import Security from '@/src/sections/Security';
import DeveloperDocs from '@/src/sections/DeveloperDocs';
import BuildWithUs from '@/src/sections/BuildWithUs';
import Footer from '@/src/components/Footer';

function TractionBar() {
    return (
          <section className="w-full bg-background px-6 md:px-12 flex justify-center">
                <div className="w-full max-w-[1200px] py-16 flex flex-col items-center">
                        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-white/15 to-transparent mb-16 relative">
                                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-background flex items-center justify-center">
                                              <div className="w-1.5 h-1.5 rounded-full bg-primary/50 shadow-[0_0_8px_rgba(231,118,48,0.6)]"></div>div>
                                  </div>div>
                        </div>div>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                                  <div className="flex flex-col items-center text-center">
                                              <span className="text-3xl md:text-4xl font-bold text-white">90%</span>span>
                                              <span className="text-sm text-gray-400 font-mono mt-1">Retention Rate</span>span>
                                  </div>div>
                                  <div className="hidden md:block w-px h-12 bg-white/10"></div>div>
                                  <div className="flex flex-col items-center text-center">
                                              <span className="text-3xl md:text-4xl font-bold text-white">300+</span>span>
                                              <span className="text-sm text-gray-400 font-mono mt-1">Beta Users</span>span>
                                  </div>div>
                                  <div className="hidden md:block w-px h-12 bg-white/10"></div>div>
                                  <div className="flex flex-col items-center text-center">
                                              <span className="text-3xl md:text-4xl font-bold text-white">$0</span>span>
                                              <span className="text-sm text-gray-400 font-mono mt-1">Paid Marketing</span>span>
                                  </div>div>
                        </div>div>
                        <p className="text-gray-500 text-sm font-mono mt-8 text-center max-w-md">
                                  Organic growth, built on trust. Free during beta.
                        </p>p>
                </div>div>
          </section>section>
        );
}

export default function Home() {
    return (
          <div className="w-full bg-background">
                <Navbar currentPage="home" />
                <Hero />
                <Product />
                <Security />
                <DeveloperDocs />
                <TractionBar />
                <BuildWithUs />
                <Footer />
          </div>div>
        );
}</section>
