/**
 * Manages elapsed time with pause/resume awareness.
 * Tracks only active (non-paused) time.
 */
export class TimerService {
  private accumulatedMs: number = 0;
  private lastResumeTime: number | null = null;

  start(): void {
    this.accumulatedMs = 0;
    this.lastResumeTime = Date.now();
  }

  pause(): void {
    if (this.lastResumeTime !== null) {
      this.accumulatedMs += Date.now() - this.lastResumeTime;
      this.lastResumeTime = null;
    }
  }

  resume(): void {
    this.lastResumeTime = Date.now();
  }

  stop(): number {
    this.pause();
    const elapsed = this.accumulatedMs;
    return elapsed;
  }

  /** Fully reset the timer to a clean initial state. */
  reset(): void {
    this.accumulatedMs = 0;
    this.lastResumeTime = null;
  }

  /** Returns elapsed active time in milliseconds. */
  getElapsedTime(): number {
    if (this.lastResumeTime !== null) {
      return this.accumulatedMs + (Date.now() - this.lastResumeTime);
    }
    return this.accumulatedMs;
  }

  isRunning(): boolean {
    return this.lastResumeTime !== null;
  }

  /** Restore timer state (e.g., after app restart). */
  restore(accumulatedMs: number, isRunning: boolean): void {
    this.accumulatedMs = accumulatedMs;
    this.lastResumeTime = isRunning ? Date.now() : null;
  }
}
