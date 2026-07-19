import './style.css';
import { Game } from './game';
import { LEVELS } from './map';
import { isTutorialDone } from './tutorial';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <canvas id="silhouette"></canvas>
  <div id="hint"></div>
  <div id="complete">
    <h2 id="complete-title">Bölüm tamamlandı</h2>
    <span id="complete-subtitle">Az önce karanlıkta yürüdüğün rota</span>
    <button class="start-btn" id="continue-btn">Sonraki bölüm</button>
  </div>
  <div id="overlay">
    <h1>LIGHTWAKE</h1>
    <p>
      Kulaklık tak. Ekrana dokun: bir tık sesi ve yankısı geri döner.
      Sürükle: yukarı/aşağı ilerle, sağa/sola dön. Yönünü kaybetmeden
      koridorun sonuna ulaş. ${LEVELS.length} bölüm var, her biri bir
      öncekinden zorlaşıyor.
    </p>
    <button class="start-btn" id="start-btn"></button>
    <button class="start-btn" id="tutorial-btn"></button>
  </div>
`;

// First visit funnels into the tutorial; afterwards it stays available as a
// secondary option for replay.
const tutorialDone = isTutorialDone();
const startBtn = document.querySelector<HTMLButtonElement>('#start-btn')!;
const tutorialBtn = document.querySelector<HTMLButtonElement>('#tutorial-btn')!;
startBtn.textContent = tutorialDone ? 'Başla' : 'Eğitimi atla';
tutorialBtn.textContent = tutorialDone ? 'Eğitimi tekrar oyna' : 'Eğitimle başla';
(tutorialDone ? tutorialBtn : startBtn).classList.add('secondary');

new Game({
  overlay: document.querySelector('#overlay')!,
  startBtn,
  tutorialBtn,
  hint: document.querySelector('#hint')!,
  silhouette: document.querySelector('#silhouette')!,
  complete: document.querySelector('#complete')!,
  completeTitle: document.querySelector('#complete-title')!,
  completeSubtitle: document.querySelector('#complete-subtitle')!,
  continueBtn: document.querySelector('#continue-btn')!,
});
