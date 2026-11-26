import * as THREE from 'three';
import Application from '../Application';
import BakedModel from '../Utils/BakedModel';
import Resources from '../Utils/Resources';

export default class Computer {
    application: Application;
    scene: THREE.Scene;
    resources: Resources;
    bakedModel: BakedModel;

    constructor() {
        this.application = new Application();
        this.scene = this.application.scene;
        this.resources = this.application.resources;

        this.bakeModel();
        this.setModel();
    }

    bakeModel() {
        this.bakedModel = new BakedModel(
            this.resources.items.gltfModel.computerSetupModel,
            this.resources.items.texture.computerSetupTexture,
            900
        );
        this.applyBranding();
    }

    /** Draw the TP mark on the monitor's existing baked UV surface. */
    applyBranding() {
        this.bakedModel.material.onBeforeCompile = (shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <map_fragment>',
                `#ifdef USE_MAP
                    vec4 sampledDiffuseColor = texture2D(map, vUv);

                    // The front bezel is an upside-down UV island in the model.
                    // Sample its plain neighboring surface so the baked lighting
                    // is preserved beneath the procedural, vector-like mark.
                    vec2 lower = vec2(0.323, 0.645);
                    vec2 upper = vec2(0.407, 0.671);
                    if (all(greaterThanEqual(vUv, lower)) && all(lessThanEqual(vUv, upper))) {
                        sampledDiffuseColor = texture2D(map, vec2(vUv.x - 0.10, vUv.y));
                        vec2 p = vec2(1.0) - (vUv - lower) / (upper - lower);
                        float t = max(
                            step(0.09, p.x) * step(p.x, 0.47) * step(0.22, p.y) * step(p.y, 0.32),
                            step(0.23, p.x) * step(p.x, 0.33) * step(0.22, p.y) * step(p.y, 0.78)
                        );
                        float stem = step(0.57, p.x) * step(p.x, 0.67) * step(0.22, p.y) * step(p.y, 0.78);
                        float cap = step(0.57, p.x) * step(p.x, 0.88) * step(0.22, p.y) * step(p.y, 0.32);
                        float middle = step(0.57, p.x) * step(p.x, 0.88) * step(0.46, p.y) * step(p.y, 0.55);
                        float right = step(0.79, p.x) * step(p.x, 0.89) * step(0.22, p.y) * step(p.y, 0.55);
                        float ink = max(t, max(stem, max(cap, max(middle, right))));
                        sampledDiffuseColor.rgb = mix(sampledDiffuseColor.rgb, vec3(0.12), ink * 0.85);
                    }

                    // The keyboard carries a second, smaller badge on a separate
                    // UV island. Match its pale surround and draw the same mark.
                    lower = vec2(0.551, 0.469);
                    upper = vec2(0.591, 0.487);
                    if (all(greaterThanEqual(vUv, lower)) && all(lessThanEqual(vUv, upper))) {
                        sampledDiffuseColor = texture2D(map, vec2(vUv.x, vUv.y - 0.018));
                        vec2 p = (vUv - lower) / (upper - lower);
                        float t = max(
                            step(0.09, p.x) * step(p.x, 0.47) * step(0.22, p.y) * step(p.y, 0.32),
                            step(0.23, p.x) * step(p.x, 0.33) * step(0.22, p.y) * step(p.y, 0.78)
                        );
                        float stem = step(0.57, p.x) * step(p.x, 0.67) * step(0.22, p.y) * step(p.y, 0.78);
                        float cap = step(0.57, p.x) * step(p.x, 0.88) * step(0.22, p.y) * step(p.y, 0.32);
                        float middle = step(0.57, p.x) * step(p.x, 0.88) * step(0.46, p.y) * step(p.y, 0.55);
                        float right = step(0.79, p.x) * step(p.x, 0.89) * step(0.22, p.y) * step(p.y, 0.55);
                        float ink = max(t, max(stem, max(cap, max(middle, right))));
                        sampledDiffuseColor.rgb = mix(sampledDiffuseColor.rgb, vec3(0.12), ink * 0.75);
                    }

                    // Product badges on the back of the monitor and the base
                    // are separate, dark UV islands. Replace their original
                    // lettering while leaving the baked border in place.
                    vec2 monitorLower = vec2(0.6802, 0.8069);
                    vec2 monitorUpper = vec2(0.7283, 0.8374);
                    vec2 baseLower = vec2(0.4165, 0.1330);
                    vec2 baseUpper = vec2(0.4456, 0.1794);
                    bool monitorBadge = all(greaterThanEqual(vUv, monitorLower)) && all(lessThanEqual(vUv, monitorUpper));
                    bool baseBadge = all(greaterThanEqual(vUv, baseLower)) && all(lessThanEqual(vUv, baseUpper));
                    if (monitorBadge || baseBadge) {
                        vec2 p;
                        if (monitorBadge) {
                            sampledDiffuseColor = texture2D(map, vec2(0.6812, 0.8362));
                            p = (vUv - monitorLower) / (monitorUpper - monitorLower);
                        } else {
                            sampledDiffuseColor = texture2D(map, vec2(0.4175, 0.1340));
                            vec2 rotated = (vUv - baseLower) / (baseUpper - baseLower);
                            p = vec2(rotated.y, 1.0 - rotated.x);
                        }
                        float t = max(
                            step(0.15, p.x) * step(p.x, 0.45) * step(0.27, p.y) * step(p.y, 0.35),
                            step(0.26, p.x) * step(p.x, 0.34) * step(0.27, p.y) * step(p.y, 0.73)
                        );
                        float stem = step(0.55, p.x) * step(p.x, 0.63) * step(0.27, p.y) * step(p.y, 0.73);
                        float cap = step(0.55, p.x) * step(p.x, 0.85) * step(0.27, p.y) * step(p.y, 0.35);
                        float middle = step(0.55, p.x) * step(p.x, 0.85) * step(0.46, p.y) * step(p.y, 0.54);
                        float right = step(0.77, p.x) * step(p.x, 0.85) * step(0.27, p.y) * step(p.y, 0.54);
                        float ink = max(t, max(stem, max(cap, max(middle, right))));
                        sampledDiffuseColor.rgb = mix(sampledDiffuseColor.rgb, vec3(0.8), ink * 0.9);
                    }
                    diffuseColor *= sampledDiffuseColor;
                #endif`
            );
        };
    }

    setModel() {
        this.scene.add(this.bakedModel.getModel());
    }
}
