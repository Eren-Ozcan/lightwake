/**
 * The Vibration API only controls pulse duration, not amplitude, so haptics
 * here work as a texture channel (a felt sense of "close" vs "open") rather
 * than a precise information channel — that job belongs to panned audio.
 * No-ops silently where unsupported (iOS Safari, desktop).
 */
export class Haptics {
  readonly supported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  private vibrate(pattern: number | number[]): void {
    if (this.supported) navigator.vibrate(pattern);
  }

  /** The click itself: a short tap under the finger. */
  tap(): void {
    this.vibrate(8);
  }

  /** Nearest wall distance drives urgency: close = rapid double pulse, mid = one pulse, far = nothing. */
  echoFeedback(nearestDistance: number): void {
    if (nearestDistance < 1.5) {
      this.vibrate([0, 18, 40, 18]);
    } else if (nearestDistance < 4) {
      this.vibrate(20);
    }
  }

  /** Walked into a wall. Kept distinct from echoFeedback so it can't be mistaken for sonar. */
  bump(): void {
    this.vibrate([0, 30]);
  }

  checkpoint(): void {
    this.vibrate([0, 15, 60, 15, 60, 25]);
  }

  complete(): void {
    this.vibrate([0, 20, 80, 20, 80, 20, 80, 40]);
  }
}
