import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSanityData } from '../hooks/useSanityData';
import { QUERIES } from '../lib/sanity';
import { getDirectDriveUrl, API_BASE_URL } from '../lib/utils';
import SEO from '../components/ui/SEO';
import MagneticButton from '../components/ui/MagneticButton';
import GlitchText from '../components/ui/GlitchText';

const DEFAULTS = {
  homeHeading1: 'FUTURE',
  homeHeading2: 'READY',
  homeHeading3: 'ENGINEERS',
  homeDesc: "The Official ACM Student Chapter of TSEC.\nWe don't just write code; we architect experiences.",
  whatIsAcm: "Discover who we are and the mission that drives our network. We are building a community of relentless innovators.",
};

const homeStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ACM TSEC',
  url: 'https://acm-tsec.com',
  logo: 'https://acm-tsec.com/logo.png',
  description: "The Official ACM Student Chapter of TSEC.",
  sameAs: ['https://www.instagram.com/acm_tsec', 'https://www.linkedin.com/company/tsec-acm'],
};

/* ─── Circular Gallery Carousel ─────────────────────────────────────────── */
const GalleryCarousel = ({ items }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const containerRef = useRef(null);
  const total = items.length;

  const goTo = useCallback((dir) => {
    setActiveIdx(prev => (prev + dir + total) % total);
  }, [total]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft') goTo(-1);
      if (e.key === 'ArrowRight') goTo(1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goTo]);

  if (total === 0) return null;

  const getCardStyle = (idx) => {
    const diff = ((idx - activeIdx) % total + total) % total;
    const normalDiff = diff > total / 2 ? diff - total : diff;
    const maxVisible = 3;

    if (Math.abs(normalDiff) > maxVisible) return null;

    const angle = (normalDiff / Math.max(total, 1)) * 180;
    const rad = (angle * Math.PI) / 180;
    const x = Math.sin(rad) * 55;     // % horizontal offset
    const z = Math.cos(rad) * 200 - 200;  // depth
    const rotateY = -normalDiff * 18;
    const scale = 1 - Math.abs(normalDiff) * 0.14;
    const opacity = 1 - Math.abs(normalDiff) * 0.28;
    const blur = Math.abs(normalDiff) * 1.5;

    return {
      transform: `translateX(${x}%) translateZ(${z}px) rotateY(${rotateY}deg) scale(${scale})`,
      opacity,
      filter: `blur(${blur}px)`,
      zIndex: 20 - Math.abs(normalDiff),
    };
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none"
      style={{ perspective: '900px', height: '220px', overflowX: 'hidden' }}
      onMouseDown={e => { setDragging(true); dragStart.current = e.clientX; }}
      onMouseUp={e => {
        if (dragging && dragStart.current !== null) {
          const delta = e.clientX - dragStart.current;
          if (Math.abs(delta) > 40) goTo(delta < 0 ? 1 : -1);
        }
        setDragging(false);
      }}
      onMouseLeave={() => setDragging(false)}
      onTouchStart={e => { dragStart.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        const delta = e.changedTouches[0].clientX - dragStart.current;
        if (Math.abs(delta) > 30) goTo(delta < 0 ? 1 : -1);
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
        {items.map((item, idx) => {
          const style = getCardStyle(idx);
          if (!style) return null;
          const isCenter = idx === activeIdx;
          return (
            <div
              key={idx}
              className="absolute cursor-pointer"
              style={{
                ...style,
                width: '260px',
                height: '165px',
                transition: dragging ? 'none' : 'all 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                transformOrigin: 'center center',
                left: '50%',
                marginLeft: '-130px',
              }}
              onClick={() => isCenter ? null : setActiveIdx(idx)}
            >
              <div className={`w-full h-full rounded-2xl overflow-hidden border transition-all duration-700 relative group ${isCenter ? 'border-acm-cyan/60 shadow-[0_0_40px_rgba(100,255,218,0.2)]' : 'border-white/10'}`}>
                {item.src ? (
                  <img
                    src={getDirectDriveUrl(item.src)}
                    alt={item.caption || 'Gallery'}
                    className={`w-full h-full object-cover transition-all duration-700 ${isCenter ? 'grayscale-0 scale-100' : 'grayscale scale-105'}`}
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${item.gradient || 'from-blue-900/40 to-cyan-900/40'}`} />
                )}
                {isCenter && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                    <span className="text-[9px] font-mono text-acm-cyan tracking-widest uppercase">// CAPTURED</span>
                    <p className="text-xs text-white font-medium truncate mt-0.5">{item.caption || 'Chapter Capture'}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Nav Buttons */}
      <button
        onClick={() => goTo(-1)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/70 border border-white/20 text-white hover:border-acm-cyan hover:text-acm-cyan transition-all text-sm flex items-center justify-center"
        aria-label="Previous"
      >←</button>
      <button
        onClick={() => goTo(1)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/70 border border-white/20 text-white hover:border-acm-cyan hover:text-acm-cyan transition-all text-sm flex items-center justify-center"
        aria-label="Next"
      >→</button>

      {/* Dots */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIdx(idx)}
            className={`rounded-full transition-all ${idx === activeIdx ? 'w-4 h-1.5 bg-acm-cyan' : 'w-1.5 h-1.5 bg-white/20'}`}
          />
        ))}
      </div>
    </div>
  );
};

/* ─── Event Preview Card ───────────────────────────────────────────────── */
const EventCard = ({ ev, index }) => (
  <Link
    to={ev.slug ? `/events/${ev.slug}` : '/events'}
    className="group relative border border-white/8 hover:border-acm-cyan/50 bg-white/3 hover:bg-white/6 backdrop-blur-sm p-5 transition-all duration-500 overflow-hidden block"
  >
    <div className="absolute top-0 left-0 w-0 h-[2px] bg-gradient-to-r from-acm-cyan to-acm-blue group-hover:w-full transition-all duration-700" />
    <div className="flex justify-between items-start mb-3">
      <span className="text-[9px] font-mono text-acm-cyan tracking-[0.25em] uppercase">{ev.dateText || 'TBA'}</span>
      <span className="text-[8px] font-mono text-gray-500 border border-white/10 px-1.5 py-0.5 uppercase">{ev.category || 'EVENT'}</span>
    </div>
    <h3 className="text-base font-heading font-bold text-white mb-2 group-hover:text-acm-cyan transition-colors leading-tight uppercase">{ev.title}</h3>
    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{ev.desc}</p>
    <div className="mt-4 flex items-center gap-1.5 text-[10px] font-mono text-acm-cyan/60 group-hover:text-acm-cyan transition-colors group-hover:translate-x-1 duration-300">
      <span>ACCESS_LOG</span>
      <span>→</span>
    </div>
    <div className="absolute bottom-0 right-0 text-[60px] font-bold font-heading text-white/3 group-hover:text-white/6 transition-colors select-none leading-none">
      {String(index + 1).padStart(2, '0')}
    </div>
  </Link>
);

/* ─── Home Page ─────────────────────────────────────────────────────────── */
const Home = () => {
  const { data } = useSanityData(QUERIES.ABOUT, {}, DEFAULTS);
  const { data: eventsData } = useSanityData(QUERIES.EVENTS, {});
  const { data: teamData } = useSanityData(QUERIES.MEMBERS, {});
  const { data: galleryData } = useSanityData(QUERIES.ALL_GALLERY, {});

  const d = { ...DEFAULTS, ...(data || {}) };
  const recentEvents = (eventsData || []).slice(0, 3);
  const coreTeam = (teamData || []).filter(m => m.category === 'Core').slice(0, 4);

  // Gallery fallback cards + sanity items
  const fallbackGallery = [
    { caption: 'TechFest Launch', gradient: 'from-blue-900/60 to-cyan-900/60' },
    { caption: 'AI Tools Workshop', gradient: 'from-purple-900/60 to-pink-900/60' },
    { caption: 'Chapter Induction', gradient: 'from-emerald-900/60 to-teal-900/60' },
    { caption: 'DevSprint 2K26', gradient: 'from-amber-900/60 to-orange-900/60' },
    { caption: 'Open Source Day', gradient: 'from-rose-900/60 to-red-900/60' },
  ];
  const galleryItems = galleryData && galleryData.length > 0 ? galleryData.slice(0, 8) : fallbackGallery;

  return (
    <div className="w-full text-white relative">
      <SEO
        title="Home | ACM TSEC"
        description="The Official ACM Student Chapter of TSEC. We don't just write code; we architect experiences."
        url="https://acm-tsec.com"
        structuredData={homeStructuredData}
      />

      {/* ── SECTION 1: HERO ── */}
      <section className="min-h-screen flex flex-col justify-center px-6 md:px-20 pt-24 pb-16 relative z-10 pointer-events-none">
        <div className="max-w-5xl pointer-events-auto">
          <div className="overflow-hidden mb-4">
            <p className="text-acm-cyan font-mono text-xs md:text-sm tracking-[0.25em] animate-pulse">
              :: SYSTEM_READY — ACM_TSEC_v4.0
            </p>
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-[10rem] font-heading font-bold leading-[0.88] mb-8 mix-blend-screen">
            <GlitchText text={d.homeHeading1} /><br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 uppercase">{d.homeHeading2}</span><br />
            <span className="text-acm-blue uppercase">{d.homeHeading3}</span>
          </h1>

          <p className="text-gray-400 text-base md:text-xl max-w-xl mb-10 leading-relaxed border-l-2 border-acm-cyan/40 pl-5 whitespace-pre-line">
            {d.homeDesc}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/events">
              <MagneticButton as="div" className="px-8 py-4 bg-white text-black font-bold text-sm hover:bg-acm-cyan transition-colors flex items-center justify-center gap-2 w-full sm:w-auto">
                EXPLORE EVENTS
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
                </svg>
              </MagneticButton>
            </Link>
            <Link to="/contact">
              <MagneticButton as="div" className="px-8 py-4 border border-white/20 text-white font-bold text-sm hover:bg-white/10 backdrop-blur-md flex items-center justify-center w-full sm:w-auto">
                JOIN NETWORK
              </MagneticButton>
            </Link>
          </div>

          {/* Scroll hint */}
          <div className="mt-16 flex items-center gap-3 text-gray-600 font-mono text-[10px] tracking-widest">
            <div className="w-6 h-9 border border-white/15 rounded-full flex items-start justify-center pt-1.5">
              <div className="w-1 h-2 bg-acm-cyan rounded-full animate-movedown" />
            </div>
            SCROLL_TO_EXPLORE
          </div>
        </div>
      </section>

      {/* ── SECTION 2: ABOUT PREVIEW ── */}
      <section className="min-h-screen flex flex-col justify-center items-end px-6 md:px-20 relative z-10 py-20">
        <div className="w-full max-w-2xl bg-black/40 backdrop-blur-xl border-r-4 border-acm-blue p-8 md:p-14 relative overflow-hidden">
          {/* Decorative corner lines */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-acm-blue/30" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-acm-blue/30" />

          <p className="font-mono text-[10px] text-acm-blue tracking-[0.3em] mb-3 uppercase">// ABOUT_MODULE</p>
          <h2 className="text-4xl md:text-6xl font-heading font-bold mb-6 text-right">THE <span className="text-acm-blue">ORBIT</span></h2>

          <p className="text-gray-300 text-base md:text-lg mb-8 leading-relaxed text-right">
            {d.whatIsAcm ? d.whatIsAcm.substring(0, 180) + '...' : "Discover who we are and the mission that drives our network. Building a community of relentless innovators."}
          </p>

          {/* Stats row */}
          <div className="flex justify-end gap-8 mb-10">
            {[
              { val: '100+', label: 'Members', color: 'text-acm-cyan' },
              { val: '20+', label: 'Events', color: 'text-acm-blue' },
              { val: '5+', label: 'Awards', color: 'text-white' },
            ].map((stat, i) => (
              <div key={i} className="text-right border-r border-white/15 pr-6 last:border-r-0">
                <div className={`text-3xl font-bold font-mono ${stat.color}`}>{stat.val}</div>
                <div className="text-[10px] tracking-wider text-gray-500 uppercase mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Objectives horizontal scroll */}
          <div className="mb-8 overflow-hidden">
            <span className="text-[9px] font-mono text-acm-blue tracking-widest block mb-3 uppercase text-right">// PROTOCOL_OBJECTIVES</span>
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none snap-x">
              {[
                { id: "01", title: "Technical Excellence", desc: "Core algorithms & systems." },
                { id: "02", title: "Open Source Culture", desc: "Collaborative community code." },
                { id: "03", title: "Industry Bridge", desc: "Connect with industry experts." },
              ].map((obj, idx) => (
                <div key={idx} className="min-w-[175px] border border-white/8 bg-white/4 p-4 rounded-lg snap-center hover:border-acm-blue/40 transition-all">
                  <div className="text-xs font-mono text-acm-blue mb-1">{obj.id}</div>
                  <h4 className="font-bold text-sm text-white mb-1">{obj.title}</h4>
                  <p className="text-[10px] text-gray-400 leading-normal">{obj.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Link to="/about">
              <MagneticButton as="div" className="inline-block px-8 py-3 border border-acm-blue text-white font-bold hover:bg-acm-blue/20 transition-all">
                INITIATE: ABOUT →
              </MagneticButton>
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: EVENTS PREVIEW ── */}
      <section className="min-h-screen flex flex-col justify-center items-start px-6 md:px-20 relative z-10 py-20">
        <div className="w-full max-w-4xl bg-black/35 backdrop-blur-xl border-l-4 border-acm-cyan p-8 md:p-14 relative overflow-hidden">
          <div className="absolute top-0 right-0 text-[120px] font-heading font-bold text-acm-cyan/3 leading-none pointer-events-none select-none">EVT</div>

          <p className="font-mono text-[10px] text-acm-cyan tracking-[0.3em] mb-3 uppercase">// EVENTS_MODULE</p>
          <h2 className="text-4xl md:text-6xl font-heading font-bold mb-10">SYSTEM <span className="text-acm-cyan">EVENTS</span></h2>

          {/* Event Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {recentEvents.length > 0 ? (
              recentEvents.map((evt, i) => <EventCard key={evt.slug || i} ev={evt} index={i} />)
            ) : (
              [
                { title: 'DevSprint 2K26', dateText: 'AUG 2026', category: 'Hackathon', desc: '48-hour prototype generation sprint with industry mentors.' },
                { title: 'AI Tools Workshop', dateText: 'JUL 2026', category: 'Workshop', desc: 'Integration of modern AI workflow toolkits and pipelines.' },
                { title: 'Internship Seminar', dateText: 'JUN 2026', category: 'Career', desc: 'Corporate readiness metrics, roadmaps, and resume reviews.' },
              ].map((ev, i) => <EventCard key={i} ev={ev} index={i} />)
            )}
          </div>

          {/* Timeline strip */}
          <div className="mb-10 overflow-hidden">
            <span className="text-[9px] font-mono text-acm-cyan tracking-widest block mb-3 uppercase">// LOGGED_TIMELINE</span>
            <div className="relative pl-4 border-l border-acm-cyan/20">
              {[
                { year: '2026', title: 'DevSprint', mode: 'Hackathon' },
                { year: '2025', title: 'AI Summit', mode: 'Conference' },
                { year: '2024', title: 'CodeQuest', mode: 'Competition' },
              ].map((t, i) => (
                <div key={i} className="mb-4 last:mb-0 flex items-center gap-4 group cursor-pointer">
                  <div className="absolute left-0 w-1.5 h-1.5 bg-acm-cyan/40 rounded-full -translate-x-[3px] group-hover:bg-acm-cyan transition-all" style={{ marginTop: `${i * 2}rem` }} />
                  <span className="text-[9px] font-mono text-acm-cyan/50 w-10 shrink-0">{t.year}</span>
                  <span className="text-sm font-bold text-white group-hover:text-acm-cyan transition-colors">{t.title}</span>
                  <span className="text-[9px] font-mono text-gray-600 border border-white/8 px-1.5 py-0.5">{t.mode}</span>
                </div>
              ))}
            </div>
          </div>

          <Link to="/events">
            <MagneticButton as="div" className="inline-block px-8 py-3 border border-acm-cyan text-white font-bold hover:bg-acm-cyan/15 transition-all">
              ACCESS FULL LOGS →
            </MagneticButton>
          </Link>
        </div>
      </section>

      {/* ── SECTION 4: GALLERY PREVIEW ── */}
      <section className="min-h-screen flex flex-col justify-center items-center px-4 md:px-20 relative z-10 py-20">
        <div className="w-full max-w-5xl bg-black/35 backdrop-blur-xl border-t-4 border-white/30 p-8 md:p-14 relative overflow-hidden">
          <div className="absolute bottom-0 right-0 text-[100px] font-heading font-bold text-white/3 leading-none pointer-events-none select-none">CAP</div>

          <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
            <div>
              <p className="font-mono text-[10px] text-gray-400 tracking-[0.3em] mb-2 uppercase">// GALLERY_MODULE</p>
              <h2 className="text-4xl md:text-6xl font-heading font-bold">THE <span className="text-gray-300">CAPTURES</span></h2>
            </div>
            <Link to="/gallery">
              <MagneticButton as="div" className="text-[10px] font-mono border border-white/15 px-4 py-2 text-gray-400 hover:border-acm-cyan hover:text-acm-cyan transition-all mt-2">
                OPEN ARCHIVE →
              </MagneticButton>
            </Link>
          </div>

          {/* Core Team Strip */}
          {coreTeam.length > 0 && (
            <div className="mb-10">
              <span className="text-[9px] font-mono text-gray-500 tracking-widest block mb-4 uppercase">// CORE_ARCHITECTS</span>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {coreTeam.map((member) => (
                  <div key={member._id} className="min-w-[140px] flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-acm-cyan/50 transition-all">
                      {member.image ? (
                        <img src={getDirectDriveUrl(member.image)} alt={member.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-xl font-bold text-acm-cyan/30">
                          {member.name?.[0] || '?'}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-white group-hover:text-acm-cyan transition-colors truncate max-w-[130px]">{member.name}</p>
                      <p className="text-[9px] text-acm-blue font-mono truncate max-w-[130px]">{member.role}</p>
                    </div>
                  </div>
                ))}
                <Link to="/team" className="min-w-[100px] flex flex-col items-center justify-center gap-2 group cursor-pointer opacity-50 hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 group-hover:border-acm-cyan/50 flex items-center justify-center text-2xl text-white/30 group-hover:text-acm-cyan transition-all">+</div>
                  <p className="text-[9px] font-mono text-gray-500 group-hover:text-acm-cyan text-center transition-colors">VIEW ALL</p>
                </Link>
              </div>
            </div>
          )}

          {/* Circular Gallery Carousel */}
          <div className="mb-14">
            <span className="text-[9px] font-mono text-gray-500 tracking-widest block mb-6 uppercase">// RECENT_CAPTURES — DRAG OR USE ARROWS TO NAVIGATE</span>
            <GalleryCarousel items={galleryItems} />
          </div>

          <div className="flex justify-center gap-6 mt-4">
            <Link to="/team">
              <MagneticButton as="div" className="px-8 py-3 bg-white text-black font-bold hover:bg-gray-200 transition-colors">
                VIEW FULL TEAM
              </MagneticButton>
            </Link>
            <Link to="/gallery">
              <MagneticButton as="div" className="px-8 py-3 border border-white/30 text-white font-bold hover:bg-white/8 transition-colors">
                VIEW ARCHIVE
              </MagneticButton>
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: CONTACT (inline mini form) ── */}
      <ContactSection />
    </div>
  );
};

/* ─── Inline Mini Contact Form (lives at bottom of Home) ─────────────────── */
const ContactSection = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _type: 'contactMessage',
          ...form,
          submittedAt: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setForm({ name: '', email: '', message: '' });
      } else {
        alert('Failed to send. Please try again.');
      }
    } catch {
      alert('Network error — check if the API is running.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="min-h-[90vh] flex flex-col justify-center items-center px-4 md:px-20 py-20 relative z-10">
      <div className="w-full max-w-5xl relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -right-32 -bottom-32 w-96 h-96 rounded-full bg-acm-blue/5 blur-3xl pointer-events-none" />
        <div className="absolute -left-32 -top-20 w-64 h-64 rounded-full bg-acm-cyan/4 blur-3xl pointer-events-none" />

        {/* Top accent line */}
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-acm-cyan to-transparent opacity-40 mb-0" />

        <div className="bg-black/60 backdrop-blur-2xl border border-white/8 overflow-hidden">
          {/* Header bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/8 bg-white/3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-acm-cyan animate-pulse" />
              <span className="font-mono text-[9px] text-acm-cyan tracking-[0.25em] uppercase">// SESSION_TERMINAL — UPLINK_ACTIVE</span>
            </div>
            <span className="font-mono text-[9px] text-gray-600 tracking-widest">SIGNAL_HQ: MUMBAI, MH</span>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* ─ Left: Info ─ */}
            <div className="w-full md:w-5/12 p-8 md:p-10 border-b md:border-b-0 md:border-r border-white/8 flex flex-col justify-between gap-8">
              <div>
                <p className="font-mono text-[9px] text-acm-cyan tracking-[0.3em] mb-3 uppercase">// CONTACT_MODULE</p>
                <h2 className="text-4xl md:text-5xl font-heading font-bold mb-5 leading-tight">
                  ESTABLISH<br /><span className="text-acm-cyan">CONNECTION</span>
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-8">
                  Whether you're a student, professional, or collaborator — our uplink is always open.
                </p>

                {/* Info rows */}
                <div className="space-y-4 font-mono text-xs">
                  <div className="group flex items-start gap-3 p-3 border border-white/5 bg-white/3 hover:border-acm-cyan/30 hover:bg-acm-cyan/5 transition-all cursor-default">
                    <span className="text-acm-cyan mt-0.5">⊕</span>
                    <div>
                      <div className="text-[9px] text-gray-600 mb-0.5 uppercase tracking-widest"># TARGET_HQ</div>
                      <div className="text-gray-300 text-[11px] leading-relaxed">Thakur Complex, Kandivali (E),<br />Mumbai — TSEC, CO Staffroom</div>
                      <div className="text-[9px] text-acm-cyan/40 group-hover:text-acm-cyan/70 mt-1 transition-colors">LAT: 19.2130 | LON: 72.8647</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border border-white/5 bg-white/3 hover:border-acm-cyan/30 hover:bg-acm-cyan/5 transition-all cursor-default">
                    <span className="text-acm-cyan">@</span>
                    <div>
                      <div className="text-[9px] text-gray-600 mb-0.5 uppercase tracking-widest"># EMAIL</div>
                      <div className="text-gray-300 text-[11px] uppercase tracking-wider">ACMCO@TSECMUMBAI.IN</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social links */}
              <div>
                <div className="text-[9px] font-mono text-gray-600 mb-3 uppercase tracking-widest"># SOCIAL_UPLINKS</div>
                <div className="flex gap-3">
                  {[
                    { label: 'INSTAGRAM', href: 'https://www.instagram.com/acm_tsec', icon: '📷' },
                    { label: 'LINKEDIN', href: 'https://www.linkedin.com/company/tsec-acm', icon: '💼' },
                  ].map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div className="w-11 h-11 border border-white/10 flex items-center justify-center text-lg group-hover:border-acm-cyan group-hover:bg-acm-cyan/10 transition-all">
                        {social.icon}
                      </div>
                      <span className="text-[8px] font-mono text-gray-600 group-hover:text-acm-cyan transition-colors">{social.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* ─ Right: Form ─ */}
            <div className="w-full md:w-7/12 p-8 md:p-10 relative">
              {/* Corner decorators */}
              <div className="absolute top-4 right-4 text-[10px] font-mono text-white/10 pointer-events-none">[ ]</div>
              <div className="absolute bottom-4 left-4 text-[10px] font-mono text-white/10 pointer-events-none">[_]</div>

              {submitted ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 gap-4">
                  <div className="w-16 h-16 rounded-full border-2 border-acm-cyan flex items-center justify-center text-3xl text-acm-cyan">✓</div>
                  <h3 className="text-2xl font-heading font-bold text-acm-cyan uppercase tracking-tighter">SIGNAL_SENT</h3>
                  <p className="text-gray-400 text-xs font-mono">Your message has been logged in our system.</p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-2 border border-white/20 px-6 py-2.5 text-xs font-mono text-acm-cyan hover:bg-acm-cyan hover:text-black transition-all"
                  >
                    [NEW_MESSAGE]
                  </button>
                </div>
              ) : (
                <>
                  <p className="font-mono text-[9px] text-gray-500 mb-6 uppercase tracking-widest">// TRANSMIT_MESSAGE</p>
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* Name */}
                    <div className="group relative">
                      <input
                        type="text"
                        required
                        placeholder=" "
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="w-full bg-transparent border-b border-white/10 py-3 text-white focus:border-acm-cyan outline-none transition-all peer pt-6 font-mono text-xs"
                      />
                      <label className="absolute left-0 top-6 text-gray-500 text-[10px] peer-focus:text-acm-cyan peer-focus:-translate-y-5 peer-[:not(:placeholder-shown)]:-translate-y-5 transition-all font-mono uppercase tracking-widest pointer-events-none">
                        // USER_ID
                      </label>
                      <div className="absolute bottom-0 left-0 h-px bg-acm-cyan w-0 peer-focus:w-full transition-all duration-400" />
                    </div>

                    {/* Email */}
                    <div className="group relative">
                      <input
                        type="email"
                        required
                        placeholder=" "
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="w-full bg-transparent border-b border-white/10 py-3 text-white focus:border-acm-cyan outline-none transition-all peer pt-6 font-mono text-xs"
                      />
                      <label className="absolute left-0 top-6 text-gray-500 text-[10px] peer-focus:text-acm-cyan peer-focus:-translate-y-5 peer-[:not(:placeholder-shown)]:-translate-y-5 transition-all font-mono uppercase tracking-widest pointer-events-none">
                        // EMAIL_ADDR
                      </label>
                      <div className="absolute bottom-0 left-0 h-px bg-acm-cyan w-0 peer-focus:w-full transition-all duration-400" />
                    </div>

                    {/* Message */}
                    <div className="group relative">
                      <textarea
                        rows="3"
                        required
                        placeholder=" "
                        value={form.message}
                        onChange={e => setForm({ ...form, message: e.target.value })}
                        className="w-full bg-transparent border-b border-white/10 py-3 text-white focus:border-acm-cyan outline-none transition-all peer pt-6 resize-none font-mono text-xs leading-relaxed"
                      />
                      <label className="absolute left-0 top-6 text-gray-500 text-[10px] peer-focus:text-acm-cyan peer-focus:-translate-y-5 peer-[:not(:placeholder-shown)]:-translate-y-5 transition-all font-mono uppercase tracking-widest pointer-events-none">
                        // MESSAGE_PAYLOAD
                      </label>
                      <div className="absolute bottom-0 left-0 h-px bg-acm-cyan w-0 peer-focus:w-full transition-all duration-400" />
                    </div>

                    {/* Submit */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <MagneticButton
                        type="submit"
                        disabled={submitting}
                        className="px-10 py-3.5 bg-acm-cyan/10 border border-acm-cyan/40 text-acm-cyan font-bold tracking-[0.2em] hover:bg-acm-cyan hover:text-black transition-all duration-400 group relative overflow-hidden text-xs disabled:opacity-50"
                      >
                        <span className="relative z-10">{submitting ? 'TRANSMITTING...' : 'INITIATE_HANDSHAKE'}</span>
                        <div className="absolute inset-0 bg-acm-cyan transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 origin-bottom" />
                      </MagneticButton>
                      <Link to="/contact" className="text-[9px] font-mono text-gray-600 hover:text-acm-cyan transition-colors underline underline-offset-4">
                        open full contact page →
                      </Link>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* Bottom gradient line */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>
    </section>
  );
};

export default Home;
