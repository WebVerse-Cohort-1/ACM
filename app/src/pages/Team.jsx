import { useMemo } from 'react';
import { useSanityData } from '../hooks/useSanityData';
import { QUERIES } from '../lib/sanity';
import SEO from '../components/ui/SEO';
import TeamPersonaCard from '../components/Team/TeamPersonaCard';

const Team = () => {
  const { data: members, loading } = useSanityData(QUERIES.MEMBERS, {}, []);

  // Group members by category (done in JS since GROQ can't directly group)
  const grouped = useMemo(() => {
    if (!members) return {};
    return members.reduce((acc, m) => {
      const cat = m.category || 'Team';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(m);
      return acc;
    }, {});
  }, [members]);

  return (
    <main className="min-h-screen pt-28 md:pt-32 px-4 md:px-20 max-w-7xl mx-auto pb-20 relative z-10">
      <SEO
        title="Team | ACM TSEC"
        description="Meet the dedicated team behind the TSEC ACM Student Chapter."
        url="https://acm-tsec.com/team"
      />

      <h1 className="hidden md:block text-6xl md:text-9xl font-heading font-bold mb-16 opacity-5 fixed -z-10 top-20 right-0 pointer-events-none select-none">
        ACM_CORE
      </h1>

      <div className="flex flex-col md:flex-row items-start md:items-baseline justify-between mb-8 md:mb-16 border-b border-white/10 pb-6 md:pb-8">
        <h2 className="text-4xl md:text-7xl font-heading font-bold text-white uppercase tracking-tighter">
          FORCE_<span className="text-acm-cyan">COMMAND</span>
        </h2>
        <p className="text-gray-500 font-mono text-[8px] md:text-xs tracking-[0.4em] mt-4 md:mt-0 uppercase font-bold text-center">
          // THE_ARCHITECTS_OF_CHAPTER_SCALING
        </p>
      </div>

      {loading && (
        <div className="text-center py-20 text-acm-cyan font-mono text-xs animate-pulse tracking-widest">
          :: LOADING_FORCE_MEMBERS...
        </div>
      )}

      {!loading && Object.keys(grouped).length === 0 && (
        <div className="text-center py-20 text-gray-600 font-mono text-xs">
          NO_MEMBERS_FOUND — Add members in Sanity Studio
        </div>
      )}

      {Object.entries(grouped).map(([category, categoryMembers]) => (
        <div key={category} className="mb-20 md:mb-32">
          <h3 className="text-sm md:text-xl font-mono text-acm-cyan mb-8 md:mb-16 tracking-[.4em] flex items-center justify-center md:justify-start gap-4">
            <span className="w-12 h-px bg-acm-cyan/30" />
            <span className="uppercase">{category.replace(/_/g, ' ')}</span>
            <span className="text-[10px] opacity-20">[{categoryMembers.length}_NODES]</span>
          </h3>
          <div className="flex flex-wrap gap-8 md:gap-14 justify-center px-4">
            {categoryMembers.map((m, i) => (
              <TeamPersonaCard key={m._id || i} member={m} />
            ))}
          </div>
        </div>
      ))}
    </main>
  );
};

export default Team;
