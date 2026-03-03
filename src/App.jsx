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
    const isMobile = window.innerWidth < 768;

    useEffect(() => {
        const mount = mountRef.current;
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x020202, 0.002);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 30;
        camera.position.y = 10;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mount.appendChild(renderer.domElement);

        // --- WAVE PARTICLES ---
        const particleCount = 500;
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
        const gyro = { x: 0, y: 0 };
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
        const handleOrientation = (e) => {
            if (e.beta !== null && e.gamma !== null) {
                gyro.x = (e.gamma / 15);
                gyro.y = (e.beta - 45) / 15;
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('deviceorientation', handleOrientation);

        // iOS Permission
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            document.addEventListener('click', () => {
                DeviceOrientationEvent.requestPermission().catch(console.error);
            }, { once: true });
        }

        const clock = new THREE.Clock();
        const animate = () => {
            requestAnimationFrame(animate);
            const time = clock.getElapsedTime();

            // Camera Motion
            targetX = (mouse.x + gyro.x) * 0.5;
            targetY = (mouse.y + gyro.y) * 0.5;
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
            window.removeEventListener('deviceorientation', handleOrientation);
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
            <div className={`fixed inset-0 bg-[#020c1b] flex flex-col items-center justify-center gap-10 md:hidden transition-all duration-500 z-[1000] pt-20 ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
                {/* Decorative scanning line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-acm-cyan/30 animate-pulse"></div>

                {navItems.map((item, idx) => (
                    <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`group relative text-3xl font-heading font-bold uppercase tracking-widest transition-all duration-300 ${location.pathname === item.path ? 'text-acm-cyan ml-4' : 'text-gray-500 hover:text-white'}`}
                        style={{ transitionDelay: `${idx * 50}ms` }}
                    >
                        <span className="relative z-10">{item.name}</span>
                        {location.pathname === item.path && <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-acm-cyan animate-ping text-sm">⊕</span>}
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-acm-cyan scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                    </Link>
                ))}

                <div className="mt-12 text-[10px] font-mono text-gray-600 tracking-[0.5em] animate-pulse">
                    :: STATUS_ONLINE ::
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
    const events = [
        {
            slug: 'codesprint-26',
            title: 'CodeSprint 26',
            date: 'MAR 15',
            tag: 'HACKATHON',
            color: 'from-acm-cyan to-blue-600',
            desc: '48h intensive prototyping sprint.'
        },
        {
            slug: 'system-breach',
            title: 'System_Breach',
            date: 'APR 02',
            tag: 'CTF',
            color: 'from-red-500 to-orange-600',
            desc: 'Cybersecurity capture the flag.'
        },
        {
            slug: 'neural-nets',
            title: 'Neural_Nets',
            date: 'MAY 10',
            tag: 'WORKSHOP',
            color: 'from-purple-500 to-indigo-600',
            desc: 'Deep learning with experts.'
        },
        {
            slug: 'cloud-summit',
            title: 'Cloud_Summit',
            date: 'JUN 22',
            tag: 'CONFERENCE',
            color: 'from-blue-400 to-teal-400',
            desc: 'Cloud native architecture.'
        },
        {
            slug: 'open-source',
            title: 'Open_Source',
            date: 'JUL 14',
            tag: 'INITIATIVE',
            color: 'from-green-400 to-emerald-600',
            desc: 'Summer contribution drive.'
        },
        {
            slug: 'dev-fest',
            title: 'Dev_Fest',
            date: 'AUG 30',
            tag: 'MEETUP',
            color: 'from-yellow-400 to-orange-500',
            desc: 'Community developer meet.'
        },
    ];

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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-12">
                {events.map((ev) => (
                    <Link key={ev.slug} to={`/events/${ev.slug}`} className="block">
                        <TiltCard className="group aspect-[4/3] sm:aspect-[4/3] cursor-pointer">
                            <div className="relative h-full w-full p-5 md:p-8 flex flex-col justify-between z-10">

                                {/* Date Badge */}
                                <div className="flex justify-between items-start">
                                    <span className="font-mono text-lg md:text-xl font-bold text-white border-b-2 border-acm-cyan pb-1">
                                        {ev.date}
                                    </span>
                                    <span className="font-mono text-xs font-semibold border border-white/30 px-2 md:px-3 py-1 md:py-1.5 rounded text-gray-200 bg-black/30 backdrop-blur-md tracking-wider">
                                        {ev.tag}
                                    </span>
                                </div>

                                {/* Central Glow */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none">
                                    <div className={`w-32 md:w-40 h-32 md:h-40 rounded-full bg-gradient-to-br ${ev.color} blur-3xl animate-pulse`}></div>
                                </div>

                                {/* Content */}
                                <div className="z-20">
                                    <h3 className="text-xl md:text-3xl font-heading font-bold text-white mb-1 md:mb-2 drop-shadow-md">
                                        {ev.title}
                                    </h3>
                                    <p className="text-xs md:text-sm text-gray-300 font-mono mb-3 md:mb-6 border-l-2 border-white/20 pl-2 md:pl-3">
                                        {ev.desc}
                                    </p>
                                    <div className="text-xs border border-white/20 text-acm-cyan px-3 py-1.5 rounded uppercase tracking-wider bg-black/40 backdrop-blur-md inline-block">
                                        View Details →
                                    </div>
                                </div>
                            </div>
                        </TiltCard>
                    </Link>
                ))}
            </div>
        </div>
    );
};

const About = () => {
    const stats = [
        { label: "MEMBERS", value: 500 },
        { label: "EVENTS", value: 30 },
        { label: "AWARDS", value: 10 },
    ];

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
                <div className="w-24 h-1.5 bg-acm-cyan mt-4 rounded-full shadow-[0_0_10px_rgba(100,255,218,0.5)]"></div>
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
                        We are the <span className="text-white font-bold">architects</span> of the digital frontier.
                        TSEC ACM is not just a club; it's an incubator for those who dare to
                        <span className="italic text-gray-400"> disrupt</span> the status quo.
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
                        <div>
                            <span className="text-2xl md:text-4xl font-heading font-bold opacity-30">2025</span>
                            <h3 className="text-lg md:text-2xl font-bold mt-2">National Apex</h3>
                            <p className="text-gray-400 mt-2 text-sm md:text-base">Awarded Best Student Chapter nationwide.</p>
                        </div>
                        <div>
                            <span className="text-2xl md:text-4xl font-heading font-bold opacity-30">2023</span>
                            <h3 className="text-lg md:text-2xl font-bold mt-2">Source Code</h3>
                            <p className="text-gray-400 mt-2 text-sm md:text-base">Launched open-source initiative with 500+ PRs.</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

const Team = () => {
    const teamData = {
        "FACULTY_SPONSORS": [
            { name: "Dr. Aarti Deshpande", role: "Faculty Sponsor", desc: "Guiding TSEC ACM towards excellence with strategic vision and academic leadership.", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&h=500&fit=crop" },
            { name: "Prof. S. Waghmare", role: "Faculty Incharge", desc: "Overseeing chapter operations and student engagement initiatives.", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&h=500&fit=crop" },
            { name: "Prof. Mani J.", role: "Faculty Incharge", desc: "Mentoring project teams and fostering technical innovation.", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&h=500&fit=crop" },
            { name: "Prof. K. Patel", role: "Faculty Incharge", desc: "Supporting student growth through industry-aligned mentorship.", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&h=500&fit=crop" },
        ],
        "CORE_COMMITTEE": [
            { name: "Taran Shetty", role: "Chairperson", desc: "Leading the chapter with a focus on community building and global tech standards.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&h=500&fit=crop" },
            { name: "Ananya Rai", role: "Vice Chairperson", desc: "Driving internal operations and coordinating between diverse team verticals.", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&h=500&fit=crop" },
            { name: "Rahul Varma", role: "Membership Chair", desc: "Expanding our reach and ensuring value for every TSEC ACM member.", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&h=500&fit=crop" },
            { name: "Ishani Gupta", role: "Treasurer", desc: "Managing chapter finances with precision and strategic allocation.", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&h=500&fit=crop" },
        ],
        "TECHNICAL_FORCE": [
            { name: "Devansh Mehta", role: "Technical Head", desc: "Architecting codebases and leading technical research initiatives.", image: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=400&h=500&fit=crop" },
            { name: "Tanvi Kulkarni", role: "Technical Head", desc: "Specializing in cloud architecture and system design patterns.", image: "https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=400&h=500&fit=crop" },
        ],
        "WEB_ARCHITECTS": [
            { name: "Sahil Shah", role: "Webmaster", desc: "Building immersive digital experiences with modern web stacks.", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&h=500&fit=crop" },
            { name: "Nitya Iyer", role: "Webmaster", desc: "Optimizing web performance and maintaining digital infrastructure.", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&h=500&fit=crop" },
        ],
        "DESIGN_SQUAD": [
            { name: "Arjun Khanna", role: "Creative Designer", desc: "Visual storytelling through high-impact graphic design.", image: "https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=400&h=500&fit=crop" },
            { name: "Pooja Hegde", role: "Creative Designer", desc: "Crafting visual identities that resonate with our tech community.", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&h=500&fit=crop" },
            { name: "Mehak Chawla", role: "UI/UX Designer", desc: "Designing user-centric interfaces for seamless digital navigation.", image: "https://images.unsplash.com/photo-1517841905240-472988bad197?q=80&w=400&h=500&fit=crop" },
        ],
        "CONTENT_STRATEGISTS": [
            { name: "Rohan Deshmukh", role: "Editorial Incharge", desc: "Overseeing all published content and thematic consistency.", image: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=400&h=500&fit=crop" },
            { name: "Kiara Advani", role: "Newsletter Editor", desc: "Curating the latest tech news for our weekly subscriber base.", image: "https://images.unsplash.com/photo-1567532939604-b6c5b0ad2e01?q=80&w=400&h=500&fit=crop" },
            { name: "Kabir Singh", role: "Content Writer", desc: "Translating complex tech concepts into engaging written narratives.", image: "https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=400&h=500&fit=crop" },
        ],
        "MEDIA_TEAM": [
            { name: "Varun Dhawan", role: "Cinematographer", desc: "Capturing the essence of events through dynamic visual lenses.", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&h=500&fit=crop" },
            { name: "Kriti Sanon", role: "Video Editor", desc: "Post-processing visual assets into premium brand stories.", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&h=500&fit=crop" },
            { name: "Ayush Khurana", role: "Social Media Manager", desc: "Managing our digital footprint and community engagement.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&h=500&fit=crop" },
            { name: "Sara Ali", role: "Social Media Manager", desc: "Curating viral content and handling channel outreach.", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&h=500&fit=crop" },
        ],
        "MANAGEMENT_CREW": [
            { name: "Aditya Roy", role: "Operational Head", desc: "Ensuring smooth execution of all logistical and back-end pipelines.", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&h=500&fit=crop" },
            { name: "Tara Sutaria", role: "Event Head", desc: "Conceptualizing and managing large-scale flagship hackathons.", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&h=500&fit=crop" },
            { name: "Ishaan Khatter", role: "Event Head", desc: "Coordinating workshop logistics and speaker onboarding.", image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&h=500&fit=crop" },
            { name: "Alaya F", role: "Event Head", desc: "Managing onsite operations and attendee experience metrics.", image: "https://images.unsplash.com/photo-1517841905240-472988bad197?q=80&w=400&h=500&fit=crop" },
        ],
    };

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

                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                        {members.map((m, i) => (
                            <TeamPersonaCard key={i} member={m} />
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
        <div className="group relative aspect-[3/4] bg-[#020c1b] rounded-xl md:rounded-2xl border border-white/5 hover:border-acm-cyan/40 transition-all duration-500 overflow-hidden select-none touch-manipulation">
            {/* LinkedIn Icon */}
            <a
                href="#"
                onClick={(e) => e.stopPropagation()}
                className="absolute top-3 right-3 md:top-6 md:right-6 z-30 w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-[#0077b5]/10 border border-[#0077b5]/30 rounded-lg hover:bg-[#0077b5] hover:text-white text-[#0077b5] transition-all flex-shrink-0"
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
                    {member.role}
                </p>

                {/* Description — hidden on very small screens to avoid clutter */}
                <p className="hidden sm:block text-gray-300 text-[10px] md:text-xs leading-relaxed font-sans opacity-80 md:group-hover:opacity-100 transition-opacity line-clamp-3">
                    {member.desc}
                </p>

                {/* Persona Image */}
                <div className="mt-auto relative w-full h-32 md:h-56 flex justify-center items-end">
                    <div className="absolute bottom-0 w-24 md:w-40 h-24 md:h-40 bg-acm-cyan/10 rounded-full blur-3xl opacity-40 md:group-hover:opacity-100 transition-opacity duration-700"></div>
                    <img
                        src={member.image}
                        alt={member.name}
                        className="relative z-10 w-full h-full object-cover object-top rounded-t-xl grayscale md:group-hover:grayscale-0 transition-all duration-700"
                        style={{
                            WebkitMaskImage: 'linear-gradient(to top, transparent 5%, black 35%)',
                            maskImage: 'linear-gradient(to top, transparent 5%, black 35%)'
                        }}
                    />
                </div>
            </div>

            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full md:group-hover:translate-x-full transition-transform duration-1000"></div>
        </div>
    );
};








// --- FUSION GALLERY (Tunnel + Drift + Carousel) ---
const FusionGallery = () => {
    const [scrollProgress, setScrollProgress] = useState(0);
    const [activeIndex, setActiveIndex] = useState(-1);

    const items = useMemo(() => {
        const events = [
            {
                slug: "codesprint-26",
                category: "HACKATHON",
                title: "CodeSprint 26",
                desc: "48-hour innovation marathon.",
                images: [
                    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200",
                    "https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=1200",
                    "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200"
                ]
            },
            {
                slug: "system-breach",
                category: "CTF",
                title: "System_Breach",
                desc: "Cybersecurity battlefield.",
                images: [
                    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200",
                    "https://images.unsplash.com/photo-1526378722484-bd91ca387e72?q=80&w=1200"
                ]
            },
            {
                slug: "neural-nets",
                category: "WORKSHOP",
                title: "Neural_Nets",
                desc: "Deep learning immersion.",
                images: [
                    "https://images.unsplash.com/photo-1555949963-aa79dcee981c?q=80&w=1200",
                    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200"
                ]
            },
            {
                slug: "cloud-summit",
                category: "CONFERENCE",
                title: "Cloud_Summit",
                desc: "Cloud-native architecture talks.",
                images: [
                    "https://images.unsplash.com/photo-1492724441997-5dc865305da7?q=80&w=1200",
                    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200"
                ]
            },
            {
                slug: "open-source",
                category: "INITIATIVE",
                title: "Open_Source Drive",
                desc: "30-day contribution marathon.",
                images: [
                    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200",
                    "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?q=80&w=1200"
                ]
            },
            {
                slug: "dev-fest",
                category: "MEETUP",
                title: "Dev_Fest",
                desc: "Community networking night.",
                images: [
                    "https://images.unsplash.com/photo-1503424886307-b090341d25d1?q=80&w=1200",
                    "https://images.unsplash.com/photo-1492724441997-5dc865305da7?q=80&w=1200"
                ]
            }
        ];

        return events.map((event, i) => ({
            ...event,
            id: i,
            z: i * 1200 + 650,
            x: (Math.random() - 0.5) * (window.innerWidth < 768 ? 25 : 150),
            y: (Math.random() - 0.5) * (window.innerWidth < 768 ? 90 : 100),
            rotation: (Math.random() - 0.5) * 45
        }));
    }, []);
useEffect(() => {
    setScrollProgress(items[0].z);
}, [items]);

   useEffect(() => {
    const handleScroll = () => {
        const min = items[0].z;
        const max = items[items.length - 1].z;

        const raw = window.scrollY;

        const clamped = Math.min(Math.max(raw, min), max);

        setScrollProgress(clamped);

        // Optional: lock actual page scroll visually
        if (raw !== clamped) {
            window.scrollTo(0, clamped);
        }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
}, [items]);

    useEffect(() => {
        let closest = -1;
        let minDist = Infinity;

        items.forEach((item, index) => {
            const dist = Math.abs(item.z - scrollProgress);
            if (dist < 600 && dist < minDist) {
                minDist = dist;
                closest = index;
            }
        });

        setActiveIndex(closest);
    }, [scrollProgress, items]);

    const maxZ = items[items.length - 1].z + 2000;

    return (
        <div className="min-h-screen bg-transparent">
             

            <div style={{ height: `${maxZ}px` }} className="absolute top-0 left-0 w-px -z-50" />

            <div className="fixed top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center perspective-[1000px]">
                <div className="relative w-full h-full preserve-3d">
                    {items.map((item, index) => {
                        const isActive = index === activeIndex;
                        const rawZ = -item.z + scrollProgress - 500;

                        return (
                            <FusionCard
                                key={item.id}
                                item={item}
                                isActive={isActive}
                                rawZ={rawZ}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Sub-Component for individual card logic
const FusionCard = ({ item, isActive, rawZ }) => {
    const navigate = ReactRouterDOM.useNavigate();
    const [slide, setSlide] = useState(0);

    // Reset slide when inactive
    useEffect(() => {
        if (!isActive) { setSlide(0); return; }
        // Autoplay slideshow every 3 seconds when card is active
        if (item.images.length <= 1) return;
        const timer = setInterval(() => {
            setSlide(prev => (prev + 1) % item.images.length);
        }, 3000);
        return () => clearInterval(timer);
    }, [isActive, item.images.length]);

    const style = isActive
        ? {
            transform: `translate3d(-50%, -50%, 0) scale(1)`,
            opacity: 1,
            zIndex: 100,
            filter: "none"
        }
        : {
            transform: `translate3d(-50%, -50%, 0) translate3d(${item.x}vw, ${item.y}vh, ${rawZ}px) scale(0.6) rotate(${item.rotation}deg)`,
            opacity: window.innerWidth < 768 ? 0 : Math.max(0.3, (rawZ + 3000) / 3500),
            zIndex: 0,
            filter: "blur(4px) grayscale(100%)"
        };

    const nextSlide = (e) => {
        e.stopPropagation();
        setSlide((prev) => (prev + 1) % item.images.length);
    };

    const prevSlide = (e) => {
        e.stopPropagation();
        setSlide((prev) => (prev - 1 + item.images.length) % item.images.length);
    };

    return (
        <div
            className="absolute top-1/2 left-1/2 w-[95vw] md:w-[900px] h-[55vh] md:h-[70vh] transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
            style={style}
        >
            <div
                onClick={() => navigate(`/events/${item.slug}`)}
                className={`cursor-pointer w-full h-full bg-black/90 border ${isActive ? "border-acm-cyan" : "border-white/10"} rounded-2xl overflow-hidden flex flex-col`}
            >
                <div className="relative flex-1 overflow-hidden">
                    {item.images.map((img, i) => (
                        <div
                            key={i}
                            className="absolute inset-0 transition-opacity duration-500"
                            style={{ opacity: i === slide ? 1 : 0 }}
                        >
                            <img src={img} className="w-full h-full object-cover" />
                        </div>
                    ))}

                    {isActive && item.images.length > 1 && (
                        <>
                            <button
                                onClick={prevSlide}
                                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/70 border border-white/20 rounded-full w-11 h-11 flex items-center justify-center text-white hover:bg-acm-cyan hover:border-acm-cyan hover:text-black transition-all duration-200 shadow-lg"
                                aria-label="Previous image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                            </button>
                            <button
                                onClick={nextSlide}
                                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/70 border border-white/20 rounded-full w-11 h-11 flex items-center justify-center text-white hover:bg-acm-cyan hover:border-acm-cyan hover:text-black transition-all duration-200 shadow-lg"
                                aria-label="Next image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                            </button>
                            {/* Dot indicators */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                                {item.images.map((_, dotIdx) => (
                                    <button
                                        key={dotIdx}
                                        onClick={(e) => { e.stopPropagation(); setSlide(dotIdx); }}
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${ dotIdx === slide ? 'bg-acm-cyan w-5' : 'bg-white/40' }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="p-6 bg-black/40 border-t border-white/10">
                    <span className="text-xs font-mono tracking-[0.3em] text-acm-cyan block mb-2">
                        {item.category}
                    </span>

                    <h2 className="text-2xl font-bold text-white mb-1">
                        {item.title}
                    </h2>

                    <p className="text-gray-400 text-sm">
                        {item.desc}
                    </p>
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
                                        <span className="text-xs">acm.tsec@gmail.com</span>
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

                            // HIDDEN ADMIN HANDSHAKE
                            if (userId.toLowerCase() === 'admin' && email === 'acm.tsec@gmail.com' && message === 'ACM_SECURE_2026') {
                                localStorage.setItem('acm_admin_session', 'active');
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
const eventData = {
    "codesprint-26": {
        title: "CodeSprint 26",
        dateText: "MAR 15 • 48 HOURS • TSEC CAMPUS",
        eventDate: "March 15, 2026 09:00:00",
        prizePool: 100000,
        description: "A 48-hour flagship hackathon transforming ideas into scalable tech products.",
        tracks: [
            "AI & Machine Learning",
            "Cybersecurity",
            "Web3 & Blockchain",
            "Open Innovation"
        ],
        speakers: [
            {
                name: "Rohit Sharma",
                role: "Senior Engineer, Google",
                image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400"
            },
            {
                name: "Ananya Mehta",
                role: "AI Researcher, Microsoft",
                image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400"
            }
        ],
        faqs: [
            { question: "Team size?", answer: "2–4 members allowed." },
            { question: "Is it offline?", answer: "Yes. Fully on campus." },
            { question: "Food provided?", answer: "Yes. All meals included." }
        ]
    },

    "system-breach": {
        title: "System_Breach",
        dateText: "APR 02 • 12 HOURS • CYBER LAB",
        eventDate: "April 2, 2026 10:00:00",
        prizePool: 50000,
        description: "A high-intensity cybersecurity Capture The Flag competition.",
        tracks: [
            "Web Exploitation",
            "Cryptography",
            "Reverse Engineering",
            "Digital Forensics"
        ],
        speakers: [
            {
                name: "Arjun Nair",
                role: "Security Analyst, Deloitte",
                image: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=400"
            }
        ],
        faqs: [
            { question: "Experience required?", answer: "Basic cybersecurity knowledge recommended." },
            { question: "Team size?", answer: "2–3 members." },
            { question: "Prizes?", answer: "Cash rewards + internship opportunities." }
        ]
    },

    "neural-nets": {
        title: "Neural_Nets Workshop",
        dateText: "MAY 10 • 1 DAY • AI LAB",
        eventDate: "May 10, 2026 09:30:00",
        prizePool: 20000,
        description: "Hands-on deep learning workshop covering CNNs and real-world AI deployment.",
        tracks: [
            "Neural Network Fundamentals",
            "Computer Vision",
            "Model Deployment"
        ],
        speakers: [
            {
                name: "Dr. Meera Iyer",
                role: "AI Researcher",
                image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400"
            }
        ],
        faqs: [
            { question: "ML experience needed?", answer: "Basic Python is enough." },
            { question: "Certificate?", answer: "Yes. ACM verified certificate." }
        ]
    },

    "cloud-summit": {
        title: "Cloud_Summit",
        dateText: "JUN 22 • 1 DAY • AUDITORIUM",
        eventDate: "June 22, 2026 10:00:00",
        prizePool: 30000,
        description: "Conference on scalable cloud-native architecture and DevOps.",
        tracks: [
            "Cloud Architecture",
            "Kubernetes",
            "CI/CD Pipelines"
        ],
        speakers: [
            {
                name: "Sahil Verma",
                role: "Cloud Architect, AWS",
                image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400"
            }
        ],
        faqs: [
            { question: "Slides shared?", answer: "Yes. After event." },
            { question: "Who should attend?", answer: "Backend & cloud enthusiasts." }
        ]
    },

    "open-source": {
        title: "Open_Source Drive",
        dateText: "JUL 14 • 30 DAYS • ONLINE",
        eventDate: "July 14, 2026 08:00:00",
        prizePool: 15000,
        description: "Month-long open source contribution initiative.",
        tracks: [
            "Git & Version Control",
            "First PR Guidance",
            "Maintainer Interaction"
        ],
        speakers: [
            {
                name: "Kabir Joshi",
                role: "Open Source Maintainer",
                image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400"
            }
        ],
        faqs: [
            { question: "Beginner friendly?", answer: "Yes." },
            { question: "Mentorship?", answer: "Dedicated mentors available." }
        ]
    },

    "dev-fest": {
        title: "Dev_Fest Meetup",
        dateText: "AUG 30 • EVENING • CAMPUS HUB",
        eventDate: "August 30, 2026 17:00:00",
        prizePool: 10000,
        description: "Community developer meetup with talks and networking.",
        tracks: [
            "Lightning Talks",
            "Startup Pitches",
            "Networking"
        ],
        speakers: [
            {
                name: "Nitya Rao",
                role: "Startup Founder",
                image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400"
            }
        ],
        faqs: [
            { question: "Open to all?", answer: "Yes." },
            { question: "Food?", answer: "Evening refreshments provided." }
        ]
    }
};
const EventDetail = () => {
    const { slug } = ReactRouterDOM.useParams();
    const event = eventData[slug];

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

                <div className="w-full md:w-80 sticky top-32">
                    <MagneticButton onClick={() => setShowRegister(true)} className="w-full py-5 bg-white text-black font-bold tracking-widest hover:bg-acm-cyan transition-colors shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                        REGISTER_NOW
                    </MagneticButton>
                    <div className="mt-4 p-4 border border-white/10 bg-white/5 rounded-xl text-[10px] font-mono text-gray-500 uppercase leading-loose">
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

            {/* Registration Modal */}
            {showRegister && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4 overflow-y-auto pt-20 pb-10">
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowRegister(false)}></div>
                    <div className="relative w-full max-w-lg bg-[#020c1b] border border-acm-cyan/30 rounded-2xl p-6 md:p-10 shadow-[0_0_100px_rgba(0,255,136,0.2)] overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-acm-cyan to-transparent"></div>
                        
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-heading font-bold text-white uppercase tracking-tighter">EVENT_REGISTRATION</h2>
                                <p className="text-acm-cyan font-mono text-[10px] mt-1 tracking-widest uppercase">Target: {event.title}</p>
                            </div>
                            <button onClick={() => setShowRegister(false)} className="text-gray-500 hover:text-white transition-colors text-2xl">✕</button>
                        </div>

                        <form className="space-y-5" onSubmit={e => {
                            e.preventDefault();
                            const data = {
                                event: event.title,
                                eventSlug: slug,
                                name: e.target[0].value,
                                team: e.target[1].value,
                                email: e.target[2].value,
                                timestamp: new Date().toLocaleString()
                            };
                            
                            const existing = JSON.parse(localStorage.getItem('acm_registrations') || '[]');
                            localStorage.setItem('acm_registrations', JSON.stringify([data, ...existing]));

                            alert("UPLINK_STABLISHED :: REGISTRATION_LOGGED");
                            setShowRegister(false);
                        }}>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] text-acm-cyan/70 font-mono uppercase tracking-widest">// FULL_NAME</label>
                                <input type="text" required placeholder="John Doe" className="w-full bg-white/5 border border-white/10 p-3.5 text-white rounded-lg focus:border-acm-cyan outline-none transition-all placeholder:text-gray-600"/>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] text-acm-cyan/70 font-mono uppercase tracking-widest">// TEAM_NAME</label>
                                <input type="text" required placeholder="Binary_Bards" className="w-full bg-white/5 border border-white/10 p-3.5 text-white rounded-lg focus:border-acm-cyan outline-none transition-all placeholder:text-gray-600"/>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] text-acm-cyan/70 font-mono uppercase tracking-widest">// DECODE_ID (EMAIL)</label>
                                <input type="email" required placeholder="pilot@matrix.com" className="w-full bg-white/5 border border-white/10 p-3.5 text-white rounded-lg focus:border-acm-cyan outline-none transition-all placeholder:text-gray-600"/>
                            </div>
                            
                            <div className="pt-4">
                                <button type="submit" className="w-full py-4 bg-acm-cyan text-black font-bold tracking-[.3em] uppercase hover:bg-white transition-all shadow-[0_0_20px_rgba(100,255,218,0.2)] active:scale-[0.98]">
                                    CONFIRM_UPLINK
                                </button>
                                <p className="text-[9px] font-mono text-gray-500 mt-4 text-center opacity-60">
                                    BY PROCEEDING, YOU AGREE TO THE PROTOCOLS OF TSEC ACM.
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};



// --- MANAGEMENT PAGE ---
const Management = () => {
    const navigate = ReactRouterDOM.useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [registrations, setRegistrations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [filterEvent, setFilterEvent] = useState('all');

    useEffect(() => {
        if (localStorage.getItem('acm_admin_session') !== 'active') {
            navigate('/contact');
        }
        setRegistrations(JSON.parse(localStorage.getItem('acm_registrations') || '[]'));
        setMessages(JSON.parse(localStorage.getItem('acm_messages') || '[]'));
    }, []);

    const logout = () => {
        localStorage.removeItem('acm_admin_session');
        navigate('/contact');
    };

    const clearData = (key) => {
        if(confirm(`Wipe all ${key} data?`)){
            localStorage.removeItem(`acm_${key}`);
            if(key === 'registrations') setRegistrations([]);
            else setMessages([]);
        }
    }

    const regCounts = registrations.reduce((acc, curr) => {
        acc[curr.event] = (acc[curr.event] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="min-h-screen pt-32 px-4 md:px-20 text-white pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-white/10 pb-10">
                <div>
                    <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-tighter">CHAPTER_MANAGEMENT</h1>
                    <p className="text-acm-cyan font-mono text-[10px] tracking-[0.3em] mt-2 opacity-60">:: ACCESS_LEVEL_AUTHORITY :: ENCRYPTED_LINK_ACTIVE</p>
                </div>
                <button onClick={logout} className="text-[10px] font-mono text-red-500 border border-red-500/30 px-6 py-3 uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all rounded-none">TERMINATE_SESSION</button>
            </div>

            {/* TAB STRIP */}
            <div className="flex gap-4 mb-10 overflow-x-auto pb-2 border-b border-white/5 font-mono text-xs uppercase tracking-widest">
                <button onClick={() => setActiveTab('overview')} className={`pb-4 px-2 whitespace-nowrap transition-all ${activeTab === 'overview' ? 'text-acm-cyan border-b border-acm-cyan' : 'text-gray-500 hover:text-white'}`}>[ OVERVIEW ]</button>
                <button onClick={() => setActiveTab('registrations')} className={`pb-4 px-2 whitespace-nowrap transition-all ${activeTab === 'registrations' ? 'text-acm-cyan border-b border-acm-cyan' : 'text-gray-500 hover:text-white'}`}>[ REGISTRATIONS ({registrations.length}) ]</button>
                <button onClick={() => setActiveTab('messages')} className={`pb-4 px-2 whitespace-nowrap transition-all ${activeTab === 'messages' ? 'text-acm-cyan border-b border-acm-cyan' : 'text-gray-500 hover:text-white'}`}>[ INBOX ({messages.length}) ]</button>
            </div>

            {activeTab === 'overview' && (
                <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:border-acm-cyan/30 transition-colors">
                            <h3 className="text-acm-cyan font-mono text-[10px] mb-6 uppercase tracking-widest">// TOTAL_REGISTRATIONS</h3>
                            <div className="text-6xl font-bold flex items-baseline gap-2">{registrations.length}<span className="text-sm font-normal text-gray-600">NODES</span></div>
                        </div>
                        <div className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:border-acm-cyan/30 transition-colors">
                            <h3 className="text-acm-cyan font-mono text-[10px] mb-6 uppercase tracking-widest">// SYSTEM_HEALTH</h3>
                            <div className="text-6xl font-bold text-green-500">99.2%</div>
                            <p className="text-gray-500 text-[10px] mt-4 uppercase">Load Balanced Across 14 Sectors</p>
                        </div>
                        <div className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:border-acm-cyan/30 transition-colors">
                            <h3 className="text-acm-cyan font-mono text-[10px] mb-6 uppercase tracking-widest">// SECURE_INBOX</h3>
                            <div className="text-6xl font-bold text-acm-cyan border-b-4 border-acm-cyan/20 inline-block">{messages.length}</div>
                        </div>
                    </div>

                    <div className="p-10 border border-white/10 bg-white/2 rounded-2xl">
                        <h2 className="text-xl font-bold mb-8 font-heading text-white uppercase tracking-tighter flex items-center gap-3">
                            <span className="w-2 h-2 bg-acm-cyan rounded-full animate-pulse"></span>
                            ACTIVE_EVENT_METRICS
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Object.keys(eventData).map(slug => {
                                const title = eventData[slug].title;
                                const count = regCounts[title] || 0;
                                return (
                                    <div 
                                        key={slug} 
                                        onClick={() => {
                                            setFilterEvent(title);
                                            setActiveTab('registrations');
                                        }}
                                        className="p-4 border border-white/5 bg-black/40 rounded-xl relative overflow-hidden group cursor-pointer hover:bg-white/5 transition-all active:scale-[0.98]"
                                    >
                                        <div className="relative z-10">
                                            <p className="text-gray-500 text-[9px] font-mono mb-1 uppercase tracking-widest">ID: {slug}</p>
                                            <h4 className="font-bold text-sm mb-4">{title}</h4>
                                            <div className="text-3xl font-heading font-black text-acm-cyan">{count}</div>
                                            <p className="text-[10px] text-gray-600 mt-1 uppercase transition-all group-hover:text-gray-400">Registrations</p>
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-20 h-20 bg-acm-cyan/5 rounded-full blur-2xl -mr-10 -mb-10 transition-all group-hover:bg-acm-cyan/10"></div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'registrations' && (
                <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/2">
                        <div className="flex items-center gap-4">
                            <h2 className="font-mono text-xs uppercase tracking-widest text-acm-cyan">// REGISTRATION_RECORDS</h2>
                            {filterEvent !== 'all' && (
                                <div className="flex items-center gap-2 bg-acm-cyan/10 border border-acm-cyan/20 px-3 py-1 rounded-full">
                                    <span className="text-[9px] text-acm-cyan font-mono uppercase font-bold tracking-tighter">Event: {filterEvent}</span>
                                    <button onClick={() => setFilterEvent('all')} className="text-acm-cyan hover:text-white transition-colors text-xs leading-none">✕</button>
                                </div>
                            )}
                        </div>
                        <button onClick={() => clearData('registrations')} className="text-[9px] text-gray-600 hover:text-red-500 uppercase transition-colors underline-offset-4 underline">Clear Records</button>
                    </div>
                    {registrations.length === 0 ? (
                        <div className="p-20 text-center text-gray-600 font-mono text-xs italic uppercase tracking-widest">NO_RECORDS_FOUND_IN_LOCAL_BUFFER</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs font-mono">
                                <thead className="bg-white/5 border-b border-white/10 text-gray-500">
                                    <tr>
                                        <th className="p-4 tracking-widest">TIMESTAMP</th>
                                        <th className="p-4 tracking-widest">TARGET_EVENT</th>
                                        <th className="p-4 tracking-widest">NAME</th>
                                        <th className="p-4 tracking-widest">TEAM</th>
                                        <th className="p-4 tracking-widest">EMAIL_UPLINK</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {registrations
                                        .filter(reg => filterEvent === 'all' || reg.event === filterEvent)
                                        .map((reg, i) => (
                                            <tr key={i} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-4 text-gray-500">{reg.timestamp}</td>
                                                <td className="p-4 text-acm-cyan">{reg.event}</td>
                                                <td className="p-4 font-bold text-white capitalize">{reg.name}</td>
                                                <td className="p-4 text-gray-300">{reg.team}</td>
                                                <td className="p-4 text-gray-400 group-hover:text-white transition-colors">{reg.email}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                            {(filterEvent !== 'all' && registrations.filter(reg => reg.event === filterEvent).length === 0) && (
                                <div className="p-20 text-center text-gray-600 font-mono text-xs italic uppercase tracking-widest underline">NO_UPLINKS_DETECTED_FOR_THIS_SECTOR</div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'messages' && (
                <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
                     <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/2">
                        <h2 className="font-mono text-xs uppercase tracking-widest text-acm-cyan">// SECURE_SIGNALS_RECEIVED</h2>
                        <button onClick={() => clearData('messages')} className="text-[9px] text-gray-600 hover:text-red-500 uppercase transition-colors underline-offset-4 underline">Clear Inbox</button>
                    </div>
                    {messages.length === 0 ? (
                        <div className="p-20 text-center text-gray-600 font-mono text-xs italic uppercase tracking-widest">INBOX_EMPTY :: SILENCE_DETECTED</div>
                    ) : (
                        <div className="divide-y divide-white/10">
                            {messages.map((msg, i) => (
                                <div key={i} className="p-6 hover:bg-white/5 transition-all">
                                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-acm-cyan/10 border border-acm-cyan/20 flex items-center justify-center text-acm-cyan font-bold uppercase">{msg.user[0]}</div>
                                            <div>
                                                <h4 className="font-bold text-sm tracking-tight capitalize">{msg.user}</h4>
                                                <p className="text-[10px] text-gray-500 font-mono">{msg.email}</p>
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">{msg.timestamp}</span>
                                    </div>
                                    <div className="p-4 bg-white/5 border border-white/5 rounded-xl ml-0 md:ml-14 text-sm leading-relaxed text-gray-300 italic border-l-2 border-l-acm-cyan/40">
                                        "{msg.content}"
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- APP ROOT ---
const App = () => {
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