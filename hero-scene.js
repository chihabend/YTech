import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const canvas = document.querySelector("#hero-scene");
const hero = document.querySelector("#accueil");

if (canvas && hero) {
    try {
        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            powerPreference: "low-power"
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
        camera.position.set(0, 0, 10.5);

        scene.add(new THREE.AmbientLight(0xffffff, 1.6));
        const keyLight = new THREE.PointLight(0x8ebfa4, 38, 22);
        keyLight.position.set(2.5, 3.5, 5);
        scene.add(keyLight);
        const warmLight = new THREE.PointLight(0xd78663, 24, 18);
        warmLight.position.set(-3, -1.5, 3);
        scene.add(warmLight);

        const composition = new THREE.Group();
        const globe = new THREE.Group();
        composition.add(globe);
        scene.add(composition);

        const core = new THREE.Mesh(
            new THREE.SphereGeometry(2.2, 48, 36),
            new THREE.MeshPhysicalMaterial({
                color: 0xd8eadf,
                roughness: 0.24,
                metalness: 0.12,
                transparent: true,
                opacity: 0.46,
                clearcoat: 1,
                clearcoatRoughness: 0.18
            })
        );
        globe.add(core);

        const wireframe = new THREE.Mesh(
            new THREE.SphereGeometry(2.22, 36, 24),
            new THREE.MeshBasicMaterial({
                color: 0x174e43,
                wireframe: true,
                transparent: true,
                opacity: 0.19
            })
        );
        globe.add(wireframe);

        const rings = [];
        [
            { color: 0xb96345, opacity: 0.8, rotation: [1.12, 0.12, -0.32], scale: [1.24, 0.77, 1] },
            { color: 0x4c8b72, opacity: 0.62, rotation: [0.26, 0.8, 0.72], scale: [1.3, 0.7, 1] },
            { color: 0xc3a36a, opacity: 0.56, rotation: [1.42, -0.52, 0.2], scale: [1.1, 0.92, 1] }
        ].forEach((config) => {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(2.75, 0.012, 8, 180),
                new THREE.MeshBasicMaterial({
                    color: config.color,
                    transparent: true,
                    opacity: config.opacity
                })
            );
            ring.rotation.set(...config.rotation);
            ring.scale.set(...config.scale);
            globe.add(ring);
            rings.push(ring);
        });

        const nodeMaterial = new THREE.MeshStandardMaterial({
            color: 0xb96345,
            emissive: 0x6a2c1a,
            emissiveIntensity: 0.38,
            roughness: 0.32,
            metalness: 0.25
        });
        const nodeGeometry = new THREE.SphereGeometry(0.055, 12, 10);
        const nodeCount = 18;
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));

        for (let index = 0; index < nodeCount; index += 1) {
            const y = 1 - (index / (nodeCount - 1)) * 2;
            const radius = Math.sqrt(1 - y * y);
            const angle = goldenAngle * index;
            const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
            node.position.set(
                Math.cos(angle) * radius * 2.24,
                y * 2.24,
                Math.sin(angle) * radius * 2.24
            );
            globe.add(node);
        }

        const particlePositions = new Float32Array(180 * 3);
        for (let index = 0; index < 180; index += 1) {
            const angle = index * 2.39996;
            const height = 1 - 2 * ((index + 0.5) / 180);
            const radius = 3.35 + ((index * 37) % 100) / 100 * 1.25;
            const ringRadius = Math.sqrt(1 - height * height) * radius;
            particlePositions[index * 3] = Math.cos(angle) * ringRadius;
            particlePositions[index * 3 + 1] = height * radius;
            particlePositions[index * 3 + 2] = Math.sin(angle) * ringRadius;
        }
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
        const particles = new THREE.Points(
            particleGeometry,
            new THREE.PointsMaterial({
                color: 0x6e9d82,
                size: 0.035,
                transparent: true,
                opacity: 0.66,
                sizeAttenuation: true
            })
        );
        globe.add(particles);

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const pointer = { x: 0, y: 0 };
        const target = { x: 0, y: 0 };
        let frameId = 0;
        let narrowLayout = false;

        function resizeScene() {
            const bounds = hero.getBoundingClientRect();
            const width = Math.max(1, Math.round(bounds.width));
            const height = Math.max(1, Math.round(bounds.height));
            narrowLayout = width < 1024;
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            composition.position.set(width < 761 ? 0.15 : narrowLayout ? 1.2 : 2.15, width < 761 ? -1.45 : 0.05, 0);
            composition.scale.setScalar(width < 761 ? 0.72 : narrowLayout ? 0.84 : 1);
            renderer.render(scene, camera);
        }

        function renderFrame(time) {
            const seconds = time * 0.001;
            globe.rotation.y = seconds * 0.12 + pointer.x * 0.14;
            globe.rotation.x = Math.sin(seconds * 0.26) * 0.07 + pointer.y * 0.08;
            rings[0].rotation.z += 0.0007;
            rings[1].rotation.y += 0.0005;
            particles.rotation.y = -seconds * 0.025;
            camera.position.x += (target.x - camera.position.x) * 0.025;
            camera.position.y += (target.y - camera.position.y) * 0.025;
            camera.lookAt(0, 0, 0);
            renderer.render(scene, camera);
            frameId = window.requestAnimationFrame(renderFrame);
        }

        const resizeObserver = new ResizeObserver(resizeScene);
        resizeObserver.observe(hero);
        resizeScene();

        if (!reducedMotion.matches) {
            frameId = window.requestAnimationFrame(renderFrame);
        }

        hero.addEventListener("pointermove", (event) => {
            const bounds = hero.getBoundingClientRect();
            pointer.x = (event.clientX - bounds.left) / bounds.width - 0.5;
            pointer.y = (event.clientY - bounds.top) / bounds.height - 0.5;
            target.x = pointer.x * (narrowLayout ? 0.18 : 0.42);
            target.y = -pointer.y * (narrowLayout ? 0.12 : 0.28);
        }, { passive: true });

        hero.addEventListener("pointerleave", () => {
            pointer.x = 0;
            pointer.y = 0;
            target.x = 0;
            target.y = 0;
        }, { passive: true });

        reducedMotion.addEventListener("change", (event) => {
            if (event.matches) {
                window.cancelAnimationFrame(frameId);
                renderer.render(scene, camera);
            } else {
                frameId = window.requestAnimationFrame(renderFrame);
            }
        });

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                window.cancelAnimationFrame(frameId);
            } else if (!reducedMotion.matches) {
                frameId = window.requestAnimationFrame(renderFrame);
            }
        });
    } catch (error) {
        canvas.classList.add("hero-scene-fallback");
        console.warn("The animated hero scene could not be initialized.", error);
    }
}
