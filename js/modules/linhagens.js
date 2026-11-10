// Aba "Linhagens"
// Mostra uma linhagem (classe) por vez: quem ela é, como joga, os pontos fortes
// e o critério para uma lenda entrar nela. As cartas ficam na aba Códice
// (o botão no fim do painel leva para lá, já filtrado).
// Embaixo, uma tabela compara o bônus das seis linhagens.

import { classes, ORDEM_CLASSES, varsAura } from "../classes.js";
import { esc, reduzirMovimento } from "../utils.js";

const CHAVE = "smashdeck:linhagens:ultima"; // localStorage: última linhagem vista
const COR_TEXTO_ESCURO = "10, 14, 23";

// Lembrar a última linhagem vista (try/catch: o localStorage pode falhar na navegação privada).
function linhagemLembrada() {
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}

function lembrarLinhagem(chave) {
  try {
    localStorage.setItem(CHAVE, chave);
  } catch {
    // sem localStorage: tudo bem
  }
}

export function initLinhagens(cartas) {
  const tela = document.getElementById("linhagens");
  const runas = document.getElementById("linha-runas");
  const painel = document.getElementById("linha-painel");
  if (!tela || !runas || !painel) return;

  let montada = false;
  let atual = null; // linhagem aberta agora
  let pedidaAntes = null; // linhagem pedida pelo Códice antes da aba ser montada

  // Separa as cartas por classe: { soberano: [...], trevas: [...], ... }
  // O Olvido não tem classe (iconeClasse vazio), então não entra.
  const cartasDaClasse = {};
  for (const chave of ORDEM_CLASSES) {
    cartasDaClasse[chave] = cartas.filter((c) => c.classeCSS === chave && c.iconeClasse);
  }

  // ---------- Runas: os botões das seis linhagens ----------

  function montarRunas() {
    let html = "";
    for (const chave of ORDEM_CLASSES) {
      const classe = classes[chave];
      html += `<button type="button" class="runa" data-classe="${chave}" aria-pressed="false" aria-label="${esc(classe.nome)} (${cartasDaClasse[chave].length} lendas)">
        <span class="runa-disco"><img src="${esc(classe.pin)}" alt="" decoding="async"></span><span class="runa-nome">${esc(classe.nome)}</span>
      </button>`;
    }
    runas.innerHTML = html;

    runas.addEventListener("click", (e) => {
      const botao = e.target.closest(".runa");
      if (botao) escolher(botao.dataset.classe);
    });

    // Setas ← e → passam de uma linhagem para a outra, dando a volta no fim.
    runas.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const passo = e.key === "ArrowRight" ? 1 : -1;
      const total = ORDEM_CLASSES.length;
      const posicao = (ORDEM_CLASSES.indexOf(atual) + passo + total) % total;
      const chave = ORDEM_CLASSES[posicao];
      escolher(chave);
      runas.querySelector(`[data-classe="${chave}"]`).focus();
      e.preventDefault();
    });
  }

  // ---------- HTML do painel da linhagem ----------

  function htmlPainel(chave) {
    const classe = classes[chave];
    const quantas = cartasDaClasse[chave].length;

    // classe.pontos é uma lista de pares: [título, descrição]
    let pontos = "";
    for (const ponto of classe.pontos) {
      pontos += `<li><strong>${esc(ponto[0])}</strong><span>${esc(ponto[1])}</span></li>`;
    }

    // Topo: selo, nome, subtítulo, frase de destaque e o bônus
    // Corpo: texto à esquerda e pontos fortes à direita (no celular, um embaixo do outro)
    // Fim: critério de seleção e o botão para ver as cartas no Códice
    return `<article class="linha-ficha" style="${varsAura(chave)}">
      <header class="linha-topo">
        <img src="${esc(classe.pin)}" alt="" class="linha-pin" decoding="async">
        <div class="linha-nome">
          <h2 class="painel-titulo">${esc(classe.nome)}</h2>
          <p class="linha-sub">${esc(classe.subtitulo)}</p>
          <p class="linha-destaque">${esc(classe.destaque)}</p>
        </div>
        <p class="classe-bonus"><span>Bônus</span> ${esc(classe.bonus)}</p>
      </header>

      <div class="linha-corpo">
        <div class="linha-principal">
          <p class="linha-identidade">${esc(classe.identidade)}</p>
          <h3 class="linha-titulo">Como joga</h3>
          <p>${esc(classe.comentario)}</p>
        </div>
        <aside class="linha-lateral">
          <h3 class="linha-titulo">Pontos fortes</h3>
          <ul class="linha-pontos">${pontos}</ul>
        </aside>
      </div>

      <section class="linha-criterio">
        <h3 class="linha-titulo">Critério de seleção</h3>
        <p>${esc(classe.criterio)}</p>
      </section>

      <footer class="linha-acoes">
        <button type="button" class="cta-primario" data-codice="${chave}">Ver as ${quantas} lendas no Códice →</button>
      </footer>
    </article>`;
  }

  // Tabela com o bônus das seis linhagens lado a lado.
  function htmlComparativo() {
    // Sem bônus aparece um traço; com bônus, "+10".
    function celula(valor) {
      return valor ? `+${valor}` : "—";
    }

    let linhas = "";
    for (const chave of ORDEM_CLASSES) {
      const classe = classes[chave];
      let extra = "";
      if (classe.regraForte) extra = ` <small>(+${classe.regraForte.ataque} se o oponente for forte)</small>`;

      linhas += `<tr data-classe="${chave}" style="${varsAura(chave)}">
        <th scope="row"><img src="${esc(classe.pin)}" alt="" loading="lazy"> ${esc(classe.nome)}</th>
        <td>${celula(classe.regra.ataque)}${extra}</td><td>${celula(classe.regra.defesa)}</td><td>${celula(classe.regra.tecnica)}</td></tr>`;
    }

    return `<section class="comparativo" aria-labelledby="comp-titulo">
      <h2 class="painel-titulo" id="comp-titulo">As seis linhagens lado a lado</h2>
      <p class="linha-ajuda">Bônus que cada linhagem concede conforme o atributo escolhido para o duelo.</p>
      <div class="comparativo-rolagem"><table>
        <thead><tr><th scope="col">Linhagem</th><th scope="col">ATK</th><th scope="col">DEF</th><th scope="col">TECH</th></tr></thead>
        <tbody>${linhas}</tbody></table></div>
    </section>`;
  }

  // ---------- Trocar de linhagem ----------

  function escolher(chave, animar = true) {
    if (!classes[chave]) chave = ORDEM_CLASSES[0];
    atual = chave;
    lembrarLinhagem(chave);

    for (const botao of runas.querySelectorAll(".runa")) {
      botao.setAttribute("aria-pressed", String(botao.dataset.classe === chave));
    }

    // Destaca a linha da tabela correspondente
    for (const linha of document.querySelectorAll("#linha-comparativo tr[data-classe]")) {
      if (linha.dataset.classe === chave) linha.setAttribute("aria-current", "true");
      else linha.removeAttribute("aria-current");
    }

    // Cores da aba
    const classe = classes[chave];
    tela.style.setProperty("--aura-rgb", classe.rgb);
    tela.style.setProperty("--aura-txt", classe.rgbTexto || classe.rgb);
    tela.style.setProperty("--aura-on", classe.rgbSobre || COR_TEXTO_ESCURO);

    painel.innerHTML = htmlPainel(chave);

    // Reinicia a animação de troca: tira a classe, força o navegador a perceber e coloca de novo.
    if (animar && !reduzirMovimento()) {
      painel.classList.remove("trocando");
      void painel.offsetWidth;
      painel.classList.add("trocando");
    }

  }

  // ---------- Montagem (primeira visita à aba) ----------

  function montar() {
    if (montada) return;
    montada = true;
    montarRunas();

    const comparativo = document.createElement("div");
    comparativo.id = "linha-comparativo";
    comparativo.innerHTML = htmlComparativo();
    painel.after(comparativo);

    // Botão "Ver todas no Códice"
    painel.addEventListener("click", (e) => {
      const botao = e.target.closest("[data-codice]");
      if (!botao) return;
      document.dispatchEvent(new CustomEvent("abrir-codice", { detail: { classe: botao.dataset.codice } }));
      const linkCodice = document.querySelector('.nav-links a[data-target="codice"]');
      if (linkCodice) linkCodice.click();
    });

    // Abre a linhagem pedida pelo Códice, ou a última vista, ou a primeira.
    let inicial = pedidaAntes !== null ? pedidaAntes : linhagemLembrada();
    if (!ORDEM_CLASSES.includes(inicial)) inicial = ORDEM_CLASSES[0];
    escolher(inicial, false);

  }

  // O Códice pede uma linhagem ("Entender esta linhagem").
  // Se a aba ainda não foi montada, guardo o pedido para depois.
  document.addEventListener("abrir-linhagem", (e) => {
    const chave = e.detail.classe;
    if (montada) escolher(chave);
    else pedidaAntes = chave;
  });

  document.addEventListener("screenchange", (e) => {
    if (e.detail.id === "linhagens") montar();
  });
}
