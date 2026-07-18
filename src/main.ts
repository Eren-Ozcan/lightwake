import './style.css';
import { Game } from './game';
import { LEVELS } from './map';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <canvas id="silhouette"></canvas>
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
    <button class="start-btn" id="start-btn">Başla</button>
  </div>
`;

new Game({
  overlay: document.querySelector('#overlay')!,
  startBtn: document.querySelector('#start-btn')!,
  silhouette: document.querySelector('#silhouette')!,
  complete: document.querySelector('#complete')!,
  completeTitle: document.querySelector('#complete-title')!,
  completeSubtitle: document.querySelector('#complete-subtitle')!,
  continueBtn: document.querySelector('#continue-btn')!,
});
