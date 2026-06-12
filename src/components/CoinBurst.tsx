"use client";

import React, { useState, useCallback } from 'react';

interface Coin {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  scale: number;
  rotZ: number;
  rotY: number;
  rotX: number;
}

const CoinBurst = ({ children }: { children: React.ReactNode }) => {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [counter, setCounter] = useState(0);

  const spawnCoins = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Spawn multiple coins per move / hover event for a premium burst effect
    const newCoins: Coin[] = [];
    let currentCounter = counter;

    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 160;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance - (60 + Math.random() * 80); // Skew slightly upwards for a gravity-defying feel
      const scale = 0.5 + Math.random() * 0.6;
      
      // Randomize spin speeds and directions on Z, Y, and X axes for a full 3D tumble
      const rotZ = (Math.random() - 0.5) * 1080; // Z-axis spin (flat spin)
      const rotY = Math.random() > 0.5 ? 720 + Math.random() * 720 : 0; // Y-axis spin (coin flip horizontal)
      const rotX = Math.random() > 0.5 ? 720 + Math.random() * 720 : 0; // X-axis spin (coin flip vertical)

      newCoins.push({
        id: currentCounter++,
        x: mouseX,
        y: mouseY,
        tx,
        ty,
        scale,
        rotZ,
        rotY,
        rotX,
      });
    }

    setCounter(currentCounter);
    setCoins(prev => [...prev, ...newCoins].slice(-40)); // Cap total coins for excellent performance
  }, [counter]);

  const handleAnimationEnd = (id: number) => {
    setCoins(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div 
      className="relative group cursor-pointer overflow-visible"
      onMouseMove={spawnCoins}
      onMouseEnter={spawnCoins}
    >
      {children}

      {/* Render Flying Proton Coins */}
      <div className="absolute inset-0 pointer-events-none overflow-visible z-50" style={{ perspective: '1000px' }}>
        {coins.map((coin) => (
          <div
            key={coin.id}
            className="absolute animate-coin-fly w-14 h-14"
            onAnimationEnd={() => handleAnimationEnd(coin.id)}
            style={{
              left: `${coin.x - 28}px`,
              top: `${coin.y - 28}px`,
              '--tx': `${coin.tx}px`,
              '--ty': `${coin.ty}px`,
              '--scale': coin.scale,
              '--rotZ': `${coin.rotZ}deg`,
              '--rotY': `${coin.rotY}deg`,
              '--rotX': `${coin.rotX}deg`,
            } as React.CSSProperties}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_20px_rgba(251,212,81,0.6)]">
              <defs>
                <radialGradient id="goldGradient" cx="50%" cy="35%" r="50%" fx="30%" fy="30%">
                  <stop offset="0%" stopColor="#FFFCE6" />
                  <stop offset="40%" stopColor="#FBCE4B" />
                  <stop offset="85%" stopColor="#D49A15" />
                  <stop offset="100%" stopColor="#805600" />
                </radialGradient>
                <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#FBD361" />
                  <stop offset="100%" stopColor="#573D00" />
                </linearGradient>
              </defs>
              
              {/* Gold Coin Outer Ring shadow/depth */}
              <circle cx="53" cy="53" r="46" fill="#5E3F00" />
              
              {/* Outer Gold Base Coin */}
              <circle cx="50" cy="50" r="46" fill="url(#goldGradient)" stroke="url(#goldRim)" strokeWidth="3" />
              
              {/* Concentric Gold Accent Lines */}
              <circle cx="50" cy="50" r="38" fill="none" stroke="#FFF5C2" strokeWidth="1" opacity="0.3" />
              <circle cx="50" cy="50" r="37" fill="none" stroke="#8A6300" strokeWidth="1.5" opacity="0.5" />

              {/* Purple Proton Atom Orbit Rings */}
              <g stroke="#7C3AED" strokeWidth="4.5" fill="none" strokeLinecap="round" opacity="0.95">
                {/* Diagonal Ellipse 1 */}
                <ellipse cx="50" cy="50" rx="28" ry="10.5" transform="rotate(-30 50 50)" />
                {/* Diagonal Ellipse 2 */}
                <ellipse cx="50" cy="50" rx="28" ry="10.5" transform="rotate(30 50 50)" />
                {/* Vertical Orbit */}
                <ellipse cx="50" cy="50" rx="28" ry="10.5" transform="rotate(90 50 50)" />
                
                {/* Purple glowing proton nucleus core */}
                <circle cx="50" cy="50" r="4.5" fill="#A78BFA" stroke="#6D28D9" strokeWidth="2" />
              </g>

              {/* Sparkles */}
              <circle cx="28" cy="26" r="2" fill="#FFFFFF" opacity="0.9" />
              <circle cx="72" cy="74" r="1.5" fill="#FFFFFF" opacity="0.7" />
              
              {/* Realistic glass-reflection shine arc overlay */}
              <path d="M 14 36 C 30 15, 70 15, 86 36 C 70 25, 30 25, 14 36 Z" fill="#FFFFFF" opacity="0.3" />
            </svg>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes coinFly {
          0% {
            transform: translate(0, 0) scale(0.1) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(var(--scale)) rotateX(var(--rotX)) rotateY(var(--rotY)) rotateZ(var(--rotZ));
            opacity: 0;
          }
        }
        .animate-coin-fly {
          animation: coinFly 1.3s cubic-bezier(0.12, 0.89, 0.32, 0.98) forwards;
          transform-style: preserve-3d;
          transform-origin: center;
          will-change: transform, opacity;
        }
      `}</style>
    </div>
  );
};

export default CoinBurst;