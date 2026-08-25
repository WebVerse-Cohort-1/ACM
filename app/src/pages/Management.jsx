import { useEffect } from 'react';
import SEO from '../components/ui/SEO';

const STUDIO_URL = 'http://localhost:3333';

/**
 * Management page — replaced the old client-side admin panel.
 * All management is now done in Sanity Studio.
 *
 * The admin login (handshake) has been removed for security.
 * Studio provides a proper auth system with role-based access.
 */
const Management = () => {
  // Redirect to Studio automatically after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      window.open(STUDIO_URL, '_blank');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 text-white">
      <SEO title="Admin | ACM TSEC" description="Redirecting to Sanity Studio." />

      <div className="text-center max-w-xl">
        <div className="text-acm-cyan font-mono text-[10px] tracking-[0.5em] mb-6 animate-pulse">
          :: REDIRECTING_TO_STUDIO
        </div>
        <h1 className="text-4xl md:text-6xl font-heading font-bold uppercase tracking-tighter mb-6">
          CHAPTER_<span className="text-acm-cyan">STUDIO</span>
        </h1>
        <p className="text-gray-400 text-sm mb-10 leading-relaxed">
          All management has moved to <strong className="text-acm-cyan">Sanity Studio</strong>. Use the Studio to manage events, team members, registrations, messages, quizzes, and gallery items.
        </p>

        <div className="grid grid-cols-2 gap-3 text-[10px] font-mono text-left mb-10">
          {[
            ['Events', 'Create, edit, publish events'],
            ['Team', 'Add & update team members'],
            ['Registrations', 'View all event registrations'],
            ['Messages', 'Read contact messages'],
            ['Gallery', 'Upload & organize photos'],
            ['Quizzes', 'Create & manage quizzes'],
          ].map(([title, desc]) => (
            <div key={title} className="p-3 border border-white/10 rounded-lg bg-white/2">
              <div className="text-acm-cyan mb-1">{title}</div>
              <div className="text-gray-500 text-[9px]">{desc}</div>
            </div>
          ))}
        </div>

        <a
          href={STUDIO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 bg-acm-cyan text-black font-bold uppercase tracking-[0.3em] text-sm hover:bg-white transition-colors"
        >
          OPEN_STUDIO
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
          </svg>
        </a>

        <p className="mt-6 text-gray-600 font-mono text-[10px]">
          :: Studio opens automatically in 3s. Requires TSEC ACM credentials.
        </p>
      </div>
    </main>
  );
};

export default Management;
