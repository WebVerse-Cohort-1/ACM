const { useState, useEffect, useRef, useMemo, useCallback } = React;
const { HashRouter, Routes, Route, Link, useLocation, useNavigate, useParams } = ReactRouterDOM;

// --- CONFIG ---
// This is the primary link between your website and Google Sheets.
// Hardcoding it here ensures data syncs automatically on any new device.
const ACM_MASTER_GAS_URL = "https://script.google.com/macros/s/AKfycbxDtzQ8WmDF3tGeRdq9YzORYD0xHmYd7Lwh0zfR-GS7T-edTPySnFDvb9E8T5fwivExjw/exec";


// --- MEDIA UTILS ---
const getDirectDriveUrl = (url) => {
    if (!url) return '';
    // Strip crop info if present (e.g., url|50|50|1.2)
    const cleanUrl = url.split('|')[0];
    if (cleanUrl.includes('drive.google.com')) {
        // Broad regex to catch any FILE_ID in a typical Google Drive URL
        const match = cleanUrl.match(/\/(?:file\/d|d|e)\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/id=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            // Using the thumbnail endpoint bypasses Google's recent 3rd-party cookie & CORS hotlink blocks
            return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
        }
    }
    return cleanUrl;
};

const getImageStyle = (imageStr) => {
    if (!imageStr || !imageStr.includes('|')) return { objectFit: 'cover' };
    const parts = imageStr.split('|');
    if (parts.length < 4) return { objectFit: 'cover' };
    const [_, x, y, scale] = parts;
    return {
        objectFit: 'cover',
        objectPosition: `${x}% ${y}%`,
        transform: `scale(${scale})`,
        transformOrigin: `${x}% ${y}%`
    };
};

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
        // High DPI support
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.domElement.style.position = 'fixed';
        renderer.domElement.style.top = '0';
        renderer.domElement.style.left = '0';
        renderer.domElement.style.zIndex = '-10'; // Bring it slightly forward
        renderer.domElement.style.opacity = '1';  // Restore full particle visibility
        document.body.appendChild(renderer.domElement);

        // --- WAVE PARTICLES ---
        const particleCount = isMobile ? 120 : 400;
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
            if (document.body.contains(renderer.domElement)) document.body.removeChild(renderer.domElement);
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

const Home = () => {
    const [data, setData] = useState({
        homeHeading1: "FUTURE",
        homeHeading2: "READY",
        homeHeading3: "ENGINEERS",
        homeDesc: "The Official ACM Student Chapter of TSEC.\nWe don't just write code; we architect experiences."
    });

    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem('acm_about'));
            if (stored) {
                setData(prev => ({
                    ...prev,
                    ...stored
                }));
            }
        } catch (e) {}
    }, []);

    return (
        <div className="min-h-screen flex flex-col justify-center px-6 md:px-20 pt-24 md:pt-20 pb-16">
            <div className="max-w-4xl">
                <div className="overflow-hidden mb-3">
                    <p className="text-acm-cyan font-mono text-xs md:text-sm tracking-[0.2em] md:tracking-[0.3em]">
                        :: SYSTEM_READY
                    </p>
                </div>

                <h1 className="text-5xl sm:text-6xl md:text-9xl font-heading font-bold leading-[0.9] md:leading-[0.85] mb-6 md:mb-8 mix-blend-screen">
                    <GlitchText text={data.homeHeading1 || "FUTURE"} /><br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 uppercase">{data.homeHeading2 || "READY"}</span><br />
                    <span className="text-acm-blue uppercase">{data.homeHeading3 || "ENGINEERS"}</span>
                </h1>

                <p className="text-gray-400 text-base md:text-xl max-w-xl mb-8 md:mb-12 leading-relaxed border-l-2 border-acm-cyan/30 pl-4 md:pl-6 whitespace-pre-line">
                    {data.homeDesc || "The Official ACM Student Chapter of TSEC.\nWe don't just write code; we architect experiences."}
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
};

const Events = () => {
    const [events, setEvents] = useState([]);
    const location = useLocation();

    useEffect(() => {
        try {
            const data = JSON.parse(localStorage.getItem('acm_events') || '[]').map(ev => ({
                slug: ev.slug,
                title: ev.title,
                date: ev.dateText || 'TBA',
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
                <h2 className="text-3xl md:text-6xl font-heading font-bold text-white uppercase tracking-tighter">
                    EVENT_<span className="text-acm-cyan">LOGS</span>
                </h2>
                <p className="text-gray-400 font-mono text-xs tracking-widest mt-2 md:mt-0 uppercase font-semibold">:: UPCOMING_OPERATIONS</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                {events.map((ev) => (
                    <Link key={ev.slug} to={`/events/${ev.slug}`} className="block">
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
                                        <img src={getDirectDriveUrl(ev.image)} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
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

// --- SCROLL REVEAL HOOK ---
const useScrollReveal = (threshold = 0.15) => {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
            { threshold }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);
    return [ref, isVisible];
};

// --- TYPING EFFECT COMPONENT ---
const TerminalTyping = ({ text, delay = 0, className = "" }) => {
    const [displayed, setDisplayed] = useState("");
    const [started, setStarted] = useState(false);
    const [ref, isVisible] = useScrollReveal(0.3);

    useEffect(() => {
        if (isVisible && !started) {
            const timer = setTimeout(() => setStarted(true), delay);
            return () => clearTimeout(timer);
        }
    }, [isVisible, started, delay]);

    useEffect(() => {
        if (!started) return;
        let i = 0;
        const interval = setInterval(() => {
            setDisplayed(text.slice(0, i + 1));
            i++;
            if (i >= text.length) clearInterval(interval);
        }, 30);
        return () => clearInterval(interval);
    }, [started, text]);

    return (
        <span ref={ref} className={className}>
            {displayed}
            {started && displayed.length < text.length && (
                <span className="inline-block w-2 h-5 bg-acm-cyan ml-1 animate-pulse" />
            )}
        </span>
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
            if (stored) {
                setAboutData(prev => ({ ...prev, ...stored }));
            }
        } catch (e) {
            console.error("About Data Load Error:", e);
        }
    }, [location.pathname]);

    // Handle stats animation re-triggering if data updates
    useEffect(() => {
        if (aboutData.stats) {
            setCounts(aboutData.stats.map(() => 0));
            setHasAnimated(false);
        }
    }, [aboutData.stats]);

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

    const objectives = [
        { id: "01", title: "Enhance Technical Competence", desc: "Strengthen students' core knowledge in programming, algorithms, AI, and emerging technologies through workshops, coding contests, and hands-on sessions.", icon: "⚡" },
        { id: "02", title: "Promote Innovation & Problem-Solving", desc: "Encourage students to develop innovative solutions for real-world challenges through hackathons, projects, and research-driven activities.", icon: "💡" },
        { id: "03", title: "Foster Research & Development Culture", desc: "Motivate students to explore research, publish papers, and participate in technical conferences and competitions.", icon: "🔬" },
        { id: "04", title: "Build a Collaborative Tech Community", desc: "Create a platform for peer learning, knowledge sharing, and collaboration among students, faculty, and industry professionals.", icon: "🤝" },
        { id: "05", title: "Develop Leadership & Teamwork Skills", desc: "Provide opportunities for students to lead, organize, and manage technical and non-technical events.", icon: "🚀" },
        { id: "06", title: "Bridge Academia and Industry", desc: "Connect students with industry experts through guest lectures, mentorship programs, and internships.", icon: "🌉" },
        { id: "07", title: "Encourage Socially Relevant Computing", desc: "Use technology for solving societal issues through projects, awareness drives, and community-focused initiatives.", icon: "🌍" },
        { id: "08", title: "Promote Inclusivity & Equal Opportunities", desc: "Ensure participation from students of all backgrounds and encourage diversity in technology fields.", icon: "♾️" },
        { id: "09", title: "Support Open Source & Continuous Learning", desc: "Encourage contributions to open-source projects and promote lifelong learning through continuous upskilling.", icon: "📖" },
        { id: "10", title: "Enhance Communication & Technical Expression", desc: "Develop students' ability to present ideas, explain concepts, and communicate technical knowledge effectively.", icon: "🎯" },
    ];

    const missions = [
        { text: "To cultivate critical thinking and technical excellence through hands-on learning, competitions, and collaborative projects.", icon: "🧠" },
        { text: "To promote innovation and research by encouraging students to explore emerging technologies and build impactful solutions.", icon: "🔭" },
        { text: "To nurture leadership, entrepreneurship, and teamwork through diverse technical and creative initiatives.", icon: "⭐" },
        { text: "To create a strong tech community that bridges academia, industry, and society.", icon: "🔗" },
    ];

    const taglines = [
        "Innovate. Integrate. Impact.",
        "Building Coders. Creating Innovators.",
        "Think Tech. Build the Future.",
        "From Code to Change."
    ];

    const [activeTagline, setActiveTagline] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTagline(prev => (prev + 1) % taglines.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const [visionRef, visionVisible] = useScrollReveal();
    const [missionRef, missionVisible] = useScrollReveal();
    const [objRef, objVisible] = useScrollReveal();

    return (
        <div className="min-h-screen pt-32 px-6 md:px-20 max-w-7xl mx-auto pb-32">

            {/* === HERO SECTION === */}
            <div className="mb-32 relative">
                <h1 className="text-8xl md:text-[10rem] font-heading font-bold opacity-[0.03] absolute -top-10 -left-4 pointer-events-none select-none z-0">
                    ABOUT
                </h1>
                <div className="relative z-10">
                    <p className="text-acm-cyan font-mono text-xs tracking-[0.5em] mb-6 animate-pulse">
                        :: SYSTEM_PROFILE_LOADED
                    </p>
                    <h2 className="text-5xl md:text-7xl font-heading font-bold text-white mb-4">
                        WHO_WE<span className="text-acm-cyan">_ARE</span>
                    </h2>
                    <p className="text-xl md:text-2xl text-gray-400 max-w-3xl leading-relaxed border-l-2 border-acm-cyan/30 pl-6">
                        We are the <span className="text-white font-bold">architects</span> of the digital frontier.
                        TSEC ACM is not just a club; it's an incubator for those who dare to
                        <span className="italic text-acm-cyan/80"> disrupt</span> the status quo.
                    </p>

                    {/* Rotating Tagline */}
                    <div className="mt-8 h-12 relative overflow-hidden">
                        {taglines.map((t, i) => (
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
                </div>
            </div>

            {/* === STATS COUNTER === */}
            <div
                ref={statsRef}
                className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16 mb-40"
            >
                {stats.map((stat, i) => (
                    <div
                        key={i}
                        className="text-center group transition-transform duration-500 hover:-translate-y-3 relative"
                    >
                        <div className="absolute inset-0 bg-acm-cyan/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                        <h3 className="text-6xl md:text-7xl font-heading font-bold text-acm-cyan relative mb-2">
                            {counts[i]}+
                            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-acm-cyan group-hover:w-full transition-all duration-500"></span>
                        </h3>
                        <p className="text-xs tracking-[0.3em] text-gray-500 mt-3 font-mono">
                            {stat.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* === VISION SECTION === */}
            <div ref={visionRef} className={`mb-40 transition-all duration-1000 ${visionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>
                <div className="flex items-center gap-6 mb-10">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-acm-cyan rounded-full animate-pulse shadow-[0_0_15px_rgba(100,255,218,0.5)]" />
                        <h2 className="text-3xl md:text-5xl font-heading font-bold text-white">
                            VISION<span className="text-acm-cyan">_</span>
                        </h2>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-acm-cyan/30 to-transparent" />
                    <span className="font-mono text-[9px] text-acm-cyan/40 tracking-[0.5em] hidden md:block">MODULE_01</span>
                </div>

                <div className="relative group">
                    {/* Glow backdrop */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-acm-cyan/10 via-blue-500/5 to-purple-500/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <div className="relative bg-white/[0.03] border border-white/10 rounded-2xl p-8 md:p-14 backdrop-blur-md group-hover:border-acm-cyan/30 transition-all duration-700 overflow-hidden">
                        {/* Decorative corner brackets */}
                        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-acm-cyan/30 rounded-tl-sm" />
                        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-acm-cyan/30 rounded-br-sm" />

                        {/* Scan line animation */}
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-acm-cyan/40 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[movedown_3s_linear_infinite]" />

                        <p className="font-mono text-[10px] text-acm-cyan/60 tracking-[0.4em] mb-6">// CORE_DIRECTIVE</p>

                        <blockquote className="text-2xl md:text-4xl font-light leading-relaxed text-white/90">
                            <span className="text-acm-cyan text-5xl font-serif leading-none mr-2">"</span>
                            To build a <span className="text-acm-cyan font-semibold">future-ready community</span> of innovators who leverage computing to solve{' '}
                            <span className="text-white font-semibold">real-world problems</span> and drive meaningful{' '}
                            <span className="bg-gradient-to-r from-acm-cyan to-blue-400 bg-clip-text text-transparent font-semibold">societal impact</span>.
                            <span className="text-acm-cyan text-5xl font-serif leading-none ml-1">"</span>
                        </blockquote>

                        <div className="mt-8 flex flex-wrap gap-4">
                            {["Innovation", "Real-World Impact", "Societal Progress"].map((tag, i) => (
                                <span key={i} className="px-4 py-1.5 border border-acm-cyan/20 rounded-full text-[10px] font-mono tracking-[0.2em] text-acm-cyan/70 bg-acm-cyan/5 hover:bg-acm-cyan/10 hover:border-acm-cyan/40 transition-all duration-300 cursor-default">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* === MISSION SECTION === */}
            <div ref={missionRef} className={`mb-40 transition-all duration-1000 delay-200 ${missionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>
                <div className="flex items-center gap-6 mb-12">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(96,165,250,0.5)]" />
                        <h2 className="text-3xl md:text-5xl font-heading font-bold text-white">
                            MISSION<span className="text-blue-400">_</span>
                        </h2>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-blue-400/30 to-transparent" />
                    <span className="font-mono text-[9px] text-blue-400/40 tracking-[0.5em] hidden md:block">MODULE_02</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {missions.map((m, i) => (
                        <div
                            key={i}
                            className="group relative"
                            style={{ animationDelay: `${i * 150}ms` }}
                        >
                            {/* Hover glow */}
                            <div className="absolute -inset-2 bg-blue-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative bg-white/[0.03] border border-white/10 rounded-xl p-6 md:p-8 h-full group-hover:border-blue-400/30 group-hover:bg-white/[0.05] transition-all duration-500 overflow-hidden">
                                {/* Top accent bar */}
                                <div className="absolute top-0 left-0 w-0 h-[2px] bg-gradient-to-r from-blue-400 to-acm-cyan group-hover:w-full transition-all duration-700" />

                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 bg-blue-500/10 border border-blue-400/20 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-500">
                                        {m.icon}
                                    </div>
                                    <div className="flex-1">
                                        <span className="font-mono text-[9px] text-blue-400/50 tracking-[0.3em] block mb-2">M{i + 1}_DIRECTIVE</span>
                                        <p className="text-gray-300 text-sm md:text-base leading-relaxed group-hover:text-white/90 transition-colors duration-500">
                                            {m.text}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* === OBJECTIVES SECTION === */}
            <div ref={objRef} className={`mb-40 transition-all duration-1000 delay-300 ${objVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>
                <div className="flex items-center gap-6 mb-12">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(192,132,252,0.5)]" />
                        <h2 className="text-3xl md:text-5xl font-heading font-bold text-white">
                            OBJECTIVES<span className="text-purple-400">_</span>
                        </h2>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-purple-400/30 to-transparent" />
                    <span className="font-mono text-[9px] text-purple-400/40 tracking-[0.5em] hidden md:block">MODULE_03</span>
                </div>

                {/* Objectives Terminal Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {objectives.map((obj, i) => {
                        const [objItemRef, objItemVisible] = useScrollReveal(0.1);
                        return (
                            <div
                                key={obj.id}
                                ref={objItemRef}
                                className={`group relative transition-all duration-700 ${objItemVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                                style={{ transitionDelay: `${i * 80}ms` }}
                            >
                                <div className="relative bg-white/[0.02] border border-white/[0.06] rounded-lg p-5 md:p-6 hover:border-purple-400/30 hover:bg-white/[0.04] transition-all duration-500 overflow-hidden h-full">
                                    {/* Left accent */}
                                    <div className="absolute left-0 top-0 w-[2px] h-0 bg-gradient-to-b from-purple-400 to-acm-cyan group-hover:h-full transition-all duration-700" />

                                    <div className="flex items-start gap-4 pl-2">
                                        <div className="flex-shrink-0">
                                            <span className="text-2xl block mb-1 group-hover:scale-125 transition-transform duration-500">{obj.icon}</span>
                                            <span className="font-mono text-[10px] text-purple-400/60 tracking-widest">{obj.id}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm md:text-base font-bold text-white/90 mb-2 group-hover:text-purple-300 transition-colors duration-500">
                                                {obj.title}
                                            </h4>
                                            <p className="text-xs md:text-sm text-gray-500 leading-relaxed group-hover:text-gray-400 transition-colors duration-500">
                                                {obj.desc}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Terminal Footer */}
                <div className="mt-8 text-center">
                    <p className="font-mono text-[10px] text-gray-600 tracking-[0.4em] animate-pulse">
                        :: {objectives.length}_OBJECTIVES_LOADED :: STATUS_ACTIVE ::
                    </p>
                </div>
            </div>

            {/* === LEGACY LOGS === */}
            <div className="mb-20">
                <div className="flex items-center gap-6 mb-12">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                        <h2 className="text-3xl md:text-5xl font-heading font-bold text-white">
                            LEGACY<span className="text-amber-400">_</span>LOGS
                        </h2>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-amber-400/30 to-transparent" />
                    <span className="font-mono text-[9px] text-amber-400/40 tracking-[0.5em] hidden md:block">MODULE_04</span>
                </div>

                <div className="border-l-2 border-white/10 pl-8 md:pl-12 space-y-16 relative">
                    {/* Animated Pulse on timeline */}
                    <div className="absolute left-[-5px] top-0 w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)] animate-ping" />

                    <div className="group">
                        <span className="text-5xl font-heading font-bold text-white/10 group-hover:text-amber-400/30 transition-colors duration-500">2025</span>
                        <h3 className="text-2xl font-bold mt-2 text-white group-hover:text-amber-300 transition-colors duration-500">National Apex</h3>
                        <p className="text-gray-400 mt-2 group-hover:text-gray-300 transition-colors duration-500">
                            Awarded Best Student Chapter nationwide.
                        </p>
                    </div>
                    <div className="group">
                        <span className="text-5xl font-heading font-bold text-white/10 group-hover:text-amber-400/30 transition-colors duration-500">2023</span>
                        <h3 className="text-2xl font-bold mt-2 text-white group-hover:text-amber-300 transition-colors duration-500">Source Code</h3>
                        <p className="text-gray-400 mt-2 group-hover:text-gray-300 transition-colors duration-500">
                            Launched open-source initiative with 500+ PRs.
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
};

const Team = () => {
    const teamData = {
        "CHIEF_PATRON": [
            { name: "Vaishali Rane", role: "Chief Patron", desc: "Leading with strategic vision and providing overarching support for the chapter's mission.", image: "./Photoshot ACM/vaishali rane.jpeg", linkedin: "#" },
        ],
        "SPONSORS_AND_COORDINATORS": [
            { name: "Smita Dandge", role: "Faculty Sponsor", desc: "Guiding the chapter with academic leadership and professional mentorship.", image: "./Photoshot ACM/smita dange.jpeg", linkedin: "#" },
            { name: "Kashif Sheikh", role: "Faculty Co-Sponsor", desc: "Providing strategic guidance and support for chapter initiatives.", image: "./Photoshot ACM/kashif sheikh.jpeg", linkedin: "#" },
        ],
        "CHAIRPERSONS": [
            { name: "Aaditya Devghare", role: "Chairperson", desc: "Leading the chapter with a focus on community building and global tech standards.", image: "./Photoshot ACM/aditya devghare.jpeg", linkedin: "https://www.linkedin.com/in/aaditya-devghare" },
            { name: "Ishika Mehta", role: "Vice Chairperson", desc: "Driving internal operations and coordinating between diverse team verticals.", image: "./Photoshot ACM/ishika mehta.jpeg", linkedin: "https://www.linkedin.com/in/ishika-mehta-" },
            { name: "Nigam Tiwari", role: "Membership Chair", desc: "Expanding our reach and ensuring value for every TSEC ACM member.", image: "./Photoshot ACM/nigam tiwari.png", linkedin: "https://www.linkedin.com/in/nigam-tiwari-8a76233a3" },
        ],
        "TREASURER_AND_SECRETARY": [
            { name: "Sagar Gupta", role: "Treasurer", desc: "Managing chapter finances with precision and strategic allocation.", image: "./Photoshot ACM/sagar gupta.jpeg", linkedin: "https://www.linkedin.com/in/sagar-gupta-8788052ab" },
            { name: "Aditya Mishra", role: "Secretary", desc: "Overseeing administrative tasks and maintaining chapter records.", image: "./Photoshot ACM/aditya mishra.jpeg", linkedin: "https://www.linkedin.com/in/aditya-mishra-b76b7436a" },
        ],
        "TECHNICAL_TEAM": [
            { name: "Shivam Pal", role: "Technical Head", desc: "Architecting codebases and leading technical research initiatives.", image: "./Photoshot ACM/shivam pal.jpeg", linkedin: "https://www.linkedin.com/in/shivampal7" },
            { name: "Aman Mandal", role: "Technical Head", desc: "Specializing in software architecture and technical implementation.", image: "./Photoshot ACM/aman mandal.jpeg", linkedin: "https://www.linkedin.com/in/amanmandal35" },
            { name: "Rushab Singh", role: "Webmaster", desc: "Building immersive digital experiences with modern web stacks.", image: "./Photoshot ACM/rushabh singh.jpeg", linkedin: "#" },
            { name: "Subham Singh", role: "Webmaster", desc: "Optimizing web performance and maintaining digital infrastructure.", image: "./Photoshot ACM/shubham singh.jpeg", linkedin: "https://www.linkedin.com/in/shubham-singh-564602314" },
        ],
        "CREATIVE_TEAM": [
            { name: "Krishi Oza", role: "Creative Designer", desc: "Visual storytelling through high-impact graphic design.", image: "./Photoshot ACM/krishi oza.jpeg", linkedin: "https://www.linkedin.com/in/krishi-oza-86399a3b2" },
            { name: "Janish Dave", role: "Creative Designer", desc: "Crafting visual identities that resonate with our tech community.", image: "./Photoshot ACM/jainish dave.jpeg", linkedin: "#" },
            { name: "Samhita Hejmadi", role: "UI/UX Designer", desc: "Designing user-centric interfaces for seamless digital navigation.", image: "./Photoshot ACM/samhita hejmadi.jpeg", linkedin: "https://www.linkedin.com/in/samhita-hejmadi-7a0892262" },
            { name: "Sahir Sheikh", role: "UI/UX Designer", desc: "Creating intuitive user journeys and aesthetic digital interfaces.", image: "./Photoshot ACM/sahir sheikh.jpeg", linkedin: "https://www.linkedin.com/in/sahir-shaikh-b19b90281" },
        ],
        "DOCUMENTATION": [
            { name: "Amaan Sheikh", role: "Newsletter Editor", desc: "Curating the latest tech news for our weekly subscriber base.", image: "./Photoshot ACM/amaan sheikh.jpeg", linkedin: "https://www.linkedin.com/in/mohammed-amaan-shaikh-2a5518346" },
            { name: "Aadiish Shukla", role: "Content Writer", desc: "Translating complex tech concepts into engaging written narratives.", image: "./Photoshot ACM/aadish shukla.jpeg", linkedin: "#" },
        ],
        "PHOTOGRAPHY_TEAM": [
            { name: "Shivam Tiwari", role: "Cinematographer", desc: "Capturing the essence of events through dynamic visual lenses.", image: "./Photoshot ACM/shivam tiwari.jpeg", linkedin: "https://www.linkedin.com/in/shivam-tiwari-381872337" },
        ],
        "SOCIAL_MEDIA_TEAM": [
            { name: "Aditya Bhatt", role: "Social Media Manager", desc: "Managing our digital footprint and community engagement.", image: "./Photoshot ACM/aditya bhat.jpg", linkedin: "https://www.linkedin.com/in/aditya-bhatt-1710123a5" },
            { name: "Ayushi Labde", role: "Social Media Manager", desc: "Curating viral content and handling channel outreach.", image: "./Photoshot ACM/ayushi labde.jpeg", linkedin: "https://www.linkedin.com/in/ayushi-labde-74872931b" },
        ],
        "EVENT_COORDINATORS": [
            { name: "Sonal Tripathi", role: "Operational Head", desc: "Ensuring smooth execution of all logistical and back-end pipelines.", image: "./Photoshot ACM/sonal  tripathi.jpeg", linkedin: "https://www.linkedin.com/in/sonaltripathi20" },
            { name: "Asmita Chauhan", role: "Event Head", desc: "Conceptualizing and managing large-scale flagship hackathons.", image: "./Photoshot ACM/asmita chauhan.jpeg", linkedin: "https://www.linkedin.com/in/asmita-chauhan-8083682a0" },
            { name: "Samriddhi Singh", role: "Event Head", desc: "Coordinating workshop logistics and speaker onboarding.", image: "./Photoshot ACM/sammriddhi singh.jpeg", linkedin: "https://www.linkedin.com/in/samriddhi-singh-0a770238a" },
            { name: "Nidhi Lad", role: "Event Head", desc: "Managing onsite operations and attendee experience metrics.", image: "./Photoshot ACM/nidhi lad.jpeg", linkedin: "https://www.linkedin.com/in/nidhi-lad-6187a8354" },
        ],
        "MARKETING_TEAM": [
            { name: "Arushi Singh", role: "Marketing Manager", desc: "Developing strategies to expand chapter visibility and reach.", image: "./Photoshot ACM/arushi singh.jpeg", linkedin: "https://www.linkedin.com/in/arushi-singh-b327643a3" },
            { name: "Jaya Yadav", role: "Marketing Manager", desc: "Driving brand growth through targeted outreach and communication.", image: "./Photoshot ACM/jaya yadav.jpeg", linkedin: "https://www.linkedin.com/in/jaya-yadav-560a103a1" },
        ],
    };

    return (
        <div className="min-h-screen pt-40 px-6 md:px-20 max-w-7xl mx-auto pb-32">
            <h1 className="text-8xl md:text-[12rem] font-['Playfair_Display'] italic font-bold mb-32 opacity-[0.03] fixed -z-10 top-20 right-0 pointer-events-none select-none">
                Leadership
            </h1>

            {Object.entries(teamData).map(([category, members]) => (
                <div key={category} className="mb-40">
                    <div className="flex items-center gap-6 md:gap-10 mb-16 px-4">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 bg-acm-cyan rounded-full shadow-[0_0_12px_rgba(100,255,218,0.5)] animate-pulse" />
                            <h3 className="text-2xl md:text-4xl font-heading font-bold tracking-[0.15em] text-white uppercase">
                                {category.split('_').join(' ')}
                            </h3>
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-acm-cyan/20 to-transparent"></div>
                        <span className="font-mono text-[10px] text-acm-cyan tracking-[0.5em] bg-acm-cyan/5 border border-acm-cyan/15 px-3 py-1.5 rounded-full">
                            {members.length} MEMBERS
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
                        {members.map((m, i) => (
                            <TeamPersonaCard key={m.id || i} member={m} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const TeamPersonaCard = ({ member }) => {
    return (
        <TiltCard className="group relative aspect-[10/14] bg-[#030712] rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-700 overflow-hidden shadow-2xl">
            {/* Persona Media (Image/Video) */}
            <div className="absolute top-0 left-0 w-full h-[72%] overflow-hidden">
                {member.image.toLowerCase().endsWith('.mp4') ? (
                    <video
                        src={member.image}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110"
                    />
                ) : (
                    <img
                        src={member.image}
                        alt={member.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent"></div>
            </div>

            {/* LinkedIn Float */}
            {member.linkedin && member.linkedin !== "#" && (
                <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-4 right-4 z-30 w-8 h-8 flex items-center justify-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-full hover:bg-[#0077b5] hover:border-[#0077b5] hover:text-white transition-all duration-500 opacity-0 group-hover:opacity-100"
                >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                </a>
            )}

            {/* Content Section */}
            <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col items-start bg-gradient-to-t from-[#030712] via-[#030712]/90 to-transparent">
                <p className="text-[9px] font-mono text-acm-cyan tracking-[0.4em] uppercase mb-2 opacity-60">
                    {member.role}
                </p>
                <h3 className="text-2xl md:text-2xl font-['Playfair_Display'] font-serif text-white mb-2 group-hover:text-acm-cyan transition-colors duration-500">
                    {member.name}
                </h3>
                
                <div className="w-6 h-[1px] bg-white/20 group-hover:w-full group-hover:bg-acm-cyan/40 transition-all duration-700 mb-4"></div>
                
                <p className="text-[11px] leading-relaxed text-gray-400 font-sans line-clamp-2 opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-y-2 group-hover:translate-y-0">
                    {member.desc}
                </p>
            </div>

            {/* Subtle Overlay Glow */}
            <div className="absolute inset-0 border border-white/5 pointer-events-none group-hover:border-acm-cyan/20 transition-colors duration-700"></div>
        </TiltCard>
    );
};










// --- FUSION GALLERY (Tunnel + Drift + Carousel) ---
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
                // Ensure all images from the event are included, or use fallback gradients
                images: (Array.isArray(event.images) && event.images.length > 0) ? event.images : [],
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
                slides: [],
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
                                    src={getDirectDriveUrl(img)} 
                                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
                                        i === slide ? 'translate-x-0 opacity-100 z-10' : 
                                        i < slide ? '-translate-x-full opacity-0 z-0' : 'translate-x-full opacity-0 z-0'
                                    } ${isActive ? 'grayscale-0' : 'grayscale'}`}
                                    alt="Event"
                                />
                            ))}
                        </>
                    ) : (
                        item.slides.map((gradient, i) => (
                            <div 
                                key={i} 
                                className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-all duration-1000 ${
                                    i === slide ? 'translate-x-0 opacity-100 z-10' : 
                                    i < slide ? '-translate-x-full opacity-0 z-0' : 'translate-x-full opacity-0 z-0'
                                }`} 
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

                            // Submit to cloud
                            const submitToCloud = async (msg) => {
                                const gasUrl = localStorage.getItem('acm_gas_url') || ACM_MASTER_GAS_URL;
                                if (!gasUrl) return;
                                try {
                                    await fetch(gasUrl, {
                                        method: 'POST',
                                        mode: 'no-cors',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ action: 'message', data: msg })
                                    });
                                } catch (e) { console.error("Cloud Submit Failed:", e); }
                            };
                            submitToCloud(newMessage);

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
    const { slug } = useParams();
    
    const event = useMemo(() => {
        try {
            const storedRaw = localStorage.getItem('acm_events');
            if (!storedRaw) return null;
            const stored = JSON.parse(storedRaw);
            if (!Array.isArray(stored)) return null;
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

    useEffect(() => {
        if (!event?.eventDate) return;
        const interval = setInterval(() => {
            const eventDt = new Date(event.eventDate);
            if (isNaN(eventDt.getTime())) {
                clearInterval(interval);
                return;
            }
            const difference = eventDt - new Date();
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
    }, [event?.eventDate]);

    if (!event) return <div className="min-h-screen flex items-center justify-center text-white text-3xl">Event Not Found</div>;

    return (
        <div className="min-h-screen pt-28 md:pt-32 px-4 md:px-20 text-white max-w-6xl mx-auto pb-20 md:pb-32">
            
            <div className="flex flex-col md:flex-row justify-between items-start gap-10">
                <div className="flex-1">
                    <h1 className="text-3xl sm:text-5xl md:text-7xl font-heading font-bold mb-3 md:mb-4">{event.title}</h1>
                    <p className="text-acm-cyan font-mono text-xs md:text-base mb-5 md:mb-8">{event.dateText}</p>
                    <p className="text-gray-300 text-sm md:text-lg mb-8 md:mb-12 max-w-3xl leading-relaxed">{event.desc}</p>
                    
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
                let storedGallery = [];
                try {
                    storedGallery = JSON.parse(localStorage.getItem('acm_gallery') || '[]');
                } catch(e) { storedGallery = []; }
                
                const eventGallery = Array.isArray(storedGallery) ? storedGallery : [];
                const eventImages = [
                    ...(Array.isArray(event.images) ? event.images : []),
                    ...eventGallery.filter(g => g.eventSlug === slug).map(g => g.src)
                ].filter(Boolean);

                if (eventImages.length === 0) return null;
                return (
                    <div className="mb-12 md:mb-20">
                        <h2 className="text-xl md:text-3xl font-bold mb-4 md:mb-8">📸 Event Gallery</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                            {eventImages.map((src, i) => (
                                <div key={i} className="aspect-video overflow-hidden rounded-xl border border-white/10 group cursor-pointer"
                                    onClick={() => window.open(src, '_blank')}>
                                    <img src={getDirectDriveUrl(src)} alt={`Gallery ${i+1}`}
                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" />
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
                    <h2 className="text-xl md:text-3xl font-bold mb-6 md:mb-10">Experts & Guests</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 mb-12 md:mb-20">
                        {event.speakers?.map((speaker, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 text-center group">
                                <div className="relative w-16 h-16 md:w-28 md:h-28 mx-auto mb-3 md:mb-4">
                                    <img src={getDirectDriveUrl(speaker.image)} alt={speaker.name} className="w-full h-full rounded-full object-cover border-2 border-white/10 grayscale group-hover:grayscale-0 group-hover:border-acm-cyan transition-all duration-500" />
                                    {speaker.type && (
                                        <span className="absolute -bottom-1 -right-1 bg-acm-cyan text-black font-black text-[8px] md:text-[10px] px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-xl">
                                            {speaker.type}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-sm md:text-xl font-bold truncate">{speaker.name}</h3>
                                <p className="text-gray-400 text-[10px] md:text-xs mt-1 md:mt-2 uppercase tracking-widest">{speaker.role}</p>
                                {speaker.link && (
                                    <a href={speaker.link} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-[10px] text-acm-cyan font-mono hover:underline">
                                         :: VIEW_INTEL
                                    </a>
                                )}
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
    const { slug } = useParams();
    const navigate = useNavigate();
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '', team: '', year: '', branch: '', college: 'TSEC', message: '', members: [] });

    const event = useMemo(() => {
        try {
            const storedRaw = localStorage.getItem('acm_events');
            if (!storedRaw) return null;
            const stored = JSON.parse(storedRaw);
            if (!Array.isArray(stored)) return null;
            const found = stored.find(e => e.slug === slug);
            return found || null;
        } catch (e) { 
            console.error("Error finding event:", e);
            return null; 
        }
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
        
        // Submit to cloud
        const submitToCloud = async (reg) => {
            const gasUrl = localStorage.getItem('acm_gas_url') || ACM_MASTER_GAS_URL;
            if (!gasUrl) return;
            try {
                await fetch(gasUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'register', data: reg })
                });
            } catch (e) { console.error("Cloud Submit Failed:", e); }
        };
        submitToCloud(data);

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

                            {/* Dynamic Members */}
                            {event.maxTeamSize > 1 && (
                                <div className="space-y-4 border-t border-white/10 pt-4 mt-4">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">// TEAM_MATES ({form.members.length + 1} / {event.maxTeamSize})</p>
                                        {form.members.length < event.maxTeamSize - 1 && (
                                            <button 
                                                type="button" 
                                                onClick={() => setForm({...form, members: [...form.members, { name: '', email: '', phone: '' }]})}
                                                className="text-[10px] text-acm-cyan font-mono border border-acm-cyan/30 px-3 py-1 rounded hover:bg-acm-cyan hover:text-black transition-all"
                                            >
                                                [+] ADD_MEMBER
                                            </button>
                                        )}
                                    </div>

                                    {form.members.map((member, idx) => (
                                        <div key={idx} className="p-4 bg-black/40 border border-white/5 rounded-lg space-y-3 relative">
                                            <button 
                                                type="button" 
                                                onClick={() => setForm({...form, members: form.members.filter((_, i) => i !== idx)})}
                                                className="absolute top-2 right-2 text-red-500 font-bold p-1 hover:bg-red-500/10 rounded"
                                            >
                                                ✕
                                            </button>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[8px] text-gray-600 font-mono mb-1 block uppercase">Name</label>
                                                    <input required className="w-full bg-black border border-white/10 p-2 rounded text-xs text-white" value={member.name} onChange={e => {
                                                        const nm = [...form.members]; nm[idx].name = e.target.value; setForm({...form, members: nm});
                                                    }}/>
                                                </div>
                                                <div>
                                                    <label className="text-[8px] text-gray-600 font-mono mb-1 block uppercase">Email</label>
                                                    <input required type="email" className="w-full bg-black border border-white/10 p-2 rounded text-xs text-white" value={member.email} onChange={e => {
                                                        const nm = [...form.members]; nm[idx].email = e.target.value; setForm({...form, members: nm});
                                                    }}/>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

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
const RegistrationsPanel = ({ registrations, setRegistrations, events, filterEvent, setFilterEvent, setIsDirty }) => {
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
        // Sort registrations by event for better readability in the flat export
        const sorted = [...registrations].sort((a, b) => (a.event || '').localeCompare(b.event || ''));
        const rows = sorted.map(r => [r.name,r.email,r.phone,r.year,r.branch,r.college,r.team,r.event,r.timestamp,r.message].map(v => `"${v||''}"`));
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
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

            <div className="space-y-8">
                {filtered.length === 0 && <div className="py-20 text-center text-gray-600 font-mono text-xs">NO_RECORDS_MATCH_QUERY</div>}
                
                {Object.entries(
                    filtered.reduce((acc, reg) => {
                        const key = reg.event || 'Unknown Event';
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(reg);
                        return acc;
                    }, {})
                ).map(([eventName, regs]) => (
                    <div key={eventName} className="space-y-3">
                        <div className="flex items-center gap-3 px-2">
                            <h3 className="text-acm-cyan font-mono text-[10px] tracking-widest uppercase">// {eventName} ({regs.length})</h3>
                            <div className="flex-1 h-[1px] bg-white/5"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                            {regs.map((reg, i) => {
                                const regIndex = registrations.indexOf(reg);
                                return (
                                    <div key={regIndex} className="border border-white/10 rounded-xl overflow-hidden bg-white/2">
                                        <button
                                            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left gap-4"
                                            onClick={() => setExpandedReg(expandedReg === regIndex ? null : regIndex)}
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
                                            <div className="hidden md:block text-[10px] text-gray-600 font-mono text-right flex-shrink-0">{reg.timestamp}</div>
                                            <span className="text-gray-500 text-xs flex-shrink-0">{expandedReg === regIndex ? '▲' : '▼'}</span>
                                        </button>

                                        {expandedReg === regIndex && (
                                            <div className="bg-black/40 border-t border-white/10 p-5 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                {[
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
                                                {reg.members && reg.members.length > 0 && (
                                                    <div className="col-span-2 md:col-span-4 border-t border-white/5 pt-4 mt-2">
                                                        <p className="text-[9px] text-gray-600 font-mono uppercase tracking-wider mb-2">Team Members</p>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {reg.members.map((m, idx) => (
                                                                <div key={idx} className="p-2 rounded bg-white/5 border border-white/5">
                                                                    <p className="text-[10px] text-white font-bold">{m.name}</p>
                                                                    <p className="text-[9px] text-gray-500 font-mono">{m.email}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {reg.message && (
                                                    <div className="col-span-2 md:col-span-4 border-t border-white/5 pt-4 mt-2">
                                                        <p className="text-[9px] text-gray-600 font-mono uppercase tracking-wider mb-0.5">Message</p>
                                                        <p className="text-xs text-gray-300 italic">"{reg.message}"</p>
                                                    </div>
                                                )}
                                                <div className="col-span-2 md:col-span-4 flex justify-end mt-4">
                                                    <button 
                                                        onClick={() => {
                                                            if(confirm('Delete this registration?')) {
                                                                const updated = registrations.filter((_, idx) => idx !== regIndex);
                                                                setRegistrations(updated);
                                                                localStorage.setItem('acm_registrations', JSON.stringify(updated));
                                                                setIsDirty(true);
                                                            }
                                                        }}
                                                        className="text-[9px] font-mono text-red-500 hover:text-red-400 border border-red-500/20 px-3 py-1 rounded"
                                                    >
                                                        [ DELETE_RECORD ]
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
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
    const [isDirty, setIsDirty] = useState(localStorage.getItem('acm_is_dirty') === 'true');
    const [syncStatus, setSyncStatus] = useState('IDLE'); // 'IDLE' | 'SYNCING' | 'ERROR' | 'SUCCESS'

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
    const [newEvent, setNewEvent] = useState({ title: '', category: '', desc: '', slug: '', images: [], prizePool: 0, maxTeamSize: 1, dateText: '', eventDate: '', tracks: [], speakers: [], faqs: [] });
    const [newMember, setNewMember] = useState({ name: '', role: '', desc: '', image: '', category: 'CORE_COMMITTEE', linkedin: '' });
    const [newGalleryItem, setNewGalleryItem] = useState({ src: '', caption: '', eventSlug: '' });
    const [editingEventId, setEditingEventId] = useState(null);
    const [editingMemberId, setEditingMemberId] = useState(null);
    // Crop picker state
    const [cropPicker, setCropPicker] = useState(null); // { src, onConfirm, aspect }

    // --- LOAD DATA (only if auth ok) ---
    useEffect(() => {
        if (authState !== 'ok') return;

        // --- ONLY USE CLOUD DATA, NO DEFAULTS ---
        if (!localStorage.getItem('acm_events')) localStorage.setItem('acm_events', '[]');
        if (!localStorage.getItem('acm_team')) localStorage.setItem('acm_team', '{}');
        
        // Auto-initialize from cloud if URL exists but data is empty
        const gasUrl = localStorage.getItem('acm_gas_url') || ACM_MASTER_GAS_URL;
        if (gasUrl && JSON.parse(localStorage.getItem('acm_events')).length === 0) {
           console.log("INITIAL_BOOT :: ATTEMPTING_CLOUD_SYNC");
           // We'll let the user manually trigger Fetch for now to be safe, 
           // or we could trigger the fetch function if it was extracted.
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

    const saveEvents = (updated) => { setEvents(updated); localStorage.setItem('acm_events', JSON.stringify(updated)); setIsDirty(true); };
    const saveTeam = (updated) => { setTeam(updated); localStorage.setItem('acm_team', JSON.stringify(updated)); setIsDirty(true); };
    const saveGallery = (updated) => { setGallery(updated); localStorage.setItem('acm_gallery', JSON.stringify(updated)); setIsDirty(true); };
    const saveAbout = (updated) => { setEditAbout(updated); localStorage.setItem('acm_about', JSON.stringify(updated)); setIsDirty(true); };

    // --- AUTO-PUSH ENGINE (Debounced) ---
    useEffect(() => {
        if (!isDirty) {
            localStorage.removeItem('acm_is_dirty');
            return;
        }
        localStorage.setItem('acm_is_dirty', 'true');
        const gasUrl = localStorage.getItem('acm_gas_url') || ACM_MASTER_GAS_URL;
        if (!gasUrl) return;

        setSyncStatus('SYNCING');
        const timer = setTimeout(() => {
            pushToCloud(true);
        }, 3000); 
        return () => clearTimeout(timer);
    }, [isDirty]);

    // --- CLOUD SYNC ENGINE ---
    const pushToCloud = async (silent = false) => {
        const gasUrl = localStorage.getItem('acm_gas_url') || ACM_MASTER_GAS_URL;
        if (!gasUrl) return silent ? null : alert('DOWNLINK_OFFLINE :: ENTER_APPS_SCRIPT_URL');
        
        setSyncStatus('SYNCING');
        try {
            const payload = {
                action: 'save',
                data: {
                    events: JSON.parse(localStorage.getItem('acm_events') || '[]'),
                    team: JSON.parse(localStorage.getItem('acm_team') || '{}'),
                    gallery: JSON.parse(localStorage.getItem('acm_gallery') || '[]'),
                    about: JSON.parse(localStorage.getItem('acm_about') || '{}'),
                    registrations: JSON.parse(localStorage.getItem('acm_registrations') || '[]'),
                    messages: JSON.parse(localStorage.getItem('acm_messages') || '[]'),
                    timestamp: new Date().toISOString()
                }
            };
            
            // Use no-cors as Apps Script doesn't support CORS preflight,
            // but the POST still reaches the server. We verify success via 
            // the subsequent GET (version will have bumped).
            await fetch(gasUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            });
            
            // Mark as synced locally
            setIsDirty(false);
            localStorage.removeItem('acm_is_dirty');
            localStorage.setItem('acm_last_sync', new Date().toLocaleTimeString());
            setSyncStatus('SUCCESS');
            if(!silent) alert('UPLINK_SUCCESS :: CLOUD_STORAGE_SYNCHRONIZED');
        } catch (err) {
            console.error("Push Failed:", err);
            setSyncStatus('ERROR');
            if(!silent) alert(`UPLINK_FAILURE: ${err.message}`);
        }
    };

    const pullFromCloud = async () => {
        const gasUrl = localStorage.getItem('acm_gas_url') || ACM_MASTER_GAS_URL;
        if (!gasUrl) return alert('DOWNLINK_OFFLINE :: ENTER_APPS_SCRIPT_URL');
        
        setSyncStatus('SYNCING');
        try {
            const response = await fetch(`${gasUrl}?action=get`);
            if (!response.ok) throw new Error(`HTTP_${response.status}`);
            const result = await response.json();
            const finalData = result.data || result;
            
            if (finalData && finalData.events) {
                localStorage.setItem('acm_events', JSON.stringify(finalData.events));
                localStorage.setItem('acm_team', JSON.stringify(finalData.team));
                localStorage.setItem('acm_gallery', JSON.stringify(finalData.gallery));
                localStorage.setItem('acm_about', JSON.stringify(finalData.about));
                localStorage.setItem('acm_registrations', JSON.stringify(finalData.registrations || []));
                localStorage.setItem('acm_messages', JSON.stringify(finalData.messages || []));
                
                // Clear dirty state to allow automatic sync to resume
                localStorage.removeItem('acm_is_dirty');
                localStorage.setItem('acm_last_sync', new Date().toLocaleTimeString());
                
                setSyncStatus('SUCCESS');
                alert('DOWNLINK_ESTABLISHED :: FETCH_COMPLETE :: RE-INITIALIZING');
                window.location.reload();
            } else {
                setSyncStatus('IDLE');
                alert('EMPTY_BUFFER_RECEIVED :: CHECK_SHEET_DATA');
            }
        } catch (err) {
            console.error("Pull Failed:", err);
            setSyncStatus('ERROR');
            alert(`DOWNLINK_FAILURE: ${err.message}`);
        }
    };


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

    const addGalleryPhoto = () => {
        if (!newGalleryItem.src) return alert('No image selected');
        const updated = [...gallery, { ...newGalleryItem, id: Date.now() }];
        saveGallery(updated);
        setNewGalleryItem({ src: '', caption: '', eventSlug: '' });
    };

    const deleteGalleryPhoto = (id) => {
        if (confirm('Remove this photo?')) saveGallery(gallery.filter(g => g.id !== id));
    };

    const moveGalleryPhoto = (index, dir, e) => {
        if (e) { e.stopPropagation(); e.preventDefault(); }
        const updated = [...gallery];
        const target = index + dir;
        if (target < 0 || target >= updated.length) return;
        [updated[index], updated[target]] = [updated[target], updated[index]];
        saveGallery(updated);
    };

    const moveEvent = (index, dir, e) => {
        if (e) { e.stopPropagation(); e.preventDefault(); }
        const updated = [...events];
        const target = index + dir;
        if (target < 0 || target >= updated.length) return;
        [updated[index], updated[target]] = [updated[target], updated[index]];
        saveEvents(updated);
    };

    const moveMember = (cat, id, dir, e) => {
        if (e) { e.stopPropagation(); e.preventDefault(); }
        const updated = { ...team };
        const list = [...updated[cat]];
        const index = list.findIndex(m => m.id === id);
        const target = index + dir;
        if (target < 0 || target >= list.length) return;
        [list[index], list[target]] = [list[target], list[index]];
        updated[cat] = list;
        saveTeam(updated);
    };

    const addEvent = (e) => {
        if(e) e.preventDefault();
        if (!newEvent.title || !newEvent.slug) return alert('MISSING_REQUIRED_FIELDS');
        
        const finalEvent = {
            ...newEvent,
            id: editingEventId || Date.now()
        };

        const existing = [...events];
        if (editingEventId) {
            const idx = existing.findIndex(e => e.id === editingEventId);
            existing[idx] = finalEvent;
        } else {
            existing.push(finalEvent);
        }
        
        saveEvents(existing);
        setNewEvent({ title: '', category: '', desc: '', slug: '', images: [], prizePool: 0, maxTeamSize: 1, dateText: '', eventDate: '', tracks: [], speakers: [], faqs: [] });
        setEditingEventId(null);
        alert(editingEventId ? "EVENT_UPDATED" : "EVENT_DEPLOYED");
    };

    const startEditEvent = (ev) => {
        setNewEvent({
            ...ev,
            tracks: ev.tracks || [],
            speakers: (ev.speakers || []).map(s => ({
                name: s.name || '',
                role: s.role || '',
                image: s.image || '',
                type: s.type || 'SPEAKER',
                link: s.link || '',
                isCustomType: !['SPEAKER', 'JUDGE', 'MENTOR', 'GUEST'].includes(s.type?.toUpperCase())
            })),
            faqs: (ev.faqs || []).map(f => ({
                question: f.question || '',
                answer: f.answer || ''
            }))
        });
        setEditingEventId(ev.id);
        setActiveTab('events');
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
        
        // Serialize crop metadata into the image string if present
        let finalImage = newMember.image;
        if (newMember.cropCss && newMember.cropCss.objectPosition) {
            const pos = newMember.cropCss.objectPosition.replace(/%/g, '').split(' ');
            const scale = newMember.cropCss.transform.replace(/[scale()]/g, '');
            finalImage = `${newMember.image.split('|')[0]}|${pos[0]}|${pos[1]}|${scale}`;
        }

        const memberData = { ...newMember, image: finalImage, section: newMember.category.replace(/_/g, ' ') };
        delete memberData.cropCss; // Cleaner storage

        if (editingMemberId) {
            Object.keys(updated).forEach(cat => {
                updated[cat] = updated[cat].filter(m => m.id !== editingMemberId);
            });
            updated[newMember.category].push({ ...memberData, id: editingMemberId });
            setEditingMemberId(null);
        } else {
            if (!updated[newMember.category]) updated[newMember.category] = [];
            updated[newMember.category].push({ ...memberData, id: Date.now() });
        }
        
        saveTeam(updated);
        setNewMember({ name: '', role: '', desc: '', image: '', category: 'CORE_COMMITTEE', linkedin: '' });
        alert(editingMemberId ? "MEMBER_RE_SYNCED" : "MEMBER_BOARDED");
    };

    const startEditMember = (m) => {
        const [url, x, y, s] = (m.image || '').split('|');
        const cropCss = x ? {
            objectFit: 'cover',
            objectPosition: `${x}% ${y}%`,
            transform: `scale(${s})`,
            transformOrigin: `${x}% ${y}%`
        } : null;

        setNewMember({ 
            name: m.name, 
            role: m.role, 
            desc: m.desc, 
            image: url, 
            category: m.category || 'CORE_COMMITTEE', 
            linkedin: m.linkedin || '',
            cropCss 
        });
        setEditingMemberId(m.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

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

    // ─── IMAGE CROP PICKER MODAL ───
    const ImageCropPickerModal = () => {
        const [pos, setPos] = useState({ x: 50, y: 50 });
        const [scale, setScale] = useState(1.0);
        const [dragging, setDragging] = useState(false);
        const [lastMouse, setLastMouse] = useState(null);
        const frameRef = React.useRef(null);
        if (!cropPicker) return null;
        const { src, aspect, label, onConfirm } = cropPicker;

        const handleMouseDown = (e) => {
            e.preventDefault();
            setDragging(true);
            setLastMouse({ x: e.clientX, y: e.clientY });
        };
        const handleMouseMove = (e) => {
            if (!dragging || !lastMouse || !frameRef.current) return;
            const rect = frameRef.current.getBoundingClientRect();
            const dx = ((e.clientX - lastMouse.x) / rect.width) * 100 / scale;
            const dy = ((e.clientY - lastMouse.y) / rect.height) * 100 / scale;
            setPos(p => ({ x: Math.max(0, Math.min(100, p.x - dx)), y: Math.max(0, Math.min(100, p.y - dy)) }));
            setLastMouse({ x: e.clientX, y: e.clientY });
        };
        const handleMouseUp = () => { setDragging(false); setLastMouse(null); };
        const handleConfirm = () => {
            const cropCss = {
                objectFit: 'cover',
                objectPosition: `${pos.x}% ${pos.y}%`,
                transform: `scale(${scale})`,
                transformOrigin: `${pos.x}% ${pos.y}%`,
            };
            onConfirm(cropCss);
        };

        return (
            <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 w-full max-w-lg space-y-5 shadow-2xl">
                    <div className="flex justify-between items-center">
                        <h3 className="font-mono text-xs text-acm-cyan tracking-widest uppercase">✂ CROP_EDITOR :: {label}</h3>
                        <button type="button" onClick={() => setCropPicker(null)} className="text-gray-500 hover:text-white text-lg leading-none">✕</button>
                    </div>
                    <p className="text-[9px] text-gray-500 font-mono">DRAG image to pan • Use slider to zoom • Frame shows final visible area</p>

                    {/* Preview Frame */}
                    <div
                        ref={frameRef}
                        className="relative overflow-hidden rounded-xl border border-white/20 bg-black/40 select-none"
                        style={{ aspectRatio: aspect, cursor: dragging ? 'grabbing' : 'grab', maxHeight: '280px' }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <img
                            src={getDirectDriveUrl(src)}
                            draggable={false}
                            className="absolute inset-0 w-full h-full pointer-events-none"
                            style={{
                                objectFit: 'cover',
                                objectPosition: `${pos.x}% ${pos.y}%`,
                                transform: `scale(${scale})`,
                                transformOrigin: `${pos.x}% ${pos.y}%`,
                                transition: dragging ? 'none' : 'transform 0.1s',
                            }}
                        />
                        {/* Crosshair guideline */}
                        <div className="absolute inset-0 pointer-events-none border-2 border-acm-cyan/30 rounded-xl" />
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-acm-cyan/10 pointer-events-none" />
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-acm-cyan/10 pointer-events-none" />
                    </div>

                    {/* Zoom Slider */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-mono text-gray-500">
                            <span>ZOOM</span>
                            <span className="text-acm-cyan">{scale.toFixed(2)}x</span>
                        </div>
                        <input
                            type="range" min="1.0" max="3.0" step="0.05"
                            value={scale}
                            onChange={e => setScale(parseFloat(e.target.value))}
                            className="w-full accent-cyan-400 h-1 rounded-full"
                        />
                        <div className="flex justify-between text-[8px] text-gray-600 font-mono">
                            <span>1x (no zoom)</span><span>3x (max)</span>
                        </div>
                    </div>

                    {/* Position readout */}
                    <div className="text-[8px] text-gray-600 font-mono flex gap-4">
                        <span>PAN_X: {pos.x.toFixed(0)}%</span>
                        <span>PAN_Y: {pos.y.toFixed(0)}%</span>
                        <button type="button" onClick={() => { setPos({ x: 50, y: 50 }); setScale(1.0); }} className="text-gray-500 hover:text-white underline ml-auto">RESET</button>
                    </div>

                    <div className="flex gap-3">
                        <button type="button" onClick={() => setCropPicker(null)} className="flex-1 py-3 border border-white/10 text-gray-400 text-xs font-mono uppercase hover:border-white/30 rounded-lg transition-all">CANCEL</button>
                        <button type="button" onClick={handleConfirm} className="flex-1 py-3 bg-acm-cyan text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white transition-all">CONFIRM CROP</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen pt-32 px-4 md:px-20 text-white pb-20">
            <ImageCropPickerModal />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-white/10 pb-10">
                <div>
                    <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-tighter">CHAPTER_MANAGEMENT</h1>
                    <div className="flex items-center gap-4 mt-2">
                        <p className="text-acm-cyan font-mono text-[10px] tracking-[0.3em] opacity-60">:: ACCESS_LEVEL_AUTHORITY :: SECURE_SESSION</p>
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                            <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'SYNCING' ? 'bg-yellow-400 animate-pulse' : syncStatus === 'ERROR' ? 'bg-red-500' : isDirty ? 'bg-blue-400' : 'bg-green-500'}`}></div>
                            <span className="text-[8px] font-mono tracking-[0.2em] text-gray-400 uppercase">
                                {syncStatus === 'SYNCING' ? 'SYNCING_TO_CLOUD' : 
                                 syncStatus === 'ERROR' ? 'SYNC_FAILED' : 
                                 isDirty ? 'CHANGES_READY' : 'CLOUD_SAVED'}
                            </span>
                            {localStorage.getItem('acm_last_sync') && (
                                <span className="text-[8px] font-mono text-gray-600 border-l border-white/10 pl-2 ml-1 uppercase">{localStorage.getItem('acm_last_sync')}</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => pushToCloud(false)} className="text-[10px] font-mono text-acm-cyan border border-acm-cyan/30 px-4 py-3 uppercase tracking-widest hover:bg-acm-cyan/10 transition-all">FORCE_PUSH</button>
                    <button onClick={logout} className="text-[10px] font-mono text-red-500 border border-red-500/30 px-6 py-3 uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">TERMINATE</button>
                </div>
            </div>

            <div className="flex gap-4 mb-10 overflow-x-auto pb-2 border-b border-white/5 font-mono text-xs uppercase tracking-widest no-scrollbar">
                {['overview', 'events', 'gallery', 'team', 'site', 'registrations', 'messages', 'system'].map(tab => (
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
                            <input 
                                required 
                                placeholder="Title" 
                                className="bg-black border border-white/10 p-3 rounded" 
                                value={newEvent.title} 
                                onChange={e => {
                                    const val = e.target.value;
                                    const s = val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 30);
                                    setNewEvent({...newEvent, title: val, slug: s});
                                }}
                            />
                            <input 
                                required 
                                placeholder="Slug (URL ID)" 
                                className="bg-black border border-white/10 p-3 rounded" 
                                value={newEvent.slug} 
                                onPaste={e => {
                                    const pasted = e.clipboardData.getData('Text');
                                    if (pasted.includes('drive.google.com') || pasted.includes('http')) {
                                        // Attempt to extract title or just the last part of URL if it's not a generic link
                                        const clean = pasted.split('/').pop().split('?')[0].split('=')[0].toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 30);
                                        setNewEvent({...newEvent, slug: clean});
                                        e.preventDefault();
                                    }
                                }}
                                onChange={e => {
                                    const val = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                                    setNewEvent({...newEvent, slug: val});
                                }}
                            />
                        </div>
                        <input required placeholder="Category (e.g. HACKATHON)" className="w-full bg-black border border-white/10 p-3 rounded text-xs" value={newEvent.category} onChange={e => setNewEvent({...newEvent, category: e.target.value})}/>
                        <textarea required placeholder="Description" className="w-full bg-black border border-white/10 p-3 rounded h-32 text-xs" value={newEvent.desc} onChange={e => setNewEvent({...newEvent, desc: e.target.value})}/>

                        {/* ─── MULTI-IMAGE MANAGER ─── */}
                        <div className="space-y-3 border border-white/10 rounded-xl p-4 bg-black/20">
                            <p className="text-[10px] text-acm-cyan font-mono tracking-widest">// EVENT_MEDIA_POOL ({(Array.isArray(newEvent.images) ? newEvent.images : []).length} attached)</p>

                            <div className="space-y-3">
                                {(Array.isArray(newEvent.images) ? newEvent.images : []).map((url, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input
                                            value={url}
                                            onChange={e => {
                                                const newImgs = [...newEvent.images];
                                                newImgs[idx] = e.target.value;
                                                setNewEvent(prev => ({ ...prev, images: newImgs }));
                                            }}
                                            placeholder="https://drive.google.com/..."
                                            className="flex-1 bg-black/60 border border-white/5 p-2 rounded text-[10px] font-mono"
                                        />
                                        <button type="button" onClick={() => setNewEvent(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))} className="text-red-500 px-2 text-xs hover:bg-red-500/10 rounded">✕</button>
                                    </div>
                                ))}
                                <button 
                                    type="button"
                                    onClick={() => setNewEvent(prev => ({ ...prev, images: [...(Array.isArray(prev.images) ? prev.images : []), ""] }))}
                                    className="w-full py-2 border border-dashed border-acm-cyan/30 text-[9px] text-acm-cyan/60 font-mono uppercase hover:border-acm-cyan hover:text-acm-cyan transition-all rounded-lg"
                                >
                                    [+] ADD_NEURAL_LINK
                                </button>
                            </div>

                            {/* Preview grid */}
                            {(Array.isArray(newEvent.images) ? newEvent.images : []).filter(Boolean).length > 0 && (
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-4 p-2 bg-black/20 rounded-lg">
                                    {newEvent.images.filter(Boolean).map((src, idx) => (
                                        <div key={idx} className="relative aspect-square rounded overflow-hidden border border-white/5 opacity-80 hover:opacity-100 transition-opacity">
                                            <img src={getDirectDriveUrl(src)} className="w-full h-full object-cover"/>
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-gray-400 font-mono mb-2 block uppercase tracking-widest">Prize_Pool (Number)</label>
                                    <input type="number" className="w-full bg-black/40 border border-white/10 px-4 py-2 text-xs rounded-lg text-white" value={newEvent.prizePool} onChange={e => setNewEvent({...newEvent, prizePool: parseInt(e.target.value)||0})}/>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-400 font-mono mb-2 block uppercase tracking-widest">Max_Team_Size</label>
                                    <input type="number" min="1" className="w-full bg-black/40 border border-white/10 px-4 py-2 text-xs rounded-lg text-white" value={newEvent.maxTeamSize} onChange={e => setNewEvent({...newEvent, maxTeamSize: parseInt(e.target.value)||1})}/>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] text-gray-400 font-mono mb-4 block uppercase tracking-widest">// EVENT_INTEL_SYSTEM</label>
                                
                                {/* Tracks Manager */}
                                <div className="space-y-4 mb-8 p-6 bg-black/40 border border-white/5 rounded-xl">
                                    <p className="text-[10px] text-acm-cyan font-mono tracking-widest uppercase">:: TRACKS_OF_INNOVATION</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(newEvent.tracks || []).map((track, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-acm-cyan/10 border border-acm-cyan/20 px-3 py-2 rounded">
                                                <input 
                                                    className="bg-transparent border-none outline-none text-[10px] text-white w-24"
                                                    value={track}
                                                    onChange={e => {
                                                        const nt = [...newEvent.tracks];
                                                        nt[idx] = e.target.value;
                                                        setNewEvent({...newEvent, tracks: nt});
                                                    }}
                                                />
                                                <button type="button" onClick={() => setNewEvent({...newEvent, tracks: newEvent.tracks.filter((_, i) => i !== idx)})} className="text-red-500 text-[10px]">✕</button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => setNewEvent({...newEvent, tracks: [...(newEvent.tracks || []), "New Track"]})} className="text-[10px] text-gray-500 border border-dashed border-white/10 px-3 py-2 rounded hover:text-acm-cyan hover:border-acm-cyan transition-all">[+] ADD_TRACK</button>
                                    </div>
                                </div>

                                {/* Speakers Manager */}
                                <div className="space-y-4 mb-8 p-6 bg-black/40 border border-white/5 rounded-xl">
                                    <p className="text-[10px] text-acm-cyan font-mono tracking-widest uppercase">:: EXPERT_POOL_DEPOLYMENT (Speakers & Judges)</p>
                                    <div className="space-y-6">
                                        {(newEvent.speakers || []).map((s, idx) => (
                                            <div key={idx} className="p-4 bg-white/2 border border-white/5 rounded-lg relative space-y-4">
                                                <button type="button" onClick={() => setNewEvent({...newEvent, speakers: newEvent.speakers.filter((_, i) => i !== idx)})} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-lg z-10">✕</button>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] text-gray-500 font-mono">EXPERT_NAME</label>
                                                        <input placeholder="e.g. Satoshi Nakamoto" className="w-full bg-black border border-white/10 p-2 rounded text-[10px] text-white" value={s.name} onChange={e => {
                                                            const ns = [...newEvent.speakers]; ns[idx].name = e.target.value; setNewEvent({...newEvent, speakers: ns});
                                                        }}/>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] text-gray-500 font-mono">PRIMARY_ROLE</label>
                                                        <input placeholder="e.g. Lead Dev @ Google" className="w-full bg-black border border-white/10 p-2 rounded text-[10px] text-white" value={s.role} onChange={e => {
                                                            const ns = [...newEvent.speakers]; ns[idx].role = e.target.value; setNewEvent({...newEvent, speakers: ns});
                                                        }}/>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] text-gray-500 font-mono">ASSIGN_ROLE</label>
                                                        <select className="w-full bg-black border border-white/10 p-2 rounded text-[10px] text-white" 
                                                            value={['SPEAKER', 'JUDGE', 'MENTOR', 'GUEST'].includes(s.type?.toUpperCase()) ? s.type : 'OTHER_CUSTOM'} 
                                                            onChange={e => {
                                                                const val = e.target.value;
                                                                const ns = [...newEvent.speakers]; 
                                                                if(val === 'OTHER_CUSTOM') {
                                                                    ns[idx].isCustomType = true;
                                                                    ns[idx].type = ''; // Reset for custom entry
                                                                } else {
                                                                    ns[idx].isCustomType = false;
                                                                    ns[idx].type = val;
                                                                }
                                                                setNewEvent({...newEvent, speakers: ns});
                                                            }}>
                                                            <option value="SPEAKER">SPEAKER</option>
                                                            <option value="JUDGE">JUDGE</option>
                                                            <option value="MENTOR">MENTOR</option>
                                                            <option value="GUEST">GUEST</option>
                                                            <option value="OTHER_CUSTOM">++ OTHER_CUSTOM ++</option>
                                                        </select>
                                                        {s.isCustomType && (
                                                            <input 
                                                                placeholder="Enter Custom Type" 
                                                                className="w-full mt-1 bg-black border border-acm-cyan/30 p-2 rounded text-[9px] text-acm-cyan animate-pulse focus:animate-none"
                                                                value={s.type}
                                                                onChange={e => {
                                                                    const ns = [...newEvent.speakers]; 
                                                                    ns[idx].type = e.target.value.toUpperCase(); 
                                                                    setNewEvent({...newEvent, speakers: ns});
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="md:col-span-2 space-y-1">
                                                        <label className="text-[8px] text-gray-500 font-mono">NEURAL_LINK (LinkedIn / Portfolio)</label>
                                                        <input placeholder="https://linkedin.com/in/..." className="w-full bg-black border border-white/10 p-2 rounded text-[10px] text-white" value={s.link || ''} onChange={e => {
                                                            const ns = [...newEvent.speakers]; ns[idx].link = e.target.value; setNewEvent({...newEvent, speakers: ns});
                                                        }}/>
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[8px] text-gray-500 font-mono">VISUAL_ASSET_URL</label>
                                                    <input placeholder="Image URL (Direct Link)" className="w-full bg-black border border-white/10 p-2 rounded text-[10px] text-white font-mono" value={s.image} onChange={e => {
                                                        const ns = [...newEvent.speakers]; ns[idx].image = e.target.value; setNewEvent({...newEvent, speakers: ns});
                                                    }}/>
                                                </div>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => setNewEvent({...newEvent, speakers: [...(newEvent.speakers || []), {name:'', role:'', image:'', type:'SPEAKER', link:''}]})} className="w-full py-3 border border-dashed border-white/10 text-[10px] text-gray-500 hover:text-acm-cyan hover:border-acm-cyan transition-all font-mono">
                                            [+] INITIALIZE_NEW_EXPERT_PROFILE
                                        </button>
                                    </div>
                                </div>

                                {/* FAQ Manager */}
                                <div className="space-y-4 mb-8 p-6 bg-black/40 border border-white/5 rounded-xl">
                                    <p className="text-[10px] text-acm-cyan font-mono tracking-widest uppercase">:: KNOWLEDGE_RECON_FAQS</p>
                                    <div className="space-y-4">
                                        {(newEvent.faqs || []).map((f, idx) => (
                                            <div key={idx} className="space-y-2 p-4 bg-white/2 border border-white/5 rounded-lg relative">
                                                <button type="button" onClick={() => setNewEvent({...newEvent, faqs: newEvent.faqs.filter((_, i) => i !== idx)})} className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-lg">✕</button>
                                                <input placeholder="Question" className="w-full bg-black border border-white/10 p-2 rounded text-[10px] text-white" value={f.question} onChange={e => {
                                                    const nf = [...newEvent.faqs]; nf[idx].question = e.target.value; setNewEvent({...newEvent, faqs: nf});
                                                }}/>
                                                <textarea placeholder="Response" rows="2" className="w-full bg-black border border-white/10 p-2 rounded text-[10px] text-white" value={f.answer} onChange={e => {
                                                    const nf = [...newEvent.faqs]; nf[idx].answer = e.target.value; setNewEvent({...newEvent, faqs: nf});
                                                }}/>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => setNewEvent({...newEvent, faqs: [...(newEvent.faqs || []), {question:'', answer:''}]})} className="w-full py-2 border border-dashed border-white/10 text-[10px] text-gray-500 hover:text-acm-cyan hover:border-acm-cyan transition-all font-mono">[+] GENERATE_FAQ</button>
                                    </div>
                                </div>
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
                                            <button type="button" onClick={(e) => moveEvent(i, -1, e)} className="text-[10px] w-6 h-5 flex items-center justify-center bg-white/5 hover:bg-acm-cyan/20 hover:text-acm-cyan rounded transition-all">▲</button>
                                            <button type="button" onClick={(e) => moveEvent(i, 1, e)} className="text-[10px] w-6 h-5 flex items-center justify-center bg-white/5 hover:bg-acm-cyan/20 hover:text-acm-cyan rounded transition-all">▼</button>
                                        </div>
                                        <button type="button" onClick={() => startEditEvent(ev)} className="bg-acm-cyan/10 text-acm-cyan hover:bg-acm-cyan hover:text-black p-2 rounded transition-all">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button type="button" onClick={() => deleteEvent(i)} className="text-red-500 hover:bg-red-500/10 p-2 rounded">✕</button>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 line-clamp-2 mb-4 h-8">{ev.desc}</p>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {(Array.isArray(ev.images) ? ev.images : []).map((img, idx) => (
                                        <div key={idx} className="w-10 h-10 bg-white/5 rounded-lg overflow-hidden flex-shrink-0 border border-white/5">
                                            <img src={getDirectDriveUrl(img)} className="w-full h-full object-cover" />
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
                        <h2 className="text-xl font-bold font-mono tracking-widest text-acm-cyan">// ARCHIVE_NEURAL_PHOTO</h2>
                        <div className="space-y-3">
                            <label className="text-[10px] text-gray-500 font-mono block mb-1">IMAGE_SOURCE (Google Drive Link Recommended):</label>
                            <div className="flex gap-2">
                                <input 
                                    placeholder="Paste GDrive or Image URL" 
                                    className="flex-1 bg-black border border-white/10 p-3 rounded text-xs font-mono text-white"
                                    value={newGalleryItem.src} 
                                    onChange={e => setNewGalleryItem({...newGalleryItem, src: e.target.value})}
                                />
                                {newGalleryItem.src && (
                                    <button
                                        type="button"
                                        onClick={() => setCropPicker({
                                            src: getDirectDriveUrl(newGalleryItem.src),
                                            aspect: '16/9',
                                            label: 'GALLERY_PHOTO',
                                            onConfirm: (cropCss) => {
                                                setNewGalleryItem(prev => ({ ...prev, cropCss }));
                                                setCropPicker(null);
                                            }
                                        })}
                                        className="px-3 py-2 bg-acm-cyan/10 border border-acm-cyan/30 text-acm-cyan text-[10px] font-mono rounded hover:bg-acm-cyan/20 whitespace-nowrap"
                                    >✂ CROP</button>
                                )}
                            </div>
                        </div>
                        {newGalleryItem.src && (
                            <div className="h-40 rounded-xl overflow-hidden border border-white/10 bg-black/40">
                                <img src={getDirectDriveUrl(newGalleryItem.src)} className="w-full h-full object-contain"/>
                            </div>
                        )}
                        <input placeholder="Short Caption" className="w-full bg-black border border-white/10 p-3 rounded text-xs text-white"
                            value={newGalleryItem.caption} onChange={e => setNewGalleryItem({...newGalleryItem, caption: e.target.value})}/>
                        <div>
                            <label className="text-[10px] text-gray-500 font-mono block mb-1">ASSOCIATED_EVENT:</label>
                            <select className="w-full bg-black border border-white/10 p-3 rounded text-xs text-white"
                                value={newGalleryItem.eventSlug} onChange={e => setNewGalleryItem({...newGalleryItem, eventSlug: e.target.value})}>
                                <option value="">-- NO_LINK --</option>
                                {events.map(ev => <option key={ev.slug} value={ev.slug}>{ev.title}</option>)}
                            </select>
                        </div>
                        <button onClick={addGalleryPhoto} className="w-full py-4 bg-acm-cyan text-black font-bold uppercase tracking-widest hover:bg-white transition-all">
                            SYNC_TO_GALLERY_BUFFER
                        </button>
                    </div>

                    {/* Gallery Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {gallery.map((g, i) => (
                            <div key={g.id} className="group relative aspect-video rounded-xl overflow-hidden border border-white/10">
                                <img src={getDirectDriveUrl(g.src)} className="w-full h-full object-cover"/>
                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                    {g.caption && <p className="text-[10px] text-white text-center">{g.caption}</p>}
                                    {g.eventSlug && <p className="text-[8px] text-acm-cyan font-mono">{g.eventSlug}</p>}
                                    <div className="flex gap-2 mt-1">
                                        <button type="button" onClick={(e) => moveGalleryPhoto(i, -1, e)} className="text-white text-xs border border-white/20 px-2 py-1 rounded hover:border-acm-cyan">▲</button>
                                        <button type="button" onClick={(e) => moveGalleryPhoto(i, 1, e)} className="text-white text-xs border border-white/20 px-2 py-1 rounded hover:border-acm-cyan">▼</button>
                                        <button type="button" onClick={() => deleteGalleryPhoto(g.id)} className="text-red-400 text-xs border border-red-400/20 px-2 py-1 rounded hover:bg-red-500/10">✕</button>
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
                            <div className="flex gap-2">
                                <input
                                    placeholder="Image URL (Google Drive or Direct)"
                                    className="flex-1 bg-black border border-white/10 p-3 rounded text-xs"
                                    value={newMember.image}
                                    onChange={e => setNewMember({...newMember, image: e.target.value})}
                                />
                                {newMember.image && (
                                    <button
                                        type="button"
                                        onClick={() => setCropPicker({
                                            src: getDirectDriveUrl(newMember.image),
                                            aspect: '2/3',
                                            label: 'MEMBER_PHOTO',
                                            onConfirm: (cropCss) => {
                                                setNewMember(prev => ({ ...prev, cropCss }));
                                                setCropPicker(null);
                                            }
                                        })}
                                        className="px-3 py-2 bg-acm-cyan/10 border border-acm-cyan/30 text-acm-cyan text-[10px] font-mono rounded hover:bg-acm-cyan/20 whitespace-nowrap"
                                    >✂ CROP</button>
                                )}
                            </div>
                            {newMember.image && (
                                <div className="w-20 h-20 rounded-full overflow-hidden border border-white/10 bg-black">
                                    <img
                                        src={getDirectDriveUrl(newMember.image)}
                                        className="w-full h-full object-cover"
                                        style={newMember.cropCss || {}}
                                    />
                                </div>
                            )}
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
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button type="button" onClick={(e) => moveMember(cat, m.id, -1, e)} className="p-1 hover:text-acm-cyan">▲</button>
                                                <button type="button" onClick={(e) => moveMember(cat, m.id, 1, e)} className="p-1 hover:text-acm-cyan">▼</button>
                                            </div>
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button type="button" onClick={() => startEditMember(m)} className="p-1.5 bg-black/80 rounded-full hover:text-acm-cyan">✎</button>
                                                <button type="button" onClick={() => deleteMember(cat, m.id)} className="p-1.5 bg-black/80 rounded-full hover:text-red-500">✕</button>
                                            </div>
                                            <div className="w-16 h-16 rounded-full overflow-hidden mb-2 bg-black border border-white/10">
                                                <img 
                                                    src={getDirectDriveUrl(m.image)} 
                                                    style={getImageStyle(m.image)}
                                                    className="w-full h-full object-cover" 
                                                />
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

            {activeTab === 'site' && (
                <div className="space-y-10 pb-20">
                    <section className="p-8 bg-white/5 border border-white/10 rounded-2xl space-y-6">
                        <h2 className="text-xl font-bold font-mono tracking-widest text-acm-cyan uppercase">// CORE_BRANDING_IDENTITY</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <label className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Home_Heading_Line_1</label>
                                <input className="w-full bg-black border border-white/10 p-3 rounded text-xs text-white" value={editAbout.homeHeading1 || ''} onChange={e => setEditAbout({...editAbout, homeHeading1: e.target.value.toUpperCase()})}/>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Home_Heading_Line_2</label>
                                <input className="w-full bg-black border border-white/10 p-3 rounded text-xs text-white" value={editAbout.homeHeading2 || ''} onChange={e => setEditAbout({...editAbout, homeHeading2: e.target.value.toUpperCase()})}/>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Home_Heading_Line_3</label>
                                <input className="w-full bg-black border border-white/10 p-3 rounded text-xs text-white" value={editAbout.homeHeading3 || ''} onChange={e => setEditAbout({...editAbout, homeHeading3: e.target.value.toUpperCase()})}/>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Home_Main_Tagline</label>
                            <textarea className="w-full bg-black border border-white/10 p-3 rounded text-xs text-white h-20" value={editAbout.homeDesc || ''} onChange={e => setEditAbout({...editAbout, homeDesc: e.target.value})}/>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Mission_Statement</label>
                            <textarea className="w-full bg-black border border-white/10 p-3 rounded text-xs text-white h-24 font-light text-lg italic" value={editAbout.mission || ''} onChange={e => setEditAbout({...editAbout, mission: e.target.value})}/>
                        </div>
                    </section>

                    <section className="p-8 bg-white/5 border border-white/10 rounded-2xl space-y-6">
                        <h2 className="text-xl font-bold font-mono tracking-widest text-acm-cyan uppercase">// SYSTEM_METRICS</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(editAbout.stats || []).map((stat, i) => (
                                <div key={i} className="p-4 bg-black/40 border border-white/5 rounded-lg space-y-3">
                                    <input className="w-full bg-transparent border-b border-white/10 py-1 text-xs text-acm-cyan font-bold" value={stat.label} onChange={e => {
                                        const n = [...editAbout.stats]; n[i].label = e.target.value.toUpperCase(); setEditAbout({...editAbout, stats: n});
                                    }}/>
                                    <input type="number" className="w-full bg-transparent text-2xl font-bold" value={stat.value} onChange={e => {
                                        const n = [...editAbout.stats]; n[i].value = parseInt(e.target.value)||0; setEditAbout({...editAbout, stats: n});
                                    }}/>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="p-8 bg-white/5 border border-white/10 rounded-2xl space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold font-mono tracking-widest text-acm-cyan uppercase">// LEGACY_ARCHIVE</h2>
                            <button onClick={() => setEditAbout({...editAbout, legacyLogs: [...(editAbout.legacyLogs||[]), {year:'', title:'', desc:''}]})} className="text-[10px] bg-white/10 px-4 py-2 hover:bg-white/20 transition-all font-mono uppercase tracking-widest">++ APPEND_LOG</button>
                        </div>
                        <div className="space-y-4">
                            {(editAbout.legacyLogs || []).map((log, i) => (
                                <div key={i} className="p-6 bg-black/40 border border-white/10 rounded-xl relative group">
                                    <button onClick={() => { const n = editAbout.legacyLogs.filter((_, idx)=>idx!==i); setEditAbout({...editAbout, legacyLogs: n}); }} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                    <div className="grid grid-cols-4 gap-4 mb-3">
                                        <input placeholder="Year" className="bg-transparent border-b border-white/10 text-xl font-bold text-acm-cyan" value={log.year} onChange={e => { const n = [...editAbout.legacyLogs]; n[i].year = e.target.value; setEditAbout({...editAbout, legacyLogs: n}); }}/>
                                        <input placeholder="Headline" className="col-span-3 bg-transparent border-b border-white/10 text-xl font-bold" value={log.title} onChange={e => { const n = [...editAbout.legacyLogs]; n[i].title = e.target.value; setEditAbout({...editAbout, legacyLogs: n}); }}/>
                                    </div>
                                    <textarea placeholder="Event Description/Impact..." className="w-full bg-transparent text-xs text-gray-400 h-16 resize-none" value={log.desc} onChange={e => { const n = [...editAbout.legacyLogs]; n[i].desc = e.target.value; setEditAbout({...editAbout, legacyLogs: n}); }}/>
                                </div>
                            ))}
                        </div>
                    </section>

                    <button onClick={() => { saveAbout(editAbout); alert('SITE_METRICS_SERIALIZED_IN_LOCAL_BUFFER :: REMEMBER TO BROADCAST_PUSH'); }} className="w-full py-6 bg-acm-cyan text-black font-black uppercase tracking-[0.4em] hover:bg-white transition-all shadow-[0_0_50px_rgba(100,255,218,0.2)]">
                        COMMIT_CHANGES_TO_LOCAL_BUFFER
                    </button>
                </div>
            )}

            {activeTab === 'registrations' && (
                <RegistrationsPanel
                    registrations={registrations}
                    setRegistrations={setRegistrations}
                    events={events}
                    filterEvent={filterEvent}
                    setFilterEvent={setFilterEvent}
                    setIsDirty={setIsDirty}
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
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-20 items-start">
                    <section className="p-8 bg-[#0A192F]/60 backdrop-blur-xl border border-acm-cyan/20 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <h2 className="text-xl font-bold font-heading mb-4 tracking-tighter uppercase text-acm-cyan">Neural_Sheet_Relay</h2>
                        <p className="text-[10px] text-gray-400 mb-8 font-mono leading-relaxed">
                            // CONNECT: Use Google Sheets as your global database via Apps Script.
                            This allows updates from any phone to sync across all visitor devices instantly.
                        </p>
                        
                        <div className="space-y-5 mb-8">
                            <div className="space-y-1">
                                <div className="flex justify-between items-end mb-1">
                                    <label className="text-[9px] text-acm-cyan font-mono uppercase">Apps_Script_Deployment_URL</label>
                                    <button 
                                        onClick={() => {
                                            localStorage.setItem('acm_gas_url', ACM_MASTER_GAS_URL);
                                            document.getElementById('gasUrlInput').value = ACM_MASTER_GAS_URL;
                                            alert('RELAY_RESTORED_TO_MASTER_ENGINE');
                                        }}
                                        className="text-[7px] text-gray-500 hover:text-white underline font-mono uppercase"
                                    >Reset_to_Master</button>
                                </div>
                                <input 
                                    id="gasUrlInput"
                                    className="w-full bg-black border border-white/10 p-3 rounded text-xs text-white font-mono" 
                                    defaultValue={localStorage.getItem('acm_gas_url') || ACM_MASTER_GAS_URL} 
                                    onChange={e => { localStorage.setItem('acm_gas_url', e.target.value); }} 
                                    placeholder="https://script.google.com/macros/s/.../exec" 
                                />
                                <p className="text-[7px] text-gray-600 uppercase mt-1 italic">// LINKED_SHEET: <a href="https://docs.google.com/spreadsheets/d/1ywPsh_TLHx6sEhWstvEFcID7JUpZIzlQ4r9og9Ew6C0/edit" target="_blank" className="underline text-acm-cyan">1ywPsh...og9Ew6C0</a></p>
                                <p className="text-[7px] text-gray-600 uppercase mt-1 italic">// SETUP_PROTOCOL: 1. Paste script in Sheet &gt; 2. Deploy as Web App &gt; 3. Anyone access &gt; 4. Paste URL above.</p>
                                <p className="text-[7px] text-acm-cyan uppercase mt-3 font-bold animate-pulse">// INITIALIZATION_REQUIRED: If your sheet is brand new, you MUST click 'Broadcast_Push_Sync' once to setup the structure.</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button 
                                onClick={async (e) => {
                                    const currentGasUrl = localStorage.getItem('acm_gas_url') || ACM_MASTER_GAS_URL;
                                    if(!currentGasUrl) return alert('DOWNLINK_OFFLINE :: ENTER_APPS_SCRIPT_URL');
                                    const btn = e.currentTarget;
                                    btn.innerText = "UPLOADING...";
                                    
                                    try {
                                        const events = JSON.parse(localStorage.getItem('acm_events') || '[]');
                                        const team = JSON.parse(localStorage.getItem('acm_team') || '{}');
                                        const gallery = JSON.parse(localStorage.getItem('acm_gallery') || '[]');
                                        const about = JSON.parse(localStorage.getItem('acm_about') || '{}');
                                        const registrations = JSON.parse(localStorage.getItem('acm_registrations') || '[]');
                                        const messages = JSON.parse(localStorage.getItem('acm_messages') || '[]');

                                        const payload = { 
                                            action: 'save',
                                            data: { events, team, gallery, about, registrations, messages, timestamp: new Date().toISOString() }
                                        };

                                        await fetch(currentGasUrl, {
                                            method: 'POST',
                                            mode: 'no-cors',
                                            body: JSON.stringify(payload)
                                        });
                                        alert('UPLINK_INITIALIZED :: INFRASTRUCTURE_SYNCED\n(Cloud Database Generated Successfully)');
                                    } catch(err) { 
                                        console.error("Broadcast Error:", err);
                                        alert(`BROADCAST_FAILURE: ${err.message}`); 
                                    }
                                    btn.innerText = "Broadcast_Push_Sync ↑";
                                }}
                                className="flex-1 py-4 bg-acm-cyan text-black font-black text-xs uppercase hover:bg-white transition-all shadow-[0_0_30px_rgba(100,255,218,0.3)]"
                            >Broadcast_Push_Sync ↑</button>
                            
                            <button 
                                onClick={async (e) => {
                                    const currentGasUrl = localStorage.getItem('acm_gas_url') || ACM_MASTER_GAS_URL;
                                    if(!currentGasUrl) return alert('DOWNLINK_OFFLINE :: ENTER_APPS_SCRIPT_URL');
                                    const btn = e.currentTarget;
                                    btn.innerText = "DOWNLOADING...";
                                    try {
                                        const response = await fetch(`${currentGasUrl}?action=get`);
                                        const result = await response.json();
                                        // V4 Response structure: { version: x, data: { ... } }
                                        const finalData = result.data || result; 
                                        if(finalData && finalData.events) {
                                            localStorage.setItem('acm_events', JSON.stringify(finalData.events));
                                            localStorage.setItem('acm_team', JSON.stringify(finalData.team));
                                            localStorage.setItem('acm_gallery', JSON.stringify(finalData.gallery));
                                            localStorage.setItem('acm_about', JSON.stringify(finalData.about));
                                            localStorage.setItem('acm_registrations', JSON.stringify(finalData.registrations || []));
                                            localStorage.setItem('acm_messages', JSON.stringify(finalData.messages || []));
                                            alert('DOWNLINK_ESTABLISHED :: FETCH_COMPLETE :: RE-INITIALIZING');
                                            window.location.reload();
                                        } else {
                                            alert('EMPTY_BUFFER_RECEIVED :: CHECK_SHEET_DATA');
                                        }
                                    } catch(err) { alert(`DOWNLINK_FAILURE: ${err.message}`); }
                                btn.innerText = "Fetch_Pull ↓";
                                }}
                                className="flex-1 py-4 border border-acm-cyan text-acm-cyan font-black text-xs uppercase hover:bg-acm-cyan/10 transition-all"
                            >Fetch_Pull ↓</button>
                        </div>
                        
                        <div className="mt-4">
                            <button 
                                onClick={async (e) => {
                                    const currentGasUrl = localStorage.getItem('acm_gas_url') || ACM_MASTER_GAS_URL;
                                    if(!currentGasUrl) return alert('DOWNLINK_OFFLINE :: ENTER_APPS_SCRIPT_URL');
                                    const btn = e.currentTarget;
                                    btn.innerText = "REBUILDING_INDEX...";
                                    try {
                                        await fetch(currentGasUrl, {
                                            method: 'POST',
                                            mode: 'no-cors',
                                            body: JSON.stringify({ action: 'rebuild' })
                                        });
                                        alert('REBUILD_SIGNAL_SENT :: Cloud reflects Sheet edits now.\n(Recommended: Click Fetch_Pull to see changes)');
                                    } catch(err) { alert(`REBUILD_FAILURE: ${err.message}`); }
                                    btn.innerText = "Rebuild_Cloud_Index ⟲";
                                }}
                                className="w-full py-4 border border-white/10 text-gray-500 font-mono text-[10px] uppercase hover:text-white hover:bg-white/5 transition-all"
                            >Rebuild_Cloud_Index ⟲</button>
                            <p className="text-[7px] text-gray-600 mt-2 italic text-center uppercase">// USE_AFTER_MANUALLY_EDITING_GOOGLE_SHEET_ROWS</p>
                        </div>
                        <div className="mt-8 p-4 bg-black/40 border border-white/5 rounded-lg overflow-x-auto">
                            <p className="text-[7px] font-mono text-gray-500 leading-relaxed uppercase whitespace-pre">
                                // ELITE_SHEET_ENGINE_V4_2_GOLD (PASTE IN EXTENSIONS &gt; APPS SCRIPT)<br/>
                                                                {`
/**
 * ELITE_SHEET_ENGINE_V4_2_GOLD
 * Google Sheets Live Database Engine :: RESILIENT EDITION
 * -------------------------------------------------------
 * Robust, Self-Healing, and Error-Tracking
 */

const MASTER_SHEET = "Sheet1";
const META_SHEET = "_META";
const LOG_SHEET = "DEBUG_LOG";

const REQUIRED_SHEETS = {
  "Sheet1": ["MASTER_JSON"],
  "_META": ["KEY","VALUE"],
  "DEBUG_LOG": ["TIMESTAMP", "STATUS", "MESSAGE", "PAYLOAD_EXTRACT"],
  "TEAM_LOGS": ["CATEGORY","NAME","ROLE","IMAGE_URL","LINKEDIN","DESCRIPTION"],
  "EVENT_LOGS": ["SLUG","TITLE","DATE","CATEGORY","PRIZE_POOL","MAX_TEAM_SIZE","IMAGES","TRACKS","EXPERTS","FAQS","DESCRIPTION"],
  "GALLERY_LOGS": ["IMAGE_URL","CAPTION","EVENT_LINK"],
  "ABOUT_LOGS": ["TYPE","DATA1","DATA2","DATA3"],
  "REGISTRATION_LOGS": ["NAME","EMAIL","PHONE","YEAR","BRANCH","COLLEGE","TEAM","EVENT","TIMESTAMP","MESSAGE"],
  "MESSAGE_LOGS": ["USER_ID","EMAIL","TIMESTAMP","CONTENT"]
};

function setupDatabase() { initializeSheets(); }

function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if(!ss) throw new Error("CRITICAL_ERROR :: SCRIPT_NOT_BOUND_TO_SHEET");

  Object.keys(REQUIRED_SHEETS).forEach(function(name) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    
    const headers = REQUIRED_SHEETS[name];
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      formatHeader(sheet);
    }
  });
  initializeMeta();
}

function initializeMeta() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(META_SHEET);

  if(sheet.getLastRow() < 2){
    sheet.getRange(2,1,2,2).setValues([
      ["VERSION",1],
      ["LAST_UPDATE",Date.now()]
    ]);
    return;
  }

  const key = sheet.getRange("A2").getValue();
  if(key !== "VERSION"){
    sheet.getRange(2,1,2,2).setValues([
      ["VERSION",1],
      ["LAST_UPDATE",Date.now()]
    ]);
  }
}

function onEdit(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    rebuildMasterIndex(ss);
    logEvent("SUCCESS", "Manual Edit Rebuilt Master Index", "Version Incremented");
    lock.releaseLock();
  } catch (err) {
    if (lock.hasLock()) lock.releaseLock();
    logEvent("ERROR", "onEdit Rebuild Failed", err.toString());
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    initializeSheets();
    if (!e || !e.postData || !e.postData.contents) throw new Error("BUFFER_EMPTY");
    
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (payload.action === 'save' && payload.data) {
      saveMasterJSON(ss, payload.data);
      processPayload(ss, payload.data);
      bumpVersion();
      lock.releaseLock();
      logEvent("SUCCESS", "Save Action Complete", "Full data synced");
      return jsonResponse({ status: "SUCCESS", message: "SAVE_COMPLETE" });
    }

    if (payload.action === 'rebuild') {
      rebuildMasterIndex(ss);
      lock.releaseLock();
      return jsonResponse({ status: "SUCCESS", message: "REBUILD_COMPLETE" });
    }

    if (payload.action === 'register' && payload.data) {
      appendRegistration(ss, payload.data);
      bumpVersion();
      lock.releaseLock();
      return jsonResponse({ status: "SUCCESS", message: "REGISTRATION_RECORDED" });
    }

    if (payload.action === 'message' && payload.data) {
      appendMessage(ss, payload.data);
      bumpVersion();
      lock.releaseLock();
      return jsonResponse({ status: "SUCCESS", message: "MESSAGE_RECORDED" });
    }

    if (payload.data) {
      saveMasterJSON(ss, payload.data);
      processPayload(ss, payload.data);
      bumpVersion();
    }
    
    lock.releaseLock();
    return jsonResponse({ status: "SUCCESS" });
  } catch (err) {
    if (lock.hasLock()) lock.releaseLock();
    logEvent("CRASH", err.toString(), "In doPost");
    return jsonResponse({ status: "ERROR", message: err.toString() });
  }
}

function appendRegistration(ss, r) {
  const sheet = ss.getSheetByName("REGISTRATION_LOGS");
  sheet.appendRow([r.name||"", r.email||"", r.phone||"", r.year||"", r.branch||"", r.college||"", r.team||"", r.event||"", r.timestamp||"", r.message||""]);
  updateMasterJSON(ss, function(data) {
    if(!data.registrations) data.registrations = [];
    data.registrations.unshift(r);
    return data;
  });
}

function appendMessage(ss, m) {
  const sheet = ss.getSheetByName("MESSAGE_LOGS");
  sheet.appendRow([m.user||"", m.email||"", m.timestamp||"", m.content||""]);
  updateMasterJSON(ss, function(data) {
    if(!data.messages) data.messages = [];
    data.messages.unshift(m);
    return data;
  });
}

function updateMasterJSON(ss, callback) {
  const sheet = ss.getSheetByName(MASTER_SHEET);
  const range = sheet.getRange("A1");
  let data = {};
  try { data = JSON.parse(range.getValue() || "{}"); } catch(e) {}
  const updated = callback(data);
  range.setValue(JSON.stringify(updated));
}

function doGet(e) {
  try {
    initializeSheets();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "get";

    if (action === "logs") {
      const sheet = ss.getSheetByName(LOG_SHEET);
      const values = sheet.getDataRange().getValues();
      const logs = [];
      for (let i = 1; i < values.length; i++) {
        logs.push({ timestamp: values[i][0], status: values[i][1], message: values[i][2], payload: values[i][3] });
      }
      return jsonResponse({ logs: logs.reverse().slice(0, 100) });
    }

    const meta = ss.getSheetByName(META_SHEET);
    const currentVersion = meta.getRange("B2").getValue();
    const clientVersion = (e && e.parameter && e.parameter.version) ? e.parameter.version : null;

    if (clientVersion && Number(clientVersion) === Number(currentVersion)) {
      return jsonResponse({ status: "NO_UPDATE", version: currentVersion });
    }

    const master = ss.getSheetByName(MASTER_SHEET);
    let rawData = master.getRange("A1").getValue() || "{}";
    return jsonResponse({ version: currentVersion, data: JSON.parse(rawData) });
  } catch (err) {
    logEvent("CRASH", err.toString(), "In doGet");
    return jsonResponse({ status: "ERROR", message: err.toString() });
  }
}

function bumpVersion() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const meta = ss.getSheetByName(META_SHEET);
  let version = parseInt(meta.getRange("B2").getValue()) || 0;
  version++;
  meta.getRange("B2").setValue(version);
  meta.getRange("B3").setValue(Date.now());
}

function saveMasterJSON(ss, data) {
  ss.getSheetByName(MASTER_SHEET).getRange("A1").setValue(JSON.stringify(data));
}

function processPayload(ss, data) {
  if (!data) return;
  if (data.team) writeTeam(ss, data.team);
  if (data.events) writeEvents(ss, data.events);
  if (data.gallery) writeGallery(ss, data.gallery);
  if (data.about) writeAbout(ss, data.about);
  if (data.registrations) writeRegistrations(ss, data.registrations);
  if (data.messages) writeMessages(ss, data.messages);
}

function writeTeam(ss, team) {
  const rows = [REQUIRED_SHEETS["TEAM_LOGS"]];
  Object.keys(team).forEach(function(cat) {
    if (Array.isArray(team[cat])) {
      team[cat].forEach(function(m) {
        rows.push([cat, m.name||"", m.role||"", m.image||"", m.linkedin||"", m.desc||""]);
      });
    }
  });
  writeToSheet(ss, "TEAM_LOGS", rows);
}

function writeEvents(ss, events) {
  const rows = [REQUIRED_SHEETS["EVENT_LOGS"]];
  if (Array.isArray(events)) {
    events.forEach(function(e) {
      rows.push([
        e.slug||"", e.title||"", e.dateText||"", e.category||"", e.prizePool||0, e.maxTeamSize||1,
        JSON.stringify(e.images||[]), JSON.stringify(e.tracks||[]), JSON.stringify(e.speakers||[]), JSON.stringify(e.faqs||[]), e.desc||""
      ]);
    });
  }
  writeToSheet(ss, "EVENT_LOGS", rows);
}

function writeGallery(ss, gallery) {
  const rows = [REQUIRED_SHEETS["GALLERY_LOGS"]];
  if (Array.isArray(gallery)) {
    gallery.forEach(function(g) { rows.push([g.src||"", g.caption||"", g.eventSlug||""]); });
  }
  writeToSheet(ss, "GALLERY_LOGS", rows);
}

function writeAbout(ss, about) {
  const rows = [REQUIRED_SHEETS["ABOUT_LOGS"]];
  rows.push(["HOME_HEADING_1", about.homeHeading1||"", "", ""]);
  rows.push(["HOME_HEADING_2", about.homeHeading2||"", "", ""]);
  rows.push(["HOME_HEADING_3", about.homeHeading3||"", "", ""]);
  rows.push(["HOME_TAGLINE", about.homeDesc||"", "", ""]);
  rows.push(["MISSION_STATEMENT", about.mission||"", "", ""]);
  if(Array.isArray(about.stats)) about.stats.forEach(function(s){ rows.push(["STATISTIC", s.label||"", s.value||"", ""]); });
  if(Array.isArray(about.legacyLogs)) about.legacyLogs.forEach(function(l){ rows.push(["LEGACY_LOG", l.year||"", l.title||"", l.desc||""]); });
  writeToSheet(ss, "ABOUT_LOGS", rows);
}

function writeRegistrations(ss, data) {
  const rows = [REQUIRED_SHEETS["REGISTRATION_LOGS"]];
  if (Array.isArray(data)) {
    data.forEach(function(r){ rows.push([r.name||"", r.email||"", r.phone||"", r.year||"", r.branch||"", r.college||"", r.team||"", r.event||"", r.timestamp||"", r.message||""]); });
  }
  writeToSheet(ss, "REGISTRATION_LOGS", rows);
}

function writeMessages(ss, data) {
  const rows = [REQUIRED_SHEETS["MESSAGE_LOGS"]];
  if (Array.isArray(data)) {
    data.forEach(function(m){ rows.push([m.user||"", m.email||"", m.timestamp||"", m.content||""]); });
  }
  writeToSheet(ss, "MESSAGE_LOGS", rows);
}

function rebuildMasterIndex(ss) {
  const data = {
    events: readEvents(ss), team: readTeam(ss), gallery: readGallery(ss), about: readAbout(ss),
    registrations: readRegistrations(ss), messages: readMessages(ss)
  };
  saveMasterJSON(ss, data);
  bumpVersion();
}

function readEvents(ss) {
  const sheet = ss.getSheetByName("EVENT_LOGS");
  const values = sheet.getDataRange().getValues();
  const events = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    events.push({
      slug: row[0], title: row[1], dateText: row[2], category: row[3], prizePool: row[4], maxTeamSize: row[5],
      images: safeJSONParse(row[6], []), tracks: safeJSONParse(row[7], []), speakers: safeJSONParse(row[8], []), faqs: safeJSONParse(row[9], []), desc: row[10]
    });
  }
  return events;
}

function safeJSONParse(val, fallback) {
  if (!val || val === "") return fallback;
  try { return JSON.parse(val); } catch(e) { return fallback; }
}

function readTeam(ss) {
  const sheet = ss.getSheetByName("TEAM_LOGS");
  const values = sheet.getDataRange().getValues();
  const team = {};
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const cat = row[0];
    if (!team[cat]) team[cat] = [];
    team[cat].push({ name: row[1], role: row[2], image: row[3], linkedin: row[4], desc: row[5] });
  }
  return team;
}

function readGallery(ss) {
  const sheet = ss.getSheetByName("GALLERY_LOGS");
  const values = sheet.getDataRange().getValues();
  const gallery = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    gallery.push({ src: row[0], caption: row[1], eventSlug: row[2] });
  }
  return gallery;
}

function readAbout(ss) {
  const sheet = ss.getSheetByName("ABOUT_LOGS");
  const values = sheet.getDataRange().getValues();
  const about = { stats: [], legacyLogs: [] };
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const type = row[0];
    if (type === "HOME_HEADING_1") about.homeHeading1 = row[1];
    else if (type === "HOME_HEADING_2") about.homeHeading2 = row[1];
    else if (type === "HOME_HEADING_3") about.homeHeading3 = row[1];
    else if (type === "HOME_TAGLINE") about.homeDesc = row[1];
    else if (type === "MISSION_STATEMENT") about.mission = row[1];
    else if (type === "STATISTIC") about.stats.push({ label: row[1], value: row[2] });
    else if (type === "LEGACY_LOG") about.legacyLogs.push({ year: row[1], title: row[2], desc: row[3] });
  }
  return about;
}

function readRegistrations(ss) {
  const sheet = ss.getSheetByName("REGISTRATION_LOGS");
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  const registrations = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    registrations.push({ name: row[0], email: row[1], phone: row[2], year: row[3], branch: row[4], college: row[5], team: row[6], event: row[7], timestamp: row[8], message: row[9] });
  }
  return registrations;
}

function readMessages(ss) {
  const sheet = ss.getSheetByName("MESSAGE_LOGS");
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  const messages = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    messages.push({ user: row[0], email: row[1], timestamp: row[2], content: row[3] });
  }
  return messages;
}

function writeToSheet(ss, name, rows) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  sheet.clearContents();
  if (rows.length > 0) {
    sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
    formatHeader(sheet);
  }
}

function formatHeader(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol > 0) {
    const header = sheet.getRange(1, 1, 1, lastCol);
    header.setFontWeight("bold").setBackground("#f3f3f3");
    sheet.setFrozenRows(1);
  }
}

function logEvent(status, message, payload) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(LOG_SHEET) || ss.insertSheet(LOG_SHEET);
    sheet.appendRow([new Date(), status, message, payload]);
  } catch(e) {}
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

                                `}
                            </p>
                        </div>
                    </section>

                    <div className="space-y-8">
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
                    </div>
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
                    { id: 101, name: "Rushabh Zaveri", role: "Chairperson", desc: "Mastermind behind chapter scaling and strategic growth of the student chapter.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&h=500&fit=crop", category: "CORE_COMMITTEE", linkedin: "#" },
                    { id: 102, name: "Aditya Devghare", role: "Secretary", desc: "Operations lead ensuring precision in every logistical protocol.", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&h=500&fit=crop", category: "CORE_COMMITTEE", linkedin: "#" }
                ],
                "TECHNICAL_FORCE": [
                    { id: 201, name: "Aryan Shah", role: "Tech Head", desc: "Chief Architect for software systems and development sprints.", image: "https://images.unsplash.com/photo-1506794778242-aff5640707c6?q=80&w=400&h=500&fit=crop", category: "TECHNICAL_FORCE", linkedin: "#" }
                ]
            };
            localStorage.setItem('acm_team', JSON.stringify(defaults));
        }
        if (!localStorage.getItem('acm_admin_creds')) {
             localStorage.setItem('acm_admin_creds', JSON.stringify({userId:"admin", email:"acmco@tsecmumbai.in", pass:"ACM_SECURE_2026"}));
        }

        if (!localStorage.getItem('acm_gas_url')) {
            localStorage.setItem('acm_gas_url', ACM_MASTER_GAS_URL);
        }
        if (!localStorage.getItem('acm_about')) {
            const defaults = {
                homeHeading1: "FUTURE",
                homeHeading2: "READY",
                homeHeading3: "ENGINEERS",
                homeDesc: "The Official ACM Student Chapter of TSEC.\nWe don't just write code; we architect experiences.",
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

        // Live Sync: Version-Based Backend Sync Engine
        const syncData = async () => {
            // Prevent sync if we have unsaved local changes to avoid overwriting work
            if (localStorage.getItem('acm_is_dirty') === 'true') {
                console.log("[SYNC] Local changes pending. Skipping pull.");
                return;
            }

            const gasUrl = localStorage.getItem('acm_gas_url') || ACM_MASTER_GAS_URL;
            if (!gasUrl) return;

            try {
                const currentVersion = localStorage.getItem('acm_version') || '0';
                const response = await fetch(`${gasUrl}?action=get&version=${currentVersion}`);
                if (!response.ok) throw new Error(`HTTP_${response.status}`);
                
                const result = await response.json();
                
                if (result.status === "NO_UPDATE") return;

                const finalData = result.data;
                const newVersion = result.version;
                
                if (finalData && finalData.events) {
                    console.log(`[SYNC] Updating to version ${newVersion}...`);
                    
                    const newAbout = JSON.stringify(finalData.about || {});
                    const oldAbout = localStorage.getItem('acm_about');
                    
                    localStorage.setItem('acm_events', JSON.stringify(finalData.events || []));
                    localStorage.setItem('acm_team', JSON.stringify(finalData.team || {}));
                    localStorage.setItem('acm_gallery', JSON.stringify(finalData.gallery || []));
                    localStorage.setItem('acm_about', newAbout);
                    localStorage.setItem('acm_registrations', JSON.stringify(finalData.registrations || []));
                    localStorage.setItem('acm_messages', JSON.stringify(finalData.messages || []));
                    localStorage.setItem('acm_version', newVersion);
                    
                    // If this was a fresh device (v0), reload to update the whole UI with new data
                    if (currentVersion === '0' || (oldAbout && newAbout !== oldAbout)) {
                         setTimeout(() => window.location.reload(), 300);
                    }
                }
            } catch (err) {
                console.error("[SYNC] Engine Error:", err);
            }
        };

        syncData();
        const poller = setInterval(syncData, 30000);
        return () => clearInterval(poller);
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