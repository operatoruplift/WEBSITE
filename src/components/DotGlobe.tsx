'use client';

import React, { useEffect, useRef } from 'react';

const DotGlobe: React.FC<{ className?: string; dark?: boolean }> = ({ className = '', dark = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let rotation = 0;
    // On light backgrounds, use dark dots. On dark backgrounds, use orange.
    const dotR = dark ? 231 : 30;
    const dotG = dark ? 118 : 30;
    const dotB = dark ? 48 : 30;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
      }
    };

    // Hotspot cities (lat, lng in radians)
    const hotspots = [
      { lat: 0.71, lng: -1.29, name: 'NYC' },      // New York
      { lat: 0.90, lng: 0.00, name: 'LON' },        // London
      { lat: 0.62, lng: 2.01, name: 'TKY' },        // Tokyo
      { lat: 0.84, lng: -2.07, name: 'SFO' },       // San Francisco
      { lat: -0.59, lng: 2.53, name: 'SYD' },       // Sydney
      { lat: 0.48, lng: 1.34, name: 'SGP' },        // Singapore
      { lat: 0.91, lng: 0.23, name: 'BER' },        // Berlin
      { lat: 0.33, lng: 1.28, name: 'DXB' },        // Dubai
      { lat: -0.40, lng: -0.76, name: 'SAO' },      // São Paulo
      { lat: 0.56, lng: -1.89, name: 'LAX' },       // Los Angeles
    ];

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.5;
      const radius = Math.min(w, h) * 0.38;
      const time = Date.now() * 0.001;
      rotation += 0.003;

      // Draw dot grid sphere
      const dotSpacing = 8;
      const rows = Math.floor(Math.PI * radius / dotSpacing);

      for (let i = 0; i <= rows; i++) {
        const lat = (i / rows) * Math.PI - Math.PI / 2;
        const ringRadius = Math.cos(lat) * radius;
        const cols = Math.max(1, Math.floor(2 * Math.PI * ringRadius / dotSpacing));

        for (let j = 0; j < cols; j++) {
          const lng = (j / cols) * Math.PI * 2 + rotation;

          // 3D to 2D projection
          const x3d = Math.cos(lat) * Math.cos(lng);
          const y3d = Math.sin(lat);
          const z3d = Math.cos(lat) * Math.sin(lng);

          // Only draw front-facing dots
          if (z3d < -0.05) continue;

          const x = cx + x3d * radius;
          const y = cy - y3d * radius;
          const depth = (z3d + 1) / 2; // 0 = back, 1 = front

          const dotSize = 0.8 + depth * 1.2;
          const alpha = 0.08 + depth * 0.35;

          ctx.fillStyle = `rgba(${dotR}, ${dotG}, ${dotB}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw hotspot cities
      hotspots.forEach(spot => {
        const lng = spot.lng + rotation;
        const x3d = Math.cos(spot.lat) * Math.cos(lng);
        const y3d = Math.sin(spot.lat);
        const z3d = Math.cos(spot.lat) * Math.sin(lng);

        if (z3d < 0) return; // behind the globe

        const x = cx + x3d * radius;
        const y = cy - y3d * radius;
        const depth = (z3d + 1) / 2;

        // Pulsing glow
        const pulseSize = 3 + Math.sin(time * 2 + spot.lat * 5) * 1.5;
        const glowAlpha = 0.15 + depth * 0.3;

        // Outer glow
        ctx.fillStyle = `rgba(${dotR}, ${dotG}, ${dotB}, ${glowAlpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(x, y, pulseSize * 3, 0, Math.PI * 2);
        ctx.fill();

        // Inner glow
        ctx.fillStyle = `rgba(${dotR}, ${dotG}, ${dotB}, ${glowAlpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(x, y, pulseSize * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Bright center
        ctx.fillStyle = `rgba(${dotR}, ${dotG}, ${dotB}, ${0.6 + depth * 0.4})`;
        ctx.beginPath();
        ctx.arc(x, y, pulseSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw faint equator ring
      ctx.strokeStyle = `rgba(${dotR}, ${dotG}, ${dotB}, 0.06)`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, radius, radius * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();

      animationId = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener('resize', resize);
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className={`block ${className}`} />;
};

export default DotGlobe;
