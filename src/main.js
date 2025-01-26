import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer, model, floor, lightmapTexture, grassTexture, wallTexture;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let cameraOffset = new THREE.Vector3(0, 12, -8);
let rotationSpeed = 0.1;
let moveSpeed = 0.22;
let cameraRotationY = 0;

init();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // PS1-style rendering
  renderer.setPixelRatio(0.75);

  // Create lightmap texture
  lightmapTexture = createLightmapTexture();

  // Load grass texture
  const textureLoader = new THREE.TextureLoader();
  grassTexture = textureLoader.load('resources/grass.jpg', function (texture) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    createFloor();
  });

  wallTexture = textureLoader.load('resources/wall.jpg', function (texture) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    createWalls();
  });

  // Load GLTF model
  const loader = new GLTFLoader();
  loader.load('/scene.gltf', function (gltf) {
    model = gltf.scene;
    model.position.y = 0.5;
    scene.add(model);

    // Apply custom shader to all meshes in the model
    model.traverse((child) => {
      if (child.isMesh) {
        child.material = createCustomShaderMaterial(child.material.map);
      }
    });

    // Set up camera position after model is loaded
    updateCameraPosition();
  }, undefined, function (error) {
    console.error('An error occurred while loading the model:', error);
  });

  // Lighting (ambient light for minimal global illumination)
  const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
  scene.add(ambientLight);

  // Event listeners
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('mousemove', onMouseMove);
  window.addEventListener('resize', onWindowResize);
}

function createFloor() {
  const floorGeometry = new THREE.PlaneGeometry(40, 40);
  const floorMaterial = createFloorShaderMaterial();
  floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
}

function createWalls() {
  const wallGeometry = new THREE.PlaneGeometry(40, 10);
  const wallMaterial = createWallShaderMaterial();

  const wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
  wall1.position.set(0, 5, -20);
  wall1.rotation.y = Math.PI;

  const wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
  wall2.position.set(0, 5, 20);

  const wall3 = new THREE.Mesh(wallGeometry, wallMaterial);
  wall3.position.set(-20, 5, 0);
  wall3.rotation.y = Math.PI / 2;

  const wall4 = new THREE.Mesh(wallGeometry, wallMaterial);
  wall4.position.set(20, 5, 0);
  wall4.rotation.y = -Math.PI / 2;

  scene.add(wall1, wall2, wall3, wall4);
}

function createCustomShaderMaterial(baseTexture) {
  return new THREE.ShaderMaterial({
    uniforms: {
      lightmap: { value: lightmapTexture },
      floorSize: { value: new THREE.Vector2(40, 40) },
      modelPosition: { value: new THREE.Vector3() },
      baseColor: { value: new THREE.Color(0xffffff) },
      baseTexture: { value: baseTexture },
      textureResolution: { value: new THREE.Vector2(128.0, 128.0) },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision mediump float;  // Use medium precision for retro effect

      uniform sampler2D lightmap;
      uniform sampler2D baseTexture;
      uniform vec2 floorSize;
      uniform vec3 modelPosition;
      uniform vec3 baseColor;
      varying vec2 vUv;
      varying vec3 vPosition;

      void main() {
        // Calculate lightmap UVs
        vec2 lightmapUV = (modelPosition.xz + floorSize / 2.0) / floorSize;
        vec3 lightColor = texture2D(lightmap, lightmapUV).rgb;

        // Lower precision texture lookup
        vec2 textureResolution = vec2(128.0, 128.0); // Lower texture resolution
        vec2 ditheredUV = floor(vUv * textureResolution) / textureResolution;
        vec3 texColor = texture2D(baseTexture, ditheredUV).rgb;

        // Combine colors and apply base color
        vec3 finalColor = texColor * lightColor * baseColor;
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    flatShading: true,
  });
}

function createFloorShaderMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      lightmap: { value: lightmapTexture },
      grassTexture: { value: grassTexture },
      floorSize: { value: new THREE.Vector2(40, 40) },
      textureResolution: { value: new THREE.Vector2(128.0, 128.0) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision mediump float;

      uniform sampler2D lightmap;
      uniform sampler2D grassTexture;
      uniform vec2 floorSize;
      varying vec2 vUv;

      void main() {
        // Calculate lightmap color
        vec3 lightColor = texture2D(lightmap, vUv).rgb;

        // Lower precision texture lookup for grass
        vec2 textureResolution = vec2(128.0, 128.0);
        vec2 ditheredUV = floor(vUv * textureResolution) / textureResolution;
        vec3 grassColor = texture2D(grassTexture, ditheredUV * 10.0).rgb; // Multiply by 10 for tiling

        // Combine colors
        vec3 finalColor = grassColor * lightColor;
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    flatShading: true,
  });
}

function createWallShaderMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      lightmap: { value: lightmapTexture },
      wallTexture: { value: wallTexture },
      textureResolution: { value: new THREE.Vector2(128.0, 128.0) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision mediump float;  // Use medium precision for retro effect

      uniform sampler2D lightmap;
      uniform sampler2D wallTexture;
      varying vec2 vUv;

      void main() {
        // Calculate lightmap color
        vec3 lightColor = texture2D(lightmap, vUv).rgb;

        // Lower precision texture lookup for walls
        vec2 textureResolution = vec2(128.0, 128.0); // Lower texture resolution
        vec2 ditheredUV = floor(vUv * textureResolution) / textureResolution;
        vec3 wallColor = texture2D(wallTexture, ditheredUV).rgb;

        // Combine colors
        vec3 finalColor = wallColor * lightColor;
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    flatShading: true,
  });
}

function createLightmapTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Create a radial gradient for the lightmap
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'white'); // Center is white
  gradient.addColorStop(1, 'black'); // Edges are black

  // Apply the gradient
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  // Optionally apply a blur effect for smoother transitions
  ctx.filter = 'blur(2px)';
  ctx.drawImage(canvas, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function onKeyDown(event) {
  switch (event.code) {
    case 'KeyW':
      moveForward = true;
      break;
    case 'KeyS':
      moveBackward = true;
      break;
    case 'KeyA':
      moveLeft = true;
      break;
    case 'KeyD':
      moveRight = true;
      break;
  }
}

function onKeyUp(event) {
  switch (event.code) {
    case 'KeyW':
      moveForward = false;
      break;
    case 'KeyS':
      moveBackward = false;
      break;
    case 'KeyA':
      moveLeft = false;
      break;
    case 'KeyD':
      moveRight = false;
      break;
  }
}

function onMouseMove(event) {
  if (!model) return;
  cameraRotationY -= event.movementX * 0.005;
  updateCameraPosition();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function moveModel() {
  if (!model) return;

  velocity.set(0, 0, 0);

  if (moveLeft) {
    model.rotation.y += THREE.MathUtils.degToRad(5);
    cameraRotationY += THREE.MathUtils.degToRad(5);
  }
  if (moveRight) {
    model.rotation.y -= THREE.MathUtils.degToRad(5);
    cameraRotationY -= THREE.MathUtils.degToRad(5);
  }

  if (moveForward) {
    direction.set(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), model.rotation.y);
    velocity.add(direction.multiplyScalar(moveSpeed));
  }
  if (moveBackward) {
    direction.set(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), model.rotation.y);
    velocity.add(direction.multiplyScalar(moveSpeed));
  }

  model.position.add(velocity);

  model.position.y = 0.5;

  model.traverse((child) => {
    if (child.isMesh) {
      child.material.uniforms.modelPosition.value.copy(model.position);
    }
  });

  // Update camera position
  updateCameraPosition();
}

function updateCameraPosition() {
  if (!model) return;

  // Calculate the camera's offset based on the model's rotation
  let offset = cameraOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotationY);

  // Calculate desired camera position
  let desiredPosition = model.position.clone().add(offset);

  // Smoothly interpolate the camera position
  camera.position.lerp(desiredPosition, 0.1);

  // Make the camera look at the character
  camera.lookAt(model.position.clone().add(new THREE.Vector3(0, 6, 0))); // Adjust look-at height as needed
}

function animate() {
  requestAnimationFrame(animate);
  moveModel();
  renderer.render(scene, camera);
}
