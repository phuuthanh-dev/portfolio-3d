import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Application from '../Application';
import { CameraKey } from '../Camera/Camera';
import portfolio from '@portfolio-config';

/** Small desk details and accessible screen-space controls anchored to them. */
export default class DeskObjects {
    application: Application;
    scene: THREE.Scene;
    buttons: { button: HTMLButtonElement; position: THREE.Vector3 }[] = [];
    targets: { object: THREE.Object3D; action: () => void }[] = [];
    raycaster = new THREE.Raycaster();
    pressed: { action: () => void; x: number; y: number; pointerId: number } | null = null;
    mixers: THREE.AnimationMixer[] = [];

    constructor() {
        this.application = new Application();
        this.scene = this.application.scene;
        this.makeFrame();
        this.makeNotebook();
        const paper = this.application.world.decor.bakedModel.getModel().getObjectByName('paper');
        if (paper) this.targets.push({ object: paper, action: () => this.openResume() });
        this.setupObjectInteraction();
        this.addButton('About', 'Open About from the photo frame', new THREE.Vector3(-1320, 20, -1000), () => this.navigate('/about'));
        this.addButton('Experience', 'Open experience from the notebook', new THREE.Vector3(-1620, 0, -120), () => this.navigate('/experience'));
        // The printed CV is already part of the original desk model.
        this.addButton('View CV', 'Open the resume', new THREE.Vector3(-2050, -410, 980), () => this.openResume());
        this.loadDeskExtras();
    }

    box(width: number, height: number, depth: number, color: number) {
        return new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            new THREE.MeshBasicMaterial({ color })
        );
    }

    makeFrame() {
        const frame = new THREE.Group();
        frame.position.set(-1320, -210, -1000);
        const back = this.box(345, 470, 35, 0x55453e);
        frame.add(back);

        const mat = this.box(300, 425, 8, 0xece6d9);
        mat.position.z = 21;
        frame.add(mat);
        const texture = new THREE.TextureLoader().load('/images/desk-portrait.jpg');
        texture.encoding = THREE.sRGBEncoding;
        const portrait = new THREE.Mesh(
            new THREE.PlaneGeometry(258, 385),
            new THREE.MeshBasicMaterial({ map: texture })
        );
        portrait.position.z = 26;
        frame.add(portrait);

        const foot = this.box(180, 16, 170, 0x55453e);
        foot.position.set(0, -227, -45);
        frame.add(foot);
        this.scene.add(frame);
        this.targets.push({ object: frame, action: () => this.navigate('/about') });
    }

    makeNotebook() {
        const notebook = new THREE.Group();
        // On top of the existing paper stack, as if left open for later.
        notebook.position.set(-1620, -100, -120);
        notebook.rotation.y = -0.12;
        const pages = this.box(470, 45, 530, 0xe3dac2);
        notebook.add(pages);
        const cover = this.box(490, 14, 550, 0x405d58);
        cover.position.y = 30;
        notebook.add(cover);
        const spine = this.box(38, 62, 550, 0x263f3a);
        spine.position.x = -226;
        notebook.add(spine);
        const label = this.box(190, 3, 100, 0xd5cab0);
        label.position.set(25, 39, 0);
        notebook.add(label);
        this.scene.add(notebook);
        this.targets.push({ object: notebook, action: () => this.navigate('/experience') });
    }

    hitObject(event: MouseEvent | PointerEvent) {
        const camera = this.application.camera;
        if (camera.freeCam || camera.currentKeyframe !== CameraKey.DESK) return null;
        if (event.target instanceof Element && event.target.closest('button, a, input, textarea, select, iframe')) return null;
        const pointer = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            1 - (event.clientY / window.innerHeight) * 2
        );
        this.raycaster.setFromCamera(pointer, camera.instance);
        const hits = this.raycaster.intersectObjects(this.targets.map((target) => target.object), true);
        if (!hits.length) return null;
        return this.targets.find((target) => {
            let object: THREE.Object3D | null = hits[0].object;
            while (object) {
                if (object === target.object) return true;
                object = object.parent;
            }
            return false;
        }) || null;
    }

    setupObjectInteraction() {
        document.addEventListener('pointerdown', (event) => {
            if (event.button !== 0 || !event.isPrimary) return;
            const target = this.hitObject(event);
            if (!target) return;
            this.pressed = { action: target.action, x: event.clientX, y: event.clientY, pointerId: event.pointerId };
            event.preventDefault(); // Also prevents a synthetic mouse click after touch.
        }, true);
        document.addEventListener('mousedown', (event) => {
            // Stop the existing global camera toggle when pressing a desk object.
            if (this.hitObject(event)) event.stopImmediatePropagation();
        }, true);
        document.addEventListener('pointerup', (event) => {
            const pressed = this.pressed;
            this.pressed = null;
            if (!pressed || event.pointerId !== pressed.pointerId) return;
            const distance = Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y);
            if (distance < 10) pressed.action();
        }, true);
        document.addEventListener('pointercancel', () => { this.pressed = null; }, true);
    }

    addButton(label: string, accessibleLabel: string, position: THREE.Vector3, action: () => void): HTMLButtonElement {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'desk-object-button';
        button.textContent = label;
        button.setAttribute('aria-label', accessibleLabel);
        button.hidden = true;
        // The scene's document-level mousedown handler toggles the camera.
        // A desk control should not trigger that handler as well.
        button.addEventListener('mousedown', (event) => event.stopPropagation());
        button.addEventListener('pointerdown', (event) => event.stopPropagation());
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            action();
        });
        document.body.appendChild(button);
        this.buttons.push({ button, position });
        return button;
    }

    /** Load decorative assets independently so a failed optional model cannot block startup. */
    loadDeskExtras() {
        const loader = new GLTFLoader();
        const addModel = (
            name: string,
            position: THREE.Vector3,
            height: number,
            setup: (group: THREE.Group, gltf: GLTF) => void
        ) => {
            loader.load(`/models/DeskExtras/${name}.glb`, (gltf) => {
                // The original scene uses baked, unlit materials rather than scene lights.
                // Preserve the supplied colors/textures while matching that rendering style.
                gltf.scene.traverse((child) => {
                    if (!(child instanceof THREE.Mesh)) return;
                    const convert = (material: THREE.Material) => {
                        const original = material as THREE.MeshStandardMaterial;
                        const basic = new THREE.MeshBasicMaterial({
                            color: original.color ? original.color.clone() : 0xffffff,
                            map: original.map || null,
                            vertexColors: original.vertexColors,
                            transparent: original.transparent,
                            opacity: original.opacity,
                            alphaTest: original.alphaTest,
                            side: original.side,
                        });
                        return basic;
                    };
                    child.material = Array.isArray(child.material)
                        ? child.material.map(convert)
                        : convert(child.material);
                });
                gltf.scene.updateMatrixWorld(true);
                const bounds = new THREE.Box3().setFromObject(gltf.scene);
                const size = bounds.getSize(new THREE.Vector3());
                if (!Number.isFinite(size.y) || size.y <= 0) return;
                const factor = height / size.y;
                gltf.scene.scale.multiplyScalar(factor);
                gltf.scene.updateMatrixWorld(true);
                const normalized = new THREE.Box3().setFromObject(gltf.scene);
                const center = normalized.getCenter(new THREE.Vector3());
                // Center the model and put its base on the desk regardless of source pivot.
                gltf.scene.position.sub(new THREE.Vector3(center.x, normalized.min.y, center.z));
                const group = new THREE.Group();
                group.position.copy(position);
                group.add(gltf.scene);
                this.scene.add(group);
                setup(group, gltf);
            }, undefined, () => console.warn(`Could not load optional desk model: ${name}`));
        };

        const deskTop = -451;
        addModel('lamp', new THREE.Vector3(-1850, deskTop, 600), 700, (group) => {
            // A subtle radial pool creates a readable on/off effect on baked surfaces.
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 128;
            const context = canvas.getContext('2d');
            if (context) {
                const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
                gradient.addColorStop(0, 'rgba(255, 221, 147, 0.65)');
                gradient.addColorStop(1, 'rgba(255, 221, 147, 0)');
                context.fillStyle = gradient;
                context.fillRect(0, 0, 128, 128);
            }
            const glow = new THREE.Mesh(
                new THREE.PlaneGeometry(1000, 1000),
                new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false, opacity: 0.6 })
            );
            glow.rotation.x = -Math.PI / 2;
            glow.position.set(-1670, deskTop + 6, 590);
            this.scene.add(glow);
            const buttonPosition = group.position.clone().add(new THREE.Vector3(-210, 760, 0));
            let isOn = true;
            let button: HTMLButtonElement;
            const toggle = () => {
                isOn = !isOn;
                glow.visible = isOn;
                button.textContent = isOn ? 'Lamp: on' : 'Lamp: off';
                button.setAttribute('aria-pressed', String(isOn));
            };
            button = this.addButton('Lamp: on', 'Toggle desk lamp', buttonPosition, toggle);
            button.setAttribute('aria-pressed', 'true');
            this.targets.push({ object: group, action: toggle });
        });

        addModel('cat', new THREE.Vector3(1210, deskTop, 580), 330, (group, gltf) => {
            const mixer = new THREE.AnimationMixer(gltf.scene);
            // The exported animation names include an armature prefix.
            const idleClip = gltf.animations.find((clip) => clip.name.toLowerCase().split('|').pop() === 'idle');
            const yesClip = gltf.animations.find((clip) => clip.name.toLowerCase().split('|').pop() === 'headbutt');
            const idle = idleClip ? mixer.clipAction(idleClip) : null;
            const yes = yesClip ? mixer.clipAction(yesClip) : null;
            const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (idle && !reduceMotion) idle.play();
            if (yes) {
                yes.setLoop(THREE.LoopOnce, 1);
                yes.clampWhenFinished = true;
                mixer.addEventListener('finished', (event) => {
                    if (event.action !== yes || reduceMotion) return;
                    yes.stop();
                    idle?.reset().play();
                });
            }
            this.mixers.push(mixer);
            let resetTimer: number | undefined;
            let button: HTMLButtonElement;
            const pet = () => {
                if (yes && !reduceMotion) {
                    idle?.stop();
                    yes.reset().play();
                }
                button.textContent = 'Meow!';
                window.clearTimeout(resetTimer);
                resetTimer = window.setTimeout(() => { button.textContent = 'Pet cat'; }, 1600);
            };
            button = this.addButton('Pet cat', 'Pet the desk cat', group.position.clone().add(new THREE.Vector3(0, 390, 0)), pet);
            this.targets.push({ object: group, action: pet });
        });
    }

    navigate(path: '/about' | '/experience') {
        const iframe = document.getElementById('computer-screen') as HTMLIFrameElement | null;
        if (!iframe || !iframe.contentWindow) return;
        // The production OS is on a different origin; never read its DOM.
        const origin = new URL(iframe.src, window.location.href).origin;
        iframe.contentWindow.postMessage({ type: 'portfolio:navigate', path }, origin);
        this.application.camera.trigger('enterMonitor');
    }

    openResume() {
        const iframe = document.getElementById('computer-screen') as HTMLIFrameElement | null;
        if (!iframe) return;
        const origin = new URL(iframe.src, window.location.href).origin;
        if (portfolio.profile.cv) window.open(new URL(portfolio.profile.cv, origin).href, '_blank', 'noopener,noreferrer');
    }

    update() {
        this.mixers.forEach((mixer) => mixer.update(Math.min(this.application.time.delta / 1000, 0.1)));
        const camera = this.application.camera;
        const showing = !camera.freeCam && camera.currentKeyframe === CameraKey.DESK;
        const vector = new THREE.Vector3();
        for (const item of this.buttons) {
            if (!showing) {
                item.button.hidden = true;
                continue;
            }
            vector.copy(item.position).project(camera.instance);
            // Keep off-screen desk items reachable, especially the paper at
            // the edge on wide or narrow viewports. The depth test still
            // hides controls behind the camera.
            const visible = vector.z >= -1 && vector.z <= 1;
            item.button.hidden = !visible;
            if (visible) {
                const halfWidth = item.button.offsetWidth / 2;
                const halfHeight = item.button.offsetHeight / 2;
                const left = (vector.x + 1) * window.innerWidth / 2;
                const top = (1 - vector.y) * window.innerHeight / 2;
                item.button.style.left = `${THREE.MathUtils.clamp(left, halfWidth + 8, window.innerWidth - halfWidth - 8)}px`;
                item.button.style.top = `${THREE.MathUtils.clamp(top, halfHeight + 8, window.innerHeight - halfHeight - 8)}px`;
            }
        }
    }
}
