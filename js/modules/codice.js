// Aba "Códice das Lendas"
// Mostra as seis classes e a galeria com as 104 cartas.
// Dá para filtrar por classe (nos quadros das classes ou no menu), escolher um personagem,
// buscar pelo nome, ordenar (nome, ATK, DEF, TECH) e trocar entre grade e carrossel.
// Os filtros ficam no endereço do site (#codice?classe=trevas&ordem=atk),
// então dá para mandar o link já filtrado e o F5 não perde nada.
//
// As cartas são criadas uma vez só, na primeira visita à aba. Para filtrar,
// eu só escondo ou mostro cada carta (atributo hidden). Assim as imagens não
// são baixadas de novo e as cartas viradas continuam viradas.

import { renderCard, ajustarNomes } from "./cardRenderer.js";
import { attachCardInteractions } from "./cardInteractions.js";
import { classes, ORDEM_CLASSES, varsAura } from "../classes.js";
import { obterFicha, carregarLendas } from "./ficha.js";
import { esc, rolagem, quandoLivre, COR_PADRAO } from "../utils.js";

const CHAVE_VISTA = "smashdeck:codice:vista"; // nome usado no localStorage
const COR_TEXTO_ESCURO = "10, 14, 23";

// Deixa o texto pronto para comparar na busca: sem acentos, minúsculo e sem espaços nas pontas.
// "Pokémon " vira "pokemon".
function normalizar(texto) {
  if (texto === undefined || texto === null) return "";
  return String(texto)
    .normalize("NFD") // separa a letra do acento: "é" vira "e" + "´"
    .replace(/[̀-ͯ]/g, "") // e aqui os acentos soltos são apagados
    .toLowerCase()
    .trim();
}

// O Olvido não tem classe. Ele aparece só em "Todas" e na busca.
function chaveClasse(carta) {
  if (carta.iconeClasse) return carta.classeCSS;
  return "olvido";
}

// O site lembra se a pessoa prefere grade ou carrossel.
// O try/catch é porque na navegação privada o localStorage pode dar erro.
function lerVista() {
  try {
    if (localStorage.getItem(CHAVE_VISTA) === "carrossel") return "carrossel";
  } catch {
    // sem localStorage: usa a grade
  }
  return "grade";
}

function salvarVista(vista) {
  try {
    localStorage.setItem(CHAVE_VISTA, vista);
  } catch {
    // sem localStorage: tudo bem, só não lembra da escolha
  }
}

export function initCodice(cartas) {
  const tela = document.getElementById("codice");
  const container = document.getElementById("deck-container");
  if (!tela || !container) return;

  const busca = document.getElementById("codice-busca");
  const botoesVista = document.getElementById("codice-vista");
  const painel = document.getElementById("codice-painel");
  const contagem = document.getElementById("codice-contagem");
  const avisoVazio = document.getElementById("codice-vazio");
  const btnAnterior = document.getElementById("codice-anterior");
  const btnProxima = document.getElementById("codice-proxima");
  const btnLimpar = document.getElementById("codice-limpar");
  const filtroClasse = document.getElementById("filtro-classe");
  const filtroLenda = document.getElementById("filtro-lenda");
  const barra = document.getElementById("codice-controles");
  const filtroOrdem = document.getElementById("filtro-ordem");
  const btnTopo = document.getElementById("codice-topo");

  // O Olvido não é jogável, então vai para o fim da galeria.
  // Assim a primeira carta que a pessoa vê é uma lenda de verdade.
  const cartasEmOrdem = [];
  let olvido = null;
  for (const carta of cartas) {
    if (chaveClasse(carta) === "olvido") olvido = carta;
    else cartasEmOrdem.push(carta);
  }
  if (olvido) cartasEmOrdem.push(olvido);

  // O que está escolhido agora
  let classeEscolhida = "todas";
  let textoBusca = "";
  let lendaEscolhida = ""; // id da carta escolhida no menu de personagem ("" = todas)
  let vistaAtual = lerVista();
  let ordemAtual = "numero"; // numero | nome | atk | def | tech

  // Quantas cartas cada classe tem, por exemplo { soberano: 17, trevas: 17, ... }
  const quantidade = {};
  for (const carta of cartas) {
    const chave = chaveClasse(carta);
    quantidade[chave] = (quantidade[chave] || 0) + 1;
  }

  let itens = []; // uma entrada por carta: { carta, el, chave, texto }, na ordem da tela
  let itensOriginais = []; // as mesmas entradas, na ordem do número da carta
  let montado = false;

  // ---------- Menus de filtro (classe e personagem) ----------

  // Coloca as seis classes no primeiro menu.
  function montarMenuClasse() {
    for (const chave of ORDEM_CLASSES) {
      const opcao = document.createElement("option");
      opcao.value = chave;
      opcao.textContent = `${classes[chave].nome} (${quantidade[chave] || 0})`;
      filtroClasse.appendChild(opcao);
    }

    filtroClasse.addEventListener("change", () => {
      if (filtroClasse.value === "") escolherClasse("todas");
      else escolherClasse(filtroClasse.value);
    });

    filtroLenda.addEventListener("change", () => {
      lendaEscolhida = filtroLenda.value;
      aplicarFiltros();
    });
  }

  // Preenche o segundo menu com os personagens da classe escolhida.
  // Sem classe escolhida, ele fica desabilitado (cinza).
  function preencherMenuLenda(chave) {
    filtroLenda.innerHTML = "";

    if (chave === "todas" || !classes[chave]) {
      filtroLenda.disabled = true;
      filtroLenda.innerHTML = '<option value="">Escolha a classe</option>';
      return;
    }

    filtroLenda.disabled = false;
    filtroLenda.innerHTML = `<option value="">Todas as lendas (${quantidade[chave]})</option>`;

    // Só as cartas dessa classe, em ordem alfabética
    const lendas = cartas.filter((carta) => chaveClasse(carta) === chave);
    lendas.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    for (const lenda of lendas) {
      const opcao = document.createElement("option");
      opcao.value = lenda.id;
      opcao.textContent = lenda.nome;
      filtroLenda.appendChild(opcao);
    }
  }

  // ---------- Painel acima das cartas ----------

  // Sem filtro: os seis quadros das classes.
  function painelGeral() {
    let quadros = "";
    for (const chave of ORDEM_CLASSES) {
      const classe = classes[chave];
      quadros += `<button type="button" class="classe-tile" data-classe="${chave}" style="${varsAura(chave)}">
        <img src="${esc(classe.pin)}" alt="" decoding="async" loading="lazy">
        <span class="classe-tile-nome">${esc(classe.nome)}</span>
        <span class="classe-tile-sub">${esc(classe.subtitulo)}</span>
        <span class="classe-tile-bonus">${esc(classe.bonus)}</span>
        <span class="classe-tile-qtd">${quantidade[chave] || 0} lendas</span>
      </button>`;
    }
    return `<h2 class="painel-titulo">As Seis Linhagens</h2>
      <p class="painel-intro">Cada lenda pertence a uma classe, e cada classe concede um bônus que muda a forma de jogar. Escolha uma linhagem para conhecê-la e ver apenas as suas cartas.</p>
      <div class="classe-tiles">${quadros}</div>`;
  }

  // Com uma classe escolhida: o resumo dela.
  function painelClasse(chave) {
    const classe = classes[chave];
    return `<article class="classe-ficha classe-resumo" style="${varsAura(chave)}">
      <img src="${esc(classe.pin)}" alt="" class="classe-ficha-pin" decoding="async">
      <div class="classe-resumo-texto">
        <h2 class="painel-titulo">${esc(classe.nome)}</h2>
        <p class="classe-ficha-sub">${esc(classe.subtitulo)}</p>
        <p class="classe-resumo-frase">${esc(classe.destaque)} <span>${esc(classe.resumo)}</span></p>
        <p class="classe-bonus"><span>Bônus</span> ${esc(classe.bonus)}</p>
      </div>
      <div class="classe-resumo-acoes">
        <button type="button" class="codice-btn codice-btn-destaque" data-linhagem="${chave}">Entender esta linhagem →</button>
        <button type="button" class="classe-voltar" data-classe="todas">← Todas as classes</button>
      </div>
    </article>`;
  }

  function atualizarPainel() {
    if (classeEscolhida === "todas" || !classes[classeEscolhida]) {
      painel.innerHTML = painelGeral();
    } else {
      painel.innerHTML = painelClasse(classeEscolhida);
    }
  }

  painel.addEventListener("click", (e) => {
    // "Entender esta linhagem": a explicação completa fica na aba Linhagens.
    const botaoLinhagem = e.target.closest("[data-linhagem]");
    if (botaoLinhagem) {
      document.dispatchEvent(new CustomEvent("abrir-linhagem", { detail: { classe: botaoLinhagem.dataset.linhagem } }));
      const linkLinhagens = document.querySelector('.nav-links a[data-target="linhagens"]');
      if (linkLinhagens) linkLinhagens.click();
      return;
    }

    // Um quadro de classe ou o "← Todas as classes"
    const botaoClasse = e.target.closest("[data-classe]");
    if (botaoClasse) {
      escolherClasse(botaoClasse.dataset.classe);
      painel.scrollIntoView({ behavior: rolagem(), block: "start" });
    }
  });

  // ---------- Filtros ----------

  function escolherClasse(chave) {
    classeEscolhida = chave;

    // Os dois menus acompanham a classe (ela pode vir dos quadros, do menu ou de outra aba)
    filtroClasse.value = chave === "todas" ? "" : chave;
    lendaEscolhida = "";
    preencherMenuLenda(chave);

    // A cor da aba muda conforme a classe. Em "Todas" volta para o azul padrão.
    const classe = classes[chave];
    if (classe) {
      tela.style.setProperty("--aura-rgb", classe.rgb);
      tela.style.setProperty("--aura-txt", classe.rgbTexto || classe.rgb);
      tela.style.setProperty("--aura-on", classe.rgbSobre || COR_TEXTO_ESCURO);
    } else {
      tela.style.setProperty("--aura-rgb", COR_PADRAO);
      tela.style.setProperty("--aura-txt", COR_PADRAO);
      tela.style.setProperty("--aura-on", COR_TEXTO_ESCURO);
    }

    atualizarPainel();
    aplicarFiltros();
  }

  function aplicarFiltros() {
    if (!montado) return;
    const procurado = normalizar(textoBusca);
    let quantasVisiveis = 0;
    let olvidoVisivel = false;

    for (const item of itens) {
      const classeOk = classeEscolhida === "todas" || item.chave === classeEscolhida;
      const buscaOk = procurado === "" || item.texto.includes(procurado);
      const lendaOk = lendaEscolhida === "" || item.carta.id === lendaEscolhida;
      const mostrar = classeOk && buscaOk && lendaOk;

      item.el.hidden = !mostrar;
      if (mostrar) {
        quantasVisiveis++;
        if (item.chave === "olvido") olvidoVisivel = true;
      }
    }

    // O Olvido não é jogável, então não entra na conta das lendas. Ele aparece à parte.
    let jogaveis = quantasVisiveis;
    if (olvidoVisivel) jogaveis--;
    let texto = jogaveis === 1 ? "1 lenda" : `${jogaveis} lendas`;
    if (olvidoVisivel) texto += " + o Olvido";
    contagem.textContent = texto;

    avisoVazio.hidden = quantasVisiveis !== 0;
    container.scrollLeft = 0;
    atualizarEndereco();

    // Espera um quadro: as cartas que estavam escondidas ainda não tinham tamanho.
    // Também só depois disso dá para medir onde as cartas começam.
    requestAnimationFrame(() => {
      ajustarNomes(container);
      atualizarCentro();
      voltarParaAsCartas();
    });
  }

  // Se a pessoa estiver lá embaixo na lista e mudar o filtro pela barra fixa,
  // as cartas de cima somem e ela ficaria olhando para o nada.
  // Então eu rolo a página até o começo das cartas (logo abaixo da barra).
  // Meço o palco das cartas (e não a contagem "17 lendas", que tem animação de entrada
  // e por isso às vezes está deslocada na hora da medida). Os 40px são o espaço da contagem.
  function voltarParaAsCartas() {
    const fimDaBarra = barra.getBoundingClientRect().bottom;
    const topoDasCartas = document.getElementById("codice-palco").getBoundingClientRect().top;
    const espacoDaContagem = 40;
    if (topoDasCartas < fimDaBarra + espacoDaContagem) {
      window.scrollBy({ top: topoDasCartas - fimDaBarra - espacoDaContagem, behavior: "auto" });
    }
  }

  // As cartas que o filtro está mostrando agora.
  function cartasVisiveis() {
    const lista = [];
    for (const item of itens) {
      if (!item.el.hidden) lista.push(item.el);
    }
    return lista;
  }

  // ---------- Ordenar ----------

  // Cada opção do menu "Ordenar por" e o campo da carta que ela usa.
  const CAMPO_DA_ORDEM = { atk: "ataque", def: "defesa", tech: "tecnica" };

  // O Olvido tem "?" nos atributos. Para ordenar, "?" vale -1 (vai para o fim).
  function valorDoAtributo(carta, campo) {
    const valor = Number(carta[campo]);
    if (isNaN(valor)) return -1;
    return valor;
  }

  function ordenarCartas() {
    if (!montado) return;

    // Começo sempre da ordem original. Assim, em empates (dois com 95 de ATK),
    // quem tem o número menor aparece primeiro (o sort() mantém a ordem dos empatados).
    const lista = itensOriginais.slice();

    if (ordemAtual === "nome") {
      lista.sort((a, b) => a.carta.nome.localeCompare(b.carta.nome, "pt-BR"));
    } else if (CAMPO_DA_ORDEM[ordemAtual]) {
      const campo = CAMPO_DA_ORDEM[ordemAtual];
      lista.sort((a, b) => valorDoAtributo(b.carta, campo) - valorDoAtributo(a.carta, campo));
    }

    // O Olvido fica sempre por último, em qualquer ordem.
    const posicaoOlvido = lista.findIndex((item) => item.chave === "olvido");
    if (posicaoOlvido !== -1) {
      const itemOlvido = lista.splice(posicaoOlvido, 1)[0];
      lista.push(itemOlvido);
    }

    // appendChild de um elemento que já está na página só MUDA ele de lugar.
    // As imagens não são baixadas de novo.
    for (const item of lista) {
      container.appendChild(item.el);
    }
    itens = lista; // as setas da ficha seguem a ordem nova
  }

  filtroOrdem.addEventListener("change", () => {
    ordemAtual = filtroOrdem.value;
    ordenarCartas();
    aplicarFiltros();
  });

  // ---------- Filtros no endereço do site ----------
  // Exemplo: #codice?classe=trevas&lenda=SD-020&ordem=atk&busca=bow

  // Lê o endereço quando o site abre (link compartilhado ou F5) e quando a pessoa
  // chega na aba por um endereço com filtros (por exemplo, colando um link ou usando o Voltar).
  function lerEndereco() {
    const partes = location.hash.split("?");
    if (partes[0] !== "#codice" || !partes[1]) return;
    const params = new URLSearchParams(partes[1]);

    const classe = params.get("classe");
    if (classe && classes[classe]) escolherClasse(classe);

    // Só aceito o personagem se ele existir no menu (ou seja, se for daquela classe).
    const lenda = params.get("lenda");
    if (lenda) {
      filtroLenda.value = lenda;
      if (filtroLenda.value === lenda) lendaEscolhida = lenda;
      else filtroLenda.value = "";
    }

    const ordem = params.get("ordem");
    if (ordem) {
      filtroOrdem.value = ordem;
      if (filtroOrdem.value === ordem) ordemAtual = ordem;
      else filtroOrdem.value = "numero";
    }

    const textoDoLink = params.get("busca");
    if (textoDoLink) {
      busca.value = textoDoLink;
      textoBusca = textoDoLink;
    }

    // Se as cartas já existem, aplico a ordem e os filtros agora.
    // (Na primeira visita quem faz isso é a função montar.)
    ordenarCartas();
    aplicarFiltros();
  }

  // Escreve os filtros no endereço. Uso replaceState (e não pushState) para
  // não encher o botão Voltar com uma entrada a cada letra digitada.
  function atualizarEndereco() {
    if (!tela.classList.contains("active")) return; // só com o Códice aberto

    const params = new URLSearchParams();
    if (classeEscolhida !== "todas") params.set("classe", classeEscolhida);
    if (lendaEscolhida) params.set("lenda", lendaEscolhida);
    if (ordemAtual !== "numero") params.set("ordem", ordemAtual);
    if (textoBusca.trim() !== "") params.set("busca", textoBusca.trim());

    const texto = params.toString();
    let novoEndereco = "#codice";
    if (texto !== "") novoEndereco += "?" + texto;
    if (location.hash !== novoEndereco) history.replaceState(null, "", novoEndereco);
  }

  // ---------- Botão "voltar ao topo" ----------
  // Aparece depois que a pessoa desce bastante. Mesma ideia do carrossel:
  // o scroll dispara muitas vezes, então confiro no máximo uma vez por quadro.
  let topoEsperando = false;
  window.addEventListener("scroll", () => {
    if (topoEsperando) return;
    topoEsperando = true;
    requestAnimationFrame(() => {
      topoEsperando = false;
      btnTopo.classList.toggle("visivel", window.scrollY > 1200);
    });
  });

  btnTopo.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: rolagem() });
  });

  // ---------- Grade ou carrossel ----------

  function definirVista(vista) {
    vistaAtual = vista;
    salvarVista(vista);

    const ehCarrossel = vista === "carrossel";
    container.classList.toggle("vista-carrossel", ehCarrossel);
    container.classList.toggle("vista-grade", !ehCarrossel);
    document.getElementById("codice-palco").classList.toggle("palco-carrossel", ehCarrossel);
    for (const botao of botoesVista.querySelectorAll("button")) {
      botao.setAttribute("aria-pressed", String(botao.dataset.vista === vista));
    }

    container.scrollLeft = 0;
    requestAnimationFrame(atualizarCentro);
  }

  // O evento de scroll dispara muitas vezes por segundo. Para não recalcular
  // à toa, faço a conta no máximo uma vez por quadro da tela.
  let esperandoQuadro = false;

  // No carrossel, a carta mais perto do meio ganha a classe "is-center" e fica maior.
  function atualizarCentro() {
    esperandoQuadro = false;

    if (vistaAtual !== "carrossel") {
      for (const item of itens) item.el.classList.remove("is-center");
      return;
    }

    const caixa = container.getBoundingClientRect();
    const meio = caixa.left + caixa.width / 2;
    let maisPerto = null;
    let menorDistancia = Infinity;

    for (const el of cartasVisiveis()) {
      const r = el.getBoundingClientRect();
      const distancia = Math.abs(r.left + r.width / 2 - meio);
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        maisPerto = el;
      }
    }

    for (const item of itens) {
      item.el.classList.toggle("is-center", item.el === maisPerto);
    }
  }

  container.addEventListener("scroll", () => {
    if (esperandoQuadro) return;
    esperandoQuadro = true;
    requestAnimationFrame(atualizarCentro);
  });
  window.addEventListener("resize", () => requestAnimationFrame(atualizarCentro));

  btnAnterior.addEventListener("click", () => {
    container.scrollBy({ left: -340, behavior: rolagem() });
  });
  btnProxima.addEventListener("click", () => {
    container.scrollBy({ left: 340, behavior: rolagem() });
  });

  // No carrossel, as setas do teclado passam de uma carta para a outra.
  container.addEventListener("keydown", (e) => {
    if (vistaAtual !== "carrossel") return;
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;

    const lista = cartasVisiveis();
    const posicao = lista.indexOf(document.activeElement);
    const passo = e.key === "ArrowRight" ? 1 : -1;
    const proxima = lista[posicao + passo];
    if (proxima) {
      e.preventDefault();
      proxima.focus();
    }
  });

  botoesVista.addEventListener("click", (e) => {
    const botao = e.target.closest("button[data-vista]");
    if (botao) definirVista(botao.dataset.vista);
  });

  // ---------- Busca ----------

  busca.addEventListener("input", () => {
    textoBusca = busca.value;
    aplicarFiltros();
  });

  if (btnLimpar) {
    btnLimpar.addEventListener("click", () => {
      busca.value = "";
      textoBusca = "";
      escolherClasse("todas");
      busca.focus();
    });
  }

  // ---------- Montagem das cartas (só na primeira visita) ----------

  function montar() {
    if (montado) return;
    montado = true;

    let html = "";
    for (const carta of cartasEmOrdem) {
      html += renderCard(carta, { id: `container-${carta.id}` });
    }
    container.innerHTML = html;

    // Guardo, para cada carta, o elemento e o texto que a busca vai procurar.
    itens = [];
    for (const carta of cartasEmOrdem) {
      const classe = classes[carta.classeCSS];
      const nomeClasse = classe ? classe.nome : "";
      itens.push({
        carta,
        el: document.getElementById(`container-${carta.id}`),
        chave: chaveClasse(carta),
        texto: normalizar(`${carta.nome} ${carta.habilidadeNome} ${carta.id} ${nomeClasse}`),
      });
    }

    // Um clique, toque ou Enter abre a ficha da lenda.
    // A dica de como abrir fica discreta ao lado da contagem (index.html, .codice-dica).
    // As setas da ficha só passam pelas cartas que o filtro está mostrando.
    const ficha = obterFicha();
    const contextoFicha = {
      obterLista: () => itens.filter((item) => !item.el.hidden).map((item) => item.carta),
      obterOrigem: (carta) => document.getElementById(`container-${carta.id}`),
    };
    for (const item of itens) {
      attachCardInteractions(item.el, {
        flip: false,
        cliqueSimples: true,
        onActivate: (el) => ficha.abrir(item.carta, el, contextoFicha),
      });
    }

    // Já começa a baixar os textos das fichas quando o navegador estiver livre,
    // para a primeira ficha abrir sem demora.
    quandoLivre(() => carregarLendas().catch(() => {}));

    itensOriginais = itens.slice();
    ordenarCartas(); // o endereço pode ter pedido uma ordem (ex.: ?ordem=atk)

    definirVista(vistaAtual);
    aplicarFiltros();

    // Quando as fontes terminam de carregar, os nomes das cartas são ajustados de novo.
    if (document.fonts) document.fonts.ready.then(() => ajustarNomes(container));
  }

  montarMenuClasse();
  atualizarPainel();
  lerEndereco();
  tela.style.setProperty("--aura-rgb", COR_PADRAO);
  tela.style.setProperty("--aura-txt", COR_PADRAO);

  // A aba Linhagens pede "ver todas no Códice": já abre filtrado na classe.
  document.addEventListener("abrir-codice", (e) => escolherClasse(e.detail.classe));

  // navigation.js avisa quando uma aba aparece. As cartas só são criadas na primeira vez.
  document.addEventListener("screenchange", (e) => {
    if (e.detail.id === "codice") {
      montar();
      lerEndereco(); // o endereço pode trazer filtros novos (link colado, botão Voltar)
      atualizarEndereco(); // ao voltar para a aba, os filtros reaparecem no endereço
    }
  });
}
