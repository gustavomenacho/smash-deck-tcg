// O que acontece quando a pessoa mexe numa carta:
//  - o mouse por cima inclina a carta em 3D
//  - duplo clique (ou um clique, com cliqueSimples), toque ou Enter "ativam" a carta
// Ativar pode virar a carta ou chamar outra função (abrir a ficha, abrir o zoom).
import { reduzirMovimento } from "../utils.js";

const INCLINACAO_MAX = 15; // graus
const DURACAO_GIRO_MS = 600;

// card: o elemento .card-container
// opcoes.flip: true = ativar vira a carta (padrão)
// opcoes.onActivate: função chamada ao ativar, quando flip é false
// opcoes.cliqueSimples: true = com o mouse, um clique já ativa (no Códice, para abrir a ficha)
export function attachCardInteractions(card, opcoes = {}) {
  const flip = opcoes.flip !== false;
  const onActivate = opcoes.onActivate;
  const cliqueSimples = opcoes.cliqueSimples === true;
  const inner = card.querySelector(".card-inner");
  // Só as cartas que viram ganham o 3D de verdade e o verso (ver cards.css)
  if (flip) card.classList.add("pode-virar");
  let virada = false;
  let girando = false;
  let dentro = false; // o mouse está sobre a carta?
  let tipoPonteiro = "mouse"; // último tipo de ponteiro visto: mouse | touch | pen

  function rotacaoBase() {
    return virada ? 180 : 0;
  }

  // Sempre escrevo o transform no mesmo formato: rotateX() rotateY().
  // Descobri que, se o formato muda, o navegador às vezes "pula" para o verso
  // da carta em vez de girar.
  function pose(rotX, rotY) {
    return `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  }

  function inclinar(evento) {
    if (evento.pointerType !== "mouse" || girando || reduzirMovimento()) return;

    const caixa = card.getBoundingClientRect();
    const x = evento.clientX - caixa.left;
    const y = evento.clientY - caixa.top;
    // Posição do mouse de -1 a 1 a partir do centro, vezes a inclinação máxima
    const rotX = ((y - caixa.height / 2) / (caixa.height / 2)) * -INCLINACAO_MAX;
    const rotY = ((x - caixa.width / 2) / (caixa.width / 2)) * INCLINACAO_MAX;

    // --foil-x move o brilho da carta junto com o mouse (o CSS usa essa variável)
    inner.style.setProperty("--foil-x", `${Math.round((x / caixa.width) * 100)}%`);
    // De costas, o eixo Y inverte para o movimento da inclinação fazer sentido.
    inner.style.transform = pose(rotX, virada ? 180 - rotY : rotY);
  }

  function ativar() {
    if (!flip) {
      if (onActivate) onActivate(card);
      return;
    }
    if (girando) return; // ignora cliques durante o giro (evita girar "pela metade")
    virada = !virada;
    girando = true;
    inner.classList.remove("tilting");
    inner.classList.add("flipping");
    inner.style.transform = pose(0, rotacaoBase());
    setTimeout(() => {
      girando = false;
      inner.classList.remove("flipping");
      if (dentro) inner.classList.add("tilting"); // volta a acompanhar o mouse sem atraso
    }, DURACAO_GIRO_MS);
  }

  card.addEventListener("pointerdown", (e) => {
    tipoPonteiro = e.pointerType;
  });

  card.addEventListener("pointerenter", (e) => {
    if (e.pointerType !== "mouse") return;
    dentro = true;
    if (!girando) inner.classList.add("tilting");
  });
  card.addEventListener("pointermove", inclinar);
  card.addEventListener("pointerleave", () => {
    dentro = false;
    inner.classList.remove("tilting");
    if (!girando) inner.style.transform = pose(0, rotacaoBase());
  });

  // Mouse: duplo clique (como no projeto original), ou um clique se cliqueSimples for true.
  // Toque/caneta: um toque basta.
  card.addEventListener("dblclick", () => {
    if (tipoPonteiro === "mouse" && !cliqueSimples) ativar();
  });
  card.addEventListener("click", () => {
    if (tipoPonteiro !== "mouse" || cliqueSimples) ativar();
  });

  // Teclado (só cartas focáveis, ou seja, não decorativas).
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      ativar();
    }
  });
}
