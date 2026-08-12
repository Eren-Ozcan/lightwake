export type EnemyState = 'dormant' | 'chasing';

const DORMANT_MIN = 9;
const DORMANT_MAX = 16;
const CHASE_MIN = 4;
const CHASE_MAX = 7;
/** Cells per second the enemy closes the gap while chasing — slower than a player who keeps moving, so only dawdling gets caught. */
const CHASE_SPEED = 1.4;

/**
 * Something behind the player on the same corridor. It wakes for a chase
 * window at random intervals rather than pursuing continuously, so it adds
 * pressure without making the level unwinnable: a player who keeps moving
 * forward always keeps (or grows) their lead, because the enemy is capped at
 * the player's own path index and only closes distance during chase windows.
 */
export class Enemy {
  state: EnemyState = 'dormant';
  private timer = this.randomIn(DORMANT_MIN, DORMANT_MAX);
  private pathIndex = 0;

  private randomIn(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  /** Advances the enemy by dt seconds. Returns true the instant it reaches the player's path index (caught). */
  tick(dt: number, playerPathIndex: number): boolean {
    this.timer -= dt;

    if (this.state === 'dormant') {
      if (this.timer <= 0) {
        this.state = 'chasing';
        this.timer = this.randomIn(CHASE_MIN, CHASE_MAX);
      }
      return false;
    }

    this.pathIndex = Math.min(playerPathIndex, this.pathIndex + CHASE_SPEED * dt);
    if (this.pathIndex >= playerPathIndex) return true;

    if (this.timer <= 0) {
      this.state = 'dormant';
      this.timer = this.randomIn(DORMANT_MIN, DORMANT_MAX);
    }
    return false;
  }

  /** Gap behind the player, in corridor cells — drives audio/haptic intensity while chasing. */
  distanceTo(playerPathIndex: number): number {
    return Math.max(0, playerPathIndex - this.pathIndex);
  }
}
