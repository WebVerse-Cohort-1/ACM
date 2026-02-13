
import * as THREE from 'three';

let scene, camera, renderer, particles;
let mouseX = 0, mouseY = 0;

export function initThreeJS(containerId) {
    const container = document.getElementById(containerId);

    // Scene Setup
    scene = new THREE.Scene();
    // Fog for depth
    scene.fog = new THREE.FogExp2(0x0b0b0b, 0.002);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    // Renderer
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Create Particles (Cyber Network)
    createParticles();

    // Create Geometric Grid (Floor)
    createGrid();

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onDocumentMouseMove);

    // Animation Loop
    animate();
}

function createParticles() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];

    const color1 = new THREE.Color(0x4284d2); // ACM Blue
    const color2 = new THREE.Color(0x00d2ef); // Cyan

    for (let i = 0; i < 2000; i++) {
        const x = (Math.random() - 0.5) * 200;
        const y = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        vertices.push(x, y, z);

        // Mix colors
        const mixedColor = Math.random() > 0.5 ? color1 : color2;
        colors.push(mixedColor.r, mixedColor.g, mixedColor.b);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

function createGrid() {
    const gridHelper = new THREE.GridHelper(200, 50, 0x4284d2, 0x111111);
    gridHelper.position.y = -30;
    scene.add(gridHelper);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - window.innerWidth / 2) * 0.05;
    mouseY = (event.clientY - window.innerHeight / 2) * 0.05;
}

function animate() {
    requestAnimationFrame(animate);

    // Particle Rotation
    particles.rotation.y += 0.001;
    particles.rotation.x += 0.0005;

    // Mouse Interaction (Parallax)
    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
}
