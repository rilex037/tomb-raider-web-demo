import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import customVertexShader from './shaders/custom.vert.glsl?raw';
import customFragmentShader from './shaders/custom.frag.glsl?raw';
import floorVertexShader from './shaders/floor.vert.glsl?raw';
import floorFragmentShader from './shaders/floor.frag.glsl?raw';
import wallVertexShader from './shaders/wall.vert.glsl?raw';
import wallFragmentShader from './shaders/wall.frag.glsl?raw';

class App {
  constructor() {
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.cameraOffset = new THREE.Vector3(0, 12, -8);
    this.moveSpeed = 0.22;
    this.cameraRotationY = 0;

    this.init().catch((error) => {
      console.error('Initialization error:', error);
    });
  }

  async init() {
    this.setupScene();
    this.setupRenderer();
    await this.loadResources();
    this.setupCamera();
    this.setupLighting();
    this.setupEventListeners();
    this.animate();
  }

  setupScene() {
    this.scene = new THREE.Scene();
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(0.75);
    document.body.appendChild(this.renderer.domElement);
  }

  async loadResources() {
    this.lightmapTexture = this.createLightmapTexture();
    
    const [grassTexture, wallTexture] = await Promise.all([
      this.loadTexture('resources/grass.jpg', 2, 2),
      this.loadTexture('resources/wall.jpg', 1, 1)
    ]);
    
    this.grassTexture = grassTexture;
    this.wallTexture = wallTexture;
    
    this.createFloor();
    this.createWalls();
    
    try {
      const gltf = await this.loadModel('/models/lara/scene.gltf');
      this.model = gltf.scene;
      this.model.position.y = 0.5;
      this.scene.add(this.model);
      this.applyCustomShadersToModel();
    } catch (error) {
      console.error('Model loading error:', error);
    }
  }

  loadTexture(url, repeatX = 1, repeatY = 1) {
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

  loadModel(url) {
    return new Promise((resolve, reject) => {
      new GLTFLoader().load(url, resolve, undefined, reject);
    });
  }

  applyCustomShadersToModel() {
    this.model.traverse((child) => {
      if (child.isMesh) {
        child.material = this.createCustomShaderMaterial(child.material.map);
      }
    });
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.updateCameraPosition();
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
    this.scene.add(ambientLight);
  }

  createFloor() {
    const floorGeometry = new THREE.PlaneGeometry(40, 40);
    const floorMaterial = this.createFloorShaderMaterial();
    this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.floor.rotation.x = -Math.PI / 2;
    this.scene.add(this.floor);
  }

  createWalls() {
    const wallGeometry = new THREE.PlaneGeometry(40, 10);
    const wallMaterial = this.createWallShaderMaterial();

    const createWall = (position, rotation) => {
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(...position);
      wall.rotation.y = rotation;
      return wall;
    };

    this.scene.add(
      createWall([0, 5, -20], Math.PI),
      createWall([0, 5, 20], 0),
      createWall([-20, 5, 0], Math.PI / 2),
      createWall([20, 5, 0], -Math.PI / 2)
    );
  }

  createCustomShaderMaterial(baseTexture) {
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

  createFloorShaderMaterial() {
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

  createWallShaderMaterial() {
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

  createLightmapTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

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

  setupEventListeners() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('resize', this.handleWindowResize);
  }

  handleKeyDown = (event) => {
    switch (event.code) {
      case 'KeyW':
        this.moveForward = true;
        break;
      case 'KeyS':
        this.moveBackward = true;
        break;
      case 'KeyA':
        this.moveLeft = true;
        break;
      case 'KeyD':
        this.moveRight = true;
        break;
    }
  };

  handleKeyUp = (event) => {
    switch (event.code) {
      case 'KeyW':
        this.moveForward = false;
        break;
      case 'KeyS':
        this.moveBackward = false;
        break;
      case 'KeyA':
        this.moveLeft = false;
        break;
      case 'KeyD':
        this.moveRight = false;
        break;
    }
  };

  handleMouseMove = (event) => {
    if (!this.model) return;
    this.cameraRotationY -= event.movementX * 0.005;
    this.updateCameraPosition();
  };

  handleWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  moveModel() {
    if (!this.model) return;

    this.velocity.set(0, 0, 0);

    if (this.moveLeft) {
      this.model.rotation.y += THREE.MathUtils.degToRad(5);
      this.cameraRotationY += THREE.MathUtils.degToRad(5);
    }
    if (this.moveRight) {
      this.model.rotation.y -= THREE.MathUtils.degToRad(5);
      this.cameraRotationY -= THREE.MathUtils.degToRad(5);
    }

    if (this.moveForward) {
      this.direction
        .set(0, 0, 1)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.model.rotation.y);
      this.velocity.add(this.direction.multiplyScalar(this.moveSpeed));
    }
    if (this.moveBackward) {
      this.direction
        .set(0, 0, -1)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.model.rotation.y);
      this.velocity.add(this.direction.multiplyScalar(this.moveSpeed));
    }

    this.model.position.add(this.velocity);
    this.model.position.y = 0.5;

    this.model.traverse((child) => {
      if (child.isMesh) {
        child.material.uniforms.modelPosition.value.copy(this.model.position);
      }
    });

    this.updateCameraPosition();
  }

  updateCameraPosition() {
    if (!this.model) return;

    const offset = this.cameraOffset
      .clone()
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraRotationY);

    const desiredPosition = this.model.position.clone().add(offset);
    this.camera.position.lerp(desiredPosition, 0.1);
    this.camera.lookAt(this.model.position.clone().add(new THREE.Vector3(0, 6, 0)));
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    this.moveModel();
    this.renderer.render(this.scene, this.camera);
  };
}

new App();