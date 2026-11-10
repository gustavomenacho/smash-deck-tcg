// Aba Início: o slogan que se digita sozinho, o botão "Desça ao Nexo",
// o painel dos três pilares (ATK, DEF e TECH), o carrossel de cartas
// e o duelo Mario x Sephiroth da apresentação.

import { renderCard, ajustarNomes } from "./cardRenderer.js";
import { attachCardInteractions } from "./cardInteractions.js";
import { createCardZoom } from "./cardZoom.js";
import { obterFicha, carregarLendas } from "./ficha.js";
import { reduzirMovimento, rolagem } from "../utils.js";

const SLOGAN = "103 Lendas. Uma Arena. O Fim do Esquecimento.";
const VELOCIDADE_DIGITACAO_MS = 60;

const PROTOCOLOS = {
  atk: {
    protocol: "NEXUS PROTOCOL // ATK",
    attr: "ataque",
    rotulo: "ATK",
    title: "OS 3 MAIS FORTES EM ATK",
    desc: "Quem bate primeiro, bate mais forte.",
    manual: "Como o ATK decide um duelo? Veja no Manual do Jogador →",
    borderColor: "rgba(255, 60, 60, 0.8)",
    glow: "0 0 40px rgba(255, 40, 40, 0.5)",
    cor: "#ff5a5a",
  },
  def: {
    protocol: "NEXUS PROTOCOL // DEF",
    attr: "defesa",
    rotulo: "DEF",
    title: "OS 3 MAIS FORTES EM DEF",
    desc: "Ninguém passa por quem não cai.",
    manual: "Como a DEF decide um duelo? Veja no Manual do Jogador →",
    borderColor: "rgba(0, 195, 255, 0.8)",
    glow: "0 0 40px rgba(0, 140, 255, 0.5)",
    cor: "#38bdf8",
  },
  tech: {
    protocol: "NEXUS PROTOCOL // TECH",
    attr: "tecnica",
    rotulo: "TECH",
    title: "OS 3 MAIS FORTES EM TECH",
    desc: "Quem domina a técnica reescreve as regras.",
    manual: "Como a TECH decide um duelo? Veja no Manual do Jogador →",
    borderColor: "rgba(255, 214, 10, 0.8)",
    glow: "0 0 40px rgba(255, 214, 10, 0.5)",
    cor: "#ffd60a",
  },
};

// Lendas que aparecem no carrossel do Início.
const IDS_PANTEAO = [
  "SD-012", "SD-016", "SD-015", "SD-010", "SD-014",
  "SD-090", "SD-037", "SD-009", "SD-063", "SD-060",
  "SD-044", "SD-046", "SD-067", "SD-093",
];

// Faixas de valores do gráfico de barras do painel (de, até).
const FAIXAS = [[0, 69], [70, 74], [75, 79], [80, 84], [85, 89], [90, 94], [95, 100]];

// Abre outra aba clicando no link do menu, como se a pessoa tivesse clicado.
function irParaAba(id) {
  const link = document.querySelector(`.nav-links a[data-target="${id}"]`);
  if (link) link.click();
}

// Ajusta os nomes das cartas agora e de novo quando as fontes terminarem de carregar.
function ajustarNomesDepois(elemento) {
  requestAnimationFrame(() => ajustarNomes(elemento));
  if (document.fonts) document.fonts.ready.then(() => ajustarNomes(elemento));
}

export function initHomeEffects(todasAsCartas = []) {
  // Botões da apresentação que levam para outras abas
  for (const botao of document.querySelectorAll("[data-ir-home]")) {
    botao.addEventListener("click", () => irParaAba(botao.dataset.irHome));
  }
  iniciarDigitacao();
  iniciarBotaoDescer();
  iniciarHudPilares(todasAsCartas);
}

function iniciarDigitacao() {
  const alvo = document.getElementById("typewriter-text");
  if (!alvo) return;

  if (reduzirMovimento()) {
    alvo.textContent = SLOGAN;
    return;
  }

  // Coloca uma letra por vez. A função chama a si mesma até acabar o slogan.
  alvo.textContent = "";
  let indice = 0;
  function digitar() {
    if (indice >= SLOGAN.length) return;
    alvo.textContent += SLOGAN.charAt(indice);
    indice++;
    setTimeout(digitar, VELOCIDADE_DIGITACAO_MS);
  }
  setTimeout(digitar, 300);
}

function iniciarBotaoDescer() {
  const botao = document.getElementById("btn-desca-nexus");
  if (!botao) return;

  botao.addEventListener("click", (e) => {
    e.preventDefault();
    const bloco = document.getElementById("confluente-bloco");
    if (!bloco) return;
    // Rola até o bloco ficar no meio da tela (descontando o menu fixo lá em cima).
    // Se o bloco for mais alto que a tela, ele fica alinhado pelo topo.
    const menu = document.getElementById("hud-menu");
    const alturaMenu = menu ? menu.offsetHeight : 0;
    const areaVisivel = window.innerHeight - alturaMenu;
    const caixa = bloco.getBoundingClientRect();

    let folga = 12;
    if (caixa.height < areaVisivel) folga = (areaVisivel - caixa.height) / 2;

    window.scrollTo({
      top: window.scrollY + caixa.top - alturaMenu - folga,
      behavior: rolagem(),
    });
  });
}

// Calcula, para um atributo (ex.: "ataque"), as 3 melhores cartas,
// quantas cartas caem em cada faixa do gráfico e a média.
function calcularEstatisticas(cartas, atributo) {
  // Do maior para o menor; no empate, por ordem alfabética.
  const ranking = [...cartas].sort((a, b) => {
    if (b[atributo] !== a[atributo]) return b[atributo] - a[atributo];
    return a.nome.localeCompare(b.nome, "pt-BR");
  });

  const contagem = [];
  for (const [de, ate] of FAIXAS) {
    let quantas = 0;
    for (const carta of cartas) {
      if (carta[atributo] >= de && carta[atributo] <= ate) quantas++;
    }
    contagem.push(quantas);
  }

  let maior = 1;
  for (const n of contagem) {
    if (n > maior) maior = n;
  }

  let soma = 0;
  for (const carta of cartas) soma += carta[atributo];
  const media = cartas.length > 0 ? soma / cartas.length : 0;

  return { top: ranking.slice(0, 3), contagem, max: maior, media };
}

// As barrinhas do gráfico. A altura de cada uma é proporcional à faixa mais cheia.
function htmlGrafico(estatistica, cor) {
  let html = "";
  for (let i = 0; i < FAIXAS.length; i++) {
    const [de, ate] = FAIXAS[i];
    const quantas = estatistica.contagem[i];

    let nomeFaixa = `${de}–${ate}`;
    if (i === 0) nomeFaixa = `até ${ate}`;
    if (i === FAIXAS.length - 1) nomeFaixa = `${de}+`;

    const altura = Math.max(6, Math.round((quantas / estatistica.max) * 100)); // no mínimo 6%, para aparecer
    html += `<span style="height:${altura}%;background:${cor};box-shadow:0 0 6px ${cor}" title="${nomeFaixa}: ${quantas} lendas"></span>`;
  }
  return html;
}

// As 3 mini cartas do topo do ranking.
// Embaixo de cada carta: a posição (1º, 2º, 3º), o nome e o valor na cor do atributo.
function htmlTop3(top, dados) {
  let html = "";
  top.forEach((carta, i) => {
    const valor = carta[dados.attr];
    html += `<div class="hud-mini" role="button" tabindex="0" data-id="${carta.id}" aria-label="${i + 1}º lugar: ${carta.nome}, ${dados.rotulo} ${valor}. Abrir a ficha">
          <div class="hud-mini-carta">${renderCard(carta, { decorative: true })}</div>
          <span class="hud-mini-nome">${carta.nome}</span>
          <span class="hud-mini-valor"><span class="hud-mini-pos">${i + 1}º</span><b style="color:${dados.cor}">${valor}</b> ${dados.rotulo}</span>
        </div>`;
  });
  return html;
}

// Os três pilares do altar. Ao passar o mouse (ou tocar), abre um painel
// com as 3 lendas mais fortes naquele atributo e um gráfico de todas.
function iniciarHudPilares(todasAsCartas) {
  const pilares = document.querySelectorAll(".altar-column");
  const hud = document.getElementById("nexus-hud-modal");
  if (!hud || pilares.length === 0) return;

  const campos = {
    protocolo: document.getElementById("hud-protocol-id"),
    titulo: document.getElementById("hud-title"),
    descricao: document.getElementById("hud-description"),
    top3: document.getElementById("hud-top3"),
    barras: document.getElementById("hud-bars"),
    media: document.getElementById("hud-media"),
    total: document.getElementById("hud-total"),
    graficoTitulo: document.getElementById("hud-graph-titulo"),
    link: document.getElementById("hud-link-manual"),
  };
  const selos = document.querySelectorAll(".hud-badge");
  const temMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Os números saem das próprias cartas. O Olvido não tem atributos, então fica de fora.
  const jogaveis = todasAsCartas.filter((carta) => Number.isFinite(carta.ataque));
  const estatisticas = {};
  for (const tipo in PROTOCOLOS) {
    estatisticas[tipo] = calcularEstatisticas(jogaveis, PROTOCOLOS[tipo].attr);
  }

  function abrirFicha(carta, origem, lista) {
    carregarLendas().catch(() => {});
    obterFicha().abrir(carta, origem, {
      obterLista: () => lista,
      obterOrigem: (c) => campos.top3.querySelector(`[data-id="${c.id}"] .card-container`),
    });
  }

  // A carta de verdade tem 315 px de largura. A variável --z encolhe ela até o tamanho da miniatura.
  function ajustarMini() {
    const mini = campos.top3.querySelector(".hud-mini");
    if (mini && mini.clientWidth) campos.top3.style.setProperty("--z", (mini.clientWidth / 315).toFixed(4));
  }
  window.addEventListener("resize", ajustarMini);

  let tipoAtual = null;
  function preencher(tipo) {
    const dados = PROTOCOLOS[tipo];
    const est = estatisticas[tipo];
    campos.protocolo.textContent = dados.protocol;
    campos.titulo.textContent = dados.title;
    campos.descricao.textContent = dados.desc;
    campos.link.textContent = dados.manual;
    campos.graficoTitulo.textContent = `${dados.rotulo} DAS ${jogaveis.length} LENDAS`;
    campos.media.textContent = `MÉDIA: ${est.media.toFixed(1).replace(".", ",")}`;
    const primeira = est.top[0];
    campos.total.textContent = `TOP: ${primeira ? primeira[dados.attr] : "–"}`;
    campos.barras.innerHTML = htmlGrafico(est, dados.cor);
    campos.top3.innerHTML = htmlTop3(est.top, dados);

    // Clique ou Enter numa mini carta abre a ficha dela
    for (const mini of campos.top3.querySelectorAll(".hud-mini")) {
      const carta = est.top.find((c) => c.id === mini.dataset.id);
      const abrir = () => abrirFicha(carta, mini.querySelector(".card-container"), est.top);
      mini.addEventListener("click", abrir);
      mini.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          abrir();
        }
      });
    }
    ajustarMini();
    requestAnimationFrame(() => ajustarNomes(campos.top3));
    tipoAtual = tipo;
  }

  let timerFechar = null;
  function ativar(tipo) {
    if (!PROTOCOLOS[tipo]) return;
    clearTimeout(timerFechar);
    const dados = PROTOCOLOS[tipo];
    if (tipoAtual !== tipo) preencher(tipo);
    hud.style.borderColor = dados.borderColor;
    hud.style.boxShadow = dados.glow;
    for (const selo of selos) {
      selo.classList.toggle("active", selo.dataset.type === tipo);
    }
    hud.classList.add("active");
  }

  function desativar() {
    clearTimeout(timerFechar);
    hud.classList.remove("active");
  }
  // Fecha com um pequeno atraso: dá tempo de levar o mouse até as mini cartas dentro do painel.
  function desativarComAtraso() {
    clearTimeout(timerFechar);
    timerFechar = setTimeout(desativar, 350);
  }
  hud.addEventListener("mouseenter", () => clearTimeout(timerFechar));
  hud.addEventListener("mouseleave", () => { if (temMouse) desativarComAtraso(); });
  hud.addEventListener("focusin", () => clearTimeout(timerFechar));

  for (const pilar of pilares) {
    const tipo = pilar.dataset.type;
    pilar.tabIndex = 0;
    pilar.setAttribute("role", "button");
    pilar.setAttribute("aria-label", `Ver o protocolo ${tipo.toUpperCase()}`);

    // Hover só onde existe mouse; no toque o clique faz o trabalho.
    if (temMouse) {
      pilar.addEventListener("mouseenter", () => ativar(tipo));
      pilar.addEventListener("mouseleave", desativarComAtraso);
    }
    pilar.addEventListener("click", (e) => {
      e.stopPropagation();
      ativar(tipo);
    });
    pilar.addEventListener("focus", () => ativar(tipo));
    pilar.addEventListener("blur", desativarComAtraso);
    pilar.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        ativar(tipo);
      }
    });
  }

  const botaoFechar = hud.querySelector(".hud-close");
  if (botaoFechar) botaoFechar.addEventListener("click", desativar);

  document.addEventListener("click", (e) => {
    if (!hud.contains(e.target)) desativar();
  });

  // No celular o painel é fixo na tela: fecha sozinho quando o altar sai de vista
  // (rolagem para outra seção ou troca de aba).
  const cena = document.querySelector(".altar-nexus-scene");
  if (cena && "IntersectionObserver" in window) {
    const observador = new IntersectionObserver((entradas) => {
      if (!entradas[0].isIntersecting) desativar();
    });
    observador.observe(cena);
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") desativar();
  });
}

export function initHomeCarousel(todasAsCartas) {
  const track = document.getElementById("home-carousel-track");
  if (!track) return;

  const lendas = todasAsCartas.filter((carta) => IDS_PANTEAO.includes(carta.id));

  // Truque do carrossel infinito: as cartas entram DUAS vezes seguidas.
  // O CSS anda até a metade (-50%) e recomeça; como a segunda metade é igual
  // à primeira, ninguém percebe o salto.
  // São cartas só de enfeite (decorative): o Tab e os leitores de tela pulam elas.
  let html = "";
  for (const carta of lendas) {
    html += renderCard(carta, { decorative: true });
  }
  track.innerHTML = html + html;
  ajustarNomesDepois(track);

  const zoom = createCardZoom(track);
  for (const card of track.querySelectorAll(".card-container")) {
    attachCardInteractions(card, { flip: false, onActivate: zoom.open });
  }

  // Toque não tem "hover": pausa a esteira enquanto o dedo está no carrossel.
  const viewport = track.parentElement;
  viewport.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") track.style.animationPlayState = "paused";
  });
  function soltar(e) {
    if (e.pointerType !== "mouse" && !zoom.isOpen()) track.style.animationPlayState = "";
  }
  viewport.addEventListener("pointerup", soltar);
  viewport.addEventListener("pointercancel", soltar);
}

// As duas cartas que se chocam na apresentação: Mario x Sephiroth.
export function initHomeDuelo(todasAsCartas) {
  const palco = document.getElementById("home-duelo");
  if (!palco) return;
  const esq = todasAsCartas.find((c) => c.id === "SD-012"); // Mario
  const dir = todasAsCartas.find((c) => c.id === "SD-032"); // Sephiroth
  if (!esq || !dir) return;

  palco.innerHTML =
    `<div class="duelo-lado esq">${renderCard(esq, { decorative: true })}</div>` +
    `<div class="duelo-lado dir">${renderCard(dir, { decorative: true })}</div>` +
    `<span class="duelo-faisca">SMASH!</span>`;

  ajustarNomesDepois(palco);
  for (const card of palco.querySelectorAll(".card-container")) {
    attachCardInteractions(card, { flip: false });
  }
}
