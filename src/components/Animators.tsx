import React, { useEffect, useState, useRef } from 'react';

// --- FADE IN ANIMATION ---
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
  threshold?: number;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  direction = 'up',
  className = '',
  threshold = 0.1
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

  return (
    <div
      ref={ref}
      className={`inline-block transition-opacity duration-1000 ease-out ${className}`}
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
