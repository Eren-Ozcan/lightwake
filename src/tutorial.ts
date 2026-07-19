export type TutorialEvent = 'tap' | 'move' | 'bump' | 'turn-right' | 'turn-left' | 'checkpoint';

interface TutorialStep {
  hint: string;
  /** Event that completes this step; null = final step, cleared when the level completes. */
  advanceOn: TutorialEvent | null;
}

// Ordered to match TUTORIAL_LEVEL's shape: straight run, bump at the corner,
// right turn, checkpoint, left turn, exit.
const STEPS: TutorialStep[] = [
  { hint: 'Kulaklığın takılı olsun. Ekrana dokun — tık sesin duvarlarda yankılanıp geri döner. Yankı ne kadar geç gelirse önündeki yol o kadar açık.', advanceOn: 'tap' },
  { hint: 'Önün açık. Yukarı kaydırarak bir adım ilerle.', advanceOn: 'move' },
  { hint: 'Dokun, dinle, ilerle. Önün kapanınca tok bir çarpma duyacaksın — bu bir hata değil, duvarı bulmanın yolu.', advanceOn: 'bump' },
  { hint: 'Duvar! Sağa kaydırarak dön. Artık dokunduğunda yankılar yeni baktığın yönü anlatır.', advanceOn: 'turn-right' },
  { hint: 'Yeni yönünü dokunarak yokla, sonra ilerle.', advanceOn: 'checkpoint' },
  { hint: 'Kontrol noktası — doğru yoldasın. Şimdi sola kaydırarak dön.', advanceOn: 'turn-left' },
  { hint: 'Son düzlük. Yankıyı takip et ve çıkışa ulaş.', advanceOn: null },
];

const DONE_KEY = 'lightwake-tutorial-done';

export function isTutorialDone(): boolean {
  try {
    return localStorage.getItem(DONE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markTutorialDone(): void {
  try {
    localStorage.setItem(DONE_KEY, '1');
  } catch {
    // Private browsing can refuse writes; the tutorial will just be offered again.
  }
}

/**
 * Steps through the hint sequence as the game reports player actions. Only
 * the current step's event advances it, with one exception: reaching the
 * checkpoint always resyncs past the checkpoint step, so a player who skips
 * an earlier milestone (e.g. turns at the corner without ever bumping the
 * wall) doesn't drag a stale hint through the rest of the run.
 */
export class Tutorial {
  private stepIndex = 0;
  private hintEl: HTMLElement;

  constructor(hintEl: HTMLElement) {
    this.hintEl = hintEl;
    this.render();
  }

  notify(event: TutorialEvent): void {
    const current = STEPS[this.stepIndex];
    if (!current) return;
    if (current.advanceOn === event) {
      this.stepIndex += 1;
    } else if (event === 'checkpoint') {
      this.stepIndex = STEPS.findIndex((s) => s.advanceOn === 'checkpoint') + 1;
    } else {
      return;
    }
    this.render();
  }

  finish(): void {
    this.hintEl.classList.remove('visible');
  }

  private render(): void {
    const step = STEPS[this.stepIndex];
    if (!step) {
      this.finish();
      return;
    }
    this.hintEl.textContent = step.hint;
    this.hintEl.classList.add('visible');
  }
}
