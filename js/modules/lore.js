// Aba "Crônicas do Confluente"
// O texto da história está todo no index.html. Aqui ficam os efeitos da leitura:
// as cartas espalhadas no topo, a barra de progresso, o índice que marca o
// capítulo atual, a cor que muda por capítulo e os blocos que aparecem ao rolar.

import { renderCard, ajustarNomes } from "./cardRenderer.js";
import { reduzirMovimento, rolagem } from "../utils.js";

// As cartas espalhadas na abertura. x e y: posição a partir do centro,
// r: inclinação, s: tamanho. Ao rolar, elas se juntam no centro (CSS).
// celular: false = a carta some em telas estreitas, onde ela ficaria em cima do título.
const CARTAS_ABERTURA = [
  { id: "SD-012", x: "-18vw", y: "-24vh", r: "-14deg", s: 0.4, celular: true }, // Mario
  { id: "SD-016", x: "20vw", y: "-26vh", r: "12deg", s: 0.36, celular: true }, // Sonic
  { id: "SD-009", x: "-32vw", y: "-8vh", r: "-8deg", s: 0.32, celular: false }, // Kratos
  { id: "SD-015", x: "32vw", y: "-6vh", r: "-11deg", s: 0.38, celular: false }, // Pikachu & Charizard
  { id: "SD-010", x: "-29vw", y: "18vh", r: "9deg", s: 0.42, celular: false }, // Link
  { id: "SD-014", x: "29vw", y: "22vh", r: "-15deg", s: 0.37, celular: false }, // Pac-Man
  { id: "SD-094", x: "-13vw", y: "34vh", r: "16deg", s: 0.34, celular: true }, // Inklings
  { id: "SD-047", x: "11vw", y: "36vh", r: "-7deg", s: 0.33, celular: true }, // Scorpion & Sub-Zero
  { id: "SD-063", x: "0vw", y: "-28vh", r: "6deg", s: 0.32, celular: true }, // Master Chief
];

function montarCartasAbertura(hero, cartas) {
  const palco = hero.querySelector(".lore-fragmentos");
  if (!palco || cartas.length === 0) return;

  let html = "";
  for (const item of CARTAS_ABERTURA) {
    const carta = cartas.find((c) => c.id === item.id);
    if (!carta) continue;
    let classeExtra = "";
    if (!item.celular) classeExtra = " so-tela-larga";
    html += `<div class="lore-carta${classeExtra}" style="--x:${item.x};--y:${item.y};--r:${item.r};--s:${item.s}">${renderCard(carta, { decorative: true })}</div>`;
  }
  palco.innerHTML = html;

  requestAnimationFrame(() => ajustarNomes(palco));
  if (document.fonts) document.fonts.ready.then(() => ajustarNomes(palco));
}

// Tempo de leitura: conto as palavras e divido por 200 (média de leitura por minuto).
const PALAVRAS_POR_MINUTO = 200;

function contarPalavras(elemento) {
  const texto = elemento.textContent.trim();
  if (texto === "") return 0;
  return texto.split(/\s+/).length; // \s+ = um ou mais espaços/quebras de linha
}

function minutosDeLeitura(palavras) {
  return Math.max(1, Math.round(palavras / PALAVRAS_POR_MINUTO));
}

// Escreve "Leitura de 9 min · 4 capítulos" na abertura e o tempo de cada capítulo no índice.
function mostrarTempoDeLeitura(tela) {
  const capitulos = tela.querySelectorAll(".lore-cap");
  let totalPalavras = 0;

  for (const capitulo of capitulos) {
    const palavras = contarPalavras(capitulo);
    totalPalavras += palavras;

    const link = tela.querySelector(`.lore-indice a[data-cap-ir="${capitulo.id}"] span`);
    if (link && !link.querySelector("small")) {
      const tempo = document.createElement("small");
      tempo.textContent = `${minutosDeLeitura(palavras)} min de leitura`;
      link.appendChild(tempo);
    }
  }

  const topo = document.getElementById("lore-tempo");
  if (topo) topo.textContent = `Leitura de ${minutosDeLeitura(totalPalavras)} min · ${capitulos.length} capítulos`;
}

// Mantém um número entre um mínimo e um máximo.
function limitar(numero, minimo, maximo) {
  return Math.min(maximo, Math.max(minimo, numero));
}

export function initLore(cartas = []) {
  const tela = document.getElementById("lore");
  if (!tela) return;
  let montada = false;

  function montar() {
    if (montada) return;
    montada = true;

    const hero = tela.querySelector(".lore-hero");
    montarCartasAbertura(hero, cartas);
    mostrarTempoDeLeitura(tela);
    const barra = tela.querySelector(".lore-progresso span");
    const capitulos = tela.querySelectorAll(".lore-cap");
    const links = tela.querySelectorAll(".lore-indice a");

    // Cada capítulo tem a sua cor no atributo data-aura
    for (const capitulo of capitulos) {
      capitulo.style.setProperty("--cap-rgb", capitulo.dataset.aura);
    }

    tela.addEventListener("click", (e) => {
      // Índice: rola até o capítulo
      const linkIndice = e.target.closest("[data-cap-ir]");
      if (linkIndice) {
        e.preventDefault();
        const capitulo = document.getElementById(linkIndice.dataset.capIr);
        if (capitulo) capitulo.scrollIntoView({ behavior: rolagem(), block: "start" });
        return;
      }
      // Botões que levam para outra aba
      const botaoAba = e.target.closest("[data-ir]");
      if (botaoAba) {
        const link = document.querySelector(`.nav-links a[data-target="${botaoAba.dataset.ir}"]`);
        if (link) link.click();
      }
    });

    // Capítulo atual: o que está passando pela faixa do meio da tela.
    // Ele fica marcado no índice e a cor da página muda para a dele.
    function marcarCapitulo(capitulo) {
      for (const link of links) {
        if (link.dataset.capIr === capitulo.id) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      }
      tela.style.setProperty("--aura-rgb", capitulo.dataset.aura);
    }
    const observadorCapitulos = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) marcarCapitulo(entrada.target);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }, // só uma faixa fina no meio da tela conta
    );
    for (const capitulo of capitulos) observadorCapitulos.observe(capitulo);

    // Os blocos de texto aparecem ao rolar (classe "visto" no CSS)
    if (!reduzirMovimento() && "IntersectionObserver" in window) {
      tela.classList.add("js-reveal");
      const observadorBlocos = new IntersectionObserver(
        (entradas) => {
          for (const entrada of entradas) {
            if (!entrada.isIntersecting) continue;
            entrada.target.classList.add("visto");
            observadorBlocos.unobserve(entrada.target);
          }
        },
        { rootMargin: "0px 0px -8% 0px" },
      );
      const blocos = tela.querySelectorAll(".lore-bloco, .lore-citacao");
      blocos.forEach((bloco, i) => {
        bloco.style.setProperty("--i", String(i % 3)); // atraso em grupos de 3
        observadorBlocos.observe(bloco);
      });
    }

    // Ao rolar: as cartas do topo se juntam (--p) e a barra de progresso enche (--prog)
    function atualizar() {
      esperandoQuadro = false;
      if (!tela.classList.contains("active")) return;

      // Quanto da aba já foi lido, de 0 a 1
      const topo = tela.getBoundingClientRect().top + window.scrollY;
      const total = tela.offsetHeight - window.innerHeight;
      let progresso = 0;
      if (total > 0) progresso = limitar((window.scrollY - topo) / total, 0, 1);
      barra.parentElement.style.setProperty("--prog", progresso.toFixed(4));
      barra.style.setProperty("--prog", progresso.toFixed(4));

      // As cartas terminam de se juntar quando a pessoa rola 3/4 da abertura
      const alturaAbertura = hero.offsetHeight || 1;
      let juntas = 1;
      if (!reduzirMovimento()) juntas = limitar(window.scrollY / (alturaAbertura * 0.75), 0, 1);
      hero.style.setProperty("--p", juntas.toFixed(3));
    }

    // O scroll dispara muitas vezes: calculo no máximo uma vez por quadro da tela
    let esperandoQuadro = false;
    function pedir() {
      if (esperandoQuadro) return;
      esperandoQuadro = true;
      requestAnimationFrame(atualizar);
    }
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    atualizar();
  }

  document.addEventListener("screenchange", (e) => {
    if (e.detail.id === "lore") {
      montar();
      window.scrollTo(0, 0);
    }
  });
}
