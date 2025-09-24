import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ModelLoader {
  private gltfLoader: GLTFLoader;

  constructor() {
    this.gltfLoader = new GLTFLoader();
  }

  public async loadModel(url: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          model.position.y = 0.5;
          resolve(model);
        },
        undefined,
        reject
      );
    });
  }

  public applyCustomShadersToModel(
    model: THREE.Group,
    _lightmapTexture: THREE.Texture,
    createCustomShaderMaterial: (baseTexture: THREE.Texture) => THREE.ShaderMaterial
  ): void {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material = createCustomShaderMaterial(child.material.map || new THREE.Texture());
      }
    });
  }
}
