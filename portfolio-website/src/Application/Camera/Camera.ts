import * as THREE from 'three';
import Application from '../Application';
import Sizes from '../Utils/Sizes';
import EventEmitter from '../Utils/EventEmitter';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import TWEEN from '@tweenjs/tween.js';
import Renderer from '../Renderer';
import Resources from '../Utils/Resources';
import UIEventBus from '../UI/EventBus';
import Time from '../Utils/Time';
import BezierEasing from 'bezier-easing';
import {
    CameraKeyframeInstance,
    MonitorKeyframe,
    IdleKeyframe,
    LoadingKeyframe,
    DeskKeyframe,
    CarDisplayKeyframe,
    OrbitControlsStart,
} from './CameraKeyframes';

export enum CameraKey {
    IDLE = 'idle',
    MONITOR = 'monitor',
    LOADING = 'loading',
    DESK = 'desk',
    CAR_DISPLAY = 'carDisplay',
    ORBIT_CONTROLS_START = 'orbitControlsStart',
}
export default class Camera extends EventEmitter {
    application: Application;
    sizes: Sizes;
    scene: THREE.Scene;
    instance: THREE.PerspectiveCamera;
    renderer: Renderer;
    resources: Resources;
    time: Time;

    position: THREE.Vector3;
    focalPoint: THREE.Vector3;

    freeCam: boolean;
    orbitControls: OrbitControls;

    currentKeyframe: CameraKey | undefined;
    targetKeyframe: CameraKey | undefined;
    keyframes: { [key in CameraKey]: CameraKeyframeInstance };
    private carDisplayBackButton: HTMLButtonElement;
    private beforeCarDisplay: CameraKey = CameraKey.IDLE;
    private leavingCarDisplay = false;

    constructor() {
        super();
        this.application = new Application();
        this.sizes = this.application.sizes;
        this.scene = this.application.scene;
        this.renderer = this.application.renderer;
        this.resources = this.application.resources;
        this.time = this.application.time;

        this.position = new THREE.Vector3(0, 0, 0);
        this.focalPoint = new THREE.Vector3(0, 0, 0);

        this.freeCam = false;

        this.keyframes = {
            idle: new IdleKeyframe(),
            monitor: new MonitorKeyframe(),
            loading: new LoadingKeyframe(),
            desk: new DeskKeyframe(),
            carDisplay: new CarDisplayKeyframe(),
            orbitControlsStart: new OrbitControlsStart(),
        };

        document.addEventListener('mousedown', (event) => {
            if (this.leavingCarDisplay) return;
            event.preventDefault();
            // @ts-ignore
            if (event.target.id === 'prevent-click') return;
            // print target and current keyframe
            if (
                this.currentKeyframe === CameraKey.IDLE ||
                this.targetKeyframe === CameraKey.IDLE
            ) {
                this.transition(CameraKey.DESK);
            } else if (
                this.currentKeyframe === CameraKey.DESK ||
                this.targetKeyframe === CameraKey.DESK
            ) {
                this.transition(CameraKey.IDLE);
            }
        });

        this.setPostLoadTransition();
        this.setInstance();
        this.setMonitorListeners();
        this.setFreeCamListeners();
        this.setCarDisplayListeners();
    }

    transition(
        key: CameraKey,
        duration: number = 1000,
        easing?: any,
        callback?: () => void
    ) {
        if (this.currentKeyframe === key) return;

        if (this.targetKeyframe) TWEEN.removeAll();

        this.currentKeyframe = undefined;
        this.targetKeyframe = key;

        const keyframe = this.keyframes[key];

        const posTween = new TWEEN.Tween(this.position)
            .to(keyframe.position, duration)
            .easing(easing || TWEEN.Easing.Quintic.InOut)
            .onComplete(() => {
                this.currentKeyframe = key;
                this.targetKeyframe = undefined;
                if (callback) callback();
            });

        const focTween = new TWEEN.Tween(this.focalPoint)
            .to(keyframe.focalPoint, duration)
            .easing(easing || TWEEN.Easing.Quintic.InOut);

        posTween.start();
        focTween.start();
    }

    setInstance() {
        this.instance = new THREE.PerspectiveCamera(
            35,
            this.sizes.width / this.sizes.height,
            10,
            900000
        );
        this.currentKeyframe = CameraKey.LOADING;

        this.scene.add(this.instance);
    }

    setMonitorListeners() {
        this.on('enterMonitor', () => {
            if (this.isViewingCarDisplay() || this.leavingCarDisplay) return;
            this.transition(
                CameraKey.MONITOR,
                2000,
                BezierEasing(0.13, 0.99, 0, 1)
            );
            UIEventBus.dispatch('enterMonitor', {});
        });
        this.on('leftMonitor', () => {
            if (this.isViewingCarDisplay() || this.leavingCarDisplay) return;
            this.transition(CameraKey.DESK);
            UIEventBus.dispatch('leftMonitor', {});
        });
    }

    private isViewingCarDisplay() {
        return this.currentKeyframe === CameraKey.CAR_DISPLAY || this.targetKeyframe === CameraKey.CAR_DISPLAY;
    }

    /** Project the cabinet's actual world bounds into the viewport. */
    private isPointInCarDisplay(x: number, y: number): boolean {
        const display = this.application.world?.carDisplay;
        if (!display) return false;
        const box = display.getInteractionBounds();
        const min = new THREE.Vector2(Infinity, Infinity);
        const max = new THREE.Vector2(-Infinity, -Infinity);
        for (const px of [box.min.x, box.max.x]) {
            for (const py of [box.min.y, box.max.y]) {
                for (const pz of [box.min.z, box.max.z]) {
                    const point = new THREE.Vector3(px, py, pz).project(this.instance);
                    if (point.z < -1 || point.z > 1) continue;
                    const sx = (point.x + 1) * this.sizes.width / 2;
                    const sy = (1 - point.y) * this.sizes.height / 2;
                    min.min(new THREE.Vector2(sx, sy));
                    max.max(new THREE.Vector2(sx, sy));
                }
            }
        }
        // A small forgiving margin avoids accidental exits near the wood frame.
        const margin = 12;
        return x >= min.x - margin && x <= max.x + margin &&
            y >= min.y - margin && y <= max.y + margin;
    }

    private setCarDisplayListeners() {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'desk-object-button';
        button.textContent = '← Back';
        button.setAttribute('aria-label', 'Leave car display and return to the previous view');
        button.hidden = true;
        button.style.left = '110px';
        button.style.top = 'calc(100% - 42px)';
        button.addEventListener('mousedown', (event) => event.stopPropagation());
        button.addEventListener('pointerdown', (event) => event.stopPropagation());
        const leave = () => {
            if (!this.isViewingCarDisplay()) return;
            button.hidden = true;
            this.leavingCarDisplay = true;
            this.transition(this.beforeCarDisplay, 1000, undefined, () => {
                this.leavingCarDisplay = false;
            });
        };
        button.addEventListener('click', (event) => { event.stopPropagation(); leave(); });
        document.body.appendChild(button);
        this.carDisplayBackButton = button;

        this.on('enterCarDisplay', () => {
            if (this.freeCam || this.isViewingCarDisplay() || this.leavingCarDisplay) return;
            this.beforeCarDisplay = this.currentKeyframe === CameraKey.DESK || this.targetKeyframe === CameraKey.DESK
                ? CameraKey.DESK : CameraKey.IDLE;
            // Responsive camera keyframe needs to be current before tween starts.
            this.keyframes.carDisplay.update();
            UIEventBus.dispatch('enterCarDisplay', {});
            button.hidden = false;
            this.transition(CameraKey.CAR_DISPLAY, 1200);
        });
        document.addEventListener('pointermove', (event) => {
            // Touch has no hover; touch and keyboard users keep Back and Escape.
            if (event.pointerType !== 'mouse') return;
            if (this.currentKeyframe !== CameraKey.CAR_DISPLAY || this.leavingCarDisplay || event.buttons) return;
            // Only respond to an actual mouse movement after zoom has completed.
            // The pointer may land outside the projected cabinet as the camera
            // moves, so do not require a separate move into it before exiting.
            if (!this.isPointInCarDisplay(event.clientX, event.clientY)) leave();
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.isViewingCarDisplay()) {
                event.preventDefault();
                leave();
            }
        });
    }

    setFreeCamListeners() {
        UIEventBus.on('freeCamToggle', (toggle: boolean) => {
            if (this.carDisplayBackButton) this.carDisplayBackButton.hidden = true;
            this.leavingCarDisplay = false;
            // if (toggle === this.freeCam) return;
            if (toggle) {
                this.transition(
                    CameraKey.ORBIT_CONTROLS_START,
                    750,
                    BezierEasing(0.13, 0.99, 0, 1),
                    () => {
                        this.instance.position.copy(
                            this.keyframes.orbitControlsStart.position
                        );

                        this.orbitControls.update();
                        this.freeCam = true;
                    }
                );
                // @ts-ignore
                document.getElementById('webgl').style.pointerEvents = 'auto';
            } else {
                this.freeCam = false;
                this.transition(
                    CameraKey.IDLE,
                    4000,
                    TWEEN.Easing.Exponential.Out
                );
                // @ts-ignore
                document.getElementById('webgl').style.pointerEvents = 'none';
            }
        });
    }

    setPostLoadTransition() {
        UIEventBus.on('loadingScreenDone', () => {
            this.transition(CameraKey.IDLE, 2500, TWEEN.Easing.Exponential.Out);
        });
    }

    resize() {
        this.instance.aspect = this.sizes.width / this.sizes.height;
        this.instance.updateProjectionMatrix();
    }

    createControls() {
        this.renderer = this.application.renderer;
        this.orbitControls = new OrbitControls(
            this.instance,
            this.renderer.instance.domElement
        );

        const { x, y, z } = this.keyframes.orbitControlsStart.focalPoint;
        this.orbitControls.target.set(x, y, z);

        this.orbitControls.enablePan = false;
        this.orbitControls.enableDamping = true;
        this.orbitControls.object.position.copy(
            this.keyframes.orbitControlsStart.position
        );
        this.orbitControls.dampingFactor = 0.05;
        this.orbitControls.maxPolarAngle = Math.PI / 2;
        this.orbitControls.minDistance = 4000;
        this.orbitControls.maxDistance = 29000;

        this.orbitControls.update();
    }

    update() {
        TWEEN.update();

        if (this.freeCam && this.orbitControls) {
            this.position.copy(this.orbitControls.object.position);
            this.focalPoint.copy(this.orbitControls.target);
            this.orbitControls.update();
            return;
        }

        for (const key in this.keyframes) {
            const _key = key as CameraKey;
            this.keyframes[_key].update();
        }

        if (this.currentKeyframe) {
            const keyframe = this.keyframes[this.currentKeyframe];
            this.position.copy(keyframe.position);
            this.focalPoint.copy(keyframe.focalPoint);
        }

        this.instance.position.copy(this.position);
        this.instance.lookAt(this.focalPoint);
    }
}
