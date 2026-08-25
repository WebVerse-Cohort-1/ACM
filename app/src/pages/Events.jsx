import { Link } from 'react-router-dom';
import { useSanityData } from '../hooks/useSanityData';
import { QUERIES } from '../lib/sanity';
import { getDirectDriveUrl } from '../lib/utils';
import SEO from '../components/ui/SEO';
import TiltCard from '../components/ui/TiltCard';

const Events = () => {
  const { data: events, loading } = useSanityData(QUERIES.EVENTS, {}, []);

  return (
    <main className="min-h-screen pt-28 md:pt-32 px-4 md:px-20 max-w-8xl mx-auto pb-20">
      <SEO
        title="Events | ACM TSEC"
        description="Discover upcoming and past events hosted by ACM TSEC — hackathons, workshops, and seminars."
        url="https://acm-tsec.com/events"
      />

      <h1 className="hidden md:block text-6xl md:text-9xl font-heading font-bold mb-16 opacity-5 fixed -z-10 top-20 right-0 pointer-events-none select-none">
        TIMELINE
      </h1>

      <div className="flex flex-col md:flex-row items-start md:items-baseline justify-between mb-8 md:mb-16 border-b border-white/10 pb-6 md:pb-8">
        <h2 className="text-3xl md:text-6xl font-heading font-bold text-white uppercase tracking-tighter">
          EVENT_<span className="text-acm-cyan">LOGS</span>
        </h2>
        <p className="text-gray-400 font-mono text-xs tracking-widest mt-2 md:mt-0 uppercase font-semibold">:: UPCOMING_OPERATIONS</p>
      </div>

      {loading && (
        <div className="text-center py-20 text-acm-cyan font-mono text-xs animate-pulse tracking-widest">
          :: FETCHING_INTEL...
        </div>
      )}

      {!loading && (!events || events.length === 0) && (
        <div className="text-center py-20 text-gray-600 font-mono text-xs">
          NO_EVENTS_FOUND — Check Sanity Studio
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
        {(events || []).map((ev) => (
          <Link key={ev.slug} to={`/events/${ev.slug}`} className="block">
            <TiltCard className="group aspect-video cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-white/2 hover:scale-110 hover:shadow-[0_0_80px_rgba(100,255,218,0.15)] transition-all duration-500 z-10 hover:z-20">
              <div className="relative h-full w-full p-5 md:p-8 flex flex-col justify-between z-10 transition-all duration-500 group-hover:bg-acm-cyan/5">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-lg md:text-xl font-bold text-white border-b-2 border-acm-cyan pb-1">
                    {ev.dateText || 'TBA'}
                  </span>
                  <span className="font-mono text-[10px] font-semibold border border-white/20 px-2 py-1 rounded text-gray-400 tracking-wider">
                    {ev.category || 'EVENT'}
                  </span>
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none">
                  <div className="w-32 md:w-48 h-32 md:h-48 rounded-full bg-gradient-to-br from-acm-cyan/40 to-black blur-[100px]" />
                </div>

                <div className="z-20">
                  <h3 className="text-xl md:text-2xl font-heading font-black text-white mb-1 uppercase tracking-tight">{ev.title}</h3>
                  <p className="text-[10px] md:text-xs text-gray-400 font-mono mb-4 border-l border-acm-cyan/30 pl-3 line-clamp-2">{ev.desc}</p>
                  <div className="text-[10px] font-bold text-acm-cyan uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform duration-300">
                    UPLINK_PROTOCOL →
                  </div>
                </div>

                {ev.images && ev.images[0] && (
                  <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-opacity">
                    <img src={getDirectDriveUrl(ev.images[0])} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                  </div>
                )}
              </div>
            </TiltCard>
          </Link>
        ))}
      </div>
    </main>
  );
};

export default Events;
