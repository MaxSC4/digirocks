import { describe, it, beforeEach, expect, vi } from 'vitest';

// Mock Toolbar util
vi.mock('../src/utils/toolbar.js', () => ({
    setupToolbarActions: vi.fn()
}));

// Mock Three.js classes
vi.mock('three', () => ({
    Scene: class {
        constructor() {
            this.add = vi.fn();
            this.traverse = vi.fn();
        }
    },
    PerspectiveCamera: class {
        constructor(fov, aspect, near, far) {
        this.fov    = fov;
        this.aspect = aspect;
        this.near   = near;
        this.far    = far;
        this.position = { copy: vi.fn() };
        }
        updateProjectionMatrix() {}
    },
    WebGLRenderer: class { constructor({canvas}){ this.domElement = canvas; } setSize(){} setClearColor(){} render(){} },
    Vector3: class { constructor(){ this.x=0; this.y=0; this.z=0; } clone(){return this;} project(){return this;} },
    MathUtils: { degToRad: v => v },
    Box3: class { setFromObject(){} getCenter(v){return v;} getSize(v){return v;} },
    AxesHelper: class {},
    AmbientLight: class {},
    DirectionalLight: class { constructor(){ this.position = { set: vi.fn() }; } },
    OrbitControls: class { constructor(){ this.target = { set: vi.fn() }; } update(){} },
    Raycaster: class { constructor(){ this.setFromCamera = vi.fn(); this.intersectObject = vi.fn(()=>[]); } },
    Vector2: class { constructor(x,y){ this.x=x; this.y=y; } },
    BufferGeometry: class { setFromPoints(){} setAttribute(){} computeVertexNormals(){} },
    Float32BufferAttribute: class {},
    LineBasicMaterial: class {},
    Line: class { constructor(){ this.geometry = { setFromPoints(){} }; } },
    MeshBasicMaterial: class {},
    SphereGeometry: class {},
    Mesh: class { constructor(){ this.position = { copy: vi.fn() }; this.userData = {}; } },
    Shape: class { constructor(){ this.moveTo = vi.fn(); this.lineTo = vi.fn(); } },
    ShapeGeometry: class {}
}));

vi.mock('three/examples/jsm/controls/OrbitControls.js', () => ({
    OrbitControls: class {
        constructor(camera, domElement) {
        // on ignore camera et domElement
        this.update = vi.fn();
        this.target = { set: vi.fn() };
        this.object = { position: { clone: () => ({}), copy: vi.fn() } };
        }
    }
}));

import { init3DViewer } from '../src/viewer3d.js';

describe('viewer3d.js', () => {
    let canvas;
    beforeEach(() => {
        document.body.innerHTML = '<canvas id="threeCanvas"></canvas><div id="loader3D"></div>';
        canvas = document.getElementById('threeCanvas');
        // Spy on addEventListener so we can assert on it
        vi.spyOn(canvas, 'addEventListener');
        vi.clearAllMocks();
        init3DViewer(canvas);
    });

    it('should set window.renderer and bind DOM events', () => {
        expect(window.renderer).toBeDefined();
        // mousedown and click listeners
        expect(canvas.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
        expect(canvas.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });
});

