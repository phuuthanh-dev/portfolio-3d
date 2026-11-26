import * as THREE from 'three';
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

    addButton(label: string, accessibleLabel: string, position: THREE.Vector3, action: () => void) {
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
