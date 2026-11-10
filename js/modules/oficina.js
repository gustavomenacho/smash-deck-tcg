// Oficina do Nexo (aba Relicário)
// Vitrine de IDEIAS de produtos do Smash Deck. Nada aqui está à venda:
// o aviso aparece no selo do topo da aba e na janela de cada produto.
// As fotos ficam em imagens/merch/ (em .webp, bem mais leves que os .jpg originais).
//
// A aba tem quatro partes:
//   1. O Tapete de Batalha: foto + mapa das zonas do jogo
//   2. Os pins das linhagens: uma vitrine com a foto grande e os 6 selos para trocar
//   3. Proteção e Organização: tubo e deck box
//   4. Colecionáveis: artbook, stickers e standees
// Nas partes 3 e 4, o card inteiro é clicável e abre a janela com os detalhes.

import { classes, ORDEM_CLASSES } from "../classes.js";
import { esc, reduzirMovimento } from "../utils.js";

const PASTA = "imagens/merch/";

// Frase de "Detalhes da Forja" de cada pin
const FORJA = {
  soberano: "Cunhado em ouro pelos primeiros arquitetos da indústria. Quem o veste carrega a coroa dos pioneiros.",
  trevas: "Forjado nas brasas do conflito. Marca quem sabe que todo herói precisa de um chefe final.",
  combate: "Temperado em mil treinos. Identifica quem enxerga o golpe antes de ele acontecer.",
  sentinela: "Moldado em aço de bastião. Para quem não cai e não deixa ninguém passar.",
  crime: "Cunhado às escondidas, em um beco sem nome. Para quem sempre acha a brecha na muralha dos poderosos.",
  caos: "Forjado nas chamas do Caos: identifica os mestres da imprevisibilidade.",
};

// ---------- Os produtos ----------
// img: foto do card | imgModal: foto da janela (se for diferente) | img2: folha técnica

const ITENS_PROTECAO = [
  {
    id: "tubo",
    nome: "Tubo do Tapete de Batalha",
    sub: "Transporte seguro do playmat",
    rgb: "245, 205, 3",
    img: "tubo-recorte.webp", // recorte da foto da mesa, só com o tubo
    imgModal: "tapete-e-tubo-mesa.webp",
    desc: "Tubo rígido personalizado para levar o tapete de batalha sem amassar nem dobrar, com o logo do Smash Deck.",
    forja: "Feito para a viagem entre uma Arena e outra.",
  },
  {
    id: "deckbox",
    nome: "Deck Box de Madeira ou Couro",
    sub: "Rústica, gravada a laser",
    rgb: "255, 140, 60",
    img: "deck-box-render.webp",
    img2: "deck-box-folha-tecnica.webp",
    desc: "Caixa para guardar o baralho de 50 cartas, em madeira ou couro, com o logo ou uma ilustração gravada a laser.",
    forja: "Um cofre pequeno para o seu baralho inteiro.",
  },
];

const ITENS_COLECAO = [
  {
    id: "artbook",
    nome: "Artbook das 103 Lendas",
    sub: "Livro de arte",
    rgb: "180, 110, 255",
    img: "artbook-render.webp",
    desc: "Livro de arte com as ilustrações das 103 lendas em tamanho grande e um trecho da história de cada uma.",
    forja: "Cada página, uma lenda.",
  },
  {
    id: "stickers",
    nome: "Cartelas de Stickers",
    sub: "Por linhagem ou raridade",
    rgb: "150, 200, 80",
    img: "stickers-render.webp",
    desc: "Cartelas de adesivos separadas por linhagem, ou packs com as lendas mais icônicas.",
    forja: "Leve o Confluente no notebook.",
  },
  {
    id: "standees",
    nome: "Standees de Acrílico",
    sub: "Para a mesa e a estante",
    rgb: "70, 160, 255",
    img: "standees-render.webp",
    desc: "Pequenas figuras montáveis em acrílico das lendas mais populares, para deixar na mesa de jogo ou na estante.",
    forja: "A lenda de pé, ao lado do tabuleiro.",
  },
];

const ITEM_TAPETE = {
  id: "tapete",
  nome: "Tapete de Batalha — Arena do Nexo",
  sub: "Playmat",
  rgb: "245, 205, 3",
  img: "tapete-e-tubo-conceito.webp",
  desc: "Tapete de mesa com a Arena, o Baralho, o Relicário de 5 prêmios e o Abismo de cada Jogador marcados. Cabe no tubo do tapete.",
  forja: "Onde tudo acontece.",
};

// Todos os produtos que abrem a janela, para achar pelo id.
const TODOS = ITENS_PROTECAO.concat(ITENS_COLECAO, [ITEM_TAPETE]);

// As zonas do tapete, com a explicação que aparece ao lado do mapa.
const ZONAS = [
  { nome: "Arena", texto: "O centro do tapete, onde as duas lendas se enfrentam." },
  { nome: "Baralho", texto: "As 40 cartas restantes, viradas para baixo." },
  { nome: "Relicário", texto: "5 cartas do seu baralho, guardadas como prêmios. Quem vence um duelo resgata 1." },
  { nome: "Abismo", texto: "Para onde vão as lendas derrotadas." },
  { nome: "Mão", texto: "5 cartas, fora do tapete." },
];

// ---------- 1. O Tapete de Batalha ----------

// "quantos" espaços de carta. Cada um pisca um pouco depois do anterior (--d).
function espacosDeCarta(quantos) {
  let html = "";
  for (let i = 0; i < quantos; i++) {
    html += `<i class="pm-slot" style="--d:${i * 0.25}s"></i>`;
  }
  return html;
}

// O lado de um jogador no mapa: baralho, relicário e abismo.
function ladoDoJogador(nome) {
  return `
    <div class="pm-lado">
      <div class="pm-zona"><span>Baralho</span><i class="pm-slot"></i></div>
      <div class="pm-zona"><span>Relicário</span><div class="pm-fila">${espacosDeCarta(5)}</div></div>
      <div class="pm-zona"><span>Abismo</span><i class="pm-slot pm-slot-abismo" style="--d:.6s"></i></div>
      <b class="pm-nome">${nome}</b>
    </div>`;
}

function htmlTapete() {
  let legenda = "";
  for (const zona of ZONAS) {
    legenda += `<li><b>${zona.nome}</b><span>${zona.texto}</span></li>`;
  }

  return `
    <div class="of-tapete">
      <button type="button" class="of-tapete-foto" data-abrir="tapete" aria-label="Ver o Tapete de Batalha em detalhe">
        <img src="${PASTA}${ITEM_TAPETE.img}" alt="Tapete de Batalha aberto sobre a mesa, com as zonas de jogo marcadas e o tubo ao lado" loading="lazy" decoding="async">
      </button>
      <div class="of-tapete-mapa">
        <h3>Mapa das zonas</h3>
        <div class="pm-mesa" aria-hidden="true">
          ${ladoDoJogador("Jogador 1")}
          <div class="pm-arena"><span>Arena</span><div class="pm-fila"><i class="pm-slot pm-slot-arena"></i><i class="pm-slot pm-slot-arena" style="--d:.5s"></i></div></div>
          ${ladoDoJogador("Jogador 2")}
        </div>
        <ul class="of-zonas">${legenda}</ul>
      </div>
    </div>`;
}

// ---------- 2. Vitrine dos pins ----------

function htmlVitrinePins() {
  let selos = "";
  for (const chave of ORDEM_CLASSES) {
    const classe = classes[chave];
    selos += `<button type="button" class="of-pin-selo" data-pin="${chave}" aria-pressed="false" style="--c:${classe.rgb}">
        <img src="${esc(classe.pin)}" alt="" decoding="async">
        <span>${esc(classe.nome)}</span>
      </button>`;
  }

  return `
    <div class="of-vitrine">
      <figure class="of-vitrine-foto"><img src="" alt="" decoding="async"></figure>
      <div class="of-vitrine-texto">
        <p class="of-vitrine-rotulo">Pin de esmalte</p>
        <h3 class="of-vitrine-nome"></h3>
        <p class="of-vitrine-sub"></p>
        <p class="of-vitrine-forja"></p>
        <p class="of-vitrine-desc"></p>
      </div>
      <div class="of-pin-selos" role="group" aria-label="Escolher a linhagem">${selos}</div>
    </div>`;
}

// ---------- 3 e 4. Cards de produto ----------

// O card inteiro é clicável: o botão fica no título e uma "capa" invisível
// dele (::after no CSS) cobre o card todo. Assim continua sendo um botão de verdade
// (dá para usar com Tab e Enter) e o leitor de tela lê só o nome do produto.
function cartaProduto(it) {
  return `
    <article class="of-card" style="--c:${it.rgb}">
      <div class="of-arte"><img src="${PASTA}${it.img}" alt="" loading="lazy" decoding="async"></div>
      <div class="of-info">
        <h3><button type="button" class="of-abrir" data-abrir="${esc(it.id)}">${esc(it.nome)}</button></h3>
        <p class="of-sub">${esc(it.sub)}</p>
        <span class="of-ver" aria-hidden="true">Ver detalhes →</span>
      </div>
    </article>`;
}

function htmlCartas(lista) {
  let html = "";
  for (const item of lista) html += cartaProduto(item);
  return html;
}

// ---------- Janela de detalhes ----------

function htmlModal(it) {
  const imagem = it.imgModal || it.img;

  let folhaTecnica = "";
  if (it.img2) {
    folhaTecnica = `<figure class="of-modal-folha"><img src="${PASTA}${it.img2}" alt="Folha técnica de ${esc(it.nome)}: vistas, diagrama explodido e notas de materiais" loading="lazy"><figcaption>Folha técnica (conceito)</figcaption></figure>`;
  }

  return `
      <div class="of-modal-caixa" role="dialog" aria-modal="true" aria-labelledby="of-modal-t">
        <button type="button" class="of-modal-fechar" aria-label="Fechar">×</button>
        <div class="of-modal-arte"><img src="${PASTA}${imagem}" alt="${esc(it.nome)}"></div>
        <div class="of-modal-texto">
          <h3 id="of-modal-t">${esc(it.nome)}</h3>
          <p class="of-modal-sub">${esc(it.sub)}</p>
          <p>${esc(it.desc)}</p>
          <p class="of-modal-forja">${esc(it.forja)}</p>
          <p class="of-modal-nota">Conceito de produto do projeto de fã. Não foi produzido e não está à venda.</p>
        </div>
        ${folhaTecnica}
      </div>`;
}

export function initOficina() {
  const raiz = document.getElementById("oficina-conteudo");
  if (!raiz) return;

  raiz.innerHTML = `
    <section class="of-grupo" aria-labelledby="of-g1">
      <header class="of-grupo-cab"><h2 id="of-g1">O Tapete de Batalha</h2><p>Onde tudo acontece: cada zona do jogo marcada na mesa.</p></header>
      ${htmlTapete()}
    </section>
    <section class="of-grupo" aria-labelledby="of-g2">
      <header class="of-grupo-cab"><h2 id="of-g2">Identificação das Linhagens</h2><p>Seis pins, um por linhagem. Vista a camisa do seu estilo de jogo.</p></header>
      ${htmlVitrinePins()}
    </section>
    <section class="of-grupo" aria-labelledby="of-g3">
      <header class="of-grupo-cab"><h2 id="of-g3">Proteção e Organização</h2><p>Para o baralho e o tapete chegarem inteiros à próxima partida.</p></header>
      <div class="of-grade of-grade-2">${htmlCartas(ITENS_PROTECAO)}</div>
    </section>
    <section class="of-grupo" aria-labelledby="of-g4">
      <header class="of-grupo-cab"><h2 id="of-g4">Colecionáveis das Lendas</h2><p>103 personagens rendem muito material.</p></header>
      <div class="of-grade of-grade-3">${htmlCartas(ITENS_COLECAO)}</div>
    </section>`;

  // ---------- Vitrine: trocar de pin ----------
  const vitrine = raiz.querySelector(".of-vitrine");
  const fotoPin = vitrine.querySelector(".of-vitrine-foto img");

  function mostrarPin(chave) {
    const classe = classes[chave];
    vitrine.style.setProperty("--c", classe.rgb);
    vitrine.style.setProperty("--c-txt", classe.rgbTexto || classe.rgb);
    fotoPin.src = `${PASTA}pin-${chave}.webp`;
    fotoPin.alt = `Pin da linhagem ${classe.nome} sobre uma bancada de forja`;
    vitrine.querySelector(".of-vitrine-nome").textContent = classe.nome;
    vitrine.querySelector(".of-vitrine-sub").textContent = classe.subtitulo;
    vitrine.querySelector(".of-vitrine-forja").textContent = FORJA[chave];
    vitrine.querySelector(".of-vitrine-desc").textContent =
      `Pin de esmalte com o símbolo da linhagem, para a mochila e para o deck. Bônus da linhagem no jogo: ${classe.bonus}.`;

    for (const selo of vitrine.querySelectorAll(".of-pin-selo")) {
      selo.setAttribute("aria-pressed", String(selo.dataset.pin === chave));
    }
  }

  vitrine.addEventListener("click", (e) => {
    const selo = e.target.closest(".of-pin-selo");
    if (selo) mostrarPin(selo.dataset.pin);
  });
  mostrarPin(ORDEM_CLASSES[0]);

  // ---------- Animação de entrada dos blocos ----------
  const blocos = raiz.querySelectorAll(".of-card, .of-tapete, .of-vitrine");
  if (!("IntersectionObserver" in window) || reduzirMovimento()) {
    for (const bloco of blocos) bloco.classList.add("vis"); // sem animação: mostra tudo
  } else {
    // Em cada grade, um card aparece 100 ms depois do outro
    for (const grade of raiz.querySelectorAll(".of-grade")) {
      grade.querySelectorAll(".of-card").forEach((card, i) => card.style.setProperty("--atraso", `${i * 100}ms`));
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          entrada.target.classList.add("vis");
          observador.unobserve(entrada.target); // só anima uma vez
        }
      },
      { threshold: 0.12 }, // 12% do bloco visível já conta
    );
    for (const bloco of blocos) observador.observe(bloco);
  }

  // ---------- Abrir a janela (um ouvinte só para a aba toda) ----------
  raiz.addEventListener("click", (e) => {
    const botao = e.target.closest("[data-abrir]");
    if (!botao) return;
    const item = TODOS.find((t) => t.id === botao.dataset.abrir);
    abrirModal(item, botao);
  });

  let modal = null;
  function abrirModal(it, origem) {
    if (!it || modal) return;
    modal = document.createElement("div");
    modal.className = "of-modal";
    modal.style.setProperty("--c", it.rgb);
    modal.innerHTML = htmlModal(it);
    document.body.appendChild(modal);

    function fechar() {
      document.removeEventListener("keydown", tecla);
      modal.remove();
      modal = null;
      if (origem) origem.focus(); // o foco volta para quem abriu
    }
    // Esc fecha. Tab fica preso no botão de fechar (é o único botão da janela).
    function tecla(ev) {
      if (ev.key === "Escape") fechar();
      if (ev.key === "Tab") {
        ev.preventDefault();
        modal.querySelector(".of-modal-fechar").focus();
      }
    }
    // Clicar fora da caixa ou no × fecha.
    modal.addEventListener("click", (ev) => {
      if (ev.target === modal || ev.target.closest(".of-modal-fechar")) fechar();
    });
    document.addEventListener("keydown", tecla);
    modal.querySelector(".of-modal-fechar").focus();
  }
}
