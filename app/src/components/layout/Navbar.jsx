import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Gallery', path: '/gallery' },
  { name: 'Events', path: '/events' },
  { name: 'Team', path: '/team' },
  { name: 'Contact', path: '/contact' },
];

const Navbar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
  }, [isOpen]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <>
      <nav className={`fixed top-0 w-full px-6 md:px-12 flex justify-between items-center transition-all duration-300 z-[1001] ${scrolled || isOpen ? 'py-4 bg-[#020c1b]/95 backdrop-blur-md border-b border-white/10 shadow-lg' : 'py-8'}`}>
        <Link to="/" onClick={() => setIsOpen(false)} className="text-2xl font-heading font-bold tracking-widest text-white hover:text-acm-cyan transition-colors">
          TSEC <span className="text-acm-cyan">ACM</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex gap-8">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`text-xs uppercase tracking-[0.3em] transition-all hover:text-acm-cyan ${location.pathname === item.path ? 'text-acm-cyan font-bold' : 'text-gray-400'}`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Mobile Trigger */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen); }}
          className="md:hidden text-white text-3xl z-[1002] focus:outline-none focus:text-acm-cyan transition-colors active:scale-95 touch-none"
        >
          {isOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-[#020c1b]/98 backdrop-blur-2xl flex flex-col items-center justify-center gap-8 md:hidden transition-all duration-500 z-[1000] ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
        <div className="absolute top-0 left-0 w-full h-1 bg-acm-cyan/30 animate-pulse" />
        <div className="flex flex-col items-center gap-6 w-full px-10">
          {navItems.map((item, idx) => {
            const isCurrent = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`group relative w-full text-center py-4 text-3xl font-heading font-black uppercase tracking-[0.2em] transition-all duration-500 ${isCurrent ? 'text-acm-cyan scale-110' : 'text-gray-500/50 hover:text-white'}`}
                style={{ transitionDelay: `${idx * 50}ms` }}
              >
                <span className="relative z-10">{item.name}</span>
                {isCurrent && (
                  <>
                    <span className="absolute inset-0 bg-acm-cyan/5 rounded-full animate-pulse -z-10" />
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-acm-cyan rounded-full animate-ping" />
                    <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-acm-cyan rounded-full animate-ping" />
                  </>
                )}
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-acm-cyan scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
              </Link>
            );
          })}
        </div>
        <div className="mt-12 text-[10px] font-mono text-acm-cyan/40 tracking-[0.6em] animate-pulse">
          :: UPLINK_ESTABLISHED ::
        </div>
      </div>
    </>
  );
};

export default Navbar;
