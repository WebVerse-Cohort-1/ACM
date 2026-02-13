
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
const MagneticButton = ({ children, className, onClick }) => {
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
        <button
            ref={btnRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            className={`transition-transform duration-200 ease-out ${className}`}
        >
            {children}
        </button>
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

    const navItems = [
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
        { name: 'Events', path: '/events' },
        { name: 'Team', path: '/team' },
        { name: 'Contact', path: '/contact' }
    ];

    return (
        <nav className="fixed top-0 w-full z-40 px-8 py-6 flex justify-between items-center mix-blend-difference text-white">
            <Link to="/" className="text-2xl font-heading font-bold tracking-widest z-50">
                TSEC<span className="text-acm-cyan">ACM</span>
            </Link>

            <div className="hidden md:flex gap-1">
                {navItems.map((item) => (
                    <Link key={item.name} to={item.path}>
                        <div 
                            className="relative px-6 py-2 overflow-hidden group"
                            onMouseEnter={() => setHovered(item.name)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <span className={`relative z-10 text-sm uppercase tracking-widest transition-colors duration-300 ${location.pathname === item.path ? 'text-acm-cyan' : 'text-gray-300 group-hover:text-black'}`}>
                                {item.name}
                            </span>
                            {/* Hover Fill Effect */}
                            <span className="absolute inset-0 bg-acm-cyan transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-bottom"></span>
                        </div>
                    </Link>
                ))}
            </div>
            
            {/* Mobile Menu Placeholder (Simplified for brevity) */}
            <div className="md:hidden text-2xl">☰</div>
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
                    <MagneticButton className="px-8 py-4 bg-white text-black font-bold rounded-none hover:bg-acm-cyan transition-colors">
                        EXPLORE EVENTS ↗
                    </MagneticButton>
                </Link>
                <Link to="/contact">
                    <MagneticButton className="px-8 py-4 border border-white/20 text-white font-bold rounded-none hover:bg-white/10 backdrop-blur-md">
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
    return (
        <div className="min-h-screen pt-32 px-8 md:px-20">
            <h1 className="text-6xl md:text-8xl font-heading font-bold mb-16 opacity-10 fixed -z-10 top-20 right-0 pointer-events-none">
                EVENTS
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-32 max-w-6xl mx-auto">
                {[
                     { title: 'CodeSprint 26', date: 'MAR 15', tag: 'HACKATHON', color: 'border-acm-cyan' },
                     { title: 'System_Breach', date: 'APR 02', tag: 'CTF', color: 'border-red-500' },
                     { title: 'Neural_Nets', date: 'MAY 10', tag: 'WORKSHOP', color: 'border-acm-blue' },
                ].map((ev, i) => (
                    <div key={i} className={`group relative ${i % 2 === 1 ? 'md:mt-32' : ''}`}>
                        <div className={`border-t-2 ${ev.color} pt-4 mb-4 flex justify-between items-start`}>
                            <span className="font-mono text-xs">{ev.date}</span>
                            <span className="font-mono text-xs px-2 py-1 bg-white/5">{ev.tag}</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 group-hover:text-acm-cyan transition-colors duration-300">
                            {ev.title}
                        </h2>
                        <p className="text-gray-400 text-sm mb-6 max-w-xs">
                            Join the elite developers in a race against time and logic.
                        </p>
                        <MagneticButton className="text-sm border-b border-white pb-1 hover:text-acm-cyan hover:border-acm-cyan transition-colors">
                            REGISTER NOW
                        </MagneticButton>
                        
                        {/* Hover Image Reveal (Simulated with div) */}
                        <div className="absolute top-0 -z-10 w-64 h-80 bg-gradient-to-br from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-x-10 translate-y-[-20%] pointer-events-none grayscale group-hover:grayscale-0"></div>
                    </div>
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

const Team = () => (
    <div className="min-h-screen pt-32 px-8 pb-20">
        <h1 className="text-center text-acm-cyan font-mono tracking-widest mb-20 animate-pulse">:: PROTOCOL_LEADERS</h1>
        <div className="flex flex-wrap justify-center gap-1">
            {['CHAIR', 'VICE', 'SEC', 'TREAS', 'TECH', 'DESIGN', 'PR', 'WEB'].map((role, i) => (
                <div key={i} className="relative w-full md:w-64 h-80 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-acm-cyan/50 transition-all duration-300 group overflow-hidden">
                    <div className="absolute inset-0 flex flex-col justify-end p-6">
                        <span className="text-5xl font-heading font-bold opacity-20 -mb-4 group-hover:opacity-100 group-hover:mb-0 transition-all duration-300 transform group-hover:-translate-y-2">
                            0{i+1}
                        </span>
                        <h3 className="text-xl font-bold text-white relative z-10">{role}</h3>
                        <p className="text-xs text-acm-cyan font-mono mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                            :: LEADER
                        </p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const Contact = () => (
    <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-3xl">
            <h1 className="text-6xl md:text-8xl font-heading font-bold mb-10 text-center mix-blend-overlay">PING_US</h1>
            
            <form className="space-y-0" onSubmit={e => e.preventDefault()}>
                <div className="border-b border-white/20 group focus-within:border-acm-cyan transition-colors">
                    <input type="text" placeholder="IDENTITY" className="w-full bg-transparent py-6 text-xl md:text-2xl outline-none placeholder-gray-600 font-mono" />
                </div>
                <div className="border-b border-white/20 group focus-within:border-acm-cyan transition-colors">
                    <input type="email" placeholder="FREQUENCY (EMAIL)" className="w-full bg-transparent py-6 text-xl md:text-2xl outline-none placeholder-gray-600 font-mono" />
                </div>
                <div className="border-b border-white/20 group focus-within:border-acm-cyan transition-colors mb-12">
                     <input type="text" placeholder="TRANSMISSION" className="w-full bg-transparent py-6 text-xl md:text-2xl outline-none placeholder-gray-600 font-mono" />
                </div>
                
                <MagneticButton className="w-full py-6 bg-acm-blue hover:bg-white hover:text-black transition-colors font-bold tracking-widest">
                    INITIATE UPLINK
                </MagneticButton>
            </form>
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
                <Route path="/contact" element={<Contact />} />
            </Routes>
        </HashRouter>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
