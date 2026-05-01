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
            card.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale3d(1.02, 1.02, 1.02)`;
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
        <div className="absolute bottom-10 right-10 flex flex-col items-center gap-2 mix-blend-difference">
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
        <div className="min-h-screen pt-32 px-6 md:px-20 max-w-8xl mx-auto pb-20">

            <h1 className="text-6xl md:text-9xl font-heading font-bold mb-16 opacity-5 fixed -z-10 top-20 right-0 pointer-events-none select-none">
                TIMELINE
            </h1>

            <div className="flex flex-col md:flex-row items-baseline justify-between mb-16 border-b border-white/10 pb-8 backdrop-blur-sm">
                <h2 className="text-4xl md:text-6xl font-heading font-bold text-white">
                    EVENT_<span className="text-acm-cyan">LOGS</span>
                </h2>
                <p className="text-gray-400 font-mono text-xs tracking-widest mt-4 md:mt-0">
                    :: UPCOMING_OPERATIONS
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 perspective-1000">
                {events.map((ev) => (

                    <Link
                        key={ev.slug}
                        to={`/events/${ev.slug}`}
                        className="block"
                    >
                        <TiltCard
                            intensity={5}
                            className="group aspect-[4/5] md:aspect-[4/3] cursor-pointer"
                        >
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
                                    <h3 className="text-3xl font-heading font-bold text-white mb-2 drop-shadow-md">
                                        {ev.title}
                                    </h3>
                                    <p className="text-sm text-gray-300 font-mono mb-6 border-l-2 border-white/20 pl-3">
                                        {ev.desc}
                                    </p>

                                    <div className="text-xs border border-white/20 hover:border-acm-cyan text-acm-cyan px-4 py-2 rounded uppercase tracking-wider bg-black/40 backdrop-blur-md inline-block">
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
            { name: "Vaishali Rane", role: "Chief Patron", desc: "Leading with strategic vision and providing overarching support for the chapter's mission.", image: "./Photoshot ACM/vaishali rane.jpeg" },
        ],
        "SPONSORS_AND_COORDINATORS": [
            { name: "Smita Dandge", role: "Faculty Sponsor", desc: "Guiding the chapter with academic leadership and professional mentorship.", image: "./Photoshot ACM/smita dange.jpeg" },
            { name: "Kashif Sheikh", role: "Faculty Co-Sponsor", desc: "Providing strategic guidance and support for chapter initiatives.", image: "./Photoshot ACM/kashif sheikh.jpeg" },
            { name: "Manish Salvi", role: "Faculty Co-Ordinator", desc: "Overseeing chapter operations and student engagement.", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&h=500&fit=crop" },
        ],
        "CHAIRPERSONS": [
            { name: "Aaditya Devghare", role: "Chairperson", desc: "Leading the chapter with a focus on community building and global tech standards.", image: "./Photoshot ACM/aditya devghare.jpeg" },
            { name: "Ishika Mehta", role: "Vice Chairperson", desc: "Driving internal operations and coordinating between diverse team verticals.", image: "./Photoshot ACM/ishika mehta.jpeg" },
            { name: "Nigam Tiwari", role: "Membership Chair", desc: "Expanding our reach and ensuring value for every TSEC ACM member.", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&h=500&fit=crop" },
        ],
        "TREASURER_AND_SECRETARY": [
            { name: "Sagar Gupta", role: "Treasurer", desc: "Managing chapter finances with precision and strategic allocation.", image: "./Photoshot ACM/sagar gupta.jpeg" },
            { name: "Aditya Mishra", role: "Secretary", desc: "Overseeing administrative tasks and maintaining chapter records.", image: "./Photoshot ACM/aditya mishra.jpeg" },
        ],
        "TECHNICAL_TEAM": [
            { name: "Shivam Pal", role: "Technical Head", desc: "Architecting codebases and leading technical research initiatives.", image: "./Photoshot ACM/shivam pal.jpeg" },
            { name: "Aman Mandal", role: "Technical Head", desc: "Specializing in software architecture and technical implementation.", image: "./Photoshot ACM/aman mandal.jpeg" },
            { name: "Rushab Singh", role: "Webmaster", desc: "Building immersive digital experiences with modern web stacks.", image: "./Photoshot ACM/rushabh singh.jpeg" },
            { name: "Subham Singh", role: "Webmaster", desc: "Optimizing web performance and maintaining digital infrastructure.", image: "./Photoshot ACM/shubham singh.jpeg" },
        ],
        "CREATIVE_TEAM": [
            { name: "Krishi Oza", role: "Creative Designer", desc: "Visual storytelling through high-impact graphic design.", image: "./Photoshot ACM/krishi oza.jpeg" },
            { name: "Janish Dave", role: "Creative Designer", desc: "Crafting visual identities that resonate with our tech community.", image: "./Photoshot ACM/jainish dave.jpeg" },
            { name: "Samhita Hejmadi", role: "UI/UX Designer", desc: "Designing user-centric interfaces for seamless digital navigation.", image: "./Photoshot ACM/samhita hejmadi.jpeg" },
            { name: "Sahir Sheikh", role: "UI/UX Designer", desc: "Creating intuitive user journeys and aesthetic digital interfaces.", image: "./Photoshot ACM/sahir sheikh.jpeg" },
        ],
        "DOCUMENTATION": [
            { name: "Amaan Sheikh", role: "Newsletter Editor", desc: "Curating the latest tech news for our weekly subscriber base.", image: "./Photoshot ACM/amaan sheikh.jpeg" },
            { name: "Aadiish Shukla", role: "Content Writer", desc: "Translating complex tech concepts into engaging written narratives.", image: "./Photoshot ACM/aadish shukla.jpeg" },
        ],
        "PHOTOGRAPHY_TEAM": [
            { name: "Shivam Tiwari", role: "Cinematographer", desc: "Capturing the essence of events through dynamic visual lenses.", image: "./Photoshot ACM/shivam tiwari.jpeg" },
        ],
        "SOCIAL_MEDIA_TEAM": [
            { name: "Aditya Bhatt", role: "Social Media Manager", desc: "Managing our digital footprint and community engagement.", image: "./Photoshot ACM/aditya bhat.jpg" },
            { name: "Ayushi Labde", role: "Social Media Manager", desc: "Curating viral content and handling channel outreach.", image: "./Photoshot ACM/ayushi labde.jpeg" },
        ],
        "EVENT_COORDINATORS": [
            { name: "Sonal Tripathi", role: "Operational Head", desc: "Ensuring smooth execution of all logistical and back-end pipelines.", image: "./Photoshot ACM/sonal  tripathi.jpeg" },
            { name: "Asmita Chauhan", role: "Event Head", desc: "Conceptualizing and managing large-scale flagship hackathons.", image: "./Photoshot ACM/asmita chauhan.jpeg" },
            { name: "Samriddhi Singh", role: "Event Head", desc: "Coordinating workshop logistics and speaker onboarding.", image: "./Photoshot ACM/sammriddhi singh.jpeg" },
            { name: "Nidhi Lad", role: "Event Head", desc: "Managing onsite operations and attendee experience metrics.", image: "./Photoshot ACM/nidhi lad.jpeg" },
        ],
        "MARKETING_TEAM": [
            { name: "Arushi Singh", role: "Marketing Manager", desc: "Developing strategies to expand chapter visibility and reach.", image: "./Photoshot ACM/arushi singh.jpeg" },
            { name: "Jaya Yadav", role: "Marketing Manager", desc: "Driving brand growth through targeted outreach and communication.", image: "./Photoshot ACM/jaya yadav.jpeg" },
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
                            <TeamPersonaCard key={i} member={m} />
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
                        className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent"></div>
            </div>

            {/* LinkedIn Float */}
            <a
                href="#"
                className="absolute top-4 right-4 z-30 w-8 h-8 flex items-center justify-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-full hover:bg-white hover:text-black transition-all duration-500 opacity-0 group-hover:opacity-100"
            >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
            </a>

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
        if (!isActive) setSlide(0);
    }, [isActive]);

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
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 px-4 py-2 text-white"
                            >
                                ←
                            </button>
                            <button
                                onClick={nextSlide}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 px-4 py-2 text-white"
                            >
                                →
                            </button>
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
    <div className="min-h-screen flex items-center justify-center p-4 mt-20 md:p-8 relative overflow-hidden bg-black">
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

    const [prize, setPrize] = React.useState(0);
    const [timeLeft, setTimeLeft] = React.useState({});
    const [activeFAQ, setActiveFAQ] = React.useState(null);

    // Prize Animation
    React.useEffect(() => {
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
    React.useEffect(() => {
        if (!event?.eventDate) return;

        const interval = setInterval(() => {
            const difference =
                new Date(event.eventDate) - new Date();

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

    if (!event) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white text-3xl">
                Event Not Found
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-32 px-6 md:px-20 text-white max-w-6xl mx-auto pb-32">

            <h1 className="text-5xl md:text-7xl font-heading font-bold mb-4">
                {event.title}
            </h1>

            <p className="text-acm-cyan font-mono mb-8">
                {event.dateText}
            </p>

            <p className="text-gray-300 text-lg mb-12 max-w-3xl">
                {event.description}
            </p>

            <h2 className="text-3xl font-bold mb-6">🏆 Prize Pool</h2>
            <div className="text-6xl font-heading font-bold text-acm-cyan mb-16">
                ₹ {prize.toLocaleString()}
            </div>

            {timeLeft.days !== undefined && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mb-20">
                    {Object.entries(timeLeft).map(([key, value]) => (
                        <div key={key} className="p-6 bg-white/5 border border-white/10 rounded-xl">
                            <div className="text-4xl font-bold text-acm-cyan">
                                {value}
                            </div>
                            <div className="text-sm uppercase tracking-widest text-gray-400">
                                {key}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <h2 className="text-3xl font-bold mb-8">Tracks</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-20">
                {event.tracks?.map((track, i) => (
                    <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-xl">
                        {track}
                    </div>
                ))}
            </div>

            {event.speakers?.length > 0 && (
                <>
                    <h2 className="text-3xl font-bold mb-10">Speakers</h2>
                    <div className="grid md:grid-cols-3 gap-8 mb-20">
                        {event.speakers.map((speaker, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                                <img
                                    src={speaker.image}
                                    alt={speaker.name}
                                    className="w-28 h-28 mx-auto rounded-full object-cover mb-4"
                                />
                                <h3 className="text-xl font-bold">
                                    {speaker.name}
                                </h3>
                                <p className="text-acm-cyan text-sm mt-2">
                                    {speaker.role}
                                </p>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <h2 className="text-3xl font-bold mb-8">FAQs</h2>
            <div className="space-y-6">
                {event.faqs?.map((faq, i) => (
                    <div key={i} className="border border-white/10 rounded-xl overflow-hidden">
                        <button
                            onClick={() =>
                                setActiveFAQ(activeFAQ === i ? null : i)
                            }
                            className="w-full text-left p-6 bg-white/5"
                        >
                            {faq.question}
                        </button>

                        {activeFAQ === i && (
                            <div className="p-6 bg-black/40 text-gray-300">
                                {faq.answer}
                            </div>
                        )}
                    </div>
                ))}
            </div>

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
            </Routes>

        </HashRouter>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);