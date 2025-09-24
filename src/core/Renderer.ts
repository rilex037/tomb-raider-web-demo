import * as THREE from 'three';

export class Renderer {
  private renderer: THREE.WebGLRenderer;

  constructor() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(0.75);
    document.body.appendChild(this.renderer.domElement);

    window.addEventListener('resize', this.handleWindowResize.bind(this));
  }

  private handleWindowResize(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  public render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.renderer.render(scene, camera);
  }
}
