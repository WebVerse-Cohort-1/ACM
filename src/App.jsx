const { useState, useEffect, useRef, useMemo, useCallback } = React;
const { HashRouter, Routes, Route, Link, useLocation } = ReactRouterDOM;

// --- UTILS ---
const useMousePosition = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    useEffect(() => {
        const updateMousePosition = ev => setMousePosition({ x: ev.clientX, y: ev.clientY });
        window.addEventListener('mousemove', updateMousePosition);
        return () => window.removeEventListener('mousemove', updateMousePosition);
    }, []);
    return mousePosition;
};

// --- CUSTOM CURSOR ---
const CustomCursor = () => {
    const { x, y } = useMousePosition();
    const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    if (isTouch) return null;
    return (
        <>
            <div
                className="fixed top-0 left-0 w-8 h-8 border border-acm-cyan rounded-full pointer-events-none z-[100] transition-transform duration-100 ease-out mix-blend-difference"
                style={{ transform: `translate(${x - 16}px, ${y - 16}px)` }}
            />
            <div
                className="fixed top-0 left-0 w-2 h-2 bg-acm-blue rounded-full pointer-events-none z-[100] transition-transform duration-75 ease-out"
                style={{ transform: `translate(${x - 4}px, ${y - 4}px)` }}
            />
        </>
    );
};

// --- MAGNETIC BUTTON ---
const MagneticButton = ({ children, className, onClick, as: Component = 'button', ...props }) => {
    const btnRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        const { clientX, clientY } = e;
        const { left, top, width, height } = btnRef.current.getBoundingClientRect();
        const x = (clientX - (left + width / 2)) * 0.3;
        const y = (clientY - (top + height / 2)) * 0.3;
        setPosition({ x, y });
    };

    const handleMouseLeave = () => setPosition({ x: 0, y: 0 });

    return (
        <Component
            ref={btnRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            className={`transition-transform duration-200 ease-out ${className}`}
            {...props}
        >
            {children}
        </Component>
    );
};

// --- TILT CARD WRAPPER ---
const TiltCard = ({ children, className = "" }) => {
    const cardRef = useRef(null);
    const [glow, setGlow] = useState("50% 50%");
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
        setGlow("50% 50%");
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

// --- THREE.JS NEURAL FLOW BACKGROUND ---
const NeuralFlow = () => {
    const mountRef = useRef(null);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    useEffect(() => {
        const mount = mountRef.current;
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x020202, 0.002);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 30;
        camera.position.y = 10;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !isMobile });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
        mount.appendChild(renderer.domElement);

        // --- WAVE PARTICLES ---
        const particleCount = isMobile ? 200 : 500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const scales = new Float32Array(particleCount);
        const randomness = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
            scales[i] = Math.random();
            randomness[i * 3] = Math.random();
            randomness[i * 3 + 1] = Math.random();
            randomness[i * 3 + 2] = Math.random();
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

        const material = new THREE.PointsMaterial({
            color: 0x4284d2,
            size: 0.4,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(geometry, material);
        scene.add(particles);

        // --- CONNECTING LINES (NEURAL NET) ---
        const lineGeo = new THREE.IcosahedronGeometry(15, 1);
        const lineMat = new THREE.MeshBasicMaterial({
            color: 0x00d2ef,
            wireframe: true,
            transparent: true,
            opacity: 0.05
        });
        const net = new THREE.Mesh(lineGeo, lineMat);
        scene.add(net);

        // --- INTERACTION ---
        const mouse = new THREE.Vector2();
        let targetX = 0, targetY = 0;

        const handleMouseMove = (e) => {
            mouse.x = (e.clientX - window.innerWidth / 2) * 0.05;
            mouse.y = (e.clientY - window.innerHeight / 2) * 0.05;
        };
        const handleTouchMove = (e) => {
            if (e.touches.length > 0) {
                mouse.x = (e.touches[0].clientX - window.innerWidth / 2) * 0.05;
                mouse.y = (e.touches[0].clientY - window.innerHeight / 2) * 0.05;
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);

        const clock = new THREE.Clock();
        const animate = () => {
            requestAnimationFrame(animate);
            const time = clock.getElapsedTime();

            // Camera Motion
            targetX = mouse.x * 0.5;
            targetY = mouse.y * 0.5;
            camera.position.x += (targetX - camera.position.x) * 0.05;
            camera.position.y += (-targetY + 10 - camera.position.y) * 0.05;
            camera.lookAt(scene.position);

            // Animate Particles
            const posArr = particles.geometry.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                const x = posArr[i * 3];
                posArr[i * 3 + 1] = Math.sin(time + x * 0.1 + randomness[i * 3] * 10) * 5 + (Math.cos(time * 0.5 + randomness[i * 3 + 1] * 10) * 2);
            }
            particles.geometry.attributes.position.needsUpdate = true;

            // Rotate Net
            net.rotation.y += 0.001;
            net.rotation.z += 0.0005;

            // Pulse Color
            const hue = (time * 0.1) % 1;
            material.color.setHSL(0.6 + hue * 0.1, 0.8, 0.5);

            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            if (mount) mount.removeChild(renderer.domElement);
        };
    }, []);

    return <div ref={mountRef} id="canvas-bg" className="fixed top-0 left-0 w-full h-full -z-10 bg-[#020202]" />;
};

// --- GLITCH TEXT COMPONENT ---
const GlitchText = ({ text, className }) => {
    return (
        <div className={`relative inline-block group ${className}`}>
            <span className="relative z-10">{text}</span>
            <span className="absolute top-0 left-0 -z-10 w-full h-full text-acm-blue opacity-0 group-hover:opacity-70 group-hover:translate-x-[2px] transition-all duration-100 animate-pulse">{text}</span>
            <span className="absolute top-0 left-0 -z-10 w-full h-full text-acm-cyan opacity-0 group-hover:opacity-70 group-hover:-translate-x-[2px] transition-all duration-100 delay-75 animate-pulse">{text}</span>
        </div>
    );
};


// --- NAVBAR (Mobile First Recreation) ---
const Navbar = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Prevent scroll when menu is open
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    }, [isOpen]);

    // SCROLL TO TOP ON ROUTE CHANGE
    useEffect(() => {
        window.scrollTo(0, 0);
        setIsOpen(false);
    }, [location.pathname]);

    const navItems = [
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
        { name: 'Gallery', path: '/gallery' },
        { name: 'Events', path: '/events' },
        { name: 'Team', path: '/team' },
        { name: 'Contact', path: '/contact' }
    ];

    return (
        <>
            <nav className={`fixed top-0 w-full px-6 md:px-12 flex justify-between items-center transition-all duration-300 z-[1001] ${scrolled || isOpen ? 'py-4 bg-[#020c1b]/95 backdrop-blur-md border-b border-white/10 shadow-lg' : 'py-8'}`}>
                <Link to="/" onClick={() => setIsOpen(false)} className="text-2xl font-heading font-bold tracking-widest text-white hover:text-acm-cyan transition-colors">
                    TSEC <span className="text-acm-cyan">ACM</span>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex gap-8">
                    {navItems.map((item) => (
                        <Link key={item.name} to={item.path} className={`text-xs uppercase tracking-[0.3em] transition-all hover:text-acm-cyan ${location.pathname === item.path ? 'text-acm-cyan font-bold' : 'text-gray-400'}`}>
                            {item.name}
                        </Link>
                    ))}
                </div>

                {/* Mobile Trigger */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    className="md:hidden text-white text-3xl z-[1002] focus:outline-none focus:text-acm-cyan transition-colors active:scale-95 touch-none"
                >
                    {isOpen ? '✕' : '☰'}
                </button>
            </nav>

            {/* Mobile Menu Overlay */}
            <div className={`fixed inset-0 bg-[#020c1b]/98 backdrop-blur-2xl flex flex-col items-center justify-center gap-8 md:hidden transition-all duration-500 z-[1000] ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
                {/* Decorative scanning line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-acm-cyan/30 animate-pulse"></div>

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
                                        <span className="absolute inset-0 bg-acm-cyan/5 rounded-full animate-pulse -z-10"></span>
                                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-acm-cyan rounded-full animate-ping"></div>
                                        <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-acm-cyan rounded-full animate-ping"></div>
                                    </>
                                )}
                                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-acm-cyan scale-x-0 group-hover:scale-x-100 transition-transform origin-center"></span>
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

// --- ROUTES ---

const Home = () => (
    <div className="min-h-screen flex flex-col justify-center px-6 md:px-20 pt-24 md:pt-20 pb-16">
        <div className="max-w-4xl">
            <div className="overflow-hidden mb-3">
                <p className="text-acm-cyan font-mono text-xs md:text-sm tracking-[0.2em] md:tracking-[0.3em]">
                    :: SYSTEM_READY
                </p>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-9xl font-heading font-bold leading-[0.9] md:leading-[0.85] mb-6 md:mb-8 mix-blend-screen">
                <GlitchText text="FUTURE" /><br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">READY</span><br />
                <span className="text-acm-blue">ENGINEERS</span>
            </h1>

            <p className="text-gray-400 text-base md:text-xl max-w-xl mb-8 md:mb-12 leading-relaxed border-l-2 border-acm-cyan/30 pl-4 md:pl-6">
                The Official ACM Student Chapter of TSEC.<br />
                We don't just write code; we architect experiences.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-6">
                <Link to="/events">
                    <MagneticButton as="div" className="px-6 md:px-8 py-3 md:py-4 bg-white text-black font-bold text-sm rounded-none hover:bg-acm-cyan transition-colors flex items-center justify-center gap-2 w-full sm:w-auto">
                        EXPLORE EVENTS
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                    </MagneticButton>
                </Link>
                <Link to="/contact">
                    <MagneticButton as="div" className="px-6 md:px-8 py-3 md:py-4 border border-white/20 text-white font-bold text-sm rounded-none hover:bg-white/10 backdrop-blur-md flex items-center justify-center w-full sm:w-auto">
                        JOIN NETWORK
                    </MagneticButton>
                </Link>
            </div>
        </div>

        {/* Scroll Indicator — hidden on small screens to avoid overflow */}
        <div className="hidden sm:flex absolute bottom-10 right-10 flex-col items-center gap-2 mix-blend-difference">
            <div className="w-[1px] h-20 bg-white/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-white animate-movedown"></div>
            </div>
            <span className="text-[10px] tracking-widest vertical-rl">SCROLL</span>
        </div>
    </div>
);

const Events = () => {
    const [events, setEvents] = useState([]);
    const location = useLocation();

    useEffect(() => {
        try {
            const data = JSON.parse(localStorage.getItem('acm_events') || '[]').map(ev => ({
                slug: ev.slug,
                title: ev.title,
                date: ev.date || 'TBA',
                tag: ev.category || 'EVENT',
                color: ev.color || 'from-acm-cyan/40 to-black',
                desc: ev.desc,
                image: Array.isArray(ev.images) ? ev.images[0] : ev.images
            }));
            setEvents(data);
        } catch (e) { setEvents([]); }
    }, [location.pathname]); // Reload when navigating

    return (
        <div className="min-h-screen pt-28 md:pt-32 px-4 md:px-20 max-w-8xl mx-auto pb-20">

            <h1 className="hidden md:block text-6xl md:text-9xl font-heading font-bold mb-16 opacity-5 fixed -z-10 top-20 right-0 pointer-events-none select-none">
                TIMELINE
            </h1>

            <div className="flex flex-col md:flex-row items-start md:items-baseline justify-between mb-8 md:mb-16 border-b border-white/10 pb-6 md:pb-8">
                <h2 className="text-3xl md:text-6xl font-heading font-bold text-white">
                    EVENT_<span className="text-acm-cyan">LOGS</span>
                </h2>
                <p className="text-gray-400 font-mono text-xs tracking-widest mt-2 md:mt-0">
                    :: UPCOMING_OPERATIONS
                </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
                {events.map((ev) => (
                    <Link key={ev.slug} to={`/events/${ev.slug}`} className="block w-full sm:w-[calc(50%-2rem)] lg:w-[calc(33.33%-3rem)]">
                        <TiltCard className="group aspect-video cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-white/2 hover:scale-110 hover:shadow-[0_0_80px_rgba(100,255,218,0.15)] transition-all duration-500 z-10 hover:z-20">
                            <div className="relative h-full w-full p-5 md:p-8 flex flex-col justify-between z-10 transition-all duration-500 group-hover:bg-acm-cyan/5">

                                {/* Date Badge */}
                                <div className="flex justify-between items-start">
                                    <span className="font-mono text-lg md:text-xl font-bold text-white border-b-2 border-acm-cyan pb-1">
                                        {ev.date}
                                    </span>
                                    <span className="font-mono text-[10px] font-semibold border border-white/20 px-2 py-1 rounded text-gray-400 tracking-wider">
                                        {ev.tag}
                                    </span>
                                </div>

                                {/* Central Glow */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none">
                                    <div className={`w-32 md:w-48 h-32 md:h-48 rounded-full bg-gradient-to-br ${ev.color} blur-[100px]`}></div>
                                </div>

                                {/* Content */}
                                <div className="z-20">
                                    <h3 className="text-xl md:text-2xl font-heading font-black text-white mb-1 uppercase tracking-tight">
                                        {ev.title}
                                    </h3>
                                    <p className="text-[10px] md:text-xs text-gray-400 font-mono mb-4 border-l border-acm-cyan/30 pl-3 line-clamp-2">
                                        {ev.desc}
                                    </p>
                                    <div className="text-[10px] font-bold text-acm-cyan uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform duration-300">
                                        UPLINK_PROTOCOL →
                                    </div>
                                </div>
                                
                                {ev.image && (
                                    <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <img src={ev.image} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </TiltCard>
                    </Link>
                ))}
            </div>
        </div>
    );
};

const About = () => {
    const [aboutData, setAboutData] = useState({
        mission: "We are the architects of the digital frontier. TSEC ACM is not just a club; it's an incubator for those who dare to disrupt the status quo.",
        stats: [
            { label: "MEMBERS", value: 500 },
            { label: "EVENTS", value: 30 },
            { label: "AWARDS", value: 10 },
        ],
        legacyLogs: [
            { year: "2025", title: "National Apex", desc: "Awarded Best Student Chapter nationwide." },
            { year: "2023", title: "Source Code", desc: "Launched open-source initiative with 500+ PRs." }
        ]
    });
    const location = useLocation();

    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem('acm_about'));
            if (stored) setAboutData(stored);
        } catch (e) {}
    }, [location.pathname]);

    const stats = aboutData.stats;
    const [counts, setCounts] = useState(stats.map(() => 0));
    const [hasAnimated, setHasAnimated] = useState(false);
    const statsRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) {
                    setHasAnimated(true);

                    stats.forEach((stat, index) => {
                        let start = 0;
                        const duration = 1500;
                        const increment = stat.value / (duration / 16);

                        const counter = setInterval(() => {
                            start += increment;

                            if (start >= stat.value) {
                                start = stat.value;
                                clearInterval(counter);
                            }

                            setCounts(prev => {
                                const updated = [...prev];
                                updated[index] = Math.floor(start);
                                return updated;
                            });
                        }, 16);
                    });
                }
            },
            { threshold: 0.4 }
        );

        if (statsRef.current) observer.observe(statsRef.current);

        return () => observer.disconnect();
    }, [hasAnimated]);
    const aboutRef = useRef(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            if (!aboutRef.current) return;

            const rect = aboutRef.current.getBoundingClientRect();
            const sectionHeight = aboutRef.current.offsetHeight;
            const visible = Math.min(
                Math.max((window.innerHeight - rect.top) / sectionHeight, 0),
                1
            );

            setProgress(visible);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div
            ref={aboutRef}
            className="min-h-screen pt-28 md:pt-32 px-5 md:px-20 flex flex-col md:flex-row gap-10 md:gap-20 pb-20"
        >
            {/* WHO WE ARE — Desktop sticky sidebar. On mobile, show as inline title */}
            <div className="md:hidden mb-10">
                <h2 className="text-6xl font-heading font-bold text-acm-cyan tracking-widest leading-tight">
                    WHO<br />WE ARE
                </h2>
            </div>

            <div className="hidden md:flex md:w-1/3 items-start justify-center relative">
                <div className="sticky top-32 space-y-6">
                    {["WHO", "WE", "ARE"].map((word, i) => {
                        const activateAt = (i + 1) / 4;
                        const isActive = progress >= activateAt;
                        return (
                            <div
                                key={i}
                                className={`text-8xl font-heading font-bold transition-all duration-700 ${
                                    isActive ? "text-acm-cyan scale-110" : "text-white/30 scale-100"
                                }`}
                            >
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
                    <h2 className="text-lg md:text-2xl text-acm-cyan font-mono mb-4 md:mb-6">
                        :: MISSION_STATEMENT
                    </h2>
                    <p className="text-xl md:text-4xl font-light leading-snug">
                        {aboutData.mission.split(' ').map((word, i) => (
                            <span key={i} className={['architects', 'disrupt'].includes(word.toLowerCase().replace(/[^a-z]/gi, '')) ? "text-white font-bold" : ""}>
                                {word}{' '}
                            </span>
                        ))}
                    </p>
                </section>

                <div ref={statsRef} className="grid grid-cols-3 gap-4 md:gap-10">
                    {stats.map((stat, i) => (
                        <div key={i} className="text-center group transition-transform duration-500 hover:-translate-y-2">
                            <h3 className="text-3xl md:text-6xl font-heading font-bold text-acm-cyan relative">
                                {counts[i]}+
                                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-acm-cyan group-hover:w-full transition-all duration-500"></span>
                            </h3>
                            <p className="text-[10px] md:text-xs tracking-[0.2em] md:tracking-[0.3em] text-gray-500 mt-2 md:mt-3">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>

                <section>
                    <h2 className="text-lg md:text-2xl text-acm-blue font-mono mb-4 md:mb-6">
                        :: LEGACY_LOGS
                    </h2>
                    <div className="border-l border-white/20 pl-5 md:pl-10 space-y-10 md:space-y-16">
                        {aboutData.legacyLogs?.map((log, i) => (
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

const Team = () => {
    const [teamData, setTeamData] = useState({});
    const location = useLocation();

    useEffect(() => {
        try {
            setTeamData(JSON.parse(localStorage.getItem('acm_team') || '{}'));
        } catch (e) { setTeamData({}); }
    }, [location.pathname]);

    return (
        <div className="min-h-screen pt-28 md:pt-32 px-4 md:px-20 max-w-7xl mx-auto pb-20">
            <h1 className="hidden md:block text-6xl md:text-9xl font-heading font-bold mb-16 opacity-5 fixed -z-10 top-20 right-0 pointer-events-none select-none">
                COMMAND
            </h1>

            <div className="flex flex-col md:flex-row items-start md:items-baseline justify-between mb-8 md:mb-10 border-b border-white/10 pb-6 md:pb-8">
                <h2 className="text-3xl md:text-6xl font-heading font-bold text-white">
                    PROTOCOL_<span className="text-acm-cyan">LEADERS</span>
                </h2>
                <p className="text-gray-400 font-mono text-[10px] md:text-xs tracking-widest mt-2 md:mt-0 uppercase">:: Core committee & vertical heads</p>
            </div>

            {Object.entries(teamData).map(([category, members]) => (
                <div key={category} className="mb-14 md:mb-24">
                    <h3 className="text-base md:text-2xl font-mono text-acm-cyan/80 mb-6 md:mb-12 tracking-[.2em] md:tracking-[.3em] flex items-center gap-3 overflow-hidden">
                        <span className="w-6 md:w-8 h-px bg-acm-cyan/40 flex-shrink-0"></span>
                        <span className="truncate">{category}</span>
                        <span className="hidden md:inline text-[10px] opacity-30 flex-shrink-0">({members.length}_NODES)</span>
                    </h3>

                    <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                        {members.map((m, i) => (
                            <div key={i} className="w-[calc(50%-1rem)] md:w-[calc(33.33%-2rem)] lg:w-[calc(25%-2rem)] xl:w-[calc(20%-2rem)]">
                                <TeamPersonaCard member={m} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- PREMIUM TEAM CARD (Persona Style) ---
const TeamPersonaCard = ({ member }) => {
    return (
        <div className="group relative aspect-[3/4] bg-transparent rounded-xl md:rounded-2xl border border-white/5 hover:border-acm-cyan/60 hover:scale-110 hover:shadow-[0_0_60px_rgba(100,255,218,0.1)] transition-all duration-500 overflow-hidden select-none touch-manipulation z-10 hover:z-20">
            {/* LinkedIn Icon */}
            <a
                href={member.linkedin || "#"}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-3 right-3 md:top-6 md:right-6 z-30 w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg hover:bg-[#0077b5] hover:text-white text-gray-400 transition-all flex-shrink-0"
            >
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
            </a>

            <div className="relative h-full w-full p-4 md:p-8 flex flex-col z-10 transition-transform duration-500 md:group-hover:-translate-y-1">
                {/* Name */}
                <h3 className="text-sm md:text-xl font-['Playfair_Display'] font-bold text-white mb-0.5 md:mb-1 md:group-hover:text-acm-cyan transition-colors leading-tight pr-8 md:pr-10 line-clamp-2" title={member.name}>
                    {member.name}
                </h3>

                {/* Role */}
                <p className="text-acm-cyan font-semibold text-[10px] md:text-sm mb-2 md:mb-3 tracking-wide font-sans">
                    {member.role} {member.section && <span className="text-[8px] opacity-40 ml-1">[{member.section}]</span>}
                </p>

                {/* Description — hidden on very small screens to avoid clutter */}
                <p className="hidden sm:block text-gray-300 text-[10px] md:text-xs leading-relaxed font-sans opacity-80 md:group-hover:opacity-100 transition-opacity line-clamp-3">
                    {member.desc}
                </p>

                {/* Persona Image - EMPTY BACKGROUND REQUESTED */}
                <div className="mt-auto relative w-full h-32 md:h-56 flex justify-center items-end">
                    <img
                        src={member.image}
                        alt={member.name}
                        className="relative z-10 w-full h-full object-contain object-bottom grayscale md:group-hover:grayscale-0 transition-all duration-700"
                    />
                </div>
            </div>

            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full md:group-hover:translate-x-full transition-transform duration-1000"></div>
        </div>
    );
};








// --- FUSION GALLERY (Original 3D Neural Archive Version) ---
const FusionGallery = () => {
    const [scrollProgress, setScrollProgress] = useState(0);
    const [activeIndex, setActiveIndex] = useState(-1);
    
    const [items, setItems] = useState([]);
    const location = useLocation();

    useEffect(() => {
        try {
            const storedEvents = JSON.parse(localStorage.getItem('acm_events') || '[]');
            const storedGallery = JSON.parse(localStorage.getItem('acm_gallery') || '[]');
            
            // Map events
            const eventItems = storedEvents.map((event, i) => ({
                ...event,
                id: i,
                type: 'EVENT',
                z: i * 1500 + 800,
                x: (Math.random() - 0.5) * (window.innerWidth < 768 ? 20 : 140),
                y: (Math.random() - 0.5) * (window.innerWidth < 768 ? 80 : 90),
                rotation: (Math.random() - 0.5) * 40,
                slides: (Array.isArray(event.images) && event.images.length > 0) ? [] : [
                    `from-blue-900/40 to-cyan-900/40`,
                    `from-purple-900/40 to-pink-900/40`,
                    `from-emerald-900/40 to-teal-900/40`
                ]
            }));

            // Map standalone gallery items
            const galleryItems = storedGallery.map((img, i) => ({
                title: img.caption || 'GALLERY_ITEM',
                desc: 'COMMUNITY_CAPTURE',
                category: img.eventSlug ? `REL: ${img.eventSlug}` : 'STANDALONE',
                images: [img.src],
                slug: img.eventSlug || '',
                id: eventItems.length + i,
                type: 'PHOTO',
                z: (eventItems.length + i) * 1500 + 800,
                x: (Math.random() - 0.5) * (window.innerWidth < 768 ? 20 : 140),
                y: (Math.random() - 0.5) * (window.innerWidth < 768 ? 80 : 90),
                rotation: (Math.random() - 0.5) * 40,
            }));

            setItems([...eventItems, ...galleryItems]);
        } catch (e) { setItems([]); }
    }, [location.pathname]);

    // Scroll Logic with Hard Limit
    useEffect(() => {
        if (items.length === 0) return;
        const scrollFactor = 2.5;
        const lastZ = items[items.length - 1]?.z || 0;
        // The real page-scroll position at which last event is focused
        const scrollCap = lastZ / scrollFactor;

        const handleScroll = () => {
            const raw = window.scrollY;
            if (raw > scrollCap) {
                // Snap back to cap — user cannot scroll further
                window.scrollTo({ top: scrollCap, behavior: 'instant' });
                setScrollProgress(lastZ);
            } else {
                setScrollProgress(raw * scrollFactor);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: false });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [items]);

    // Active Item Detection
    useEffect(() => {
        let closest = -1;
        let minDist = 500;

        items.forEach((item, index) => {
            const dist = Math.abs(item.z - scrollProgress);
            if (dist < minDist) {
                minDist = dist;
                closest = index;
            }
        });
        setActiveIndex(closest);
    }, [scrollProgress, items]);

    const scrollFactor = 2.5;
    // Spacer height = exactly the scroll position of the last event
    const maxZ = items.length > 0 ? (items[items.length - 1].z / scrollFactor) + window.innerHeight : 2000;

    return (
        <div className="min-h-screen bg-transparent transition-colors duration-1000 relative">
            
            {/* Scroll Spacer */}
            <div style={{ height: `${maxZ}px` }} className="absolute top-0 left-0 w-px -z-50 pointer-events-none"></div>

            {/* HUD - Fades out on scroll to prevent overlap */}
            <div 
                className="fixed top-24 left-1/2 -translate-x-1/2 z-50 text-center mix-blend-exclusion pointer-events-none w-full transition-opacity duration-300"
                style={{ opacity: Math.max(0, 1 - scrollProgress / 400), transform: `translate(-50%, -${scrollProgress * 0.2}px)` }}
            >
                <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-2 tracking-tighter">
                    NEURAL_<span className="text-acm-cyan">ARCHIVE</span>
                </h1>
                <div className="flex justify-center space-x-4 text-[10px] md:text-xs font-mono text-acm-cyan/80">
                     <span>:: SCROLL_NAV: {activeIndex !== -1 ? 'LOCKED' : 'DRIFTING'}</span>
                     <span>:: DEPTH: {Math.round(scrollProgress)}</span>
                </div>
            </div>

            {/* Viewport */}
            <div className="fixed top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center perspective-[1000px] pointer-events-none">
                <div className="relative w-full h-full preserve-3d pointer-events-auto">
                    {items.map((item, index) => (
                        <FusionCard 
                            key={item.id} 
                            item={item} 
                            isActive={index === activeIndex} 
                            rawZ={-item.z + scrollProgress - 500}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const FusionCard = ({ item, isActive, rawZ }) => {
    const navigate = ReactRouterDOM.useNavigate();
    const [slide, setSlide] = useState(0);

    useEffect(() => {
        if (!isActive) return;
        const interval = setInterval(() => {
            const count = item.images?.length || item.slides?.length || 0;
            if (count > 0) setSlide(s => (s + 1) % count);
        }, 3000);
        return () => clearInterval(interval);
    }, [isActive, item]);

    const nextSlide = (e) => {
        e.stopPropagation();
        const count = item.images?.length || item.slides?.length || 0;
        setSlide(s => (s + 1) % count);
    }
    const prevSlide = (e) => {
        e.stopPropagation();
        const count = item.images?.length || item.slides?.length || 0;
        setSlide(s => (s - 1 + count) % count);
    }

    // --- Interaction Physics ---
    const transformStyle = isActive
        ? {
            // SNAP TO CENTER
            transform: `translate3d(-50%, -50%, 0px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
            opacity: 1,
            zIndex: 100,
            filter: 'blur(0px)'
        }
        : {
            // BACKGROUND DRIFT
            transform: `translate3d(calc(-50% + ${item.x}vw), calc(-50% + ${item.y}vh), ${rawZ}px) rotateZ(${item.rotation}deg) scale3d(0.8, 0.8, 0.8)`,
            opacity: rawZ > 0 ? 0 : Math.max(0, 1 - Math.abs(rawZ) / 3000), // Fade off in distance
            zIndex: Math.round(-rawZ),
            filter: `blur(${Math.min(10, Math.abs(rawZ)/200)}px) grayscale(${Math.min(100, Math.abs(rawZ)/30)}%)`
        };

    const handleCardClick = () => {
        if (!isActive) return;
        if (item.type === 'PHOTO') {
            const src = item.images?.[0];
            if (src) window.open(src, '_blank');
        } else {
            navigate(`/events/${item.slug || 'codesprint-26'}`);
        }
    }

    return (
        <div 
            className="absolute top-1/2 left-1/2 transition-all ease-out cursor-pointer group"
            style={{ 
                ...transformStyle,
                transitionDuration: isActive ? '800ms' : '0ms', 
                width: '90vw', 
                maxWidth: '900px',
                aspectRatio: window.innerWidth < 640 ? '1 / 1.1' : '16 / 9' 
            }}
            onClick={handleCardClick}
        >
            <div className={`w-full h-full relative rounded-2xl overflow-hidden border transition-all duration-700 ${isActive ? 'border-acm-cyan/50 shadow-[0_0_80px_rgba(100,255,218,0.2)] bg-[#020202]/92 backdrop-blur-2xl' : 'border-white/10 bg-white/5'}`}>
                
                {/* Image / Carousel Layer */}
                <div className="absolute inset-0 z-0">
                    {item.images && item.images.length > 0 ? (
                        <>
                            {item.images.map((img, i) => (
                                <img 
                                    key={i} 
                                    src={img} 
                                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === slide ? 'opacity-100' : 'opacity-0'}`}
                                    alt="Event"
                                />
                            ))}
                        </>
                    ) : (
                        item.slides.map((gradient, i) => (
                            <div 
                                key={i} 
                                className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-opacity duration-1000 ${i === slide ? 'opacity-100' : 'opacity-0'}`} 
                            />
                        ))
                    )}
                 </div>

                {/* Interaction Buttons - Only if active */}
                {isActive && (item.images?.length > 1 || (!item.images && item.slides.length > 1)) && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 z-20 pointer-events-none">
                        <button onClick={prevSlide} className="w-12 h-12 rounded-full bg-black/50 border border-white/10 text-white pointer-events-auto hover:bg-acm-cyan hover:text-black transition-all">←</button>
                        <button onClick={nextSlide} className="w-12 h-12 rounded-full bg-black/50 border border-white/10 text-white pointer-events-auto hover:bg-acm-cyan hover:text-black transition-all">→</button>
                    </div>
                )}

                {/* Content Overlay */}
                <div className="absolute bottom-0 w-full p-6 md:p-12 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10 flex justify-between items-end">
                    <div className="max-w-[70%] text-left">
                        <span className={`text-[10px] font-mono tracking-[0.3em] block mb-2 transition-colors ${isActive ? 'text-acm-cyan' : 'text-white/40'}`}>
                            {item.category || "CLASSIFIED"}
                        </span>
                        <h2 className="text-2xl md:text-5xl font-heading font-bold text-white mb-2 leading-tight uppercase">
                            {item.title}
                        </h2>
                        <p className={`text-xs md:text-sm transition-all duration-700 ${isActive ? 'text-gray-300 opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            {item.desc}
                        </p>
                    </div>
                     <div className={`font-mono text-3xl md:text-5xl font-bold text-white/5 ${isActive ? 'text-acm-cyan/20 scale-100' : 'scale-50'} transition-all duration-500`}>
                        {(item.id + 1).toString().padStart(2, '0')}
                    </div>
                </div>

            </div>
        </div>
    );
};




// --- UPDATED CONTACT (Advanced Holographic Terminal) ---
const Contact = () => (
    <div className="min-h-screen flex items-center justify-center p-3 md:p-8 pt-20 md:pt-8 relative overflow-hidden bg-black">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,136,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,136,0.02)_1px,transparent_1px)] bg-[size:30px_30px] md:bg-[size:50px_50px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[size:100%_2px,3px_100%] pointer-events-none z-0"></div>

        <div className="w-full max-w-5xl relative z-10 mt-16 md:mt-0">
            <TiltCard className="bg-black/95 md:bg-black/90 md:border md:border-acm-cyan/30 backdrop-blur-2xl rounded-2xl md:rounded-xl shadow-[0_0_100px_rgba(0,255,136,0.1)] overflow-hidden relative group p-0 border border-white/5">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-acm-cyan to-transparent opacity-40"></div>

                {/* Mobile Terminal Header */}
                <div className="md:hidden flex justify-between items-center p-4 border-b border-white/10 bg-white/5 font-mono text-[10px] tracking-widest text-acm-cyan">
                    <span>:: SESSION_TERMINAL_v4.2</span>
                    <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-acm-cyan rounded-full animate-ping"></span>
                        UPLINK_LIVE
                    </span>
                </div>

                <div className="flex flex-col md:flex-row">

                    {/* Left: Interactive Data Panel */}
                    <div className="w-full md:w-5/12 p-6 md:p-12 border-b md:border-b-0 md:border-r border-white/10 bg-white/2 relative overflow-hidden flex flex-col">
                        {/* Tactical Background element */}
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-acm-cyan/5 rounded-full blur-3xl md:hidden"></div>

                        <div className="relative z-10">
                            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-2 uppercase tracking-tighter">
                                UPLINK
                            </h1>
                            <p className="text-acm-cyan/60 font-mono text-[10px] md:text-xs mb-6 flex flex-col gap-1">
                                <span className="flex items-center gap-2">
                                    <span className="opacity-50">{" >> "}</span> SECURE_CHANNEL_READY
                                </span>
                                <span className="text-[9px] opacity-40 uppercase tracking-widest leading-relaxed">
                                    Let’s talk ideas, events & collabs.<br />
                                    Reach the TSEC ACM team here.
                                </span>
                            </p>

                            <div className="space-y-3 md:space-y-4 font-mono text-sm relative z-10 mb-6">
                                <div className="group cursor-pointer">
                                    <label className="text-[10px] text-gray-500 block mb-1.5 ml-1"># TARGET_HQ</label>
                                    <div className="p-3 bg-black/60 border border-white/5 rounded-lg group-hover:border-acm-cyan/40 transition-all flex flex-col gap-1 text-gray-400 group-hover:text-white group-hover:bg-acm-cyan/5">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-acm-cyan text-lg">⊕</span>
                                            <span className="text-xs">Thakur Complex, Kandivali (E), Mumbai</span>
                                        </div>
                                        <div className="ml-8 text-[9px] text-gray-500 italic">
                                            TSEC • 1st Floor • CO Staffroom
                                        </div>
                                        <div className="ml-8 text-[10px] font-mono text-acm-cyan/40 group-hover:text-acm-cyan/80 transition-colors">
                                            LAT: 19.213683 | LON: 72.864668
                                        </div>
                                    </div>
                                </div>

                                <div className="group cursor-pointer">
                                    <label className="text-[10px] text-gray-500 block mb-1.5 ml-1"># EMAIL</label>
                                    <div className="p-3 bg-black/60 border border-white/5 rounded-lg group-hover:border-acm-cyan/40 transition-all flex items-center space-x-3 text-gray-400 group-hover:text-white group-hover:bg-acm-cyan/5">
                                        <span className="text-acm-cyan text-lg">@</span>
                                        <span className="text-xs uppercase">ACMCO@TSECMUMBAI.IN</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tactical Mini Map Section */}
                        <div className="relative group/map md:mt-auto">
                            <label className="text-[10px] text-gray-500 block mb-2 font-mono uppercase tracking-widest px-2 flex justify-between">
                                <span>[ SCANNING_COORDINATES ]</span>
                                <span className="text-acm-cyan animate-pulse">HQ_LOCKED</span>
                            </label>
                            <div className="w-full h-40 md:h-56 rounded-lg overflow-hidden border border-white/10 relative grayscale brightness-75 contrast-125 group-hover/map:grayscale-0 group-hover/map:brightness-100 transition-all duration-700">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3767.8927005470253!2d72.86247937466826!3d19.213038647312154!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7b0e5faf7047b%3A0x696803713d2f2b3b!2sThakur%20Shyamnarayan%20Engineering%20College!5e0!3m2!1sen!2sin!4v1716900000000"
                                    className="w-full h-full border-0 invert-[.9] hue-rotate-[160deg]"
                                    allowFullScreen=""
                                    loading="lazy"
                                ></iframe>
                                <div className="absolute inset-0 bg-acm-cyan/5 pointer-events-none group-hover/map:opacity-0 transition-opacity"></div>
                            </div>
                        </div>

                        <div className="mt-6 text-[10px] font-mono text-gray-500 space-y-2 border-t border-white/5 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block text-[8px] opacity-50 mb-1">AVAILABILITY</span>
                                    <p className="text-white/80">Mon – Fri (10AM-5PM)</p>
                                    <p className="text-acm-cyan text-[8px]">Sat: Event Schedule Only</p>
                                </div>
                                <div>
                                    <span className="block text-[8px] opacity-50 mb-1">REACH_US_FOR</span>
                                    <ul className="text-[9px] text-white/60 space-y-0.5 list-['>'] list-inside">
                                        <li>Partnerships</li>
                                        <li>Hackathons</li>
                                        <li>Bootcamps</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Input Terminal */}
                    <div className="w-full md:w-7/12 p-6 md:p-12 bg-black/40 md:bg-black/20 relative">
                        {/* Terminal Corner Brackets */}
                        <div className="absolute top-0 right-0 p-2 opacity-20 pointer-events-none">[ ]</div>
                        <div className="absolute bottom-0 left-0 p-2 opacity-20 pointer-events-none">[_]</div>

                        <form className="space-y-8 md:space-y-6" onSubmit={e => {
                            e.preventDefault();
                            const userId = e.target[0].value;
                            const email = e.target[1].value;
                            const message = e.target[2].value;

                            // ADMIN HANDSHAKE — dynamic match via localStorage or fallback
                            const creds = JSON.parse(localStorage.getItem('acm_admin_creds') || '{"userId":"admin","email":"acmco@tsecmumbai.in","pass":"ACM_SECURE_2026"}');
                            if (userId.toLowerCase() === creds.userId.toLowerCase() && email.toLowerCase() === creds.email.toLowerCase() && message === creds.pass) {
                                // Create a signed token with expiry timestamp (4 hours)
                                const token = { value: 'acm_verified_' + Date.now(), expires: Date.now() + (4 * 60 * 60 * 1000) };
                                sessionStorage.setItem('acm_admin_token', JSON.stringify(token));
                                // Also clear any old localStorage session to avoid stale bypasses
                                localStorage.removeItem('acm_admin_session');
                                window.location.hash = '#/management';
                                return;
                            }

                            // Save message to localStorage for persistence
                            const existingMessages = JSON.parse(localStorage.getItem('acm_messages') || '[]');
                            const newMessage = {
                                id: Date.now(),
                                user: userId,
                                email: email,
                                content: message,
                                timestamp: new Date().toLocaleString()
                            };
                            localStorage.setItem('acm_messages', JSON.stringify([newMessage, ...existingMessages]));

                            alert('HANDSHAKE_SENT :: SIGNAL_STRENGTH_GOOD');
                            e.target.reset();
                        }}>
                            <div className="group relative">
                                <input type="text" required className="w-full bg-transparent border-b border-white/10 py-3 text-white focus:border-acm-cyan outline-none transition-all peer pt-6 font-mono text-sm" placeholder=" " />
                                <label className="absolute left-0 top-6 text-gray-500 text-xs peer-focus:text-acm-cyan peer-focus:-translate-y-6 peer-[:not(:placeholder-shown)]:-translate-y-6 transition-all font-mono uppercase tracking-widest">
                                    // USER_ID
                                </label>
                                <div className="absolute bottom-0 left-0 h-0.5 bg-acm-cyan w-0 peer-focus:w-full transition-all duration-300"></div>
                            </div>

                            <div className="group relative">
                                <input type="email" required className="w-full bg-transparent border-b border-white/10 py-3 text-white focus:border-acm-cyan outline-none transition-all peer pt-6 font-mono text-sm" placeholder=" " />
                                <label className="absolute left-0 top-6 text-gray-500 text-xs peer-focus:text-acm-cyan peer-focus:-translate-y-6 peer-[:not(:placeholder-shown)]:-translate-y-6 transition-all font-mono uppercase tracking-widest">
                                    // EMAIL
                                </label>
                                <div className="absolute bottom-0 left-0 h-0.5 bg-acm-cyan w-0 peer-focus:w-full transition-all duration-300"></div>
                            </div>

                            <div className="group relative">
                                <textarea rows="3" required className="w-full bg-transparent border-b border-white/10 py-3 text-white focus:border-acm-cyan outline-none transition-all peer pt-6 resize-none font-mono text-sm leading-relaxed" placeholder=" "></textarea>
                                <label className="absolute left-0 top-6 text-gray-500 text-xs peer-focus:text-acm-cyan peer-focus:-translate-y-6 peer-[:not(:placeholder-shown)]:-translate-y-6 transition-all font-mono uppercase tracking-widest">
                                    // MESSAGE
                                </label>
                                <div className="absolute bottom-0 left-0 h-0.5 bg-acm-cyan w-0 peer-focus:w-full transition-all duration-300"></div>
                            </div>

                            <div className="pt-6">
                                <MagneticButton type="submit" className="w-full py-6 md:py-5 bg-acm-cyan/10 border border-acm-cyan/30 text-acm-cyan font-bold tracking-[0.3em] hover:bg-acm-cyan hover:text-black transition-all duration-500 group relative overflow-hidden rounded-lg">
                                    <span className="relative z-10 text-xs md:text-sm">INITIATE_HANDSHAKE</span>
                                    <div className="absolute inset-0 bg-acm-cyan transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 origin-bottom"></div>
                                </MagneticButton>
                                <p className="text-[8px] font-mono text-gray-600 mt-4 text-center md:text-left opacity-40">
                                    CONFIRMING_ACTION_WILL_SEND_ENCRYPTED_SIGNAL...
                                </p>
                            </div>
                        </form>
                    </div>

                </div>
            </TiltCard>
        </div>
    </div>
);
// --- EVENT DETAIL PAGE ---
const EventDetail = () => {
    const { slug } = ReactRouterDOM.useParams();
    
    const event = useMemo(() => {
        try {
            const stored = JSON.parse(localStorage.getItem('acm_events') || '[]');
            const found = stored.find(e => e.slug === slug);
            if (found) return found;
        } catch (e) { return null; }
        return null;
    }, [slug]);

    const [prize, setPrize] = useState(0);
    const [timeLeft, setTimeLeft] = useState({});
    const [activeFAQ, setActiveFAQ] = useState(null);
    const [showRegister, setShowRegister] = useState(false);

    // Prize Animation
    useEffect(() => {
        if (!event?.prizePool) return;
        let start = 0;
        const duration = 1500;
        const increment = event.prizePool / (duration / 16);
        const counter = setInterval(() => {
            start += increment;
            if (start >= event.prizePool) {
                start = event.prizePool;
                clearInterval(counter);
            }
            setPrize(Math.floor(start));
        }, 16);
        return () => clearInterval(counter);
    }, [event]);

    // Countdown
    useEffect(() => {
        if (!event?.eventDate) return;
        const interval = setInterval(() => {
            const difference = new Date(event.eventDate) - new Date();
            if (difference <= 0) {
                setTimeLeft({});
                clearInterval(interval);
                return;
            }
            setTimeLeft({
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / (1000 * 60)) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [event]);

    if (!event) return <div className="min-h-screen flex items-center justify-center text-white text-3xl">Event Not Found</div>;

    return (
        <div className="min-h-screen pt-28 md:pt-32 px-4 md:px-20 text-white max-w-6xl mx-auto pb-20 md:pb-32">
            
            <div className="flex flex-col md:flex-row justify-between items-start gap-10">
                <div className="flex-1">
                    <h1 className="text-3xl sm:text-5xl md:text-7xl font-heading font-bold mb-3 md:mb-4">{event.title}</h1>
                    <p className="text-acm-cyan font-mono text-xs md:text-base mb-5 md:mb-8">{event.dateText}</p>
                    <p className="text-gray-300 text-sm md:text-lg mb-8 md:mb-12 max-w-3xl leading-relaxed">{event.description}</p>
                    
                    <h2 className="text-xl md:text-3xl font-bold mb-3 md:mb-6">🏆 Prize Pool</h2>
                    <div className="text-4xl md:text-6xl font-heading font-bold text-acm-cyan mb-10 md:mb-16">₹ {prize.toLocaleString()}</div>
                </div>

                <div className="w-full md:w-80 sticky top-32 space-y-4">
                    <Link to={`/events/${slug}/register`}>
                        <MagneticButton as="div" className="w-full py-5 bg-white text-black font-bold tracking-widest hover:bg-acm-cyan transition-colors shadow-[0_0_30px_rgba(255,255,255,0.1)] text-center">
                            REGISTER_NOW
                        </MagneticButton>
                    </Link>
                    <div className="p-4 border border-white/10 bg-white/5 rounded-xl text-[10px] font-mono text-gray-500 uppercase leading-loose">
                        :: Status: Registration Open<br/>
                        :: Verified: TSEC Chapters<br/>
                        :: Entry Code: ACM_ENCRYPT_26
                    </div>
                </div>
            </div>

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

            {/* === EVENT IMAGE GALLERY === */}
            {(() => {
                const storedEvents = JSON.parse(localStorage.getItem('acm_events') || '[]');
                const storedGallery = JSON.parse(localStorage.getItem('acm_gallery') || '[]');
                const thisEvent = storedEvents.find(e => e.slug === slug);
                const eventImages = [
                    ...(thisEvent?.images || []),
                    ...storedGallery.filter(g => g.eventSlug === slug).map(g => g.src)
                ].filter(Boolean);
                if (eventImages.length === 0) return null;
                return (
                    <div className="mb-12 md:mb-20">
                        <h2 className="text-xl md:text-3xl font-bold mb-4 md:mb-8">📸 Event Gallery</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                            {eventImages.map((src, i) => (
                                <div key={i} className="aspect-video overflow-hidden rounded-xl border border-white/10 group cursor-pointer"
                                    onClick={() => window.open(src, '_blank')}>
                                    <img src={src} alt={`Gallery ${i+1}`}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}

            <h2 className="text-xl md:text-3xl font-bold mb-4 md:mb-8">Tracks</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6 mb-12 md:mb-20">
                {event.tracks?.map((track, i) => (
                    <div key={i} className="p-4 md:p-6 bg-white/5 border border-white/10 rounded-xl text-sm md:text-base">{track}</div>
                ))}
            </div>

            {event.speakers?.length > 0 && (
                <>
                    <h2 className="text-xl md:text-3xl font-bold mb-6 md:mb-10">Speakers</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 mb-12 md:mb-20">
                        {event.speakers.map((speaker, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 text-center">
                                <img src={speaker.image} alt={speaker.name} className="w-16 h-16 md:w-28 md:h-28 mx-auto rounded-full object-cover mb-3 md:mb-4" />
                                <h3 className="text-sm md:text-xl font-bold">{speaker.name}</h3>
                                <p className="text-acm-cyan text-xs md:text-sm mt-1 md:mt-2">{speaker.role}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <h2 className="text-xl md:text-3xl font-bold mb-4 md:mb-8">FAQs</h2>
            <div className="space-y-3 md:space-y-6">
                {event.faqs?.map((faq, i) => (
                    <div key={i} className="border border-white/10 rounded-xl overflow-hidden">
                        <button onClick={() => setActiveFAQ(activeFAQ === i ? null : i)} className="w-full text-left p-4 md:p-6 bg-white/5 text-sm md:text-base">{faq.question}</button>
                        {activeFAQ === i && <div className="p-4 md:p-6 bg-black/40 text-gray-300 text-sm">{faq.answer}</div>}
                    </div>
                ))}
            </div>

        </div>
    );
};


// --- CUSTOM EVENT REGISTRATION PAGE ---
const EventRegister = () => {
    const { slug } = ReactRouterDOM.useParams();
    const navigate = ReactRouterDOM.useNavigate();
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '', team: '', year: '', branch: '', college: 'TSEC', message: '' });

    const event = useMemo(() => {
        const staticTitle = eventData[slug]?.title || null;
        if (staticTitle) return { title: staticTitle, slug };
        const stored = JSON.parse(localStorage.getItem('acm_events') || '[]');
        const found = stored.find(e => e.slug === slug);
        return found ? { title: found.title, slug } : null;
    }, [slug]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = {
            id: Date.now(),
            event: event?.title || slug,
            eventSlug: slug,
            ...form,
            timestamp: new Date().toLocaleString()
        };
        const existing = JSON.parse(localStorage.getItem('acm_registrations') || '[]');
        localStorage.setItem('acm_registrations', JSON.stringify([data, ...existing]));
        setSubmitted(true);
    };

    const inputClass = "w-full bg-white/5 border border-white/10 p-3.5 text-white rounded-lg focus:border-acm-cyan outline-none transition-all placeholder:text-gray-600 text-sm";
    const labelClass = "block text-[10px] text-acm-cyan/70 font-mono uppercase tracking-[0.2em] mb-1.5";

    if (!event) return (
        <div className="min-h-screen flex items-center justify-center text-white">
            <div className="text-center">
                <p className="text-acm-cyan font-mono mb-4">EVENT_NOT_FOUND</p>
                <button onClick={() => navigate('/events')} className="border border-white/20 px-6 py-3 text-sm hover:bg-white/5">← Back to Events</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 md:px-20 text-white">
            <div className="max-w-2xl mx-auto">

                {/* Header */}
                <div className="mb-10">
                    <button onClick={() => navigate(`/events/${slug}`)} className="text-[10px] font-mono text-gray-500 hover:text-acm-cyan mb-6 flex items-center gap-2 transition-colors">
                        ← BACK_TO_EVENT
                    </button>
                    <div className="border-l-4 border-acm-cyan pl-6 mb-8">
                        <p className="text-acm-cyan font-mono text-[10px] tracking-[0.3em] mb-1">// EVENT_REGISTRATION</p>
                        <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-tighter">{event.title}</h1>
                    </div>
                </div>

                {submitted ? (
                    <div className="text-center py-20 border border-acm-cyan/20 rounded-2xl bg-acm-cyan/5">
                        <div className="text-6xl mb-6">✓</div>
                        <h2 className="text-3xl font-heading font-bold text-acm-cyan mb-4 uppercase tracking-tighter">Registration_Logged</h2>
                        <p className="text-gray-400 text-sm mb-2">Your entry has been recorded in the system.</p>
                        <p className="text-gray-600 font-mono text-[10px] mb-10">:: Confirmation will be sent to {form.email}</p>
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => navigate(`/events/${slug}`)} className="border border-white/20 px-6 py-3 text-sm hover:bg-white/5 transition-all">← Event Page</button>
                            <button onClick={() => navigate('/events')} className="bg-acm-cyan text-black px-6 py-3 text-sm font-bold hover:bg-white transition-all">Browse Events</button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Personal Info */}
                        <fieldset className="p-6 border border-white/10 rounded-xl bg-white/2 space-y-4">
                            <legend className="text-acm-cyan font-mono text-[10px] tracking-widest px-2">// PERSONAL_INFO</legend>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Full Name *</label>
                                    <input type="text" required placeholder="John Doe" className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})}/>
                                </div>
                                <div>
                                    <label className={labelClass}>Phone *</label>
                                    <input type="tel" required placeholder="9876543210" maxLength="10" className={inputClass} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}/>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Email *</label>
                                <input type="email" required placeholder="you@example.com" className={inputClass} value={form.email} onChange={e => setForm({...form, email: e.target.value})}/>
                            </div>
                        </fieldset>

                        {/* Academic Info */}
                        <fieldset className="p-6 border border-white/10 rounded-xl bg-white/2 space-y-4">
                            <legend className="text-acm-cyan font-mono text-[10px] tracking-widest px-2">// ACADEMIC_INFO</legend>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className={labelClass}>Year *</label>
                                    <select required className={inputClass} value={form.year} onChange={e => setForm({...form, year: e.target.value})}>
                                        <option value="">Select Year</option>
                                        <option>FY</option><option>SY</option><option>TY</option><option>LY</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Branch *</label>
                                    <select required className={inputClass} value={form.branch} onChange={e => setForm({...form, branch: e.target.value})}>
                                        <option value="">Select Branch</option>
                                        <option>CS</option><option>IT</option><option>EXTC</option><option>MECH</option><option>CIVIL</option><option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>College</label>
                                    <input type="text" placeholder="TSEC" className={inputClass} value={form.college} onChange={e => setForm({...form, college: e.target.value})}/>
                                </div>
                            </div>
                        </fieldset>

                        {/* Team Info */}
                        <fieldset className="p-6 border border-white/10 rounded-xl bg-white/2 space-y-4">
                            <legend className="text-acm-cyan font-mono text-[10px] tracking-widest px-2">// TEAM_INFO</legend>
                            <div>
                                <label className={labelClass}>Team Name (leave blank if solo)</label>
                                <input type="text" placeholder="Team Binary_Bards" className={inputClass} value={form.team} onChange={e => setForm({...form, team: e.target.value})}/>
                            </div>
                            <div>
                                <label className={labelClass}>Message / Query (optional)</label>
                                <textarea placeholder="Any questions or notes for the organizers..." rows="3" className={inputClass + ' resize-none'} value={form.message} onChange={e => setForm({...form, message: e.target.value})}/>
                            </div>
                        </fieldset>

                        <button type="submit" className="w-full py-5 bg-acm-cyan text-black font-bold tracking-[0.3em] uppercase hover:bg-white transition-all text-sm shadow-[0_0_30px_rgba(100,255,218,0.15)] active:scale-[0.98]">
                            CONFIRM_REGISTRATION
                        </button>
                        <p className="text-[9px] font-mono text-gray-600 text-center">BY SUBMITTING, YOU AGREE TO THE PROTOCOLS OF TSEC ACM CHAPTER.</p>
                    </form>
                )}
            </div>
        </div>
    );
};



// --- REGISTRATIONS PANEL (Admin sub-component) ---
const RegistrationsPanel = ({ registrations, setRegistrations, events, filterEvent, setFilterEvent }) => {
    const [search, setSearch] = useState('');
    const [expandedReg, setExpandedReg] = useState(null);

    const filtered = registrations
        .filter(r => filterEvent === 'all' || r.eventSlug === filterEvent || r.event?.toLowerCase().includes(filterEvent.toLowerCase()))
        .filter(r => {
            const q = search.toLowerCase();
            return !q || r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q) || r.event?.toLowerCase().includes(q);
        });

    const exportCSV = () => {
        const headers = ['Name','Email','Phone','Year','Branch','College','Team','Event','Timestamp','Message'];
        const rows = registrations.map(r => [r.name,r.email,r.phone,r.year,r.branch,r.college,r.team,r.event,r.timestamp,r.message].map(v => `"${v||''}"`));
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
        a.download = 'all_registrations.csv';
        a.click();
    };

    const exportByEvent = async () => {
        const zip = new JSZip();
        const headers = ['Name','Email','Phone','Year','Branch','College','Team','Timestamp','Message'];

        // Group by event
        const grouped = {};
        registrations.forEach(r => {
            const key = r.event || r.eventSlug || 'Unknown_Event';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(r);
        });

        if (Object.keys(grouped).length === 0) return alert('No registrations to export');

        Object.entries(grouped).forEach(([eventName, regs]) => {
            const rows = regs.map(r => [r.name,r.email,r.phone,r.year,r.branch,r.college,r.team,r.timestamp,r.message].map(v => `"${v||''}"`));
            const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
            const safeName = eventName.replace(/[^a-z0-9_\-]/gi, '_');
            zip.file(`${safeName}.csv`, csv);
        });

        // Add a summary sheet
        const summaryRows = Object.entries(grouped).map(([name, regs]) => [`"${name}"`, regs.length]);
        const summaryCSV = [['Event','Count'], ...summaryRows].map(r => r.join(',')).join('\n');
        zip.file('_summary.csv', summaryCSV);

        const content = await zip.generateAsync({ type: 'blob' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = `registrations_event_wise_${new Date().toISOString().slice(0,10)}.zip`;
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <input
                    placeholder="Search by name, email, event..."
                    className="flex-1 bg-black/40 border border-white/10 px-4 py-2.5 text-xs rounded-lg text-white placeholder:text-gray-600 focus:border-acm-cyan outline-none"
                    value={search} onChange={e => setSearch(e.target.value)}
                />
                <select className="bg-black border border-white/10 px-3 py-2.5 text-xs rounded-lg text-white"
                    value={filterEvent} onChange={e => setFilterEvent(e.target.value)}>
                    <option value="all">All Events</option>
                    {events.map(ev => <option key={ev.slug} value={ev.slug}>{ev.title}</option>)}
                </select>
            </div>

            {/* Download buttons row */}
            <div className="flex flex-wrap gap-3">
                <button onClick={exportCSV}
                    className="text-[10px] font-mono text-acm-cyan border border-acm-cyan/30 px-4 py-2.5 rounded hover:bg-acm-cyan/10 flex items-center gap-2 whitespace-nowrap">
                    <span>↓</span> EXPORT ALL (CSV)
                </button>
                <button onClick={exportByEvent}
                    className="text-[10px] font-mono text-acm-cyan border border-acm-cyan/30 px-4 py-2.5 rounded hover:bg-acm-cyan/10 flex items-center gap-2 whitespace-nowrap">
                    <span>↓</span> DOWNLOAD EVENT-WISE (ZIP)
                </button>
                <button onClick={() => { if(confirm('Clear all registrations?')) { localStorage.removeItem('acm_registrations'); setRegistrations([]); } }}
                    className="text-[10px] font-mono text-red-500 border border-red-500/20 px-4 py-2.5 rounded hover:bg-red-500/10 whitespace-nowrap">
                    WIPE ALL
                </button>
            </div>


            <p className="text-[10px] font-mono text-gray-500">{filtered.length} / {registrations.length} RECORDS_SHOWN</p>

            <div className="space-y-2">
                {filtered.length === 0 && <div className="py-20 text-center text-gray-600 font-mono text-xs">NO_RECORDS_MATCH_QUERY</div>}
                {filtered.map((reg, i) => (
                    <div key={i} className="border border-white/10 rounded-xl overflow-hidden">
                        <button
                            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left gap-4"
                            onClick={() => setExpandedReg(expandedReg === i ? null : i)}
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-acm-cyan/10 border border-acm-cyan/20 flex items-center justify-center text-acm-cyan text-[10px] font-bold flex-shrink-0">
                                    {(reg.name || '?')[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-sm truncate">{reg.name || '—'}</p>
                                    <p className="text-[10px] text-gray-500 font-mono truncate">{reg.email}</p>
                                </div>
                            </div>
                            <div className="hidden sm:block text-[10px] text-acm-cyan font-mono text-right flex-shrink-0">{reg.event}</div>
                            <div className="hidden md:block text-[10px] text-gray-600 font-mono text-right flex-shrink-0">{reg.timestamp}</div>
                            <span className="text-gray-500 text-xs flex-shrink-0">{expandedReg === i ? '▲' : '▼'}</span>
                        </button>

                        {expandedReg === i && (
                            <div className="bg-black/40 border-t border-white/10 p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    ['Event', reg.event],
                                    ['Phone', reg.phone],
                                    ['Year', reg.year],
                                    ['Branch', reg.branch],
                                    ['College', reg.college],
                                    ['Team', reg.team || 'Solo'],
                                    ['Registered', reg.timestamp],
                                ].map(([label, val]) => (
                                    <div key={label}>
                                        <p className="text-[9px] text-gray-600 font-mono uppercase tracking-wider mb-0.5">{label}</p>
                                        <p className="text-xs text-white font-medium">{val || '—'}</p>
                                    </div>
                                ))}
                                {reg.message && (
                                    <div className="col-span-2 md:col-span-4">
                                        <p className="text-[9px] text-gray-600 font-mono uppercase tracking-wider mb-0.5">Message</p>
                                        <p className="text-xs text-gray-300 italic">"{reg.message}"</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MANAGEMENT PAGE ---
const Management = () => {
    const navigate = ReactRouterDOM.useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [registrations, setRegistrations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [events, setEvents] = useState([]);
    const [team, setTeam] = useState({});
    const [gallery, setGallery] = useState([]);
    const [filterEvent, setFilterEvent] = useState('all');
    const [authState, setAuthState] = useState('checking'); // 'checking' | 'ok' | 'denied'
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState('');
    const [adminCreds, setAdminCreds] = useState({ userId: 'admin', email: 'acmco@tsecmumbai.in', pass: 'ACM_SECURE_2026' });
    const [showPass, setShowPass] = useState(false);
    const [editAbout, setEditAbout] = useState({ mission: '', stats: [], legacyLogs: [] });

    // --- AUTH GATE: verify sessionStorage token with expiry ---
    useEffect(() => {
        const checkAuth = () => {
            try {
                const raw = sessionStorage.getItem('acm_admin_token');
                if (!raw) return setAuthState('denied');
                const token = JSON.parse(raw);
                if (!token.value.startsWith('acm_verified_')) return setAuthState('denied');
                if (Date.now() > token.expires) {
                    sessionStorage.removeItem('acm_admin_token');
                    return setAuthState('denied');
                }
                setAuthState('ok');
            } catch {
                setAuthState('denied');
            }
        };
        checkAuth();
    }, []);

    // Secondary PIN challenge handler (for when they try to force-navigate)
    const handlePinSubmit = (e) => {
        e.preventDefault();
        const creds = JSON.parse(localStorage.getItem('acm_admin_creds') || '{"userId":"admin","email":"acmco@tsecmumbai.in","pass":"ACM_SECURE_2026"}');
        if (pinInput === creds.pass) {
            // Must also verify email+user via secondary check — require full re-auth
            setPinError('FULL_HANDSHAKE_REQUIRED :: Use the Contact form to authenticate.');
        } else {
            setPinError('ACCESS_DENIED :: INVALID_CREDENTIALS');
            setPinInput('');
            // Log attempt
            const log = JSON.parse(localStorage.getItem('acm_access_log') || '[]');
            log.push({ time: new Date().toISOString(), attempt: pinInput.slice(0,5) + '...' });
            localStorage.setItem('acm_access_log', JSON.stringify(log.slice(-50)));
        }
    };

    // Form States
    const [newEvent, setNewEvent] = useState({ title: '', category: '', desc: '', slug: '', images: [], prizePool: 0, dateText: '', eventDate: '', tracks: [], speakers: [], faqs: [] });
    const [jsonEdit, setJsonEdit] = useState('');
    const [newMember, setNewMember] = useState({ name: '', role: '', desc: '', image: '', category: 'CORE_COMMITTEE', linkedin: '' });
    const [newGalleryItem, setNewGalleryItem] = useState({ src: '', caption: '', eventSlug: '' });
    const [editingEventId, setEditingEventId] = useState(null);
    const [editingMemberId, setEditingMemberId] = useState(null);

    // --- LOAD DATA (only if auth ok) ---
    useEffect(() => {
        if (authState !== 'ok') return;

        // --- INITIALIZE DEFAULTS IF EMPTY ---
        if (!localStorage.getItem('acm_events')) {
            const defaults = [
                { id: 1, slug: 'codesprint-26', title: 'CodeSprint 26', category: 'HACKATHON', desc: '48h intensive prototyping sprint.', images: ["https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200"] },
                { id: 2, slug: 'system-breach', title: 'System_Breach', category: 'CTF', desc: 'Cybersecurity capture the flag.', images: ["https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200"] }
            ];
            localStorage.setItem('acm_events', JSON.stringify(defaults));
        }

        if (!localStorage.getItem('acm_team')) {
            const defaults = {
                "CORE_COMMITTEE": [
                    { id: 101, name: "Rushabh Zaveri", role: "Chairperson", desc: "Mastermind behind chapter scaling.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&h=500&fit=crop", category: "CORE_COMMITTEE" }
                ]
            };
            localStorage.setItem('acm_team', JSON.stringify(defaults));
        }

        setRegistrations(JSON.parse(localStorage.getItem('acm_registrations') || '[]'));
        setMessages(JSON.parse(localStorage.getItem('acm_messages') || '[]'));
        setEvents(JSON.parse(localStorage.getItem('acm_events') || '[]'));
        setTeam(JSON.parse(localStorage.getItem('acm_team') || '{}'));
        setGallery(JSON.parse(localStorage.getItem('acm_gallery') || '[]'));
        setAdminCreds(JSON.parse(localStorage.getItem('acm_admin_creds') || '{"userId":"admin","email":"acmco@tsecmumbai.in","pass":"ACM_SECURE_2026"}'));
        setEditAbout(JSON.parse(localStorage.getItem('acm_about') || '{"mission":"","stats":[],"legacyLogs":[]}'));
    }, [authState]);

    const logout = () => { sessionStorage.removeItem('acm_admin_token'); navigate('/contact'); };

    // --- RENDER: Auth gate ---
    if (authState === 'checking') return (
        <div className="min-h-screen flex items-center justify-center text-acm-cyan font-mono text-xs">VERIFYING_CREDENTIALS...</div>
    );

    if (authState === 'denied') return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="border border-red-500/20 bg-black/80 rounded-2xl p-8 space-y-6">
                    <div className="text-center">
                        <div className="text-red-500 font-mono text-[10px] tracking-widest mb-2">// ACCESS_RESTRICTED</div>
                        <h1 className="text-white font-heading text-2xl font-bold uppercase tracking-tighter">Admin Zone</h1>
                        <p className="text-gray-600 text-xs mt-2 font-mono">This area requires authenticated access.</p>
                    </div>
                    <form onSubmit={handlePinSubmit} className="space-y-4">
                        <input
                            type="password"
                            placeholder="Enter access code"
                            autoComplete="off"
                            className="w-full bg-black border border-white/10 p-3 rounded text-white text-sm focus:border-red-400/50 outline-none font-mono"
                            value={pinInput}
                            onChange={e => { setPinInput(e.target.value); setPinError(''); }}
                        />
                        {pinError && <p className="text-red-400 text-[10px] font-mono">{pinError}</p>}
                        <button type="submit" className="w-full py-3 border border-white/10 text-xs font-mono hover:bg-white/5 transition-all text-white">AUTHENTICATE</button>
                    </form>
                    <button onClick={() => navigate('/contact')} className="w-full text-center text-[10px] text-gray-600 font-mono hover:text-gray-400 transition-colors">
                        ← Use Contact Form to Login
                    </button>
                </div>
            </div>
        </div>
    );

    const saveEvents = (updated) => { setEvents(updated); localStorage.setItem('acm_events', JSON.stringify(updated)); };
    const saveTeam = (updated) => { setTeam(updated); localStorage.setItem('acm_team', JSON.stringify(updated)); };
    const saveGallery = (updated) => { setGallery(updated); localStorage.setItem('acm_gallery', JSON.stringify(updated)); };

    const addGalleryPhoto = () => {
        if (!newGalleryItem.src) return alert('No image selected');
        const updated = [...gallery, { ...newGalleryItem, id: Date.now() }];
        saveGallery(updated);
        setNewGalleryItem({ src: '', caption: '', eventSlug: '' });
    };

    const deleteGalleryPhoto = (id) => {
        if (confirm('Remove this photo?')) saveGallery(gallery.filter(g => g.id !== id));
    };

    const moveGalleryPhoto = (index, dir) => {
        const updated = [...gallery];
        const target = index + dir;
        if (target < 0 || target >= updated.length) return;
        [updated[index], updated[target]] = [updated[target], updated[index]];
        saveGallery(updated);
    };

    const handleGalleryFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setNewGalleryItem(prev => ({ ...prev, src: ev.target.result }));
        reader.readAsDataURL(file);
    };

    const moveEvent = (index, dir) => {
        const updated = [...events];
        const target = index + dir;
        if (target < 0 || target >= updated.length) return;
        [updated[index], updated[target]] = [updated[target], updated[index]];
        saveEvents(updated);
    };

    const moveMember = (cat, id, dir) => {
        const updated = { ...team };
        const list = [...updated[cat]];
        const index = list.findIndex(m => m.id === id);
        const target = index + dir;
        if (target < 0 || target >= list.length) return;
        [list[index], list[target]] = [list[target], list[index]];
        updated[cat] = list;
        saveTeam(updated);
    };

    const addEvent = () => {
        if (!newEvent.title || !newEvent.slug) return alert('MISSING_REQUIRED_FIELDS');
        
        // Parse JSON sub-details
        let technical = { tracks: [], speakers: [], faqs: [] };
        try {
            technical = JSON.parse(jsonEdit);
        } catch(e) { console.warn("JSON Parse Failed", e); }

        const finalEvent = {
            ...newEvent,
            ...technical,
            id: editingEventId || Date.now()
        };

        const existing = [...events];
        if (editingEventId) {
            const idx = existing.findIndex(e => e.id === editingEventId);
            existing[idx] = finalEvent;
        } else {
            existing.push(finalEvent);
        }
        setEvents(existing);
        localStorage.setItem('acm_events', JSON.stringify(existing));
        setNewEvent({ title: '', category: '', desc: '', slug: '', images: [], prizePool: 0, dateText: '', eventDate: '', tracks: [], speakers: [], faqs: [] });
        setJsonEdit('');
        setEditingEventId(null);
        alert(editingEventId ? "EVENT_UPDATED" : "EVENT_DEPLOYED");
    };

    const startEditEvent = (ev) => {
        setNewEvent(ev);
        setJsonEdit(JSON.stringify({ tracks: ev.tracks || [], speakers: ev.speakers || [], faqs: ev.faqs || [] }, null, 2));
        setEditingEventId(ev.id);
        setActiveTab('events'); // Ensure we are on the events tab
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const deleteEvent = (index) => {
        if (confirm('Delete this event?')) {
            const updated = events.filter((_, i) => i !== index);
            saveEvents(updated);
        }
    };

    const addMember = (e) => {
        e.preventDefault();
        const updated = { ...team };
        
        if (editingMemberId) {
            // Remove old version if category changed
            Object.keys(updated).forEach(cat => {
                updated[cat] = updated[cat].filter(m => m.id !== editingMemberId);
            });
            if (!updated[newMember.category]) updated[newMember.category] = [];
            updated[newMember.category].push({ ...newMember, section: newMember.category.replace(/_/g, ' '), id: editingMemberId });
            setEditingMemberId(null);
        } else {
            if (!updated[newMember.category]) updated[newMember.category] = [];
            updated[newMember.category].push({ ...newMember, section: newMember.category.replace(/_/g, ' '), id: Date.now() });
        }
        
        saveTeam(updated);
        setNewMember({ name: '', role: '', desc: '', image: '', category: 'CORE_COMMITTEE', linkedin: '' });
        alert(editingMemberId ? "MEMBER_RE_SYNCED" : "MEMBER_BOARDED");
    };

    const startEditMember = (m) => {
        setNewMember({ name: m.name, role: m.role, desc: m.desc, image: m.image, category: m.category || 'CORE_COMMITTEE', linkedin: m.linkedin || '' });
        setEditingMemberId(m.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const handleFileUpload = (e, target) => {
        if (target === 'event') {
            const files = Array.from(e.target.files);
            if (!files.length) return;
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    setNewEvent(prev => ({ ...prev, images: [...(Array.isArray(prev.images) ? prev.images : []), ev.target.result] }));
                };
                reader.readAsDataURL(file);
            });
        } else {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => setNewMember(prev => ({ ...prev, image: ev.target.result }));
            reader.readAsDataURL(file);
        }
        e.target.value = ''; // reset so same files can be re-selected
    };

    const deleteMember = (cat, id) => {
        if(confirm('Remove this member?')) {
            const updated = { ...team };
            updated[cat] = updated[cat].filter(m => m.id !== id);
            saveTeam(updated);
        }
    }

    const exportData = async () => {
        const zip = new JSZip();
        const data = { events, team, gallery, registrations, messages };
        zip.file("data.json", JSON.stringify(data, null, 2));
        const assets = zip.folder("assets");
        // Event images
        events.forEach(ev => {
            (ev.images || []).forEach((img, idx) => {
                if (img.startsWith('data:image')) {
                    assets.file(`events/${ev.slug}_${idx}.${img.split(';')[0].split('/')[1]}`, img.split(',')[1], {base64: true});
                }
            });
        });
        // Team images
        Object.values(team).flat().forEach(m => {
            if (m.image?.startsWith('data:image')) {
                assets.file(`team/${m.id}.${m.image.split(';')[0].split('/')[1]}`, m.image.split(',')[1], {base64: true});
            }
        });
        // Standalone gallery images
        gallery.forEach((g, i) => {
            if (g.src?.startsWith('data:image')) {
                assets.file(`gallery/${i}.${g.src.split(';')[0].split('/')[1]}`, g.src.split(',')[1], {base64: true});
            }
        });
        const content = await zip.generateAsync({type: "blob"});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = `acm_vault_${new Date().toISOString().slice(0,10)}.zip`;
        a.click();
    };

    const importData = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (confirm('Overwrite current data with this backup?')) {
                    if (data.events) localStorage.setItem('acm_events', JSON.stringify(data.events));
                    if (data.team) localStorage.setItem('acm_team', JSON.stringify(data.team));
                    if (data.gallery) localStorage.setItem('acm_gallery', JSON.stringify(data.gallery));
                    if (data.registrations) localStorage.setItem('acm_registrations', JSON.stringify(data.registrations));
                    if (data.messages) localStorage.setItem('acm_messages', JSON.stringify(data.messages));
                    window.location.reload();
                }
            } catch (err) { alert('INVALID_BACKUP_FILE'); }
        };
        reader.readAsText(file);
    };

    const regCounts = registrations.reduce((acc, curr) => {
        acc[curr.event] = (acc[curr.event] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="min-h-screen pt-32 px-4 md:px-20 text-white pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-white/10 pb-10">
                <div>
                    <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-tighter">CHAPTER_MANAGEMENT</h1>
                    <p className="text-acm-cyan font-mono text-[10px] tracking-[0.3em] mt-2 opacity-60">:: ACCESS_LEVEL_AUTHORITY :: SECURE_SESSION</p>
                </div>
                <button onClick={logout} className="text-[10px] font-mono text-red-500 border border-red-500/30 px-6 py-3 uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">TERMINATE</button>
            </div>

            <div className="flex gap-4 mb-10 overflow-x-auto pb-2 border-b border-white/5 font-mono text-xs uppercase tracking-widest no-scrollbar">
                {['overview', 'events', 'gallery', 'team', 'registrations', 'messages', 'system'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 px-2 whitespace-nowrap transition-all ${activeTab === tab ? 'text-acm-cyan border-b border-acm-cyan' : 'text-gray-500 hover:text-white'}`}>
                        [ {tab.toUpperCase()} ]
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
                        <h3 className="text-acm-cyan font-mono text-[10px] mb-6 tracking-widest">// EVENTS_ACTIVE</h3>
                        <div className="text-6xl font-bold">{events.length}</div>
                    </div>
                    <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
                        <h3 className="text-acm-cyan font-mono text-[10px] mb-6 tracking-widest">// TOTAL_MEMBERS</h3>
                        <div className="text-6xl font-bold">{Object.values(team).flat().length}</div>
                    </div>
                    <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
                        <h3 className="text-acm-cyan font-mono text-[10px] mb-6 tracking-widest">// REGISTRATIONS</h3>
                        <div className="text-6xl font-bold text-acm-cyan">{registrations.length}</div>
                    </div>
                </div>
            )}

            {activeTab === 'events' && (
                <div className="space-y-10">
                    <form onSubmit={addEvent} className="p-8 bg-white/5 border border-white/10 rounded-2xl space-y-4 max-w-2xl relative">
                        {editingEventId && <button type="button" onClick={() => {setEditingEventId(null); setNewEvent({ title: '', category: '', desc: '', slug: '', images: [], prizePool: 0, dateText: '', eventDate: '', tracks: [], speakers: [], faqs: [] }); setJsonEdit('');}} className="absolute top-4 right-4 text-[10px] text-gray-500 hover:text-white underline">CANCEL_EDIT</button>}
                        <h2 className="text-xl font-bold font-mono tracking-widest text-acm-cyan">
                            {editingEventId ? "// PATCH_EXISTING_LOG" : "// DEPLOY_NEW_EVENT"}
                        </h2>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <input required placeholder="Title" className="bg-black border border-white/10 p-3 rounded" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})}/>
                            <input required placeholder="Slug (URL ID)" className="bg-black border border-white/10 p-3 rounded" value={newEvent.slug} onChange={e => setNewEvent({...newEvent, slug: e.target.value})}/>
                        </div>
                        <input required placeholder="Category (e.g. HACKATHON)" className="w-full bg-black border border-white/10 p-3 rounded text-xs" value={newEvent.category} onChange={e => setNewEvent({...newEvent, category: e.target.value})}/>
                        <textarea required placeholder="Description" className="w-full bg-black border border-white/10 p-3 rounded h-32 text-xs" value={newEvent.desc} onChange={e => setNewEvent({...newEvent, desc: e.target.value})}/>

                        {/* ─── MULTI-IMAGE MANAGER ─── */}
                        <div className="space-y-3 border border-white/10 rounded-xl p-4 bg-black/20">
                            <p className="text-[10px] text-acm-cyan font-mono tracking-widest">// EVENT_IMAGES ({(Array.isArray(newEvent.images) ? newEvent.images : []).length} attached)</p>

                            {/* URL add */}
                            <div className="flex gap-2">
                                <input
                                    id="urlInput"
                                    placeholder="Paste image URL and press Add"
                                    className="flex-1 bg-black border border-white/10 p-2.5 rounded text-xs"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const val = e.target.value.trim();
                                            if (val) { setNewEvent(prev => ({ ...prev, images: [...(Array.isArray(prev.images) ? prev.images : []), val] })); e.target.value = ''; }
                                        }
                                    }}
                                />
                                <button type="button"
                                    className="px-3 py-2 text-[10px] border border-acm-cyan/30 text-acm-cyan hover:bg-acm-cyan/10 rounded whitespace-nowrap"
                                    onClick={() => {
                                        const inp = document.getElementById('urlInput');
                                        const val = inp.value.trim();
                                        if (val) { setNewEvent(prev => ({ ...prev, images: [...(Array.isArray(prev.images) ? prev.images : []), val] })); inp.value = ''; }
                                    }}
                                >+ ADD URL</button>
                            </div>

                            {/* Multi-file picker */}
                            <div className="flex items-center gap-3">
                                <label className="cursor-pointer text-[10px] text-acm-cyan border border-acm-cyan/20 px-3 py-2 rounded hover:bg-acm-cyan/10 transition-all">
                                    ↑ UPLOAD FILES (multiple)
                                    <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleFileUpload(e, 'event')}/>
                                </label>
                                <span className="text-[9px] text-gray-600 font-mono">Select multiple at once</span>
                            </div>

                            {/* Preview grid with remove */}
                            {(Array.isArray(newEvent.images) ? newEvent.images : []).length > 0 && (
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
                                    {(Array.isArray(newEvent.images) ? newEvent.images : []).map((src, idx) => (
                                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10">
                                            <img src={src} className="w-full h-full object-cover"/>
                                            <button
                                                type="button"
                                                onClick={() => setNewEvent(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 text-lg transition-opacity"
                                            >✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-gray-400 font-mono mb-2 block uppercase tracking-widest">Date_Text (e.g. MAR 15 • 48H)</label>
                                    <input className="w-full bg-black/40 border border-white/10 px-4 py-2 text-xs rounded-lg text-white" value={newEvent.dateText} onChange={e => setNewEvent({...newEvent, dateText: e.target.value})}/>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-400 font-mono mb-2 block uppercase tracking-widest">Countdown_ISO (e.g. 2026-03-15T09:00:00)</label>
                                    <input className="w-full bg-black/40 border border-white/10 px-4 py-2 text-xs rounded-lg text-white" value={newEvent.eventDate} onChange={e => setNewEvent({...newEvent, eventDate: e.target.value})}/>
                                </div>
                            </div>
                            <div className="grid grid-cols-1">
                                <div>
                                    <label className="text-[10px] text-gray-400 font-mono mb-2 block uppercase tracking-widest">Prize_Pool (Number)</label>
                                    <input type="number" className="w-full bg-black/40 border border-white/10 px-4 py-2 text-xs rounded-lg text-white" value={newEvent.prizePool} onChange={e => setNewEvent({...newEvent, prizePool: parseInt(e.target.value)||0})}/>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] text-gray-400 font-mono mb-2 block uppercase tracking-widest">Technical_Details_JSON (Tracks, Speakers, FAQs)</label>
                                <textarea 
                                    className="w-full bg-black/40 border border-white/10 px-4 py-2 text-[10px] font-mono rounded-lg text-acm-cyan h-48" 
                                    value={jsonEdit} 
                                    onChange={e => setJsonEdit(e.target.value)}
                                    placeholder='{ "tracks": ["AI"], "speakers": [], "faqs": [] }'
                                />
                                <p className="text-[8px] text-gray-600 mt-1 uppercase tracking-tighter italic">Warning: Invalid JSON will result in empty sections.</p>
                            </div>
                        <button type="submit" className="w-full py-4 bg-acm-cyan text-black font-bold uppercase tracking-widest hover:bg-white transition-all">
                            {editingEventId ? "OVERWRITE_SIGNAL" : "INITIALIZE_UPLINK"}
                        </button>
                    </form>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((ev, i) => (
                            <div key={i} className="p-6 bg-black/40 border border-white/10 rounded-xl relative group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-bold text-lg uppercase">{ev.title}</h4>
                                        <p className="text-[10px] text-acm-cyan/60 font-mono">ID: {ev.slug}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="flex flex-col gap-1 mr-2 border-r border-white/10 pr-2">
                                            <button onClick={() => moveEvent(i, -1)} className="text-[8px] hover:text-acm-cyan">▲</button>
                                            <button onClick={() => moveEvent(i, 1)} className="text-[8px] hover:text-acm-cyan">▼</button>
                                        </div>
                                        <button onClick={() => startEditEvent(ev)} className="bg-acm-cyan/10 text-acm-cyan hover:bg-acm-cyan hover:text-black p-2 rounded transition-all">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button onClick={() => deleteEvent(i)} className="text-red-500 hover:bg-red-500/10 p-2 rounded">✕</button>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 line-clamp-2 mb-4 h-8">{ev.desc}</p>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {(Array.isArray(ev.images) ? ev.images : []).map((img, idx) => (
                                        <div key={idx} className="w-10 h-10 bg-white/5 rounded-lg overflow-hidden flex-shrink-0 border border-white/5">
                                            <img src={img} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                    {(Array.isArray(ev.images) ? ev.images : []).length === 0 && <span className="text-[8px] text-gray-600 font-mono italic">NO_IMAGES</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'gallery' && (
                <div className="space-y-10">
                    {/* Upload Form */}
                    <div className="p-8 bg-white/5 border border-white/10 rounded-2xl space-y-4 max-w-2xl">
                        <h2 className="text-xl font-bold font-mono tracking-widest text-acm-cyan">// UPLOAD_GALLERY_PHOTO</h2>
                        <div className="space-y-2">
                            <input placeholder="Image URL (optional)" className="w-full bg-black border border-white/10 p-3 rounded text-xs"
                                value={newGalleryItem.src} onChange={e => setNewGalleryItem({...newGalleryItem, src: e.target.value})}/>
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] text-gray-500 font-mono">OR_UPLOAD:</span>
                                <input type="file" accept="image/*" onChange={handleGalleryFileUpload} className="text-[10px] text-acm-cyan"/>
                            </div>
                        </div>
                        {newGalleryItem.src && <img src={newGalleryItem.src} className="h-24 rounded border border-white/10 object-cover"/>}
                        <input placeholder="Caption (optional)" className="w-full bg-black border border-white/10 p-3 rounded text-xs"
                            value={newGalleryItem.caption} onChange={e => setNewGalleryItem({...newGalleryItem, caption: e.target.value})}/>
                        <div>
                            <label className="text-[10px] text-gray-500 font-mono block mb-1">LINK_TO_EVENT (optional):</label>
                            <select className="w-full bg-black border border-white/10 p-3 rounded text-xs text-white"
                                value={newGalleryItem.eventSlug} onChange={e => setNewGalleryItem({...newGalleryItem, eventSlug: e.target.value})}>
                                <option value="">-- No Event Link --</option>
                                {events.map(ev => <option key={ev.slug} value={ev.slug}>{ev.title}</option>)}
                            </select>
                        </div>
                        <button onClick={addGalleryPhoto} className="w-full py-4 bg-acm-cyan text-black font-bold uppercase tracking-widest hover:bg-white transition-all">
                            ADD_TO_ARCHIVE
                        </button>
                    </div>

                    {/* Gallery Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {gallery.map((g, i) => (
                            <div key={g.id} className="group relative aspect-video rounded-xl overflow-hidden border border-white/10">
                                <img src={g.src} className="w-full h-full object-cover"/>
                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                    {g.caption && <p className="text-[10px] text-white text-center">{g.caption}</p>}
                                    {g.eventSlug && <p className="text-[8px] text-acm-cyan font-mono">{g.eventSlug}</p>}
                                    <div className="flex gap-2 mt-1">
                                        <button onClick={() => moveGalleryPhoto(i, -1)} className="text-white text-xs border border-white/20 px-2 py-1 rounded hover:border-acm-cyan">▲</button>
                                        <button onClick={() => moveGalleryPhoto(i, 1)} className="text-white text-xs border border-white/20 px-2 py-1 rounded hover:border-acm-cyan">▼</button>
                                        <button onClick={() => deleteGalleryPhoto(g.id)} className="text-red-400 text-xs border border-red-400/20 px-2 py-1 rounded hover:bg-red-500/10">✕</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {gallery.length === 0 && <p className="col-span-4 text-center text-gray-600 font-mono text-xs py-20">GALLERY_BUFFER_EMPTY</p>}
                    </div>
                </div>
            )}

            {activeTab === 'team' && (
                <div className="space-y-10">
                    <form onSubmit={addMember} className="p-8 bg-white/5 border border-white/10 rounded-2xl space-y-4 max-w-2xl relative">
                        {editingMemberId && <button onClick={() => {setEditingMemberId(null); setNewMember({ name: '', role: '', desc: '', image: '', category: 'CORE_COMMITTEE', linkedin: '' });}} className="absolute top-4 right-4 text-[10px] text-gray-500 hover:text-white underline">CANCEL_EDIT</button>}
                        <h2 className="text-xl font-bold font-mono tracking-widest text-acm-cyan">
                            {editingMemberId ? "// RE_SYNC_MEMBER" : "// BOARD_NEW_MEMBER"}
                        </h2>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <input required placeholder="Name" className="bg-black border border-white/10 p-3 rounded" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})}/>
                            <input required placeholder="Role" className="bg-black border border-white/10 p-3 rounded" value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})}/>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                             <select className="bg-black border border-white/10 p-3 rounded text-white" value={newMember.category} onChange={e => setNewMember({...newMember, category: e.target.value})}>
                                <option value="FACULTY_SPONSORS">FACULTY_SPONSORS</option>
                                <option value="CORE_COMMITTEE">CORE_COMMITTEE</option>
                                <option value="TECHNICAL_FORCE">TECHNICAL_FORCE</option>
                                <option value="WEB_ARCHITECTS">WEB_ARCHITECTS</option>
                                <option value="DESIGN_SQUAD">DESIGN_SQUAD</option>
                                <option value="CONTENT_STRATEGISTS">CONTENT_STRATEGISTS</option>
                                <option value="MEDIA_TEAM">MEDIA_TEAM</option>
                                <option value="MANAGEMENT_CREW">MANAGEMENT_CREW</option>
                            </select>
                            <input placeholder="LinkedIn URL" className="bg-black border border-white/10 p-3 rounded" value={newMember.linkedin} onChange={e => setNewMember({...newMember, linkedin: e.target.value})}/>
                        </div>
                        <div className="space-y-2">
                            <input placeholder="Image URL" className="w-full bg-black border border-white/10 p-3 rounded text-xs" value={newMember.image} onChange={e => setNewMember({...newMember, image: e.target.value})}/>
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] text-gray-500 font-mono">OR_UPLOAD:</span>
                                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'member')} className="text-[10px] text-acm-cyan"/>
                            </div>
                        </div>
                        <textarea required placeholder="Brief Bio (will show on card)" className="w-full bg-black border border-white/10 p-3 rounded h-24 text-xs" value={newMember.desc} onChange={e => setNewMember({...newMember, desc: e.target.value})}/>
                        <button type="submit" className="w-full py-4 bg-acm-cyan text-black font-bold uppercase tracking-widest hover:bg-white transition-all">
                            {editingMemberId ? "SYNC_UPLINK" : "JOIN_FORCE"}
                        </button>
                    </form>

                    <div className="space-y-8">
                        {Object.entries(team).map(([cat, members]) => (
                            <div key={cat} className="border-t border-white/5 pt-8">
                                <h3 className="text-acm-cyan font-mono text-[10px] mb-6 tracking-widest uppercase">// {cat}</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {members.map((m) => (
                                        <div key={m.id} className="p-3 bg-white/5 border border-white/10 rounded flex flex-col items-center group relative">
                                            <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="flex gap-1 mb-1 border-b border-white/10 pb-1">
                                                    <button onClick={() => moveMember(cat, m.id, -1)} className="text-[8px] text-gray-400 hover:text-white">▲</button>
                                                    <button onClick={() => moveMember(cat, m.id, 1)} className="text-[8px] text-gray-400 hover:text-white">▼</button>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => startEditMember(m)} className="text-acm-cyan hover:scale-110">✎</button>
                                                    <button onClick={() => deleteMember(cat, m.id)} className="text-red-500 hover:scale-110">✕</button>
                                                </div>
                                            </div>
                                            <div className="w-16 h-16 rounded-full overflow-hidden mb-2 bg-black border border-white/10">
                                                <img src={m.image} className="w-full h-full object-cover" />
                                            </div>
                                            <p className="text-[10px] font-bold text-center truncate w-full">{m.name}</p>
                                            <p className="text-[8px] text-gray-500 uppercase tracking-tighter">{m.role}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'registrations' && (
                <RegistrationsPanel
                    registrations={registrations}
                    setRegistrations={setRegistrations}
                    events={events}
                    filterEvent={filterEvent}
                    setFilterEvent={setFilterEvent}
                />
            )}



            {activeTab === 'messages' && (
                <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
                    {messages.length === 0 ? (
                        <div className="p-20 text-center text-gray-600 font-mono text-xs italic uppercase underline">INBOX_BUFFER_CLEARED</div>
                    ) : (
                        messages.map((msg, i) => (
                            <div key={i} className="p-6 hover:bg-white/2 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-acm-cyan">{msg.user} <span className="text-gray-500 font-normal">({msg.email})</span></h4>
                                    <span className="text-[9px] font-mono text-gray-600">{msg.timestamp}</span>
                                </div>
                                <p className="text-xs text-gray-300 italic">"{msg.content}"</p>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'system' && (
                <div className="max-w-xl space-y-12 pb-20">
                     <section className="p-8 bg-white/5 border border-white/10 rounded-2xl">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-xl font-bold font-heading tracking-tighter uppercase">Security_Access_Log</h2>
                            <button onClick={() => { localStorage.removeItem('acm_access_log'); alert('LOG_WIPED'); }} className="text-[8px] text-red-500 font-mono underline">WIPE_LOGS</button>
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-4 scrollbar-hide">
                            {(JSON.parse(localStorage.getItem('acm_access_log') || '[]')).length === 0 ? (
                                <p className="text-gray-600 font-mono text-[10px]">No unauthorized attempts detected.</p>
                            ) : (
                                (JSON.parse(localStorage.getItem('acm_access_log') || '[]')).reverse().map((l, idx) => (
                                    <div key={idx} className="flex justify-between text-[8px] font-mono border-b border-white/5 pb-1">
                                        <span className="text-red-400">{l.time}</span>
                                        <span className="text-gray-500">{l.attempt}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="p-8 bg-white/5 border border-white/10 rounded-2xl space-y-6">
                        <h2 className="text-xl font-bold font-heading mb-2 tracking-tighter uppercase">Admin_Handshake_Shield</h2>
                        <p className="text-[10px] text-gray-500 font-mono leading-relaxed">// Modify the required identity for Contact form login.</p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] text-acm-cyan font-mono uppercase mb-1 block">Handshake UserID</label>
                                <input className="w-full bg-black border border-white/10 p-3 rounded text-xs text-white" value={adminCreds.userId} onChange={e => setAdminCreds({...adminCreds, userId: e.target.value})}/>
                            </div>
                            <div>
                                <label className="text-[9px] text-acm-cyan font-mono uppercase mb-1 block">Handshake Email</label>
                                <input className="w-full bg-black border border-white/10 p-3 rounded text-xs text-white" value={adminCreds.email} onChange={e => setAdminCreds({...adminCreds, email: e.target.value})}/>
                            </div>
                            <div>
                                <label className="text-[9px] text-acm-cyan font-mono uppercase mb-1 block">Secret Handshake Code</label>
                                <div className="relative">
                                    <input 
                                        type={showPass ? "text" : "password"} 
                                        className="w-full bg-black border border-white/10 p-3 rounded text-xs text-white pr-12 font-mono" 
                                        value={adminCreds.pass} 
                                        onChange={e => setAdminCreds({...adminCreds, pass: e.target.value})}
                                    />
                                    <button 
                                        onClick={() => setShowPass(!showPass)} 
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                    >
                                        {showPass ? "HID" : "VIS"}
                                    </button>
                                </div>
                                <p className="text-[8px] text-gray-600 mt-2 italic font-mono">:: This is also the PIN required for the emergency lock page.</p>
                            </div>
                            <button 
                                onClick={() => { localStorage.setItem('acm_admin_creds', JSON.stringify(adminCreds)); alert('SECURITY_SIGNAL_ENCRYPTED_AND_SAVED'); }} 
                                className="w-full py-4 border border-acm-cyan/30 text-acm-cyan font-bold uppercase tracking-widest text-[10px] hover:bg-acm-cyan hover:text-black transition-all"
                            >
                                UPDATE_ENCRYPTION_KEY
                            </button>
                        </div>
                    </section>

                    <section className="p-8 bg-white/5 border border-white/10 rounded-2xl space-y-6">
                        <h2 className="text-xl font-bold font-heading mb-2 tracking-tighter uppercase">About_Page_Pulse</h2>
                        <p className="text-[10px] text-gray-500 font-mono leading-relaxed">// Modify main site stats and mission.</p>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="text-[9px] text-acm-cyan font-mono mb-2 block">MISSION_TEXT</label>
                                <textarea 
                                    className="w-full bg-black border border-white/10 p-3 rounded text-xs text-white h-24" 
                                    value={editAbout.mission} 
                                    onChange={e => setEditAbout({...editAbout, mission: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {editAbout.stats?.map((s, idx) => (
                                    <div key={idx}>
                                        <label className="text-[8px] text-gray-500 font-mono mb-1 block uppercase">{s.label}</label>
                                        <input 
                                            type="number"
                                            className="w-full bg-black border border-white/10 p-2 rounded text-xs text-white" 
                                            value={s.value} 
                                            onChange={e => {
                                                const newStats = [...editAbout.stats];
                                                newStats[idx].value = parseInt(e.target.value) || 0;
                                                setEditAbout({...editAbout, stats: newStats});
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="text-[9px] text-acm-cyan font-mono mb-2 block uppercase">Legacy_Milestones_JSON</label>
                                <textarea 
                                    className="w-full bg-black border border-white/10 p-3 rounded text-[10px] text-gray-400 h-32 font-mono leading-relaxed" 
                                    value={JSON.stringify(editAbout.legacyLogs, null, 2)} 
                                    onChange={e => {
                                        try { setEditAbout({...editAbout, legacyLogs: JSON.parse(e.target.value)}); }
                                        catch(e) {}
                                    }}
                                />
                                <p className="text-[8px] text-gray-600 mt-1 uppercase tracking-tighter italic">{"// Array of { \"year\": \"2026\", \"title\": \"...\", \"desc\": \"...\" }"}</p>
                            </div>
                            <button 
                                onClick={() => { localStorage.setItem('acm_about', JSON.stringify(editAbout)); alert('ABOUT_PROTOCOL_UPDATED'); }} 
                                className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest text-[10px] hover:bg-acm-cyan transition-all"
                            >
                                SAVE_CORE_CHANGES
                            </button>
                        </div>
                    </section>

                    <section className="p-8 bg-white/5 border border-white/10 rounded-2xl">
                        <h2 className="text-xl font-bold font-heading mb-6 tracking-tighter uppercase">System_Vault_Export</h2>
                        <p className="text-xs text-gray-400 mb-6 font-mono leading-relaxed">
                            Generate a comprehensive .ZIP vault. Includes a master JSON file and an assets folder containing all high-resolution event and team media.
                        </p>
                        <button onClick={exportData} className="px-10 py-4 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-acm-cyan transition-all">GENERATE_ZIP_VAULT</button>
                    </section>

                    <section className="p-8 bg-white/5 border border-white/10 rounded-2xl">
                        <h2 className="text-xl font-bold font-heading mb-6 tracking-tighter uppercase">Restore_Archive</h2>
                        <p className="text-xs text-gray-400 mb-6 font-mono leading-relaxed">
                            Select a valid .json archive to overwrite the current system buffer. WARNING: This will eradicate current unsaved data.
                        </p>
                        <input type="file" accept=".json" onChange={importData} className="text-xs font-mono file:bg-acm-cyan/10 file:border-acm-cyan/20 file:text-acm-cyan file:px-4 file:py-2 file:rounded file:mr-4 file:hover:bg-acm-cyan file:hover:text-black file:transition-all pointer-events-auto" />
                    </section>
                </div>
            )}
        </div>
    );
};


// --- APP ROOT ---
const App = () => {
    // --- GLOBAL DATA SEEDER (Seeds defaults if localStorage is empty) ---
    useEffect(() => {
        if (!localStorage.getItem('acm_events')) {
            const defaults = [
                {
                    id: 1, 
                    slug: 'codesprint-26', 
                    title: "CodeSprint 26",
                    dateText: "MAR 15 • 48 HOURS • TSEC CAMPUS",
                    eventDate: "2026-03-15T09:00:00",
                    prizePool: 100000,
                    category: 'HACKATHON',
                    desc: "A 48-hour flagship hackathon transforming ideas into scalable tech products.",
                    images: ["https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200"],
                    tracks: ["AI & Machine Learning", "Cybersecurity", "Web3 & Blockchain", "Open Innovation"],
                    speakers: [
                        { name: "Rohit Sharma", role: "Senior Engineer, Google", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400" },
                        { name: "Ananya Mehta", role: "AI Researcher, Microsoft", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400" }
                    ],
                    faqs: [
                        { question: "Team size?", answer: "2–4 members allowed." },
                        { question: "Is it offline?", answer: "Yes." }
                    ]
                },
                {
                    id: 2, 
                    slug: 'system-breach', 
                    title: "System_Breach",
                    dateText: "APR 02 • 12 HOURS • CYBER LAB",
                    eventDate: "2024-04-02T10:00:00",
                    prizePool: 50000,
                    category: 'CTF',
                    desc: "A high-intensity cybersecurity Capture The Flag competition.",
                    images: ["https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200"],
                    tracks: ["Web Exploitation", "Cryptography", "Reverse Engineering"],
                    speakers: [
                        { name: "Arjun Nair", role: "Security Analyst, Deloitte", image: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=400" }
                    ],
                    faqs: [
                        { question: "Prizes?", answer: "Cash rewards + internship opportunities." }
                    ]
                }
            ];
            localStorage.setItem('acm_events', JSON.stringify(defaults));
        }
        if (!localStorage.getItem('acm_team')) {
            const defaults = {
                "CORE_COMMITTEE": [
                    { id: 101, name: "Rushabh Zaveri", role: "Chairperson", desc: "Mastermind behind chapter scaling.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&h=500&fit=crop", category: "CORE_COMMITTEE", linkedin: "#" }
                ]
            };
            localStorage.setItem('acm_team', JSON.stringify(defaults));
        }
        if (!localStorage.getItem('acm_admin_creds')) {
             localStorage.setItem('acm_admin_creds', JSON.stringify({userId:"admin", email:"acmco@tsecmumbai.in", pass:"ACM_SECURE_2026"}));
        }
        if (!localStorage.getItem('acm_about')) {
            const defaults = {
                mission: "We are the architects of the digital frontier. TSEC ACM is not just a club; it's an incubator for those who dare to disrupt the status quo.",
                stats: [
                    { label: "MEMBERS", value: 500 },
                    { label: "EVENTS", value: 30 },
                    { label: "AWARDS", value: 10 }
                ],
                legacyLogs: [
                    { year: "2025", title: "National Apex", desc: "Awarded Best Student Chapter nationwide." },
                    { year: "2023", title: "Source Code", desc: "Launched open-source initiative with 500+ PRs." }
                ]
            };
            localStorage.setItem('acm_about', JSON.stringify(defaults));
        }
    }, []);

    return (
        <HashRouter>
            {/* <CustomCursor /> */}
            <NeuralFlow />
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:slug" element={<EventDetail />} />
                <Route path="/events/:slug/register" element={<EventRegister />} />
                <Route path="/team" element={<Team />} />
                <Route path="/gallery" element={<FusionGallery />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/management" element={<Management />} />
            </Routes>
        </HashRouter>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);