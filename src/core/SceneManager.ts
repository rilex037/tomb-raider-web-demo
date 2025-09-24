import * as THREE from 'three';

export class SceneManager {
  private scene: THREE.Scene;

  constructor() {
    this.scene = new THREE.Scene();
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public addObject(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  public removeObject(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  public addObjects(objects: THREE.Object3D[]): void {
    objects.forEach(obj => this.scene.add(obj));
  }

  public clearScene(): void {
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
  }
}
