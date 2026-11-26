import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Application from '../Application';
import { CameraKey } from '../Camera/Camera';

/** A freestanding display cabinet for the owner's five model cars. */
export default class CarDisplay {
    private readonly application = new Application();
    private readonly scene = this.application.scene;
    private readonly cabinet = new THREE.Group();
    private readonly loader = new GLTFLoader();
    private readonly floor = -2984;
    private readonly shelfTops = [220, 1020, 1820, 2620, 3420];
    private readonly wood: THREE.MeshBasicMaterial[];
    private readonly reflections: THREE.CubeTexture;
    private readonly raycaster = new THREE.Raycaster();
    private readonly hitBox = new THREE.Box3();
    private readonly button: HTMLButtonElement;
    private tireShadowMaterial?: THREE.MeshBasicMaterial;
    private pressed: { x: number; y: number; pointerId: number } | null = null;

    constructor() {
        // Outside the monitor's close-up, beside the existing desk in the overview.
        // Keep a small clearance from the left edge of the desk.
        this.cabinet.position.set(-4725, this.floor, -1750);
        this.scene.add(this.cabinet);
        this.wood = this.makeWoodMaterials();
        this.reflections = this.makeStudioReflections();
        // The existing environment is baked/unlit, so these lights illuminate
        // the cars' original PBR materials without altering the desk scene.
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.85));
        const key = new THREE.DirectionalLight(0xfff3e1, 1.3);
        key.position.set(-4500, 9000, 7000);
        this.scene.add(key);
        const fill = new THREE.DirectionalLight(0xdce7f0, 0.55);
        fill.position.set(4000, 3500, -6000);
        this.scene.add(fill);
        this.addFloorShadow();
        this.buildCabinet();
        this.hitBox.set(
            new THREE.Vector3(-1075, 0, -525).add(this.cabinet.position),
            new THREE.Vector3(1075, 4260, 525).add(this.cabinet.position)
        );
        this.button = this.setupInteraction();
        this.application.time.on('tick', () => this.updateButton());
        this.shelfTops.forEach((top, index) => this.loadCar(index + 1, top));
    }

    /** World-space cabinet bounds, shared with the camera's pointer handling. */
    getInteractionBounds(): THREE.Box3 {
        return this.hitBox.clone();
    }

    private addFloorShadow() {
        // The floor is baked, so a transparent plane supplies a soft contact shadow.
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 128;
        const context = canvas.getContext('2d');
        if (context) {
            const gradient = context.createRadialGradient(64, 64, 5, 64, 64, 64);
            gradient.addColorStop(0, 'rgba(0, 0, 0, .58)');
            gradient.addColorStop(0.45, 'rgba(0, 0, 0, .30)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            context.fillStyle = gradient;
            context.fillRect(0, 0, 128, 128);
        }
        const material = new THREE.MeshBasicMaterial({
            map: new THREE.CanvasTexture(canvas), transparent: true, opacity: 0.8, depthWrite: false,
        });
        const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3900, 2400), material);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.set(300, 20, 350);
        this.cabinet.add(shadow);
    }

    /** The projected control makes the cabinet available to keyboard and touch users. */
    private setupInteraction(): HTMLButtonElement {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'desk-object-button';
        button.textContent = 'View cars';
        button.setAttribute('aria-label', 'Zoom in to view the model car collection');
        button.hidden = true;
        button.addEventListener('pointerdown', (event) => event.stopPropagation());
        button.addEventListener('mousedown', (event) => event.stopPropagation());
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            this.application.camera.trigger('enterCarDisplay');
        });
        document.body.appendChild(button);

        const hitsCabinet = (event: MouseEvent | PointerEvent) => {
            const camera = this.application.camera;
            if (camera.freeCam || (camera.currentKeyframe !== CameraKey.IDLE && camera.currentKeyframe !== CameraKey.DESK)) return false;
            if (event.target instanceof Element && event.target.closest('button, a, input, textarea, select, iframe')) return false;
            const pointer = new THREE.Vector2(
                event.clientX / window.innerWidth * 2 - 1,
                1 - event.clientY / window.innerHeight * 2
            );
            this.raycaster.setFromCamera(pointer, camera.instance);
            return this.raycaster.ray.intersectsBox(this.hitBox);
        };
        document.addEventListener('pointerdown', (event) => {
            if (event.button !== 0 || !event.isPrimary || !hitsCabinet(event)) return;
            this.pressed = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
            event.preventDefault();
        }, true);
        document.addEventListener('mousedown', (event) => {
            if (hitsCabinet(event)) event.stopImmediatePropagation();
        }, true);
        document.addEventListener('pointerup', (event) => {
            const pressed = this.pressed;
            this.pressed = null;
            if (!pressed || event.pointerId !== pressed.pointerId) return;
            if (Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) < 10) {
                this.application.camera.trigger('enterCarDisplay');
            }
        }, true);
        document.addEventListener('pointercancel', () => { this.pressed = null; }, true);
        return button;
    }

    private updateButton() {
        const camera = this.application.camera;
        if (camera.freeCam || (camera.currentKeyframe !== CameraKey.IDLE && camera.currentKeyframe !== CameraKey.DESK)) {
            this.button.hidden = true;
            return;
        }
        // A cabinet may still be visible when its top is outside the viewport,
        // especially in the close desk view. Project all eight corners instead
        // of hiding the control solely based on the cabinet's top center.
        const width = window.innerWidth;
        const height = window.innerHeight;
        const point = new THREE.Vector3();
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const x of [this.hitBox.min.x, this.hitBox.max.x]) {
            for (const y of [this.hitBox.min.y, this.hitBox.max.y]) {
                for (const z of [this.hitBox.min.z, this.hitBox.max.z]) {
                    point.set(x, y, z).project(camera.instance);
                    if (point.z < -1 || point.z > 1) continue;
                    const screenX = (point.x + 1) * width / 2;
                    const screenY = (1 - point.y) * height / 2;
                    minX = Math.min(minX, screenX);
                    maxX = Math.max(maxX, screenX);
                    minY = Math.min(minY, screenY);
                    maxY = Math.max(maxY, screenY);
                }
            }
        }
        this.button.hidden = maxX < 0 || minX > width || maxY < 0 || minY > height;
        if (!this.button.hidden) {
            const halfWidth = this.button.offsetWidth / 2;
            const halfHeight = this.button.offsetHeight / 2;
            this.button.style.left = `${THREE.MathUtils.clamp((minX + maxX) / 2, halfWidth + 8, width - halfWidth - 8)}px`;
            this.button.style.top = `${THREE.MathUtils.clamp(minY - 12, halfHeight + 8, height - halfHeight - 8)}px`;
        }
    }

    private makeStudioReflections(): THREE.CubeTexture {
        // A compact neutral reflection map gives metallic paint readable highlights.
        const faces = Array.from({ length: 6 }, (_, index) => {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 128;
            const context = canvas.getContext('2d');
            if (context) {
                const gradient = context.createLinearGradient(0, 0, 0, 128);
                gradient.addColorStop(0, index === 2 ? '#eee9df' : '#b6b6b0');
                gradient.addColorStop(0.55, '#888783');
                gradient.addColorStop(1, '#514d49');
                context.fillStyle = gradient;
                context.fillRect(0, 0, 128, 128);
                context.fillStyle = 'rgba(255, 255, 255, .72)';
                context.fillRect(20, 18, 88, 8);
            }
            return canvas;
        });
        const texture = new THREE.CubeTexture(faces);
        texture.encoding = THREE.sRGBEncoding;
        texture.needsUpdate = true;
        return texture;
    }

    private makeWoodMaterials(): THREE.MeshBasicMaterial[] {
        // A small deterministic canvas texture avoids a heavy external image asset.
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        if (context) {
            context.fillStyle = '#60483c';
            context.fillRect(0, 0, 256, 256);
            let seed = 1831;
            const random = () => {
                seed = (seed * 16807) % 2147483647;
                return (seed - 1) / 2147483646;
            };
            for (let i = 0; i < 160; i++) {
                const y = random() * 256;
                context.strokeStyle = random() > 0.5 ? 'rgba(28, 19, 16, .10)' : 'rgba(221, 177, 136, .10)';
                context.lineWidth = 0.25 + random() * 1.3;
                context.beginPath();
                context.moveTo(0, y);
                context.bezierCurveTo(85, y + random() * 5 - 2.5, 170, y + random() * 5 - 2.5, 256, y);
                context.stroke();
            }
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.encoding = THREE.sRGBEncoding;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        // Different faces get different brightness to suggest directional light,
        // matching the existing baked scene without adding global lights.
        return [0xc4b6a8, 0x99877a, 0xe1d6c5, 0x78665a, 0xc3b1a1, 0x96877b].map(
            (color) => new THREE.MeshBasicMaterial({ color, map: texture })
        );
    }

    private box(width: number, height: number, depth: number, x: number, y: number, z: number,
        material: THREE.Material | THREE.Material[] = this.wood) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
        mesh.position.set(x, y, z);
        this.cabinet.add(mesh);
    }

    private buildCabinet() {
        const metal = new THREE.MeshBasicMaterial({ color: 0x2b2928 });
        const brass = new THREE.MeshBasicMaterial({ color: 0xb29a71 });
        const back = new THREE.MeshBasicMaterial({ color: 0x332e2c });
        const light = new THREE.MeshBasicMaterial({ color: 0xd6c4a2 });
        // Feet, solid base, two slim uprights and a recessed dark back panel.
        for (const x of [-900, 900]) {
            for (const z of [-365, 365]) this.box(130, 110, 130, x, 55, z, metal);
        }
        this.box(2150, 150, 1050, 0, 145, 0);
        this.box(110, 3950, 1050, -1020, 2125, 0);
        this.box(110, 3950, 1050, 1020, 2125, 0);
        this.box(1930, 3880, 45, 0, 2120, -500, back);
        this.shelfTops.slice(1).forEach((top) => this.box(1930, 105, 1000, 0, top - 52, 0));
        this.box(2150, 140, 1050, 0, 4185, 0);

        // Brass front edge and tiny pegs give the cabinet a more finished look.
        this.shelfTops.forEach((top, index) => {
            this.box(1930, 18, 18, 0, top - 20, 505, brass);
            for (const x of [-980, 980]) this.box(18, 35, 20, x, top + 40, 526, brass);
            if (index < this.shelfTops.length - 1) {
                const underside = this.shelfTops[index + 1] - 118;
                this.box(1400, 12, 32, 0, underside, 350, light);
            }
            this.addShadow(top + 2);
        });
        this.box(1400, 12, 32, 0, 4107, 350, light);
    }

    private addShadow(y: number) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        if (context) {
            const gradient = context.createRadialGradient(64, 32, 2, 64, 32, 64);
            gradient.addColorStop(0, 'rgba(0, 0, 0, .42)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            context.fillStyle = gradient;
            context.fillRect(0, 0, 128, 64);
        }
        const material = new THREE.MeshBasicMaterial({
            map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false, opacity: 0.8,
        });
        const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1550, 740), material);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.set(0, y, 0);
        this.cabinet.add(shadow);
    }

    /** Small contact shadows ground each tire on the shelf in perspective. */
    private addTireShadows(wheels: THREE.Box3, center: THREE.Vector3, top: number) {
        if (wheels.isEmpty()) return;
        if (!this.tireShadowMaterial) {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 64;
            const context = canvas.getContext('2d');
            if (context) {
                const gradient = context.createRadialGradient(32, 32, 1, 32, 32, 32);
                gradient.addColorStop(0, 'rgba(0, 0, 0, .65)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                context.fillStyle = gradient;
                context.fillRect(0, 0, 64, 64);
            }
            this.tireShadowMaterial = new THREE.MeshBasicMaterial({
                map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false, opacity: 0.7,
            });
        }
        const size = wheels.getSize(new THREE.Vector3());
        const geometry = new THREE.PlaneGeometry(Math.min(230, size.x * 0.16), Math.min(150, size.z * 0.22));
        for (const x of [wheels.min.x + size.x * 0.12, wheels.max.x - size.x * 0.12]) {
            for (const z of [wheels.min.z + size.z * 0.12, wheels.max.z - size.z * 0.12]) {
                const shadow = new THREE.Mesh(geometry, this.tireShadowMaterial);
                shadow.rotation.x = -Math.PI / 2;
                shadow.position.set(x - center.x, top + 2, z - center.z + 40);
                this.cabinet.add(shadow);
            }
        }
    }

    private loadCar(index: number, top: number) {
        this.loader.load(`/models/CarCollection/car-${index}.glb`, (gltf) => {
            gltf.scene.traverse((child) => {
                if (!(child instanceof THREE.Mesh)) return;
                const addReflection = (material: THREE.Material) => {
                    if (material instanceof THREE.MeshStandardMaterial) {
                        material.envMap = this.reflections;
                        material.envMapIntensity = 0.7;
                        material.needsUpdate = true;
                    }
                };
                if (Array.isArray(child.material)) child.material.forEach(addReflection);
                else addReflection(child.material);
            });
            // Orient along the width of the cabinet and normalize each source pivot.
            gltf.scene.updateMatrixWorld(true);
            let bounds = new THREE.Box3().setFromObject(gltf.scene);
            let size = bounds.getSize(new THREE.Vector3());
            if (size.z > size.x) {
                gltf.scene.rotation.y += Math.PI / 2;
                gltf.scene.updateMatrixWorld(true);
                bounds = new THREE.Box3().setFromObject(gltf.scene);
                size = bounds.getSize(new THREE.Vector3());
            }
            if (![size.x, size.y, size.z].every((value) => Number.isFinite(value) && value > 0)) return;
            gltf.scene.scale.multiplyScalar(Math.min(1550 / size.x, 570 / size.y, 790 / size.z));
            gltf.scene.updateMatrixWorld(true);
            bounds = new THREE.Box3().setFromObject(gltf.scene);
            const center = bounds.getCenter(new THREE.Vector3());
            // Whole-model bounds can include low exhausts, splitters or other
            // hidden geometry. Align the actual tire meshes with the shelf.
            const tireNames = [
                /3DWheel1A_Material/i,
                /TireBlur/i,
                /wheel_wheel_tire__tire/i,
                /Wheel1A_3D_3DWheel1A/i,
                /TYRE.*tire/i,
            ];
            const wheels = new THREE.Box3();
            gltf.scene.traverse((child) => {
                if (child instanceof THREE.Mesh && tireNames[index - 1].test(child.name)) {
                    wheels.union(new THREE.Box3().setFromObject(child));
                }
            });
            const contactY = wheels.isEmpty() ? bounds.min.y : wheels.min.y;
            this.addTireShadows(wheels, center, top);
            gltf.scene.position.sub(new THREE.Vector3(center.x, contactY, center.z));
            // Move the cars slightly forward while keeping them within the shelf.
            gltf.scene.position.z += 40;
            gltf.scene.position.y += top + 0.5;
            this.cabinet.add(gltf.scene);
        }, undefined, () => console.warn(`Could not load car model ${index}`));
    }
}
