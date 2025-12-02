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
  className = "",
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

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [threshold]);

  const getTransform = () => {
    switch (direction) {
      case 'up': return 'translateY(20px)';
      case 'down': return 'translateY(-20px)';
      case 'left': return 'translateX(20px)';
      case 'right': return 'translateX(-20px)';
      default: return 'none';
    }
  };

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-1000 ease-out`}
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

// --- SCRAMBLE TEXT ANIMATION (REPURPOSED AS GLITCH REVEAL) ---
interface ScrambleTextProps {
  text: string;
  className?: string;
  scrambleSpeed?: number;
  revealSpeed?: number;
  triggerOnce?: boolean;
}

export const ScrambleText: React.FC<ScrambleTextProps> = ({ 
  text, 
  className = "", 
  triggerOnce = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setIsGlitching(true);
          if (triggerOnce) observer.unobserve(entry.target);
          
          // Optional: Turn off the heavy glitch animation after it reveals
          // to save CPU/GPU and reduce distraction.
          setTimeout(() => {
            if (ref.current) {
                ref.current.classList.remove('glitch-reveal');
                // We keep opacity 1 via a manual style or class if needed, 
                // but the animation 'both' mode handles the final state.
                // However, removing the class removes the pseudo-elements (opacity 0 default).
                // So we need to ensure the main text stays visible.
                ref.current.style.opacity = '1';
                ref.current.style.transform = 'skew(0deg)';
                setIsGlitching(false);
            }
          }, 1000); // 1s matches the animation + buffer
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, [triggerOnce]);

  return (
    <span className={`relative inline-block ${className}`}>
        <span 
          ref={ref} 
          className={`glitch ${isVisible ? 'glitch-reveal' : ''} relative inline-block`}
          data-text={text}
          style={{ opacity: 0 }} // Starts hidden, animation handles opacity
        >
          {text}
        </span>
        {isGlitching && <span className="glitch-lines-overlay"></span>}
    </span>
  );
};