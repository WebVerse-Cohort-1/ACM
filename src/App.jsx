
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
    const [gyro, setGyro] = useState({ x: 0, y: 0 });
    const [glow, setGlow] = useState("50% 50%");

    useEffect(() => {
        const handleOrientation = (e) => {
            if (e.beta !== null && e.gamma !== null) {
                setGyro({
                    x: (e.gamma / 20),
                    y: (e.beta - 45) / 20
                });
            }
        };
        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, []);

    const handleMouseMove = (e) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const xPct = (e.clientX - rect.left) / rect.width;
        const yPct = (e.clientY - rect.top) / rect.height;

        setGlow(`${xPct * 100}% ${yPct * 100}%`);

        if (window.innerWidth >= 1024) {
            const x = xPct - 0.5;
            const y = yPct - 0.5;
            card.style.transform = `perspective(1000px) rotateY(${x * 15}deg) rotateX(${-y * 15}deg) scale3d(1.02, 1.02, 1.02)`;
        }
    };

    const handleMouseLeave = () => {
        if (!cardRef.current) return;
        cardRef.current.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)`;
        setGlow("50% 50%");
    };

    const gyroStyle = window.innerWidth < 1024 ? {
        transform: `perspective(1000px) rotateY(${gyro.x * 10}deg) rotateX(${-gyro.y * 10}deg)`,
        transition: 'transform 0.1s ease-out'
    } : {};

    return (
        <div
            ref={cardRef}
            className={`transition-all duration-300 ease-out group relative overflow-hidden ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={gyroStyle}
        >
            <div className="h-full w-full relative overflow-hidden rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl">
                {/* Dynamic Glow Gradient */}
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
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden text-white text-3xl z-[1002] focus:outline-none focus:text-acm-cyan transition-colors"
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
    <div className="min-h-screen flex flex-col justify-center px-8 md:px-20 pt-20">
        <div className="max-w-4xl">
            <div className="overflow-hidden mb-2">
                <p className="text-acm-cyan font-mono text-sm tracking-[0.3em] animate-appear">
                    :: SYSTEM_READY
                </p>
            </div>
            <h1 className="text-7xl md:text-9xl font-heading font-bold leading-[0.85] mb-8 mix-blend-screen">
                <GlitchText text="FUTURE" /><br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">READY</span><br />
                <span className="text-acm-blue">ENGINEERS</span>
            </h1>

            <p className="text-gray-400 text-lg md:text-xl max-w-xl mb-12 leading-relaxed border-l-2 border-acm-cyan/30 pl-6">
                The Official ACM Student Chapter of TSEC. <br />
                We don't just write code; we architect experiences.
            </p>

            <div className="flex gap-6">
                <Link to="/events">
                    <MagneticButton as="div" className="px-8 py-4 bg-white text-black font-bold rounded-none hover:bg-acm-cyan transition-colors">
                        EXPLORE EVENTS ↗
                    </MagneticButton>
                </Link>
                <Link to="/contact">
                    <MagneticButton as="div" className="px-8 py-4 border border-white/20 text-white font-bold rounded-none hover:bg-white/10 backdrop-blur-md">
                        JOIN NETWORK
                    </MagneticButton>
                </Link>
            </div>
        </div>

        {/* Floating Scroll Indicator */}
        {/* <div className="absolute bottom-10 right-10 flex flex-col items-center gap-2 mix-blend-difference">
            <div className="w-[1px] h-20 bg-white/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-white animate-movedown"></div>
            </div>
            <span className="text-[10px] tracking-widest vertical-rl">SCROLL</span>
        </div> */}
    </div>
);

const Events = () => {
    const events = [
        { title: 'CodeSprint 26', date: 'MAR 15', tag: 'HACKATHON', color: 'from-acm-cyan to-blue-600', desc: '48h intensive prototyping sprint.' },
        { title: 'System_Breach', date: 'APR 02', tag: 'CTF', color: 'from-red-500 to-orange-600', desc: 'Cybersecurity capture the flag.' },
        { title: 'Neural_Nets', date: 'MAY 10', tag: 'WORKSHOP', color: 'from-purple-500 to-indigo-600', desc: 'Deep learning with experts.' },
        { title: 'Cloud_Summit', date: 'JUN 22', tag: 'CONFERENCE', color: 'from-blue-400 to-teal-400', desc: 'Cloud native architecture.' },
        { title: 'Open_Source', date: 'JUL 14', tag: 'INITIATIVE', color: 'from-green-400 to-emerald-600', desc: 'Summer contribution drive.' },
        { title: 'Dev_Fest', date: 'AUG 30', tag: 'MEETUP', color: 'from-yellow-400 to-orange-500', desc: 'Community developer meet.' },
    ];

    return (
        <div className="min-h-screen pt-32 px-6 md:px-20 max-w-8xl mx-auto pb-20">
            <h1 className="text-6xl md:text-9xl font-heading font-bold mb-16 opacity-5 fixed -z-10 top-20 right-0 pointer-events-none select-none">
                TIMELINE
            </h1>

            <div className="flex flex-col md:flex-row items-baseline justify-between mb-16 border-b border-white/10 pb-8 backdrop-blur-sm">
                <h2 className="text-4xl md:text-6xl font-heading font-bold text-white">
                    EVENT_<span className="text-acm-cyan">LOGS</span>
                </h2>
                <p className="text-gray-400 font-mono text-xs tracking-widest mt-4 md:mt-0">:: UPCOMING_OPERATIONS</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 perspective-1000">
                {events.map((ev, i) => (
                    <TiltCard key={i} className="group aspect-[4/5] md:aspect-[4/3] cursor-pointer">
                        <div className="relative h-full w-full p-8 flex flex-col justify-between z-10">
                            {/* Date Badge */}
                            <div className="flex justify-between items-start">
                                <span className="font-mono text-xl font-bold text-white border-b-2 border-acm-cyan pb-1">
                                    {ev.date}
                                </span>
                                <span className="font-mono text-[9px] border border-white/20 px-2 py-1 rounded text-gray-300 bg-black/20 backdrop-blur-md">
                                    {ev.tag}
                                </span>
                            </div>

                            {/* Central Glow */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none">
                                <div className={`w-40 h-40 rounded-full bg-gradient-to-br ${ev.color} blur-3xl animate-pulse`}></div>
                            </div>

                            {/* Content */}
                            <div className="z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                <h3 className="text-3xl font-heading font-bold text-white mb-2 shadow-black drop-shadow-md">{ev.title}</h3>
                                <p className="text-sm text-gray-300 font-mono mb-6 border-l-2 border-white/20 pl-3">
                                    {ev.desc}
                                </p>
                                <MagneticButton as="div" className="text-xs border border-white/20 hover:border-acm-cyan text-acm-cyan px-4 py-2 rounded uppercase tracking-wider bg-black/40 backdrop-blur-md">
                                    Register Interface &rarr;
                                </MagneticButton>
                            </div>
                        </div>
                    </TiltCard>
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
            className="min-h-screen pt-32 px-8 md:px-20 flex flex-col md:flex-row gap-20"
        >

            <div className="md:w-1/3 flex items-start justify-center relative">
                <div className="sticky top-32 space-y-6">
                    {["WHO", "WE", "ARE"].map((word, i) => {
                        const threshold = (i + 1) / 3;

                        const isActive = progress >= threshold;

                        return (
                            <div
                                key={i}
                                className={`text-6xl md:text-8xl font-heading font-bold transition-all duration-500 ${isActive
                                        ? "text-acm-cyan scale-110"
                                        : "text-gray-700 scale-100"
                                    }`}
                            >
                                {word}
                            </div>
                        );
                    })}

                    {/* Vertical progress line */}
                    <div className="absolute -left-6 top-0 h-full w-[2px] bg-white/10">
                        <div
                            className="w-full bg-acm-cyan transition-all duration-300"
                            style={{ height: `${progress * 100}%` }}
                        />
                    </div>
                </div>
            </div>


            <div className="md:w-2/3 space-y-32">
                <section>
                    <h2 className="text-2xl text-acm-cyan font-mono mb-6">
                        :: MISSION_STATEMENT
                    </h2>
                    <p className="text-2xl md:text-4xl font-light leading-snug">
                        We are the <span className="text-white font-bold">architects</span> of the digital frontier.
                        TSEC ACM is not just a club; it's an incubator for those who dare to
                        <span className="italic text-gray-400"> disrupt</span> the status quo.
                    </p>
                </section>

                <div
                    ref={statsRef}
                    className="grid grid-cols-2 md:grid-cols-3 gap-10 mt-20"
                >
                    {stats.map((stat, i) => (
                        <div
                            key={i}
                            className="text-center group transition-transform duration-500 hover:-translate-y-2"
                        >
                            <h3 className="text-5xl md:text-6xl font-heading font-bold text-acm-cyan relative">
                                {counts[i]}+
                                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-acm-cyan group-hover:w-full transition-all duration-500"></span>
                            </h3>
                            <p className="text-xs tracking-[0.3em] text-gray-500 mt-3">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>

                <section>
                    <h2 className="text-2xl text-acm-blue font-mono mb-6">
                        :: LEGACY_LOGS
                    </h2>
                    <div className="border-l border-white/20 pl-10 space-y-16">
                        <div>
                            <span className="text-4xl font-heading font-bold opacity-30">2025</span>
                            <h3 className="text-2xl font-bold mt-2">National Apex</h3>
                            <p className="text-gray-400 mt-2">
                                Awarded Best Student Chapter nationwide.
                            </p>
                        </div>
                        <div>
                            <span className="text-4xl font-heading font-bold opacity-30">2023</span>
                            <h3 className="text-2xl font-bold mt-2">Source Code</h3>
                            <p className="text-gray-400 mt-2">
                                Launched open-source initiative with 500+ PRs.
                            </p>
                            
                        </div>
                    </div>
                </section><br /><br /><br />
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
            { name: "Siddharth Jain", role: "Secretary", desc: "Maintaining structural integrity and official documentation of all proceedings.", image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&h=500&fit=crop" },
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
            { name: "Ranveer Singh", role: "Marketing Manager", desc: "Building brand awareness and strategic industry tie-ups.", image: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=400&h=500&fit=crop" },
            { name: "Janhvi Kapoor", role: "Marketing Manager", desc: "Driving student registrations and sponsorship acquisition.", image: "https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=400&h=500&fit=crop" },
        ],
    };

    return (
        <div className="min-h-screen pt-32 px-6 md:px-20 max-w-8xl mx-auto pb-20">
             <h1 className="text-6xl md:text-9xl font-heading font-bold mb-16 opacity-5 fixed -z-10 top-20 right-0 pointer-events-none select-none">
                COMMAND
            </h1>
            
            <div className="flex flex-col md:flex-row items-baseline justify-between mb-16 border-b border-white/10 pb-8 backdrop-blur-sm">
                <h2 className="text-4xl md:text-6xl font-heading font-bold text-white">
                    PROTOCOL_<span className="text-acm-cyan">LEADERS</span>
                </h2>
                <p className="text-gray-400 font-mono text-xs tracking-widest mt-4 md:mt-0 uppercase">:: Core committee & vertical heads</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 perspective-1000">
                {members.map((m, i) => (
                    <TiltCard key={i} className="group aspect-[3/4] cursor-pointer">
                        <div className="relative h-full w-full p-6 flex flex-col justify-between z-10">
                            {/* Top ID */}
                            <div className="flex justify-between items-start">
                                <span className="font-mono text-4xl font-bold text-white/10 group-hover:text-white/30 transition-colors">
                                    {m.id}
                                </span>
                                <div className="w-2 h-2 rounded-full bg-acm-cyan animate-pulse"></div>
                            </div>
                            
                            {/* Central Glow representing the person */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-70 transition-opacity duration-500 pointer-events-none">
                                <div className={`w-32 h-32 rounded-full bg-gradient-to-t ${m.color} blur-3xl`}></div>
                            </div>

                            {/* Content */}
                            <div className="z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                <h3 className="text-2xl font-heading font-bold text-white mb-1">{m.role}</h3>
                                <p className="text-xs text-acm-cyan font-mono tracking-widest opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                                    :: ACTIVE_NODE
                                </p>
                            </div>
                        </div>
                    </TiltCard>
                ))}
            </div>
        </div>
    );
};








// --- FUSION GALLERY (Tunnel + Drift + Carousel) ---
const FusionGallery = () => {
    const [scrollProgress, setScrollProgress] = useState(0);
    const [activeIndex, setActiveIndex] = useState(-1);

    // Data: 3D Positions + Content
    const items = useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        // Z-Spacing: 1200px per item + Offset so first item is visible but background
        z: i * 1200 + 650,
        // Drift Scatter (Background State)
        // Rule 9: Compress horizontally, expand vertically on mobile to prevent crowding
        x: (Math.random() - 0.5) * (window.innerWidth < 768 ? 25 : 150), // Compressed X
        y: (Math.random() - 0.5) * (window.innerWidth < 768 ? 90 : 100), // Expanded Y
        rotation: (Math.random() - 0.5) * 45,
        title: `EVENT_LOG_${i < 9 ? '0' : ''}${i + 1}`,
        desc: "Secure data node accessed. Decrypting visual archives...",
        slides: [
            `from-cyan-900/40 to-blue-900/40`,
            `from-purple-900/40 to-pink-900/40`,
            `from-emerald-900/40 to-teal-900/40`
        ]
    })), []);

    // Scroll Logic
    useEffect(() => {
        const handleScroll = () => {
            setScrollProgress(window.scrollY * 1.0);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Determine Active Item
    useEffect(() => {
        let closest = -1;
        let minDist = Infinity;

        items.forEach((item, index) => {
            const dist = Math.abs(item.z - scrollProgress); // Distance from abstract "camera"
            if (dist < 600) { // Active Window width
                if (dist < minDist) {
                    minDist = dist;
                    closest = index;
                }
            }
        });
        setActiveIndex(closest);
    }, [scrollProgress, items]);

    const maxZ = items[items.length - 1].z + 2000;

    return (
        <div className="min-h-screen bg-transparent transition-colors duration-1000">

            {/* Scroll Spacer */}
            <div style={{ height: `${maxZ}px` }} className="absolute top-0 left-0 w-px -z-50 pointer-events-none"></div>

            {/* HUD */}
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
            <div className="fixed top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center perspective-[1000px]">
                <div className="relative w-full h-full preserve-3d">
                    {items.map((item, index) => {
                        const isActive = index === activeIndex;

                        // Relative Z Calculation
                        // Standard Tunnel: Item is at (item.z - scrollProgress) away from camera.
                        // We offset by -500 to start them "in front".
                        const rawZ = -item.z + scrollProgress - 500;

                        // Visibility Check (Removed to keep items floating in background)
                        // if (rawZ > 1500 || rawZ < -5000) return null;

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
    // Current Carousel Slide
    const [slide, setSlide] = useState(0);

    // Compute Transforms
    // If Active: Fixed at center, Scale 1, Rotation 0
    // If Inactive: Uses rawZ, item.x, item.y, item.rotation

    // We use CSS transition to handle the smooth snap (Drift -> Snapped)
    const style = isActive
        ? {
            transform: `translate3d(-50%, -50%, 0) translate3d(0, 0, 0) scale(1) rotate(0deg)`,
            opacity: 1,
            zIndex: 100,
            filter: 'none'
        }
        : {
            transform: `translate3d(-50%, -50%, 0) translate3d(${item.x}vw, ${item.y}vh, ${rawZ}px) scale(0.6) rotate(${item.rotation}deg)`,
            // Mobile: Hide background items completely to avoid mess
            // Desktop: Show background items with low opacity
            opacity: window.innerWidth < 768 && !isActive ? 0 : Math.max(0.3, (rawZ + 3000) / 3500),
            zIndex: 0,
            filter: 'blur(4px) grayscale(100%)'
        };

    const nextSlide = (e) => {
        if (e) e.stopPropagation();
        setSlide((prev) => (prev + 1) % item.slides.length);
    };

    const prevSlide = (e) => {
        if (e) e.stopPropagation();
        setSlide((prev) => (prev - 1 + item.slides.length) % item.slides.length);
    };

    // Keyboard Navigation
    useEffect(() => {
        if (!isActive) return;
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'ArrowRight') nextSlide();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, item.slides.length]);

    return (
        <div
            className="absolute top-1/2 left-1/2 w-[95vw] md:w-[900px] h-[50vh] md:h-[70vh] transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-transform flex items-center justify-center p-2 md:p-4"
            style={style}
        >
            <div className={`w-full h-full bg-black/90 border ${isActive ? 'border-acm-cyan' : 'border-white/10'} backdrop-blur-2xl rounded-2xl md:rounded-3xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)]`}>

                {/* Carousel Area */}
                <div className="relative flex-1 bg-gradient-to-b from-gray-900 to-black overflow-hidden group">
                    {/* Slides */}
                    {item.slides.map((color, i) => (
                        <div
                            key={i}
                            className="absolute inset-0 transition-opacity duration-500 ease-in-out flex items-center justify-center"
                            style={{ opacity: i === slide ? 1 : 0 }}
                        >
                            {/* Bg Gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-40 mix-blend-screen`}></div>

                            {/* Simulated Image */}
                            <div className="relative z-10 text-center space-y-2 md:space-y-4">
                                <h3 className="text-4xl md:text-8xl font-black text-white/5 select-none tracking-tighter">
                                    IMAGE_0{i + 1}
                                </h3>
                            </div>
                        </div>
                    ))}

                    {/* Navigation Controls (Only show if Active) */}
                    {isActive && (
                        <>
                            <button
                                onClick={prevSlide}
                                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-acm-cyan hover:text-black border border-white/10 text-white transition-all z-20"
                            >
                                ←
                            </button>
                            <button
                                onClick={nextSlide}
                                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-acm-cyan hover:text-black border border-white/10 text-white transition-all z-20"
                            >
                                →
                            </button>

                            {/* Indicators */}
                            <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
                                {item.slides.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-8 md:w-12 h-1 rounded-full transition-all ${i === slide ? 'bg-acm-cyan' : 'bg-white/20'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer / Caption */}
                <div className="h-24 md:h-32 bg-black/40 border-t border-white/10 p-4 md:p-8 flex items-center justify-between z-20">
                    <div>
                        <h2 className={`text-xl md:text-3xl font-bold text-white mb-1 md:mb-2 ${isActive ? 'translate-x-0' : '-translate-x-4 opacity-0'} transition-all duration-500 delay-100`}>
                            {item.title}
                        </h2>
                        <p className={`text-gray-400 font-mono text-[10px] md:text-xs line-clamp-1 ${isActive ? 'translate-x-0' : '-translate-x-4 opacity-0'} transition-all duration-500 delay-200`}>
                            {item.desc}
                        </p>
                    </div>
                    <div className={`font-mono text-3xl md:text-5xl font-bold text-white/5 ${isActive ? 'scale-100 text-acm-cyan/20' : 'scale-50'} transition-all duration-500`}>
                        {item.id < 9 ? `0${item.id + 1}` : item.id + 1}
                    </div>
                </div>

            </div>
        </div>
    );
};




// --- UPDATED CONTACT (Advanced Holographic Terminal) ---
const Contact = () => (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden bg-black">
        {/* Background Grid & Scanlines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,136,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,136,0.02)_1px,transparent_1px)] bg-[size:30px_30px] md:bg-[size:50px_50px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[size:100%_2px,3px_100%] pointer-events-none z-0"></div>

        <div className="w-full max-w-5xl relative z-10 perspective-1000 mt-20 md:mt-0">
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
                                            TSEC • 2nd Floor • IT Staffroom
                                        </div>
                                        <div className="ml-8 text-[10px] font-mono text-acm-cyan/40 group-hover:text-acm-cyan/80 transition-colors">
                                            LAT: 19.213683 | LON: 72.864668
                                        </div>
                                    </div>
                                </div>

                                <div className="group cursor-pointer">
                                    <label className="text-[10px] text-gray-500 block mb-1.5 ml-1"># COMM_FREQ</label>
                                    <div className="p-3 bg-black/60 border border-white/5 rounded-lg group-hover:border-acm-cyan/40 transition-all flex items-center space-x-3 text-gray-400 group-hover:text-white group-hover:bg-acm-cyan/5">
                                        <span className="text-acm-cyan text-lg">@</span>
                                        <span className="text-xs">acmco@tsecmumbai.in</span>
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

                        <form className="space-y-8 md:space-y-6" onSubmit={e => e.preventDefault()}>
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
                                    // FREQUENCY
                                </label>
                                <div className="absolute bottom-0 left-0 h-0.5 bg-acm-cyan w-0 peer-focus:w-full transition-all duration-300"></div>
                            </div>

                            <div className="group relative">
                                <textarea rows="3" required className="w-full bg-transparent border-b border-white/10 py-3 text-white focus:border-acm-cyan outline-none transition-all peer pt-6 resize-none font-mono text-sm leading-relaxed" placeholder=" "></textarea>
                                <label className="absolute left-0 top-6 text-gray-500 text-xs peer-focus:text-acm-cyan peer-focus:-translate-y-6 peer-[:not(:placeholder-shown)]:-translate-y-6 transition-all font-mono uppercase tracking-widest">
                                    // PAYLOAD_DESC
                                </label>
                                <div className="absolute bottom-0 left-0 h-0.5 bg-acm-cyan w-0 peer-focus:w-full transition-all duration-300"></div>
                            </div>

                            <div className="pt-6">
                                <MagneticButton className="w-full py-6 md:py-5 bg-acm-cyan/10 border border-acm-cyan/30 text-acm-cyan font-bold tracking-[0.3em] hover:bg-acm-cyan hover:text-black transition-all duration-500 group relative overflow-hidden rounded-lg">
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

// --- APP ROOT ---
const App = () => {
    return (
        <HashRouter>
            <CustomCursor />
            <NeuralFlow />
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/events" element={<Events />} />
                <Route path="/team" element={<Team />} />
                <Route path="/gallery" element={<FusionGallery />} />
                <Route path="/contact" element={<Contact />} />
            </Routes>
        </HashRouter>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
