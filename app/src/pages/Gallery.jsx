import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSanityData } from '../hooks/useSanityData';
import { QUERIES } from '../lib/sanity';
import { getDirectDriveUrl } from '../lib/utils';
import SEO from '../components/ui/SEO';

const FusionCard = ({ item, isActive, rawZ }) => {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    const count = item.images?.length || item.slides?.length || 0;
    if (count <= 1) return;
    const interval = setInterval(() => setSlide(s => (s + 1) % count), 3000);
    return () => clearInterval(interval);
  }, [isActive, item]);

  // Center active card lower (+60px offset) and scatter relative to that lower center
  const transformStyle = isActive
    ? { transform: 'translate3d(-50%, calc(-50% + 60px), 0px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)', opacity: 1, zIndex: 100, filter: 'blur(0px)' }
    : {
      transform: `translate3d(calc(-50% + ${item.x}vw), calc(-50% + 60px + ${item.y}vh), ${rawZ}px) rotateZ(${item.rotation}deg) scale3d(0.8, 0.8, 0.8)`,
      opacity: rawZ > 0 ? 0 : Math.max(0, 1 - Math.abs(rawZ) / 3000),
      zIndex: Math.round(-rawZ),
      filter: `blur(${Math.min(10, Math.abs(rawZ) / 200)}px) grayscale(${Math.min(100, Math.abs(rawZ) / 30)}%)`,
    };

  const handleClick = () => {
    if (!isActive) return;
    if (item.type === 'PHOTO') { const s = item.images?.[0]; if (s) window.open(s, '_blank'); }
    else navigate(`/events/${item.slug || 'codesprint-26'}`);
  };

  return (
    <div
      className="absolute top-1/2 left-1/2 transition-all ease-out cursor-pointer group"
      style={{ ...transformStyle, transitionDuration: isActive ? '800ms' : '0ms', width: '90vw', maxWidth: '900px', aspectRatio: window.innerWidth < 640 ? '1 / 1.1' : '16 / 9' }}
      onClick={handleClick}
    >
      <div className={`w-full h-full relative rounded-2xl overflow-hidden border transition-all duration-700 ${isActive ? 'border-acm-cyan/50 shadow-[0_0_80px_rgba(100,255,218,0.2)] bg-[#020202]/92 backdrop-blur-2xl' : 'border-white/10 bg-white/5'}`}>
        {/* Image / Gradient Layer */}
        <div className="absolute inset-0 z-0">
          {item.images?.length > 0
            ? item.images.map((img, i) => (
              <img
                key={i}
                src={getDirectDriveUrl(img)}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${i === slide ? 'translate-x-0 opacity-100 z-10' : i < slide ? '-translate-x-full opacity-0 z-0' : 'translate-x-full opacity-0 z-0'} ${isActive ? 'grayscale-0' : 'grayscale'}`}
                alt="Gallery"
              />
            ))
            : (item.slides || []).map((gradient, i) => (
              <div
                key={i}
                className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-all duration-1000 ${i === slide ? 'translate-x-0 opacity-100 z-10' : i < slide ? '-translate-x-full opacity-0 z-0' : 'translate-x-full opacity-0 z-0'}`}
              />
            ))
          }
        </div>

        {/* Slide Nav Buttons */}
        {isActive && (item.images?.length > 1) && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 z-20 pointer-events-none">
            <button onClick={e => { e.stopPropagation(); setSlide(s => (s - 1 + item.images.length) % item.images.length); }} className="w-12 h-12 rounded-full bg-black/50 border border-white/10 text-white pointer-events-auto hover:bg-acm-cyan hover:text-black transition-all">←</button>
            <button onClick={e => { e.stopPropagation(); setSlide(s => (s + 1) % item.images.length); }} className="w-12 h-12 rounded-full bg-black/50 border border-white/10 text-white pointer-events-auto hover:bg-acm-cyan hover:text-black transition-all">→</button>
          </div>
        )}

        {/* Info Overlay */}
        <div className="absolute bottom-0 w-full p-6 md:p-12 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10 flex justify-between items-end">
          <div className="max-w-[70%] text-left">
            <span className={`text-[10px] font-mono tracking-[0.3em] block mb-2 transition-colors ${isActive ? 'text-acm-cyan' : 'text-white/40'}`}>{item.category || 'CLASSIFIED'}</span>
            <h2 className="text-2xl md:text-5xl font-heading font-bold text-white mb-2 leading-tight uppercase">{item.title}</h2>
            <p className={`text-xs md:text-sm transition-all duration-700 ${isActive ? 'text-gray-300 opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>{item.desc}</p>
          </div>
          <div className={`font-mono text-3xl md:text-5xl font-bold text-white/5 ${isActive ? 'text-acm-cyan/20 scale-100' : 'scale-50'} transition-all duration-500`}>
            {(item.id + 1).toString().padStart(2, '0')}
          </div>
        </div>
      </div>
    </div>
  );
};

const Gallery = () => {
  const { data: events } = useSanityData(QUERIES.EVENTS, {}, []);
  const { data: galleryData } = useSanityData(QUERIES.ALL_GALLERY, {}, []);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [smoothScroll, setSmoothScroll] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [items, setItems] = useState([]);

  // Build 3D items list from Sanity data
  useEffect(() => {
    if (!events || !galleryData) return;
    const isMobile = window.innerWidth < 768;
    const eventItems = (events || []).map((event, i) => ({
      ...event,
      id: i,
      type: 'EVENT',
      z: i * 1500,
      x: (Math.random() - 0.5) * (isMobile ? 40 : 180),
      y: (Math.random() - 0.5) * (isMobile ? 100 : 120),
      rotation: (Math.random() - 0.5) * 40,
      images: Array.isArray(event.images) && event.images.length > 0 ? event.images : [],
      slides: Array.isArray(event.images) && event.images.length > 0 ? [] : ['from-blue-900/40 to-cyan-900/40', 'from-purple-900/40 to-pink-900/40', 'from-emerald-900/40 to-teal-900/40'],
    }));
    const photoItems = (galleryData || []).map((img, i) => ({
      title: img.caption || 'GALLERY_ITEM',
      desc: 'COMMUNITY_CAPTURE',
      category: img.eventSlug ? `REL: ${img.eventSlug}` : 'STANDALONE',
      images: [img.src],
      slides: [],
      slug: img.eventSlug || '',
      id: eventItems.length + i,
      type: 'PHOTO',
      z: eventItems.length * 1500 + i * 1500 + 800,
      x: (Math.random() - 0.5) * (isMobile ? 20 : 140),
      y: (Math.random() - 0.5) * (isMobile ? 80 : 90),
      rotation: (Math.random() - 0.5) * 40,
    }));
    setItems([...eventItems, ...photoItems].sort((a, b) => a.z - b.z));
  }, [events, galleryData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll logic
  useEffect(() => {
    if (items.length === 0) return;
    const scrollFactor = 2.5;
    const lastZ = Math.max(3000, items[items.length - 1]?.z || 0);
    const scrollCap = lastZ / scrollFactor;

    const handleScroll = () => {
      const raw = window.scrollY;
      if (raw > scrollCap) {
        window.scrollTo({ top: scrollCap, behavior: 'instant' });
        setScrollProgress(lastZ);
      } else {
        setScrollProgress(raw * scrollFactor);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: false });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [items]);

  // Smooth scroll interpolation loop using requestAnimationFrame
  useEffect(() => {
    let animId;
    const updateSmooth = () => {
      setSmoothScroll(prev => {
        const diff = scrollProgress - prev;
        // If difference is negligible, snap to the target
        if (Math.abs(diff) < 0.1) return scrollProgress;
        // Interpolate smoothly (0.08 scaling factor for high fluid motion)
        return prev + diff * 0.08;
      });
      animId = requestAnimationFrame(updateSmooth);
    };
    animId = requestAnimationFrame(updateSmooth);
    return () => cancelAnimationFrame(animId);
  }, [scrollProgress]);

  // Active item detection based on interpolated smoothScroll value
  useEffect(() => {
    let closest = -1, minDist = 500;
    items.forEach((item, index) => {
      const dist = Math.abs(item.z - smoothScroll);
      if (dist < minDist) { minDist = dist; closest = index; }
    });
    setActiveIndex(closest);
  }, [smoothScroll, items]);

  const scrollFactor = 2.5;
  const maxZ = items.length > 0 ? (items[items.length - 1].z / scrollFactor) + window.innerHeight : 2000;

  return (
    <main className="min-h-screen bg-transparent text-white relative">
      <SEO
        title="Archive | ACM TSEC"
        description="Explore the neural archive of ACM TSEC events, photos, and community milestones."
        url="https://acm-tsec.com/gallery"
      />

      {/* Scroll spacer */}
      <div style={{ height: `${maxZ}px` }} className="absolute top-0 left-0 w-px -z-50 pointer-events-none" />

      {/* HUD */}
      <div
        className="fixed top-24 left-1/2 -translate-x-1/2 z-50 text-center mix-blend-exclusion pointer-events-none w-full px-4 transition-opacity duration-300"
        style={{ opacity: Math.max(0, 1 - smoothScroll / 400) }}
      >
        <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-2 tracking-tighter">
          NEURAL_<span className="text-acm-cyan">ARCHIVE</span>
        </h1>
        <div className="flex justify-center space-x-4 text-[10px] md:text-xs font-mono text-acm-cyan/80">
          <span>:: SCROLL_NAV: {activeIndex !== -1 ? 'LOCKED' : 'DRIFTING'}</span>
          <span>:: DEPTH: {Math.round(smoothScroll)}</span>
        </div>
      </div>

      {/* 3D Viewport */}
      <div className="fixed top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center perspective-[1000px] pointer-events-none">
        <div className="relative w-full h-full preserve-3d pointer-events-auto">
          {items.map((item, index) => (
            <FusionCard
              key={item.id}
              item={item}
              isActive={index === activeIndex}
              rawZ={-item.z + smoothScroll - 500}
            />
          ))}
        </div>
      </div>
    </main>
  );
};

export default Gallery;
