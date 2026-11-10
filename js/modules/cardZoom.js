// Zoom 3D das cartas do carrossel do Início.
// Uma cópia da carta voa até o centro da tela girando 360°, em cima de um fundo escuro.
// Fecha com clique no fundo, duplo clique na carta ou Esc.

const LARGURA_CARTA = 315; // mesmas dimensões de .card-container em cards.css
const ALTURA_CARTA = 440;
const ESCALA_MAX = 1.6;
const MARGEM = 32; // folga mínima nas bordas da tela
const VOO_MS = 1000; // igual à transição de .card-clone-hologram em sections.css

// "track" é a esteira do carrossel: ela para enquanto uma carta está aberta.
export function createCardZoom(track) {
  let overlay = document.querySelector(".nexus-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "nexus-overlay";
    document.body.appendChild(overlay);
  }

  let clone = null;
  let origem = null;
  let ocupado = false;

  // Tamanho final da carta: 1.6x no computador; em tela pequena, o máximo que cabe.
  function escalaFinal() {
    const cabeNaLargura = (window.innerWidth - MARGEM) / LARGURA_CARTA;
    const cabeNaAltura = (window.innerHeight - MARGEM) / ALTURA_CARTA;
    return Math.min(ESCALA_MAX, cabeNaLargura, cabeNaAltura);
  }

  // Centro e largura do elemento na tela.
  function medir(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, largura: r.width };
  }

  // Deixa a carta de frente na hora, sem animar.
  function zerarGiro(inner) {
    inner.style.transition = "none";
    inner.style.transform = "rotateX(0deg) rotateY(0deg)";
  }

  function abrir(card) {
    if (clone || ocupado) return;
    ocupado = true;
    origem = card;
    track.style.animationPlayState = "paused";

    const posicao = medir(card);
    const escalaInicial = posicao.largura / card.offsetWidth; // a carta do carrossel é menor que a original
    const nome = card.dataset.nome || "carta";

    clone = card.cloneNode(true);
    clone.classList.add("card-clone-hologram");
    clone.removeAttribute("id");
    clone.removeAttribute("aria-hidden");
    clone.setAttribute("role", "dialog");
    clone.setAttribute("aria-modal", "true");
    clone.setAttribute("aria-label", card.dataset.nome || "Carta");
    clone.tabIndex = -1;
    const arte = clone.querySelector(".card-art");
    if (arte) arte.alt = `Arte de ${nome}`;

    const inner = clone.querySelector(".card-inner");
    zerarGiro(inner);

    // Começa exatamente em cima da carta do carrossel
    clone.style.setProperty("--zoom", escalaFinal());
    clone.style.top = `${posicao.y}px`;
    clone.style.left = `${posicao.x}px`;
    clone.style.transform = `translate(-50%, -50%) scale(${escalaInicial})`;

    document.body.appendChild(clone);
    card.style.opacity = "0";
    overlay.classList.add("active");
    clone.focus({ preventScroll: true });

    clone.addEventListener("dblclick", fechar);
    clone.addEventListener("pointermove", (e) => parallax(e, inner));
    clone.addEventListener("pointerleave", () => repousar(inner));

    // Espero dois quadros para o navegador desenhar a posição inicial;
    // senão ele pula direto para o fim e não há animação.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        clone.classList.add("is-fullscreen"); // o CSS leva a carta para o centro
        inner.style.transition = `transform ${VOO_MS}ms ease-in-out`;
        inner.style.transform = "rotateX(0deg) rotateY(360deg)";
      });
    });

    setTimeout(() => {
      if (!clone) return;
      // Fim do voo: zera o giro sem animar. Daqui para frente só o mouse inclina a carta.
      zerarGiro(inner);
      void inner.offsetWidth; // força o navegador a aplicar o "zerar" agora
      inner.style.transition = "transform 0.1s ease-out";
      ocupado = false;
    }, VOO_MS);
  }

  // A carta inclina para o lado do mouse (até 10 graus).
  function parallax(evento, inner) {
    if (ocupado || evento.pointerType !== "mouse") return;
    const r = clone.getBoundingClientRect();
    // Posição do mouse de -1 (borda esquerda/topo) a 1 (borda direita/baixo)
    const horizontal = (evento.clientX - r.left - r.width / 2) / (r.width / 2);
    const vertical = (evento.clientY - r.top - r.height / 2) / (r.height / 2);
    const rotX = vertical * -10;
    const rotY = horizontal * 10;
    inner.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  }

  // O mouse saiu: a carta volta devagar a ficar reta.
  function repousar(inner) {
    if (ocupado) return;
    inner.style.transition = "transform 0.4s ease-out";
    inner.style.transform = "rotateX(0deg) rotateY(0deg)";
    setTimeout(() => {
      if (!ocupado && clone) inner.style.transition = "transform 0.1s ease-out";
    }, 400);
  }

  function fechar() {
    if (!clone || !origem || ocupado) return;
    ocupado = true;

    const posicao = medir(origem);
    const escalaVolta = posicao.largura / origem.offsetWidth;
    const inner = clone.querySelector(".card-inner");

    inner.style.transition = `transform ${VOO_MS}ms ease-in-out`;
    inner.style.transform = "rotateX(0deg) rotateY(360deg)";

    // Volta para cima da carta do carrossel
    clone.classList.remove("is-fullscreen");
    clone.style.top = `${posicao.y}px`;
    clone.style.left = `${posicao.x}px`;
    clone.style.transform = `translate(-50%, -50%) scale(${escalaVolta})`;
    overlay.classList.remove("active");

    setTimeout(() => {
      if (clone) clone.remove();
      if (origem) origem.style.opacity = "1";
      track.style.animationPlayState = "";
      clone = null;
      origem = null;
      ocupado = false;
    }, VOO_MS);
  }

  overlay.addEventListener("click", fechar);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fechar();
  });

  return { open: abrir, close: fechar, isOpen: () => clone !== null };
}
