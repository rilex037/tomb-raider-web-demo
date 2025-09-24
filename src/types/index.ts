import * as THREE from 'three';

export interface AppConfig {
  moveSpeed: number;
  sprintSpeed: number;
  cameraOffset: THREE.Vector3;
  gravity: number;
  jumpVelocity: number;
}

export interface MovementState {
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
  moveSprint: boolean;
}

export interface PhysicsState {
  velocity: THREE.Vector3;
  isOnGround: boolean;
  cameraRotationY: number;
}

export interface PointerLockState {
  isPointerLocked: boolean;
}
