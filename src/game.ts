import { LevelMap, FACINGS, castEchoRays, LEVELS, type Vec2 } from './map';
import { AudioEngine } from './audio';
import { Haptics } from './haptics';
import { Controls } from './controls';

interface Dom {
  overlay: HTMLElement;
  startBtn: HTMLElement;
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

  private levelIndex = 0;
  private map: LevelMap;
  private player: Vec2;
  private facingIndex = 0; // index into FACINGS; 0 = East
  private path: Vec2[] = [];
  private checkpointReached = false;
  private ended = false;
  private started = false;

  constructor(dom: Dom) {
    this.dom = dom;
    this.map = new LevelMap(LEVELS[this.levelIndex]);
    this.player = { ...this.map.start };
    this.path.push({ ...this.player });

    new Controls(dom.overlay.parentElement as HTMLElement, {
      onTap: () => this.handleTap(),
      onMove: (dir) => this.handleMove(dir),
      onTurn: (dir) => this.handleTurn(dir),
    });

    // Stop propagation so pressing a UI button isn't also read as an in-game tap by Controls.
    dom.startBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
    dom.startBtn.addEventListener('click', () => this.beginPlay());
    dom.continueBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
    dom.continueBtn.addEventListener('click', () => this.advanceLevel());
  }

  private beginPlay(): void {
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
      return;
    }

    this.player = { x: nx, y: ny };
    const last = this.path[this.path.length - 1];
    if (!last || last.x !== nx || last.y !== ny) {
      this.path.push({ ...this.player });
    }
    this.checkSpecialCells();
  }

  private handleTurn(direction: 'left' | 'right'): void {
    if (!this.started || this.ended) return;
    const delta = direction === 'right' ? 1 : -1;
    this.facingIndex = (this.facingIndex + delta + FACINGS.length) % FACINGS.length;
  }

  private checkSpecialCells(): void {
    const cell = this.map.cellAt(this.player.x, this.player.y);
    if (cell === 'C' && !this.checkpointReached) {
      this.checkpointReached = true;
      this.audio.playCheckpoint();
      this.haptics.checkpoint();
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

    const isLastLevel = this.levelIndex === LEVELS.length - 1;
    this.dom.completeTitle.textContent = isLastLevel ? 'Tüm bölümler tamamlandı' : `Bölüm ${this.levelIndex + 1}/${LEVELS.length} tamamlandı`;
    this.dom.completeSubtitle.textContent = 'Az önce karanlıkta yürüdüğün rota';
    this.dom.continueBtn.textContent = isLastLevel ? 'Baştan başla' : 'Sonraki bölüm';

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
    this.levelIndex = (this.levelIndex + 1) % LEVELS.length;
    this.map = new LevelMap(LEVELS[this.levelIndex]);
    this.player = { ...this.map.start };
    this.facingIndex = 0;
    this.path = [{ ...this.player }];
    this.checkpointReached = false;
    this.ended = false;

    this.dom.complete.classList.remove('visible');
    this.dom.silhouette.classList.remove('visible');
    const ctx = this.dom.silhouette.getContext('2d')!;
    ctx.clearRect(0, 0, this.dom.silhouette.width, this.dom.silhouette.height);

    this.haptics.tap();
  }
}
