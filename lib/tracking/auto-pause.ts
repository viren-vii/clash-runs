const STATIONARY_THRESHOLD_MS = 30000; // 30 seconds
const MOVEMENT_SPEED_THRESHOLD = 0.3; // m/s (~1 km/h)

type AutoPauseCallback = (paused: boolean) => void;

export class AutoPauseService {
  private lastMovementTime: number = Date.now();
  private isPaused: boolean = false;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private onPauseChange: AutoPauseCallback | null = null;

  start(callback: AutoPauseCallback): void {
    this.onPauseChange = callback;
    this.isPaused = false;
    this.lastMovementTime = Date.now();

    this.checkInterval = setInterval(() => {
      const elapsed = Date.now() - this.lastMovementTime;

      if (!this.isPaused && elapsed > STATIONARY_THRESHOLD_MS) {
        this.isPaused = true;
        this.onPauseChange?.(true);
      }
    }, 5000);
  }

  /** Call this on each location update to report movement. */
  reportSpeed(speed: number | null): void {
    if (speed !== null && speed > MOVEMENT_SPEED_THRESHOLD) {
      this.lastMovementTime = Date.now();

      if (this.isPaused) {
        this.isPaused = false;
        this.onPauseChange?.(false);
      }
    }
  }

  isAutoPaused(): boolean {
    return this.isPaused;
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isPaused = false;
    this.onPauseChange = null;
  }
}
