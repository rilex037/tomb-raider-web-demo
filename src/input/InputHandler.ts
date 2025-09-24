import { MovementState, PointerLockState } from '@/types';

export class InputHandler {
  private movementState: MovementState;
  private pointerLockState: PointerLockState;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.movementState = {
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveRight: false,
      moveSprint: false,
    };
    this.pointerLockState = {
      isPointerLocked: false,
    };
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    document.addEventListener('pointerlockchange', this.handlePointerLockChange.bind(this));
    document.addEventListener('pointerlockerror', this.handlePointerLockError.bind(this));
    this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    switch (event.code) {
      case 'KeyW':
        this.movementState.moveForward = true;
        break;
      case 'KeyS':
        this.movementState.moveBackward = true;
        break;
      case 'KeyA':
        this.movementState.moveLeft = true;
        break;
      case 'KeyD':
        this.movementState.moveRight = true;
        break;
      case 'Space':
        break;
      case 'ShiftLeft':
        this.movementState.moveSprint = true;
        break;
    }
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    switch (event.code) {
      case 'KeyW':
        this.movementState.moveForward = false;
        break;
      case 'KeyS':
        this.movementState.moveBackward = false;
        break;
      case 'KeyA':
        this.movementState.moveLeft = false;
        break;
      case 'KeyD':
        this.movementState.moveRight = false;
        break;
      case 'ShiftLeft':
        this.movementState.moveSprint = false;
        break;
    }
  };

  private handlePointerLockChange = (): void => {
    this.pointerLockState.isPointerLocked = (document.pointerLockElement === this.canvas);
    document.body.style.cursor = this.pointerLockState.isPointerLocked ? 'none' : 'auto';
  };

  private handlePointerLockError = (): void => {
    console.error('Pointer lock failed');
  };

  private handleCanvasClick = (): void => {
    if (!this.pointerLockState.isPointerLocked) {
      this.canvas.requestPointerLock();
    }
  };

  public getMovementState(): MovementState {
    return { ...this.movementState };
  }

  public getPointerLockState(): PointerLockState {
    return { ...this.pointerLockState };
  }
}
