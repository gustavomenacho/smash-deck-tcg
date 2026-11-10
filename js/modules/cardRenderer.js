// Monta o HTML de uma carta.
// Todas as abas usam esta mesma função, então a carta é igual no site inteiro.
import { esc } from "../utils.js";

const PLACEHOLDER = "imagens/placeholder.jpg";
const LOGO_VERSO = "imagens/marca/logo-smash-deck.webp";
const ICONES_STATS = {
  atk: "imagens/atributos/icone-ataque.webp",
  def: "imagens/atributos/icone-defesa.webp",
  tech: "imagens/atributos/icone-tecnica.webp",
};
// Nomes com mais letras que isso ganham uma fonte menor
const LIMITE_NOME_MEDIO = 11;
const LIMITE_NOME_LONGO = 15;

// Os dois ícones do canto (classe e prioridade).
// O Olvido não tem classe nem prioridade, então fica sem eles.
function renderHud(carta) {
  if (!carta.iconeClasse) return "";
  return `
    <div class="hud-container">
      <div class="hud-glass"></div>
      <div class="hud-border"></div>
      <div class="pins-container">
        <img src="${esc(carta.iconeClasse)}" class="icon-img pin-class" alt="" decoding="async">
        <img src="${esc(carta.imagemPrioridade)}" class="icon-img pin-priority" alt="" decoding="async">
      </div>
    </div>`;
}

// Uma caixinha de atributo (ATK, DEF ou TECH)
function renderStat(tipo, rotulo, valor) {
  return `
    <div class="stat-box ${tipo}" aria-label="${rotulo}: ${esc(valor)}">
      <img src="${ICONES_STATS[tipo]}" class="stat-icon" alt=""> ${esc(valor)}
    </div>`;
}

// carta: um item de js/cartas.js
// opcoes.id: id do elemento (não usar quando a mesma carta aparece duas vezes na página)
// opcoes.decorative: true = carta só de enfeite, que o Tab e os leitores de tela ignoram
export function renderCard(carta, opcoes = {}) {
  const id = opcoes.id || "";
  const decorative = opcoes.decorative || false;

  let tamanhoNome = "";
  if (carta.nome.length > LIMITE_NOME_LONGO) tamanhoNome = "nome-longo";
  else if (carta.nome.length > LIMITE_NOME_MEDIO) tamanhoNome = "nome-medio";

  // Rodapé: créditos e dono da marca, separados por " / " (pula o que estiver vazio)
  const partesRodape = [];
  if (carta.creditos) partesRodape.push(esc(carta.creditos));
  if (carta.dono) partesRodape.push(esc(carta.dono));
  const rodape = partesRodape.join(" / ");

  // Carta normal: dá para focar com Tab e o leitor de tela lê o nome.
  let atributos = `role="group" aria-roledescription="carta" aria-label="${esc(carta.nome)}" tabindex="0"`;
  if (decorative) atributos = 'aria-hidden="true"';

  return `
  <div class="card-container" ${id ? `id="${esc(id)}"` : ""} data-nome="${esc(carta.nome)}" ${atributos}>
    <div class="card-inner">
      <div class="face card-front ${esc(carta.classeCSS)}">
        ${renderHud(carta)}
        <header class="card-header">
          <h2 class="card-name ${tamanhoNome}">${esc(carta.nome)}</h2>
        </header>
        <div class="art-window">
          <img src="${esc(carta.imagem)}" alt="${decorative ? "" : `Arte de ${esc(carta.nome)}`}" class="card-art"
               loading="lazy" decoding="async"
               style="object-position: ${esc(carta.posicaoImagem)};
                      transform: scale(${Number(carta.zoomImagem) || 1})
                                 translateX(${esc(carta.deslocamentoX || "0px")})
                                 translateY(${esc(carta.deslocamentoY || "0px")});">
        </div>
        <div class="stats-container">
          ${renderStat("atk", "Ataque", carta.ataque)}
          ${renderStat("def", "Defesa", carta.defesa)}
          ${renderStat("tech", "Técnica", carta.tecnica)}
        </div>
        <section class="grimorio">
          <h3 class="skill-name">${esc(carta.habilidadeNome)}</h3>
          <p class="skill-description">${esc(carta.habilidadeDesc)}</p>
          <span class="details-icon">
            <img src="imagens/grimorios/livro-do-grimorio.png" class="grimorio-icon" alt="">
          </span>
        </section>
        <footer class="card-footer">
          ©2026 Smash Deck TCG / ${rodape}
          <span class="footer-id">• ${esc(carta.id)}</span>
        </footer>
      </div>
      <div class="face card-back">
        <img src="${LOGO_VERSO}" class="logo-verso" alt="">
      </div>
    </div>
  </div>`;
}

// Se uma imagem não carregar: a arte da carta vira uma imagem reserva
// (só uma tentativa, para não entrar em loop) e os ícones do canto somem.
export function installImageFallbacks() {
  document.addEventListener(
    "error",
    (evento) => {
      const img = evento.target;
      if (!(img instanceof HTMLImageElement)) return;

      if (img.classList.contains("card-art")) {
        if (img.dataset.fallback) return;
        img.dataset.fallback = "1";
        img.src = PLACEHOLDER;
      } else if (img.closest(".pins-container")) {
        img.style.visibility = "hidden";
      }
    },
    true, // o erro de imagem não "sobe" até o document; com true eu escuto na descida (captura)
  );
}

// Diminui a fonte do nome da carta até ele não encostar no ícone da classe.
// Só funciona em cartas visíveis (precisa medir). Por isso é chamada de novo
// quando as fontes terminam de carregar: a fonte muda a largura do texto.
export function ajustarNomes(raiz = document) {
  for (const frente of raiz.querySelectorAll(".card-front")) {
    const nome = frente.querySelector(".card-name");
    const pin = frente.querySelector(".pin-class");
    if (!nome || !pin) continue;

    nome.style.fontSize = "";
    nome.style.letterSpacing = "";
    // A carta pode estar encolhida (carrossel), então meço a escala dela
    const escala = frente.getBoundingClientRect().width / frente.offsetWidth || 1;
    if (!frente.offsetWidth || frente.getBoundingClientRect().width === 0) continue; // carta escondida

    // O Range mede só o texto, e não a caixa inteira do título
    const intervalo = document.createRange();
    intervalo.selectNodeContents(nome);
    function folga() {
      const texto = intervalo.getBoundingClientRect();
      return (pin.getBoundingClientRect().left - texto.right) / escala;
    }

    let tamanho = parseFloat(getComputedStyle(nome).fontSize);
    const minimo = 11;
    while (folga() < 6 && tamanho > minimo) {
      tamanho -= 0.5;
      nome.style.fontSize = `${tamanho}px`;
    }
  }
}
