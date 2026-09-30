import sys

print("Opening App.jsx")
with open(r'c:\Users\DARK SEID\ACM\src\App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find('const About = () => {')
end_idx = content.find('const Team = () => {')

if start_idx == -1 or end_idx == -1:
    print("Error: Could not find start or end index.")
    sys.exit(1)

new_component = r'''const DEFAULTS = {
  whatIsAcm: 'The TSEC ACM Student Chapter at Thakur Shyamnarayan Engineering College is a dynamic student-driven community committed to fostering technical excellence, innovation, and holistic student development.',
  vision: 'To build a future-ready community of innovators who leverage computing to solve real-world problems and drive meaningful societal impact.',
  mission: '1. To cultivate critical thinking and technical excellence through hands-on learning, competitions, and collaborative projects.\n2. To promote innovation and research by encouraging students to explore emerging technologies and build impactful solutions.\n3. To nurture leadership, entrepreneurship, and teamwork through diverse technical and creative initiatives.\n4. To create a strong tech community that bridges academia, industry, and society.',
  stats: [{ label: 'MEMBERS', value: 500 }, { label: 'EVENTS', value: 30 }, { label: 'AWARDS', value: 10 }],
  legacyLogs: [
    { year: '2025', title: 'National Apex', desc: 'Awarded Best Student Chapter nationwide.' },
    { year: '2023', title: 'Source Code', desc: 'Launched open-source initiative with 500+ PRs.' },
  ],
};

const OBJECTIVES = [
  { id: "01", title: "Enhance Technical Competence", desc: "Strengthen students' core knowledge in programming, algorithms, AI, and emerging technologies through workshops, coding contests, and hands-on sessions.", icon: "💻" },
  { id: "02", title: "Promote Innovation & Problem-Solving", desc: "Encourage students to develop innovative solutions for real-world challenges through hackathons, projects, and research-driven activities.", icon: "💡" },
  { id: "03", title: "Foster Research & Development Culture", desc: "Motivate students to explore research, publish papers, and participate in technical conferences and competitions.", icon: "🔬" },
  { id: "04", title: "Build a Collaborative Tech Community", desc: "Create a platform for peer learning, knowledge sharing, and collaboration among students, faculty, and industry professionals.", icon: "🤝" },
  { id: "05", title: "Develop Leadership & Teamwork Skills", desc: "Provide opportunities for students to lead, organize, and manage technical and non-technical events.", icon: "👑" },
  { id: "06", title: "Bridge Academia and Industry", desc: "Connect students with industry experts through guest lectures, mentorship programs, and internships.", icon: "🌉" },
  { id: "07", title: "Encourage Socially Relevant Computing", desc: "Use technology for solving societal issues through projects, awareness drives, and community-focused initiatives.", icon: "🌍" },
  { id: "08", title: "Promote Inclusivity & Equal Opportunities", desc: "Ensure participation from students of all backgrounds and encourage diversity in technology fields.", icon: "🌈" },
  { id: "09", title: "Support Open Source & Continuous Learning", desc: "Encourage contributions to open-source projects and promote lifelong learning through continuous upskilling.", icon: "📖" },
  { id: "10", title: "Enhance Communication & Technical Expression", desc: "Develop students' ability to present ideas, explain concepts, and communicate technical knowledge effectively.", icon: "📢" },
];

const TAGLINES = [
  "Innovate. Integrate. Impact.",
  "Building Coders. Creating Innovators.",
  "Think Tech. Build the Future.",
  "From Code to Change."
];

const About = () => {
  const [aboutData, setAboutData] = useState({ ...DEFAULTS });
  const location = useLocation();

  useEffect(() => {
      try {
          const stored = JSON.parse(localStorage.getItem('acm_about'));
          if (stored) {
              setAboutData(prev => ({ ...prev, ...stored }));
          }
      } catch (e) {
          console.error("About Data Load Error:", e);
      }
  }, [location.pathname]);

  const stats = aboutData.stats || [];
  const [counts, setCounts] = useState(stats.map(() => 0));
  const [hasAnimated, setHasAnimated] = useState(false);
  const statsRef = useRef(null);
  const aboutRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [activeTagline, setActiveTagline] = useState(0);

  const [visionRef, visionVisible] = useScrollReveal();
  const [missionRef, missionVisible] = useScrollReveal();
  const [objRef, objVisible] = useScrollReveal();

  useEffect(() => {
    document.title = "About | ACM TSEC";
    const interval = setInterval(() => {
      setActiveTagline(prev => (prev + 1) % TAGLINES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Reset counter when stats change
  useEffect(() => {
    setCounts((aboutData.stats || []).map(() => 0));
    setHasAnimated(false);
  }, [JSON.stringify(aboutData.stats)]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated) {
        setHasAnimated(true);
        stats.forEach((stat, index) => {
          let start = 0;
          const increment = stat.value / (1500 / 16);
          const counter = setInterval(() => {
            start += increment;
            if (start >= stat.value) { start = stat.value; clearInterval(counter); }
            setCounts(prev => { const u = [...prev]; u[index] = Math.floor(start); return u; });
          }, 16);
        });
      }
    }, { threshold: 0.4 });
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [hasAnimated, JSON.stringify(stats)]); // Use JSON.stringify for stats safely

  useEffect(() => {
    const handleScroll = () => {
      if (!aboutRef.current) return;
      setProgress(Math.min(Math.max(window.scrollY / 800, 0), 1));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={aboutRef} className="min-h-screen pt-28 md:pt-32 px-5 md:px-20 flex flex-col md:flex-row gap-10 md:gap-20 pb-20">
      {/* Mobile title */}
      <div className="md:hidden mb-10">
        <h1 className="text-6xl font-heading font-bold text-acm-cyan tracking-widest leading-tight">WHO<br />WE ARE</h1>
      </div>

      {/* Desktop sticky sidebar */}
      <div className="hidden md:flex md:w-1/3 items-start justify-center relative">
        <div className="sticky top-32 space-y-6">
          {['WHO', 'WE', 'ARE'].map((word, i) => {
            const isActive = progress >= (i + 1) / 4;
            return (
              <div key={i} className={`text-8xl font-heading font-bold transition-all duration-700 ${isActive ? 'text-acm-cyan scale-110' : 'text-white/30 scale-100'}`}>
                {word}
              </div>
            );
          })}
          <div className="absolute -left-6 top-0 h-full w-[2px] bg-white/10">
            <div className="w-full bg-acm-cyan transition-all duration-300" style={{ height: `${progress * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="md:w-2/3 space-y-16 md:space-y-32">
        <section>
          <h2 className="text-sm text-acm-cyan mb-4 font-mono uppercase tracking-widest">_What is ACM?</h2>
          <p className="text-base md:text-xl font-light leading-relaxed text-white/80 mb-6">{aboutData.whatIsAcm}</p>

          {/* Rotating Tagline */}
          <div className="h-12 relative overflow-hidden mb-12">
            {TAGLINES.map((t, i) => (
              <div
                key={i}
                className={`absolute left-0 font-mono text-sm tracking-[0.2em] transition-all duration-700 ${
                  i === activeTagline
                    ? 'opacity-100 translate-y-0 text-acm-cyan'
                    : 'opacity-0 translate-y-8 text-gray-600'
                }`}
              >
                <span className="text-gray-600 mr-2">&gt;&gt;</span> "{t}"
              </div>
            ))}
          </div>

          <div ref={visionRef} className={`mb-16 transition-all duration-1000 ${visionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>
            <h2 className="text-sm text-acm-cyan mb-4 font-mono uppercase tracking-widest">_Vision</h2>
            <div className="relative group bg-white/[0.03] border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-md hover:border-acm-cyan/30 transition-all duration-700 overflow-hidden">
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-acm-cyan/30 rounded-tl-sm" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-acm-cyan/30 rounded-br-sm" />
              <blockquote className="text-lg md:text-2xl font-light leading-relaxed text-white/90 italic">
                "{aboutData.vision}"
              </blockquote>
            </div>
          </div>

          <div ref={missionRef} className={`transition-all duration-1000 ${missionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>
            <h2 className="text-sm text-acm-cyan mb-8 font-mono uppercase tracking-widest">_Mission</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {(aboutData.mission || '').split('\n').filter(l => l.trim()).map((line, i) => {
                const cleanLine = line.replace(/^\d+\./, '').trim();
                const icons = ['💡', '🚀', '🏆', '🌐'];
                return (
                  <div key={i} className="group relative bg-white/[0.03] border border-white/10 rounded-xl p-6 h-full hover:border-acm-cyan/30 hover:bg-white/[0.05] transition-all duration-500 overflow-hidden">
                    <div className="absolute top-0 left-0 w-0 h-[2px] bg-gradient-to-r from-acm-cyan to-blue-500 group-hover:w-full transition-all duration-700" />
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-acm-cyan/10 border border-acm-cyan/20 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 group-hover:bg-acm-cyan/20 transition-all duration-500">
                        {icons[i] || '🎯'}
                      </div>
                      <div className="flex-1">
                        <span className="font-mono text-[9px] text-acm-cyan/50 tracking-[0.3em] block mb-2">M{i + 1}_DIRECTIVE</span>
                        <p className="text-gray-300 text-sm leading-relaxed group-hover:text-white/90 transition-colors duration-500">
                          {cleanLine}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <div ref={statsRef} className="grid grid-cols-3 gap-4 md:gap-10">
          {stats.map((stat, i) => (
            <div key={i} className="text-center group transition-transform duration-500 hover:-translate-y-2">
              <h3 className="text-3xl md:text-6xl font-heading font-bold text-acm-cyan relative">
                {counts[i]}+
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-acm-cyan group-hover:w-full transition-all duration-500" />
              </h3>
              <p className="text-[10px] md:text-xs tracking-[0.2em] md:tracking-[0.3em] text-gray-500 mt-2 md:mt-3">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Objectives Section */}
        <div ref={objRef} className={`transition-all duration-1000 ${objVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>
          <h2 className="text-sm text-acm-cyan mb-8 font-mono uppercase tracking-widest">_Objectives</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {OBJECTIVES.map((obj) => (
              <div key={obj.id} className="group relative bg-white/[0.02] border border-white/[0.06] rounded-lg p-5 hover:border-purple-400/30 hover:bg-white/[0.04] transition-all duration-500 overflow-hidden h-full">
                <div className="absolute left-0 top-0 w-[2px] h-0 bg-gradient-to-b from-purple-400 to-acm-cyan group-hover:h-full transition-all duration-700" />
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 text-xl group-hover:scale-125 transition-transform duration-500">
                    {obj.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs md:text-sm font-bold text-white/90 mb-1 group-hover:text-purple-300 transition-colors duration-500">
                      {obj.id}. {obj.title}
                    </h4>
                    <p className="text-[11px] md:text-xs text-gray-500 leading-relaxed group-hover:text-gray-400 transition-colors duration-500">
                      {obj.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legacy Logs */}
        <section>
          <h2 className="text-sm text-acm-cyan mb-8 font-mono uppercase tracking-widest">_History & Legacy</h2>
          <div className="border-l border-white/20 pl-5 md:pl-10 space-y-10 md:space-y-16">
            {(aboutData.legacyLogs || []).map((log, i) => (
              <div key={i}>
                <span className="text-2xl md:text-4xl font-heading font-bold opacity-30">{log.year}</span>
                <h3 className="text-lg md:text-2xl font-bold mt-2">{log.title}</h3>
                <p className="text-gray-400 mt-2 text-sm md:text-base">{log.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
'''

new_content = content[:start_idx] + new_component + '\n\n' + content[end_idx:]

with open(r'c:\Users\DARK SEID\ACM\src\App.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Replaced Successfully")
