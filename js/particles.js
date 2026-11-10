// Fundo de partículas (as "estrelas" do Nexo), desenhado num <canvas>.
// As partículas andam devagar, se afastam do mouse e se mexem em velocidades
// diferentes ao rolar a página (efeito de profundidade, chamado paralaxe).
//
// Para não pesar:
//  - o brilho de cada partícula é só um círculo maior e transparente
//  - em telas de alta resolução o canvas é desenhado maior, para ficar nítido
//  - as partículas só são recriadas quando a LARGURA da tela muda. No celular a
//    barra de endereço muda a altura ao rolar, e antes isso reiniciava tudo.
import { reduzirMovimento } from "./utils.js";

const canvas = document.getElementById("astraCanvas");

if (canvas) {
  const ctx = canvas.getContext("2d");
  const semAnimacao = reduzirMovimento();

  // As partículas vivem numa área 1,5x mais alta que a tela. Quando saem por baixo,
  // voltam por cima (como no Pac-Man), então nunca acabam, por maior que seja a página.
  // Perto do fim da página elas vão sumindo aos poucos.
  const MUNDO_ALTURAS = 1.5;
  const MAX_PARTICULAS = 420;
  const FADE_TELAS = 1.6; // quantas alturas de tela antes do fim a página começa a rarear
  const RESTO_FINAL = 0.1; // fração mínima que ainda sobra no último pixel da página
  const mouse = { x: null, y: null, raio: 150 };

  let largura = 0;
  let altura = 0;
  let scrollY = window.scrollY;
  let fimScroll = 0; // maior valor possível de scrollY
  let densidade = 1; // 1 = cheio · cai até RESTO_FINAL perto do fim da página
  let particulas = [];

  class Particula {
    constructor() {
      this.x = Math.random() * largura;
      this.y = Math.random() * altura * MUNDO_ALTURAS;
      this.tamanho = Math.random() * 1.5 + 0.4;
      this.velX = (Math.random() - 0.5) * 0.3;
      this.velY = (Math.random() - 0.5) * 0.3;
      this.opacidade = Math.random() * 0.5 + 0.2;
      this.fatorParalaxe = this.tamanho * 0.6;
      this.limiar = Math.random(); // cada partícula some numa altura diferente do fim da página
      // As cores já ficam prontas aqui, para não montar o texto 60 vezes por segundo.
      this.corNucleo = `rgba(180, 220, 255, ${this.opacidade})`;
      this.corBrilho = `rgba(100, 200, 255, ${this.opacidade * 0.18})`;
    }

    // Onde a partícula aparece na tela. As maiores se mexem mais ao rolar (paralaxe).
    // O % (resto da divisão) faz ela dar a volta na área.
    yNaTela() {
      const mundo = altura * MUNDO_ALTURAS;
      const y = (this.y - scrollY * this.fatorParalaxe) % mundo;
      if (y < 0) return y + mundo;
      return y;
    }

    atualizar() {
      this.x += this.velX;
      this.y += this.velY;

      const limiteY = altura * MUNDO_ALTURAS;
      if (this.x > largura) this.x = 0;
      if (this.x < 0) this.x = largura;
      if (this.y > limiteY) this.y = 0;
      if (this.y < 0) this.y = limiteY;

      // Perto do mouse, a partícula é empurrada para longe dele
      if (mouse.x !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.yNaTela();
        const distancia = Math.hypot(dx, dy);
        if (distancia > 0 && distancia < mouse.raio) {
          const forca = (mouse.raio - distancia) / mouse.raio;
          this.x -= (dx / distancia) * forca * 1.2;
          this.y -= (dy / distancia) * forca * 1.2;
        }
      }
    }

    desenhar() {
      const y = this.yNaTela();
      if (y < -10 || y > altura + 10) return;

      // Perto do fim da página: cada partícula tem o seu limite, então elas somem uma a uma.
      const visivel = Math.min(1, Math.max(0, (densidade - this.limiar * 0.9) / 0.12));
      if (visivel <= 0) return;
      ctx.globalAlpha = visivel;

      ctx.fillStyle = this.corBrilho;
      ctx.beginPath();
      ctx.arc(this.x, y, this.tamanho * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = this.corNucleo;
      ctx.beginPath();
      ctx.arc(this.x, y, this.tamanho, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function criarParticulas() {
    const quantidade = Math.min(MAX_PARTICULAS, Math.floor((largura * altura * MUNDO_ALTURAS) / 9000));
    particulas = [];
    for (let i = 0; i < quantidade; i++) particulas.push(new Particula());
  }

  // Quanto falta para o fim da página: 1 = longe (todas aparecem), perto do fim cai até 0,1.
  function atualizarDensidade() {
    const restante = fimScroll - scrollY;
    const t = Math.min(1, Math.max(0, restante / (altura * FADE_TELAS)));
    const suave = t * t * (3 - 2 * t); // curva suave: sem "degrau" no começo nem no fim
    densidade = RESTO_FINAL + (1 - RESTO_FINAL) * suave;
  }

  function medirPagina() {
    fimScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    atualizarDensidade();
    if (semAnimacao) desenharQuadro();
  }

  function ajustarTamanho() {
    const larguraMudou = window.innerWidth !== largura;
    largura = window.innerWidth;
    altura = window.innerHeight;

    // devicePixelRatio: em telas retina é 2 ou 3. Desenho o canvas nesse tamanho (no máximo 2x).
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(largura * dpr);
    canvas.height = Math.round(altura * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (larguraMudou || particulas.length === 0) criarParticulas();
    medirPagina();
  }

  function desenharQuadro() {
    ctx.clearRect(0, 0, largura, altura);
    for (const p of particulas) p.desenhar();
  }

  function animar() {
    ctx.clearRect(0, 0, largura, altura);
    for (const p of particulas) {
      p.atualizar();
      p.desenhar();
    }
    requestAnimationFrame(animar);
  }

  window.addEventListener(
    "scroll",
    () => {
      scrollY = window.scrollY;
      atualizarDensidade();
      if (semAnimacao) requestAnimationFrame(desenharQuadro);
    },
    { passive: true },
  );
  window.addEventListener("resize", ajustarTamanho);

  if (!semAnimacao) {
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    document.documentElement.addEventListener("mouseleave", () => {
      mouse.x = null;
      mouse.y = null;
    });
  }

  ajustarTamanho();
  // A altura da página muda quando troca de aba: o ResizeObserver avisa e eu meço de novo.
  if ("ResizeObserver" in window) new ResizeObserver(medirPagina).observe(document.body);
  window.addEventListener("load", medirPagina);
  if (!semAnimacao) animar();
}
