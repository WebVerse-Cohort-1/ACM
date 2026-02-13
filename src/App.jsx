
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

// --- THREE.JS NEURAL FLOW BACKGROUND ---
const NeuralFlow = () => {
    const mountRef = useRef(null);

    useEffect(() => {
        const mount = mountRef.current;
        const scene = new THREE.Scene();
        // Deep space fog
        scene.fog = new THREE.FogExp2(0x020202, 0.002);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 30;
        camera.position.y = 10;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        mount.appendChild(renderer.domElement);

        // --- WAVE PARTICLES ---
        const particleCount = 2000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const scales = new Float32Array(particleCount);
        const randomness = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 100; // x
            positions[i * 3 + 1] = (Math.random() - 0.5) * 20; // y
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100; // z
            scales[i] = Math.random();
            randomness[i * 3] = Math.random();
            randomness[i * 3 + 1] = Math.random();
            randomness[i * 3 + 2] = Math.random();
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
        
        // Shader Material for more control
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
        // Creating a smaller chaotic network in the center
        const lineGeo = new THREE.IcosahedronGeometry(15, 1);
        const lineMat = new THREE.MeshBasicMaterial({ 
            color: 0x00d2ef, 
            wireframe: true, 
            transparent: true, 
            opacity: 0.05 
        });
        const net = new THREE.Mesh(lineGeo, lineMat);
        scene.add(net);

        // --- ANIMATION ---
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;

        const handleMouseMove = (event) => {
            mouseX = (event.clientX - window.innerWidth / 2) * 0.05;
            mouseY = (event.clientY - window.innerHeight / 2) * 0.05;
        };
        document.addEventListener('mousemove', handleMouseMove);

        const clock = new THREE.Clock();

        const animate = () => {
            requestAnimationFrame(animate);
            const time = clock.getElapsedTime();

            // Smooth camera Movement
            targetX = mouseX * 0.5;
            targetY = mouseY * 0.5;
            camera.position.x += (targetX - camera.position.x) * 0.05;
            camera.position.y += (-targetY + 10 - camera.position.y) * 0.05;
            camera.lookAt(scene.position);

            // Animate Particles (Wave effect)
            const positions = particles.geometry.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                const x = positions[i * 3];
                // Sine wave movement based on X position and Time
                positions[i * 3 + 1] = Math.sin(time + x * 0.1 + randomness[i*3]*10) * 5 + (Math.cos(time * 0.5 + randomness[i*3+1]*10) * 2);
            }
            particles.geometry.attributes.position.needsUpdate = true;

            // Rotate Net
            net.rotation.y += 0.001;
            net.rotation.z += 0.0005;
            
            // Pulse Color
            const hue = (time * 0.1) % 1;
            const color = new THREE.Color().setHSL(0.6 + hue * 0.1, 0.8, 0.5); // Oscillate around Blue/Cyan
            material.color = color;

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
            document.removeEventListener('mousemove', handleMouseMove);
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


// --- NAVBAR ---
const Navbar = () => {
    const location = useLocation();
    const [hovered, setHovered] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
        { name: 'Gallery', path: '/gallery' },
        { name: 'Events', path: '/events' },
        { name: 'Team', path: '/team' },
        { name: 'Contact', path: '/contact' }
    ];

    return (
        <nav className={`fixed top-0 w-full z-40 px-8 flex justify-between items-center transition-all duration-300 ${scrolled ? 'py-4 bg-[#020c1b]/80 backdrop-blur-md border-b border-white/10 shadow-lg' : 'py-6 mix-blend-difference'}`}>
            <Link to="/" className={`text-2xl font-heading font-bold tracking-widest z-50 transition-colors ${scrolled ? 'text-white' : ''}`}>
                TSEC <span className="text-acm-cyan">ACM</span>
            </Link>

            <div className={`hidden md:flex gap-1 ${scrolled ? 'text-gray-300' : ''}`}>
                {navItems.map((item) => (
                    <Link key={item.name} to={item.path}>
                        <div 
                            className="relative px-6 py-2 overflow-hidden group"
                            onMouseEnter={() => setHovered(item.name)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <span className={`relative z-10 text-sm uppercase tracking-widest transition-colors duration-300 ${location.pathname === item.path ? 'text-acm-cyan' : (scrolled ? 'text-gray-300 group-hover:text-white' : 'text-gray-300 group-hover:text-black')}`}>
                                {item.name}
                            </span>
                            <span className="absolute inset-0 bg-acm-cyan transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-bottom"></span>
                        </div>
                    </Link>
                ))}
            </div>
            
            <button onClick={() => setIsOpen(!isOpen)} className={`md:hidden text-2xl z-50 focus:outline-none transition-colors ${scrolled ? 'text-white' : 'mix-blend-difference'}`}>
                {isOpen ? '✕' : '☰'}
            </button>

            <div className={`fixed inset-0 bg-black backdrop-blur-3xl flex flex-col items-center justify-center gap-8 md:hidden transition-all duration-300 z-[200] ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                 {navItems.map((item) => (
                    <Link 
                        key={item.name} 
                        to={item.path} 
                        onClick={() => setIsOpen(false)} 
                        className="text-4xl font-heading font-bold text-gray-400 hover:text-white hover:scale-110 transition-all"
                    >
                        {item.name}
                    </Link>
                ))}
            </div>
        </nav>
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
                The Official ACM Student Chapter of TSEC. <br/>
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

const About = () => (
    <div className="min-h-screen pt-32 px-8 md:px-20 flex flex-col md:flex-row gap-20">
        <div className="md:w-1/3">
            <h1 className="text-6xl font-heading font-bold sticky top-32">
                WHO<br/>WE<br/>ARE
            </h1>
        </div>
        <div className="md:w-2/3 space-y-32">
            <section>
                <h2 className="text-2xl text-acm-cyan font-mono mb-6">:: MISSION_STATEMENT</h2>
                <p className="text-2xl md:text-4xl font-light leading-snug">
                    We are the <span className="text-white font-bold">architects</span> of the digital frontier. 
                    TSEC ACM is not just a club; it's an incubator for those who dare to 
                    <span className="italic text-gray-400"> disrupt</span> the status quo.
                </p>
            </section>
            
            <section>
                <h2 className="text-2xl text-acm-blue font-mono mb-6">:: LEGACY_LOGS</h2>
                <div className="border-l border-white/20 pl-10 space-y-16">
                    <div>
                        <span className="text-4xl font-heading font-bold opacity-30">2025</span>
                        <h3 className="text-2xl font-bold mt-2">National Apex</h3>
                        <p className="text-gray-400 mt-2">Awarded Best Student Chapter nationwide.</p>
                    </div>
                    <div>
                        <span className="text-4xl font-heading font-bold opacity-30">2023</span>
                        <h3 className="text-2xl font-bold mt-2">Source Code</h3>
                        <p className="text-gray-400 mt-2">Launched open-source initiative with 500+ PRs.</p>
                    </div>
                </div>
            </section>
        </div>
    </div>
);

const Team = () => {
    const members = [
        { role: 'CHAIR', id: '01', color: 'from-cyan-500 to-blue-500' },
        { role: 'VICE', id: '02', color: 'from-purple-500 to-pink-500' },
        { role: 'SEC', id: '03', color: 'from-green-400 to-emerald-600' },
        { role: 'TREAS', id: '04', color: 'from-yellow-400 to-orange-500' },
        { role: 'TECH', id: '05', color: 'from-blue-600 to-indigo-900' },
        { role: 'DESIGN', id: '06', color: 'from-pink-500 to-rose-600' },
        { role: 'PR', id: '07', color: 'from-indigo-400 to-cyan-400' },
        { role: 'WEB', id: '08', color: 'from-teal-400 to-cyan-300' },
    ];

    return (
        <div className="min-h-screen pt-32 px-6 md:px-20 max-w-8xl mx-auto pb-20">
             <h1 className="text-6xl md:text-9xl font-heading font-bold mb-16 opacity-5 fixed -z-10 top-20 right-0 pointer-events-none select-none">
                COMMAND
            </h1>
            
            <div className="flex flex-col md:flex-row items-baseline justify-between mb-16 border-b border-white/10 pb-8 backdrop-blur-sm">
                <h2 className="text-4xl md:text-6xl font-heading font-bold text-white">
                    PROTOCOL_<span className="text-acm-cyan">LEADERS</span>
                </h2>
                <p className="text-gray-400 font-mono text-xs tracking-widest mt-4 md:mt-0">:: CORE_COMMITTEE_NODES</p>
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


// --- 3D TILT UNIT ---
const TiltCard = ({ children, className = "" }) => {
    const ref = useRef(null);
    const [transform, setTransform] = useState("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    const [glow, setGlow] = useState("0% 0%");

    const handleMove = (e) => {
        const el = ref.current;
        const { left, top, width, height } = el.getBoundingClientRect();
        const x = e.clientX - left;
        const y = e.clientY - top;
        
        const xPct = x / width;
        const yPct = y / height;

        const tiltX = (0.5 - yPct) * 20;
        const tiltY = (xPct - 0.5) * 20;

        setTransform(`perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`);
        setGlow(`${xPct * 100}% ${yPct * 100}%`);
    };

    const handleLeave = () => {
        setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
        setGlow("50% 50%");
    };

    return (
        <div 
            ref={ref} 
            onMouseMove={handleMove} 
            onMouseLeave={handleLeave}
            className={`transition-all duration-200 ease-out ${className}`}
            style={{ transform }}
        >
            <div className="h-full w-full relative overflow-hidden rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl">
                {/* Dynamic Glow Gradient */}
                <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none"
                    style={{ background: `radial-gradient(circle at ${glow}, rgba(100,255,218,0.3), transparent 70%)` }}
                />
                {children}
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
        x: (Math.random() - 0.5) * (window.innerWidth < 768 ? 40 : 150), // Reduced X spread on mobile
        y: (Math.random() - 0.5) * (window.innerWidth < 768 ? 40 : 100), // Reduced Y spread on mobile
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
        <div className="min-h-screen bg-black transition-colors duration-1000"
             style={{ backgroundColor: activeIndex >= 0 ? '#000000' : '#020202' }}>
            
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
            opacity: Math.max(0.3, (rawZ + 3000) / 3500), // Min 0.3 opacity to avoid black screen
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
                                    IMAGE_0{i+1}
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
                        {item.id < 9 ? `0${item.id+1}` : item.id+1}
                    </div>
                </div>

            </div>
        </div>
    );
};




// --- UPDATED CONTACT (Advanced Holographic Terminal) ---
const Contact = () => (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black">
        {/* Background Grid & Scanlines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,136,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,136,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%] pointer-events-none z-0"></div>

        <div className="w-full max-w-5xl relative z-10 perspective-1000">
            <TiltCard className="bg-black/90 border border-acm-cyan/30 backdrop-blur-xl rounded-xl shadow-[0_0_100px_rgba(0,255,136,0.1)] overflow-hidden relative group p-0">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-acm-cyan to-transparent opacity-50"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-acm-cyan/5 rounded-tl-full pointer-events-none"></div>
                
                {/* "Scanner" Line */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-acm-cyan/5 to-transparent translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-[2s] ease-in-out pointer-events-none"></div>

                <div className="flex flex-col md:flex-row">
                    
                    {/* Left: Interactive Data Panel */}
                    <div className="md:w-5/12 p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/10 bg-white/5 relative">
                        <div className="absolute top-4 left-4 w-2 h-2 bg-acm-cyan rounded-full animate-ping"></div>
                        
                        <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-2">
                            UPLINK
                        </h1>
                        <p className="text-gray-400 font-mono text-xs mb-12">:: SECURE_CHANNEL_ESTABLISHED</p>

                        <div className="space-y-8 font-mono text-sm">
                            <div className="group cursor-pointer">
                                <label className="text-[10px] text-gray-500 block mb-1">TARGET_COORDINATES</label>
                                <div className="p-4 bg-black/40 border border-white/10 rounded group-hover:border-acm-cyan/50 transition-colors flex items-center space-x-3 text-gray-300 group-hover:text-white">
                                    <span className="text-acm-cyan">⊕</span>
                                    <span>Bandra (W), Mumbai, IN</span>
                                </div>
                            </div>

                            <div className="group cursor-pointer">
                                <label className="text-[10px] text-gray-500 block mb-1">DEDICATED_FREQUENCY</label>
                                <div className="p-4 bg-black/40 border border-white/10 rounded group-hover:border-acm-cyan/50 transition-colors flex items-center space-x-3 text-gray-300 group-hover:text-white">
                                    <span className="text-acm-cyan">@</span>
                                    <span>acm.tsec@gmail.com</span>
                                </div>
                            </div>
                        </div>

                         <div className="absolute bottom-8 left-8 text-[10px] font-mono text-gray-600">
                            STATUS: <span className="text-acm-cyan animate-pulse">ONLINE</span><br/>
                            ENCRYPTION: AES-256<br/>
                            NODE: TSEC_HQ
                        </div>
                    </div>

                    {/* Right: Input Terminal */}
                    <div className="md:w-7/12 p-8 md:p-12">
                        <form className="space-y-6" onSubmit={e => e.preventDefault()}>
                            <div className="group relative">
                                <input type="text" required className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:border-acm-cyan outline-none transition-all peer pt-6" placeholder=" " />
                                <label className="absolute left-0 top-6 text-gray-500 text-sm peer-focus:text-acm-cyan peer-focus:-translate-y-6 peer-[:not(:placeholder-shown)]:-translate-y-6 transition-all font-mono">
                                    // ENTER_IDENTITY
                                </label>
                            </div>
                            
                            <div className="group relative">
                                <input type="email" required className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:border-acm-cyan outline-none transition-all peer pt-6" placeholder=" " />
                                <label className="absolute left-0 top-6 text-gray-500 text-sm peer-focus:text-acm-cyan peer-focus:-translate-y-6 peer-[:not(:placeholder-shown)]:-translate-y-6 transition-all font-mono">
                                    // COMM_FREQUENCY (EMAIL)
                                </label>
                            </div>

                            <div className="group relative">
                                <textarea rows="4" required className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:border-acm-cyan outline-none transition-all peer pt-6 resize-none" placeholder=" "></textarea>
                                <label className="absolute left-0 top-6 text-gray-500 text-sm peer-focus:text-acm-cyan peer-focus:-translate-y-6 peer-[:not(:placeholder-shown)]:-translate-y-6 transition-all font-mono">
                                    // TRANSMISSION_PAYLOAD
                                </label>
                            </div>
                            
                            <div className="pt-4">
                                <MagneticButton className="w-full py-4 bg-acm-cyan/10 border border-acm-cyan text-acm-cyan font-bold tracking-[0.2em] hover:bg-acm-cyan hover:text-black transition-all duration-300 group relative overflow-hidden">
                                    <span className="relative z-10">INITIATE_UPLOAD</span>
                                    <div className="absolute inset-0 bg-acm-cyan transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                                </MagneticButton>
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
