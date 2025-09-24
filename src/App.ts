import * as THREE from 'three';
import { AppConfig } from '@/types';
import { InputHandler } from '@/input/InputHandler';
import { MovementController } from '@/movement/MovementController';
import { ModelLoader } from '@/models/ModelLoader';
import { SceneManager } from '@/core/SceneManager';
import { Renderer } from '@/core/Renderer';
import { Camera } from '@/core/Camera';

import customVertexShader from './shaders/custom.vert.glsl?raw';
import customFragmentShader from './shaders/custom.frag.glsl?raw';
import floorVertexShader from './shaders/floor.vert.glsl?raw';
import floorFragmentShader from './shaders/floor.frag.glsl?raw';
import wallVertexShader from './shaders/wall.vert.glsl?raw';
import wallFragmentShader from './shaders/wall.frag.glsl?raw';

export class App {
  private config: AppConfig;
  private inputHandler: InputHandler;
  private movementController: MovementController;
  private modelLoader: ModelLoader;
  private sceneManager: SceneManager;
  private renderer: Renderer;
  private camera: Camera;

  private model?: THREE.Group;
  private lightmapTexture: THREE.Texture;
  private grassTexture?: THREE.Texture;
  private wallTexture?: THREE.Texture;


  private lastMouseEvent: MouseEvent = new MouseEvent('mousemove');

  constructor() {
    this.config = {
      moveSpeed: 0.22,
      sprintSpeed: 0.4,
      cameraOffset: new THREE.Vector3(0, 12, -8),
      gravity: 0.01,
      jumpVelocity: 0.3,
    };

    this.sceneManager = new SceneManager();
    this.renderer = new Renderer();
    this.camera = new Camera();
    this.inputHandler = new InputHandler(this.renderer.getCanvas());
    this.movementController = new MovementController(this.config);
    this.modelLoader = new ModelLoader();

    this.lightmapTexture = this.createLightmapTexture();

    this.init().catch((error) => {
      console.error('Initialization error:', error);
    });
  }

  private async init(): Promise<void> {
    await this.loadResources();
    this.setupLighting();
    this.setupEventListeners();
    this.animate();
  }

  private async loadResources(): Promise<void> {
    [this.grassTexture, this.wallTexture] = await Promise.all([
      this.loadTexture('resources/grass.jpg', 2, 2),
      this.loadTexture('resources/wall.jpg', 1, 1)
    ]);

    this.createFloor();
    this.createWalls();

    try {
      this.model = await this.modelLoader.loadModel('/models/lara/scene.gltf');
      this.sceneManager.addObject(this.model);
      this.modelLoader.applyCustomShadersToModel(
        this.model,
        this.lightmapTexture,
        this.createCustomShaderMaterial.bind(this)
      );
    } catch (error) {
      console.error('Model loading error:', error);
    }
  }

  private loadTexture(url: string, repeatX: number = 1, repeatY: number = 1): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(
        url,
        (texture) => {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(repeatX, repeatY);
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
    this.sceneManager.addObject(ambientLight);
  }

  private createFloor(): THREE.Mesh {
    const floorGeometry = new THREE.PlaneGeometry(40, 40);
    const floorMaterial = this.createFloorShaderMaterial();
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    this.sceneManager.addObject(floor);
    return floor;
  }

  private createWalls(): THREE.Mesh[] {
    const wallGeometry = new THREE.PlaneGeometry(40, 10);
    const wallMaterial = this.createWallShaderMaterial();
    const walls: THREE.Mesh[] = [];

    const createWall = (position: [number, number, number], rotation: number): THREE.Mesh => {
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(...position);
      wall.rotation.y = rotation;
      return wall;
    };

    walls.push(
      createWall([0, 5, -20], Math.PI),
      createWall([0, 5, 20], 0),
      createWall([-20, 5, 0], Math.PI / 2),
      createWall([20, 5, 0], -Math.PI / 2)
    );

    this.sceneManager.addObjects(walls);
    return walls;
  }

  private createCustomShaderMaterial(baseTexture: THREE.Texture): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        lightmap: { value: this.lightmapTexture },
        floorSize: { value: new THREE.Vector2(40, 40) },
        modelPosition: { value: new THREE.Vector3() },
        baseColor: { value: new THREE.Color(0xffffff) },
        baseTexture: { value: baseTexture },
        textureResolution: { value: new THREE.Vector2(128.0, 128.0) },
      },
      vertexShader: customVertexShader,
      fragmentShader: customFragmentShader,
    });
  }

  private createFloorShaderMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        lightmap: { value: this.lightmapTexture },
        grassTexture: { value: this.grassTexture },
        floorSize: { value: new THREE.Vector2(40, 40) },
        textureResolution: { value: new THREE.Vector2(128.0, 128.0) },
      },
      vertexShader: floorVertexShader,
      fragmentShader: floorFragmentShader,
    });
  }

  private createWallShaderMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        lightmap: { value: this.lightmapTexture },
        wallTexture: { value: this.wallTexture },
        textureResolution: { value: new THREE.Vector2(128.0, 128.0) },
      },
      vertexShader: wallVertexShader,
      fragmentShader: wallFragmentShader,
    });
  }

  private createLightmapTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(1, 'black');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    ctx.filter = 'blur(2px)';
    ctx.drawImage(canvas, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'Space') {
      this.movementController.jump();
    }
  };

  private handleMouseMove = (event: MouseEvent): void => {
    this.lastMouseEvent = event;
  };

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    this.update();
    this.render();
  };

  private update(): void {
    if (!this.model) return;

    const movementState = this.inputHandler.getMovementState();
    const pointerLockState = this.inputHandler.getPointerLockState();
    const mouseMovement = {
      movementX: this.lastMouseEvent.movementX,
      movementY: this.lastMouseEvent.movementY,
    };

    this.movementController.update(
      movementState,
      pointerLockState,
      mouseMovement,
      this.model
    );

    // Update model position in shaders
    this.model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        (child.material as THREE.ShaderMaterial).uniforms.modelPosition.value.copy(this.model!.position);
      }
    });

    // Update camera
    const cameraOffset = this.movementController.getCameraOffset();
    const desiredPosition = this.model.position.clone().add(cameraOffset);
    const lookAtPosition = this.model.position.clone().add(new THREE.Vector3(0, 6, 0));
    this.camera.updatePosition(desiredPosition, lookAtPosition);
  }

  private render(): void {
    this.renderer.render(this.sceneManager.getScene(), this.camera.getCamera());
  }
}
