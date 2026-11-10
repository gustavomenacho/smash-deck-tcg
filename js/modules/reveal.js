// Entrada suave dos blocos de todas as abas: cada bloco aparece subindo um pouco
// quando entra na tela. Os que entram juntos aparecem um depois do outro.
//
// Cuidados que aprendi no caminho:
//  - As cartas nunca são animadas aqui: transparência ou transform em volta de uma
//    carta estragam as sombras dela.
//  - Quando a animação termina, eu removo as classes e estilos que coloquei.
//    Um transform que sobra quebra posições fixas e o hover.
//  - Sem JavaScript, ou com "reduzir movimento" ligado, nada fica escondido.
//  - Crônicas e Manual já têm entrada própria em alguns blocos; aqui só entram os outros.

// Cada item: [seletor CSS, só opacidade?]
// "só opacidade" é para blocos grandes que não devem subir, só aparecer.
const ALVOS = [
  // Início
  [".confluente-texto > *", false],
  [".confluente-bento > li", false],
  [".duelo-palco", true],
  [".confluente-stepper > li", false],
  [".altar-nexus-scene", true],
  [".home-final > *", false],
  // Códice e Linhagens (as cartas e o painel de cartas ficam de fora)
  ["#codice .screen-title, #codice .codice-intro, #codice .codice-controles, #codice .codice-contagem", false],
  ["#linhagens .screen-title, #linhagens .codice-intro, #linhagens .runas", false],
  // Crônicas (o resto já tem entrada própria)
  [".lore-hero-texto > *", false],
  [".lore-indice", false],
  // Manual do Jogador
  [".ritual-topo > *", false],
  [".ritual-fatos", false],
  [".ritual-indice", false],
  [".anatomia", true],
  [".conta50", false],
  [".tapete", true],
  [".tapete-acoes", false],
  [".formula", false],
  [".exemplo", true],
  [".vencedor > li", false],
  [".rit-nota", false],
  [".duvidas > details", false],
  [".rit-final > *", false],
  // Oficina do Nexo (as cartas dos produtos têm a entrada própria)
  [".of-topo > *", false],
  // O Arquiteto
  [".arq-topo > *", false],
  [".arq-bio", true],
  [".arq-autor", false],
  [".arq-stack", false],
  [".arq-legal", false],
  [".arq-duplo > *", false],
  [".arq-citacao", false],
  [".arq-contato", false],
];

// A carta é um ".card-container" (ver cardRenderer.js).
// Qualquer bloco que seja uma carta, esteja dentro de uma ou tenha uma dentro fica de fora.
import { reduzirMovimento } from "../utils.js";

const CARTA = ".card-container";
const CONTEINERES_DE_CARTA = `${CARTA}, .of-card, #deck-container, .carousel-viewport, .linha-painel`;

const ESCALONAMENTO_MS = 90; // intervalo entre um bloco e o próximo
const MAX_ATRASO_MS = 540;
const DURACAO_MS = 800; // igual à transição em reveal.css

export function initReveal() {
  if (!("IntersectionObserver" in window)) return;
  if (reduzirMovimento()) return;

  // 1. Esconde todos os blocos da lista (classe "rv" no CSS)
  const alvos = [];
  for (const item of ALVOS) {
    const seletor = item[0];
    const soOpacidade = item[1];
    for (const el of document.querySelectorAll(seletor)) {
      if (el.closest(CONTEINERES_DE_CARTA)) continue; // está dentro de uma carta
      if (el.querySelector(CARTA)) continue; // tem uma carta dentro
      if (alvos.includes(el)) continue; // já está na lista
      el.style.transition = "none"; // esconde na hora, sem animar o "sumir"
      el.classList.add("rv");
      if (soOpacidade) el.classList.add("rv-op");
      alvos.push(el);
    }
  }
  void document.body.offsetWidth; // força o navegador a aplicar o "escondido"...
  for (const el of alvos) el.style.removeProperty("transition"); // ...e só então liga a animação

  function limpar(el) {
    el.classList.remove("rv", "rv-op", "rv-in");
    el.style.removeProperty("transition-delay");
    el.style.removeProperty("transition");
  }

  // 2. Quando um bloco entra na tela, ele aparece (classe "rv-in")
  const observador = new IntersectionObserver(
    (entradas) => {
      const naTela = entradas.filter((entrada) => entrada.isIntersecting);
      // Ordena de cima para baixo (e da esquerda para a direita), para aparecerem em ordem
      naTela.sort((a, b) => {
        const diferencaTopo = a.boundingClientRect.top - b.boundingClientRect.top;
        if (diferencaTopo !== 0) return diferencaTopo;
        return a.boundingClientRect.left - b.boundingClientRect.left;
      });

      naTela.forEach((entrada, i) => {
        const el = entrada.target;
        observador.unobserve(el);
        const atraso = Math.min(i * ESCALONAMENTO_MS, MAX_ATRASO_MS);
        el.style.transitionDelay = `${atraso}ms`;
        void el.offsetWidth;
        el.classList.add("rv-in");
        // 3. Depois da animação, limpa tudo
        setTimeout(() => limpar(el), atraso + DURACAO_MS + 150);
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
  );
  for (const el of alvos) observador.observe(el);
}
