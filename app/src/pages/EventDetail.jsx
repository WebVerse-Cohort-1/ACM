import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSanityData } from '../hooks/useSanityData';
import { QUERIES } from '../lib/sanity';
import { getDirectDriveUrl } from '../lib/utils';
import SEO from '../components/ui/SEO';
import MagneticButton from '../components/ui/MagneticButton';

const EventDetail = () => {
  const { slug } = useParams();
  const { data: event, loading } = useSanityData(QUERIES.EVENT_BY_SLUG, { slug }, null);
  const { data: galleryItems } = useSanityData(QUERIES.GALLERY_BY_SLUG, { slug }, []);

  const [prize, setPrize] = useState(0);
  const [timeLeft, setTimeLeft] = useState({});
  const [activeFAQ, setActiveFAQ] = useState(null);

  // Prize counter animation
  useEffect(() => {
    if (!event?.prizePool) return;
    let start = 0;
    const increment = event.prizePool / (1500 / 16);
    const counter = setInterval(() => {
      start += increment;
      if (start >= event.prizePool) { start = event.prizePool; clearInterval(counter); }
      setPrize(Math.floor(start));
    }, 16);
    return () => clearInterval(counter);
  }, [event?.prizePool]);

  // Countdown timer
  useEffect(() => {
    if (!event?.eventDate) return;
    const interval = setInterval(() => {
      const diff = new Date(event.eventDate) - new Date();
      if (diff <= 0) { setTimeLeft({}); clearInterval(interval); return; }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [event?.eventDate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-acm-cyan font-mono text-xs animate-pulse tracking-widest">
        :: LOADING_EVENT_DATA...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-acm-cyan font-mono mb-4">EVENT_NOT_FOUND</p>
          <Link to="/events" className="border border-white/20 px-6 py-3 text-sm hover:bg-white/5 transition-all">← Back to Events</Link>
        </div>
      </div>
    );
  }

  const eventStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.desc || 'Join us for an exciting event by ACM TSEC.',
    startDate: event.eventDate ? new Date(event.eventDate).toISOString() : '',
    location: { '@type': 'Place', name: 'TSEC, Bandra', address: 'Bandra, Mumbai' },
    organizer: { '@type': 'Organization', name: 'ACM TSEC', url: 'https://acm-tsec.com' },
  };

  // Merge event images + gallery items
  const eventImages = [
    ...(Array.isArray(event.images) ? event.images : []),
    ...(galleryItems || []).map(g => g.src),
  ].filter(Boolean);

  const isPastEvent = event.eventDate ? new Date(event.eventDate) < new Date() : false;
  let isRegistrationClosed = false;
  let statusText = "Registration Open";

  if (event.registrationStatus === 'completed') {
    isRegistrationClosed = true;
    statusText = event.customStatusText || "Event Completed";
  } else if (event.registrationStatus === 'started') {
    isRegistrationClosed = true;
    statusText = event.customStatusText || "Event Started";
  } else if (event.registrationStatus === 'custom') {
    isRegistrationClosed = true;
    statusText = event.customStatusText || "Registration Closed";
  } else if (isPastEvent) {
    isRegistrationClosed = true;
    statusText = event.customStatusText || "Event Concluded";
  }

  return (
    <main className="min-h-screen pt-28 md:pt-32 px-4 md:px-20 text-white max-w-6xl mx-auto pb-20 md:pb-32">
      <SEO
        title={`${event.title} | ACM TSEC`}
        description={event.desc || 'Event details and registration.'}
        url={`https://acm-tsec.com/events/${slug}`}
        structuredData={eventStructuredData}
      />

      <div className="flex flex-col md:flex-row justify-between items-start gap-10">
        <div className="flex-1">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-heading font-bold mb-3 md:mb-4">{event.title}</h1>
          <p className="text-acm-cyan font-mono text-xs md:text-base mb-5 md:mb-8">{event.dateText}</p>
          <p className="text-gray-300 text-sm md:text-lg mb-8 md:mb-12 max-w-3xl leading-relaxed">{event.desc}</p>

          {event.prizePool > 0 && (
            <>
              <h2 className="text-xl md:text-3xl font-bold mb-3 md:mb-6">🏆 Prize Pool</h2>
              <div className="text-4xl md:text-6xl font-heading font-bold text-acm-cyan mb-10 md:mb-16">
                ₹ {prize.toLocaleString()}
              </div>
            </>
          )}
        </div>

        <div className="w-full md:w-80 sticky top-32 space-y-4">
          {isRegistrationClosed ? (
            <div className="w-full py-5 bg-white/5 border border-white/10 text-gray-500 font-bold tracking-widest text-center rounded-xl cursor-not-allowed select-none">
              {statusText.toUpperCase()}
            </div>
          ) : (
            <Link to={`/events/${slug}/register`}>
              <MagneticButton as="div" className="w-full py-5 bg-white text-black font-bold tracking-widest hover:bg-acm-cyan transition-colors shadow-[0_0_30px_rgba(255,255,255,0.1)] text-center">
                REGISTER_NOW
              </MagneticButton>
            </Link>
          )}
          <div className="p-4 border border-white/10 bg-white/5 rounded-xl text-[10px] font-mono text-gray-500 uppercase leading-loose">
            :: Status: {statusText}<br />
            :: Verified: TSEC Chapters<br />
            :: Entry Code: ACM_ENCRYPT_26
          </div>
        </div>
      </div>

      {/* Countdown */}
      {timeLeft.days !== undefined && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 text-center mb-12 md:mb-20">
          {Object.entries(timeLeft).map(([key, value]) => (
            <div key={key} className="p-3 md:p-6 bg-white/5 border border-white/10 rounded-xl">
              <div className="text-2xl md:text-4xl font-bold text-acm-cyan">{value}</div>
              <div className="text-[10px] md:text-sm uppercase tracking-widest text-gray-400 mt-1">{key}</div>
            </div>
          ))}
        </div>
      )}

      {/* Gallery */}
      {eventImages.length > 0 && (
        <div className="mb-12 md:mb-20">
          <h2 className="text-xl md:text-3xl font-bold mb-4 md:mb-8">📸 Event Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {eventImages.map((src, i) => (
              <div key={i} className="aspect-video overflow-hidden rounded-xl border border-white/10 group cursor-pointer" onClick={() => window.open(src, '_blank')}>
                <img src={getDirectDriveUrl(src)} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tracks */}
      {event.tracks?.length > 0 && (
        <>
          <h2 className="text-xl md:text-3xl font-bold mb-4 md:mb-8">Tracks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6 mb-12 md:mb-20">
            {event.tracks.map((track, i) => (
              <div key={i} className="p-4 md:p-6 bg-white/5 border border-white/10 rounded-xl">
                <h3 className="font-bold mb-2 text-acm-cyan">{track.name}</h3>
                <p className="text-sm text-gray-400">{track.desc}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Speakers */}
      {event.speakers?.length > 0 && (
        <>
          <h2 className="text-xl md:text-3xl font-bold mb-6 md:mb-10">Experts & Guests</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 mb-12 md:mb-20">
            {event.speakers.map((speaker, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 text-center group">
                <div className="relative w-16 h-16 md:w-28 md:h-28 mx-auto mb-3 md:mb-4">
                  <img src={getDirectDriveUrl(speaker.image)} alt={speaker.name} className="w-full h-full rounded-full object-cover border-2 border-white/10 grayscale group-hover:grayscale-0 group-hover:border-acm-cyan transition-all duration-500" />
                  {speaker.type && <span className="absolute -bottom-1 -right-1 bg-acm-cyan text-black font-black text-[8px] md:text-[10px] px-2 py-0.5 rounded-full uppercase">{speaker.type}</span>}
                </div>
                <h3 className="text-sm md:text-xl font-bold truncate">{speaker.name}</h3>
                <p className="text-gray-400 text-[10px] md:text-xs mt-1 md:mt-2 uppercase tracking-widest">{speaker.role}</p>
                {speaker.linkedin && (
                  <a href={speaker.linkedin} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-[10px] text-acm-cyan font-mono hover:underline">:: VIEW_INTEL</a>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* FAQs */}
      {event.faqs?.length > 0 && (
        <>
          <h2 className="text-xl md:text-3xl font-bold mb-4 md:mb-8">FAQs</h2>
          <div className="space-y-3 md:space-y-6">
            {event.faqs.map((faq, i) => (
              <div key={i} className="border border-white/10 rounded-xl overflow-hidden">
                <button onClick={() => setActiveFAQ(activeFAQ === i ? null : i)} className="w-full text-left p-4 md:p-6 bg-white/5 text-sm md:text-base hover:bg-white/10 transition-all">
                  {faq.q}
                </button>
                {activeFAQ === i && <div className="p-4 md:p-6 bg-black/40 text-gray-300 text-sm">{faq.a}</div>}
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
};

export default EventDetail;
