import * as THREE from 'three';
import { AppConfig, MovementState, PhysicsState, PointerLockState } from '@/types';

export class MovementController {
  private config: AppConfig;
  private physicsState: PhysicsState;

  constructor(config: AppConfig) {
    this.config = config;
    this.physicsState = {
      velocity: new THREE.Vector3(),
      isOnGround: true,
      cameraRotationY: 0,
    };
  }

  public update(
    movementState: MovementState,
    pointerLockState: PointerLockState,
    mouseMovement: { movementX: number; movementY: number },
    model: THREE.Group
  ): void {
    this.updateCameraRotation(mouseMovement, pointerLockState);
    this.updateVelocity(movementState);
    this.applyPhysics(model);
    this.updateModelRotation(model);
  }

  private updateCameraRotation(
    mouseMovement: { movementX: number; movementY: number },
    pointerLockState: PointerLockState
  ): void {
    if (!pointerLockState.isPointerLocked) return;
    this.physicsState.cameraRotationY -= mouseMovement.movementX * 0.005;
  }

  private updateVelocity(movementState: MovementState): void {
    // Reset horizontal velocity
    this.physicsState.velocity.x = 0;
    this.physicsState.velocity.z = 0;

    const speed = movementState.moveSprint ? this.config.sprintSpeed : this.config.moveSpeed;

    // Calculate movement directions based on camera rotation
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      this.physicsState.cameraRotationY
    );
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      this.physicsState.cameraRotationY
    );

    if (movementState.moveForward) {
      this.physicsState.velocity.add(forward.clone().multiplyScalar(speed));
    }
    if (movementState.moveBackward) {
      this.physicsState.velocity.add(forward.clone().multiplyScalar(-speed));
    }
    if (movementState.moveLeft) {
      this.physicsState.velocity.add(right.clone().multiplyScalar(speed));
    }
    if (movementState.moveRight) {
      this.physicsState.velocity.add(right.clone().multiplyScalar(-speed));
    }
  }

  private applyPhysics(model: THREE.Group): void {
    // Apply gravity
    this.physicsState.velocity.y -= this.config.gravity;

    // Update position
    model.position.add(this.physicsState.velocity);

    // Ground collision
    if (model.position.y <= 0.5) {
      model.position.y = 0.5;
      this.physicsState.velocity.y = 0;
      this.physicsState.isOnGround = true;
    }
  }

  private updateModelRotation(model: THREE.Group): void {
    if (this.physicsState.velocity.x !== 0 || this.physicsState.velocity.z !== 0) {
      const lookDirection = new THREE.Vector3(
        this.physicsState.velocity.x,
        0,
        this.physicsState.velocity.z
      ).normalize();
      model.lookAt(model.position.clone().add(lookDirection));
    }
  }

  public jump(): void {
    if (this.physicsState.isOnGround) {
      this.physicsState.velocity.y = this.config.jumpVelocity;
      this.physicsState.isOnGround = false;
    }
  }

  public getCameraOffset(): THREE.Vector3 {
    return this.config.cameraOffset
      .clone()
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.physicsState.cameraRotationY);
  }

  public getPhysicsState(): PhysicsState {
    return { ...this.physicsState };
  }
}
