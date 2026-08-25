import { useRef, useState } from 'react';

const TiltCard = ({ children, className = '' }) => {
  const cardRef = useRef(null);
  const [glow, setGlow] = useState('50% 50%');
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card || isMobile) return;
    const rect = card.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;
    setGlow(`${xPct * 100}% ${yPct * 100}%`);
    const x = xPct - 0.5;
    const y = yPct - 0.5;
    card.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current || isMobile) return;
    cardRef.current.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)`;
    setGlow('50% 50%');
  };

  return (
    <div
      ref={cardRef}
      className={`transition-transform duration-300 ease-out group relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ willChange: 'transform', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
    >
      <div className="h-full w-full relative overflow-hidden rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl">
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none z-10"
          style={{ background: `radial-gradient(circle at ${glow}, rgba(100,255,218,0.3), transparent 70%)` }}
        />
        {children}
      </div>
    </div>
  );
};

export default TiltCard;
