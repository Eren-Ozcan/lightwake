import { LevelMap, FACINGS, castEchoRays, LEVELS, TUTORIAL_LEVEL, type Vec2 } from './map';
import { AudioEngine } from './audio';
import { Haptics } from './haptics';
import { Controls } from './controls';
import { Tutorial, markTutorialDone } from './tutorial';

interface Dom {
  overlay: HTMLElement;
  startBtn: HTMLElement;
  tutorialBtn: HTMLElement;
  hint: HTMLElement;
  silhouette: HTMLCanvasElement;
  complete: HTMLElement;
  completeTitle: HTMLElement;
  completeSubtitle: HTMLElement;
  continueBtn: HTMLButtonElement;
}

export class Game {
  private audio = new AudioEngine();
  private haptics = new Haptics();
  private dom: Dom;

  private mode: 'game' | 'tutorial' = 'game';
  private tutorial: Tutorial | null = null;
  private levelIndex = 0;
  private map!: LevelMap;
  private player!: Vec2;
  private facingIndex = 0; // index into FACINGS; 0 = East
  private path: Vec2[] = [];
  private checkpointReached = false;
  private ended = false;
  private started = false;

  constructor(dom: Dom) {
    this.dom = dom;
    this.loadLevel(LEVELS[this.levelIndex]);

    new Controls(dom.overlay.parentElement as HTMLElement, {
      onTap: () => this.handleTap(),
      onMove: (dir) => this.handleMove(dir),
      onTurn: (dir) => this.handleTurn(dir),
    });

    // Stop propagation so pressing a UI button isn't also read as an in-game tap by Controls.
    for (const btn of [dom.startBtn, dom.tutorialBtn, dom.continueBtn]) {
      btn.addEventListener('pointerdown', (e) => e.stopPropagation());
    }
    dom.startBtn.addEventListener('click', () => this.beginPlay('game'));
    dom.tutorialBtn.addEventListener('click', () => this.beginPlay('tutorial'));
    dom.continueBtn.addEventListener('click', () => this.advanceLevel());
  }

  private loadLevel(rows: string[]): void {
    this.map = new LevelMap(rows);
    this.player = { ...this.map.start };
    this.facingIndex = 0;
    this.path = [{ ...this.player }];
    this.checkpointReached = false;
    this.ended = false;
  }

  private beginPlay(mode: 'game' | 'tutorial'): void {
    this.mode = mode;
    if (mode === 'tutorial') {
      this.loadLevel(TUTORIAL_LEVEL);
      this.tutorial = new Tutorial(this.dom.hint);
    }
    this.started = true;
    this.audio.ensureStarted();
    this.dom.overlay.classList.add('hidden');
    this.haptics.tap();
  }

  private handleTap(): void {
    if (!this.started || this.ended) return;
    this.audio.ensureStarted();

    const facing = FACINGS[this.facingIndex];
    const rays = castEchoRays(this.map, this.player, facing.angle);

    this.audio.emitClick(rays);
    this.haptics.tap();
    this.tutorial?.notify('tap');

    const nearest = Math.min(...rays.map((r) => (r.openEnded ? Infinity : r.distance)));
    if (Number.isFinite(nearest)) {
      setTimeout(() => this.haptics.echoFeedback(nearest), 60 + (nearest / 5) * 1000);
    }
  }

  private handleMove(direction: 'forward' | 'backward'): void {
    if (!this.started || this.ended) return;
    const facing = FACINGS[this.facingIndex];
    const sign = direction === 'forward' ? 1 : -1;
    const nx = this.player.x + facing.dx * sign;
    const ny = this.player.y + facing.dy * sign;

    if (this.map.isWall(nx, ny)) {
      this.audio.playBump();
      this.haptics.bump();
      this.tutorial?.notify('bump');
      return;
    }

    this.player = { x: nx, y: ny };
    const last = this.path[this.path.length - 1];
    if (!last || last.x !== nx || last.y !== ny) {
      this.path.push({ ...this.player });
    }
    if (direction === 'forward') this.tutorial?.notify('move');
    this.checkSpecialCells();
  }

  private handleTurn(direction: 'left' | 'right'): void {
    if (!this.started || this.ended) return;
    const delta = direction === 'right' ? 1 : -1;
    this.facingIndex = (this.facingIndex + delta + FACINGS.length) % FACINGS.length;
    this.tutorial?.notify(direction === 'right' ? 'turn-right' : 'turn-left');
  }

  private checkSpecialCells(): void {
    const cell = this.map.cellAt(this.player.x, this.player.y);
    if (cell === 'C' && !this.checkpointReached) {
      this.checkpointReached = true;
      this.audio.playCheckpoint();
      this.haptics.checkpoint();
      this.tutorial?.notify('checkpoint');
    }
    if (cell === 'E' && !this.ended) {
      this.ended = true;
      this.audio.playComplete();
      this.haptics.complete();
      this.revealSilhouette();
    }
  }

  private revealSilhouette(): void {
    const canvas = this.dom.silhouette;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const pad = 40;
    const scale = Math.min((w - pad * 2) / this.map.width, (h - pad * 2) / this.map.height);
    const offsetX = (w - this.map.width * scale) / 2;
    const offsetY = (h - this.map.height * scale) / 2;
    const toScreen = (p: Vec2) => ({
      x: offsetX + (p.x + 0.5) * scale,
      y: offsetY + (p.y + 0.5) * scale,
    });

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Soft outer glow, then a crisp core line, so the path reads like it's lit from within.
    ctx.strokeStyle = 'rgba(127, 215, 255, 0.5)';
    ctx.lineWidth = scale * 0.5;
    ctx.shadowColor = 'rgba(127, 215, 255, 0.9)';
    ctx.shadowBlur = 18;
    this.strokePath(ctx, toScreen);

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(232, 244, 255, 0.95)';
    ctx.lineWidth = scale * 0.14;
    this.strokePath(ctx, toScreen);

    if (this.mode === 'tutorial') {
      markTutorialDone();
      this.tutorial?.finish();
      this.dom.completeTitle.textContent = 'Eğitim tamamlandı';
      this.dom.continueBtn.textContent = 'Oyuna başla';
    } else {
      const isLastLevel = this.levelIndex === LEVELS.length - 1;
      this.dom.completeTitle.textContent = isLastLevel ? 'Tüm bölümler tamamlandı' : `Bölüm ${this.levelIndex + 1}/${LEVELS.length} tamamlandı`;
      this.dom.continueBtn.textContent = isLastLevel ? 'Baştan başla' : 'Sonraki bölüm';
    }
    this.dom.completeSubtitle.textContent = 'Az önce karanlıkta yürüdüğün rota';

    setTimeout(() => {
      canvas.classList.add('visible');
      this.dom.complete.classList.add('visible');
    }, 200);
  }

  private strokePath(ctx: CanvasRenderingContext2D, toScreen: (p: Vec2) => { x: number; y: number }): void {
    ctx.beginPath();
    this.path.forEach((p, i) => {
      const { x, y } = toScreen(p);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  private advanceLevel(): void {
    if (this.mode === 'tutorial') {
      // The tutorial precedes the progression: continue into level 1, not past it.
      this.mode = 'game';
      this.tutorial = null;
    } else {
      this.levelIndex = (this.levelIndex + 1) % LEVELS.length;
    }
    this.loadLevel(LEVELS[this.levelIndex]);

    this.dom.complete.classList.remove('visible');
    this.dom.silhouette.classList.remove('visible');
    const ctx = this.dom.silhouette.getContext('2d')!;
    ctx.clearRect(0, 0, this.dom.silhouette.width, this.dom.silhouette.height);

    this.haptics.tap();
  }
}
