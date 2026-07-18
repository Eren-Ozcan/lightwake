export interface ControlsHandlers {
  onTap(): void;
  onMove(direction: 'forward' | 'backward'): void;
  onTurn(direction: 'left' | 'right'): void;
}

const TAP_MAX_DISTANCE = 18; // px
const TAP_MAX_DURATION = 350; // ms
const SWIPE_MIN_DISTANCE = 24; // px

/**
 * Drag to move/turn, tap to click: vertical drag = forward/back, horizontal
 * drag = turn. The gesture is classified once, at pointerup, from total
 * displacement — not incrementally during pointermove. Some mobile browsers
 * (notably iOS Safari on a fast flick) deliver few or late pointermove
 * events, so gating the swipe detection on pointermove crossing a threshold
 * left a dead zone where fast swipes registered as neither a tap nor a move.
 */
export class Controls {
  private handlers: ControlsHandlers;

  constructor(target: HTMLElement, handlers: ControlsHandlers) {
    this.handlers = handlers;
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let active = false;

    target.addEventListener('pointerdown', (e) => {
      startX = e.clientX;
      startY = e.clientY;
      startTime = performance.now();
      active = true;
    });

    target.addEventListener('pointerup', (e) => {
      if (!active) return;
      active = false;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const distance = Math.hypot(dx, dy);
      const duration = performance.now() - startTime;

      if (distance <= TAP_MAX_DISTANCE && duration <= TAP_MAX_DURATION) {
        this.handlers.onTap();
        return;
      }
      if (distance < SWIPE_MIN_DISTANCE) return; // too far for a tap, too short for a clean swipe

      if (Math.abs(dx) > Math.abs(dy)) {
        this.handlers.onTurn(dx > 0 ? 'right' : 'left');
      } else {
        this.handlers.onMove(dy < 0 ? 'forward' : 'backward');
      }
    });

    target.addEventListener('pointercancel', () => {
      active = false;
    });

    window.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          this.handlers.onMove('forward');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          this.handlers.onMove('backward');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          this.handlers.onTurn('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          this.handlers.onTurn('right');
          break;
        case ' ':
          e.preventDefault();
          this.handlers.onTap();
          break;
      }
    });
  }
}
