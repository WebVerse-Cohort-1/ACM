import { useEffect, useRef } from 'react';
import * as THREE from 'three';

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '-10';
    document.body.appendChild(renderer.domElement);

    // Particles
    const particleCount = isMobile ? 800 : 2000;
    const positions = new Float32Array(particleCount * 3);
    const randomness = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
      randomness[i * 3] = Math.random();
      randomness[i * 3 + 1] = Math.random();
      randomness[i * 3 + 2] = Math.random();
    }
    const particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0x64ffda, size: isMobile ? 0.3 : 0.2, transparent: true, opacity: 0.6 });
    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // Neural net lines (lessened)
    const netGeom = new THREE.BufferGeometry();
    const netCount = isMobile ? 15 : 40; // Less lines
    const netPos = new Float32Array(netCount * 3);
    for (let i = 0; i < netCount; i++) {
      netPos[i * 3] = (Math.random() - 0.5) * 100;
      netPos[i * 3 + 1] = (Math.random() - 0.5) * 100;
      netPos[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    netGeom.setAttribute('position', new THREE.BufferAttribute(netPos, 3));
    const material = new THREE.LineSegments(netGeom, new THREE.LineBasicMaterial({ color: 0x1a237e, transparent: true, opacity: 0.15 }));
    const net = material;
    scene.add(net);

    // Solar System Group
    const solarSystem = new THREE.Group();
    scene.add(solarSystem);

    // Sun
    const sunGeom = new THREE.SphereGeometry(12, 10, 10);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffd700, wireframe: true, transparent: true, opacity: 0.15 });
    const sun = new THREE.Mesh(sunGeom, sunMat);
    solarSystem.add(sun);

    // Planets
    const planets = [];
    const planetData = [
      { radius: 2, distance: 25, speed: 0.5, color: 0x64ffda }, // Planet 1
      { radius: 3, distance: 40, speed: 0.3, color: 0xff4081 }, // Planet 2
      { radius: 4, distance: 60, speed: 0.2, color: 0x448aff }, // Planet 3
      { radius: 2.5, distance: 80, speed: 0.15, color: 0xb2ff59 } // Planet 4
    ];

    planetData.forEach((data, index) => {
      const geom = new THREE.SphereGeometry(data.radius, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: data.color, wireframe: true, transparent: true, opacity: 0.3 });
      const planet = new THREE.Mesh(geom, mat);
      
      // Orbit Path
      const pathGeom = new THREE.RingGeometry(data.distance - 0.1, data.distance + 0.1, 16);
      const pathMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05, side: THREE.DoubleSide });
      const orbitPath = new THREE.Mesh(pathGeom, pathMat);
      orbitPath.rotation.x = Math.PI / 2;
      solarSystem.add(orbitPath);

      solarSystem.add(planet);
      planets.push({ mesh: planet, ...data, angle: Math.random() * Math.PI * 2 });
    });

    solarSystem.rotation.x = 0.2; // Tilt the solar system slightly

    // Mouse/touch interaction
    let mouseX = 0, mouseY = 0;
    const handleMouseMove = (e) => { mouseX = (e.clientX / window.innerWidth - 0.5) * 2; mouseY = (e.clientY / window.innerHeight - 0.5) * 2; };
    const handleTouchMove = (e) => { mouseX = (e.touches[0].clientX / window.innerWidth - 0.5) * 2; mouseY = (e.touches[0].clientY / window.innerHeight - 0.5) * 2; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Scroll interaction
    let scrollY = 0;
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    let animId;
    const posArr = particleGeom.attributes.position.array;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      // Base camera movement
      camera.position.x += (mouseX * 15 - camera.position.x) * 0.05;
      camera.position.y += (-mouseY * 15 - camera.position.y) * 0.05;
      
      // Move camera closer based on scroll
      camera.position.z = 30 - (scrollY * 0.015);
      
      camera.lookAt(scene.position);

      for (let i = 0; i < particleCount; i++) {
        const x = positions[i * 3];
        posArr[i * 3 + 1] = Math.sin(time + x * 0.1 + randomness[i * 3] * 10) * 5 + (Math.cos(time * 0.5 + randomness[i * 3 + 1] * 10) * 2);
      }
      particleGeom.attributes.position.needsUpdate = true;

      net.rotation.y += 0.001;
      net.rotation.z += 0.0005;

      // Rotate solar system based on scroll
      solarSystem.rotation.y = time * 0.05 + scrollY * 0.001;
      
      // Rotate planets
      planets.forEach(p => {
        p.angle += p.speed * 0.01;
        p.mesh.position.x = Math.cos(p.angle) * p.distance;
        p.mesh.position.z = Math.sin(p.angle) * p.distance;
        p.mesh.rotation.y += 0.02;
        p.mesh.rotation.x += 0.01;
      });

      sun.rotation.y += 0.002;
      sun.rotation.x += 0.001;

      const hue = (time * 0.1) % 1;
      material.material.color.setHSL(0.6 + hue * 0.1, 0.8, 0.5);

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
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      if (document.body.contains(renderer.domElement)) document.body.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={mountRef} id="canvas-bg" className="fixed top-0 left-0 w-full h-full -z-10 bg-[#020202]" />;
};

export default NeuralFlow;
