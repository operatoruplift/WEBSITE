'use client';

import React, { useEffect, useState, useRef } from 'react';

// --- SPLIT TEXT ANIMATION ---
// Word-by-word stagger. Each word slides up from translateY(18px) into place
// with a cascading delay. Inspired by editorial heading patterns from fintech
// landing pages. Reduced-motion: skips animation and shows text immediately.
interface SplitTextProps {
  text: string;
  className?: string;
  baseDelay?: number;
  wordDelay?: number;
}

export const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  baseDelay = 0,
  wordDelay = 65,
}) => {
  const [triggered, setTriggered] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    if (mq.matches) setTriggered(true);
    const onChange = (e: MediaQueryListEvent) => {
      setPrefersReduced(e.matches);
      if (e.matches) setTriggered(true);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (prefersReduced) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTriggered(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, [prefersReduced]);

  const words = text.trim().split(/\s+/);

  return (
    <span ref={ref} className={className} aria-label={text}>
      {words.map((word, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            display: 'inline-block',
            opacity: triggered ? 1 : 0,
            transform: triggered ? 'none' : 'translateY(18px)',
            transition: prefersReduced
              ? 'none'
              : `opacity 0.55s cubic-bezier(0.16,1,0.3,1) ${baseDelay + i * wordDelay}ms, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${baseDelay + i * wordDelay}ms`,
          }}
        >
          {word}{i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  );
};


// --- FADE IN ANIMATION ---
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
  threshold?: number;
  /**
   * Default FadeIn wrapper is `inline-block`, which shrinks to its
   * content's natural width. That breaks layouts that want the child
   * to participate in `flex` / `text-center` / `w-full` centering
   * against the full viewport (e.g. hero headers). Set `block` to
   * render the wrapper as `block w-full` instead. Callers that
   * actually wanted inline-block (text spans, badge pills with their
   * own border) can omit this.
   */
  block?: boolean;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  direction = 'up',
  className = '',
  threshold = 0.1,
  block = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, [threshold]);

  const getTransform = () => {
    const distance = 30;
    switch (direction) {
      case 'up': return `translateY(${distance}px)`;
      case 'down': return `translateY(-${distance}px)`;
      case 'left': return `translateX(${distance}px)`;
      case 'right': return `translateX(-${distance}px)`;
      default: return 'none';
    }
  };

  const displayClass = block ? 'block w-full' : 'inline-block';
  return (
    <div
      ref={ref}
      className={`${displayClass} transition-opacity duration-1000 ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'none' : getTransform(),
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
};

// --- SPLIT CHARS ANIMATION ---
// Character-level stagger. Each character slides in from translateX(-14px).
// More dramatic than SplitText (word-level); use for primary display headings.
// VEX AnimatedHeading pattern adapted for the OU dark brand.
interface SplitCharsProps {
  text: string;
  className?: string;
  baseDelay?: number;
  charDelay?: number;
}

export const SplitChars: React.FC<SplitCharsProps> = ({
  text,
  className = '',
  baseDelay = 0,
  charDelay = 22,
}) => {
  const [triggered, setTriggered] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    if (mq.matches) setTriggered(true);
    const onChange = (e: MediaQueryListEvent) => {
      setPrefersReduced(e.matches);
      if (e.matches) setTriggered(true);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (prefersReduced) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTriggered(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, [prefersReduced]);

  const chars = text.split('');

  return (
    <span ref={ref} className={className} aria-label={text}>
      {chars.map((char, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            display: 'inline-block',
            opacity: triggered ? 1 : 0,
            transform: triggered ? 'none' : 'translateX(-14px)',
            transition: prefersReduced
              ? 'none'
              : `opacity 0.5s cubic-bezier(0.16,1,0.3,1) ${baseDelay + i * charDelay}ms, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${baseDelay + i * charDelay}ms`,
          }}
        >
          {char === ' ' ? ' ' : char}
        </span>
      ))}
    </span>
  );
};

// --- GLIDE TEXT ANIMATION ---
interface GlideTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export const GlideText: React.FC<GlideTextProps> = ({ text, className = '', delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);

    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, []);

  return (
    <span
      ref={ref}
      className={`inline-block transition-opacity duration-1000 ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transitionDelay: `${delay}ms`
      }}
    >
      {text}
    </span>
  );
};
