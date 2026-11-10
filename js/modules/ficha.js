// Ficha da Lenda
// Quando a pessoa ativa uma carta (clique, toque ou Enter), a carta voa
// até a esquerda da tela dando um giro, e a ficha com a história abre à direita.
// Os textos das lendas ficam em js/lendas.js, um arquivo grande, então ele só é
// baixado na primeira vez que alguém abre uma ficha.

import { renderCard, ajustarNomes } from "./cardRenderer.js";
import { attachCardInteractions } from "./cardInteractions.js";
import { classes } from "../classes.js";
import { esc, reduzirMovimento, COR_PADRAO } from "../utils.js";

const LARGURA = 315; // mesmo tamanho do .card-container em cards.css
const ALTURA = 440;
const VOO_MS = 900; // duração do voo da carta
const ROMANOS = { 1: "I", 2: "II", 3: "III", 4: "IV" };
const COR_OLVIDO = "190, 110, 255";
const AJUDA_PRIORIDADE =
  "Velocidade de reação da lenda, de I (a mais rápida) a IV. Quem tem a Prioridade mais alta ativa o Grimório antes do oponente.";

// ---------- Textos das lendas ----------

let promessaLendas = null;

// Baixa o lendas.js só uma vez. Nas próximas chamadas devolve o que já foi baixado.
// O import() entre parênteses carrega o arquivo na hora que precisa, e não junto com o site.
export function carregarLendas() {
  if (promessaLendas === null) {
    promessaLendas = import("../lendas.js").then((modulo) => modulo.lendas);
  }
  return promessaLendas;
}

// A prioridade vem do nome da imagem: "prioridade-2.png" vira "II".
function prioridadeDe(carta) {
  const resultado = /prioridade-(\d)/.exec(carta.imagemPrioridade || "");
  if (!resultado) return null;
  return ROMANOS[resultado[1]];
}

// ---------- HTML da ficha ----------

// Uma barra de atributo (ATK, DEF ou TECH). Se o valor não for número, mostra "?".
function htmlBarra(sigla, tipo, valor) {
  const numero = Number(valor);
  const ehNumero = Number.isFinite(numero);

  let largura = 100;
  let rotulo = "?";
  let extra = " incerta";
  if (ehNumero) {
    largura = Math.min(100, Math.max(0, numero)); // fica entre 0 e 100
    rotulo = numero;
    extra = "";
  }

  return `<div class="barra">
    <span class="barra-sigla">${sigla}</span>
    <span class="barra-trilho"><span class="barra-fill ${tipo}${extra}" style="--w:${largura}%"></span></span>
    <span class="barra-valor">${esc(rotulo)}</span>
  </div>`;
}

// Uma fala do personagem. Se a fala começa com "Nome: "texto"", o nome vira um <cite>.
function htmlFala(texto) {
  const partes = /^([^":“]{2,32}):\s*(["“].*)$/s.exec(texto);
  if (partes) {
    const quemFala = partes[1];
    const fala = partes[2];
    return `<blockquote><cite>${esc(quemFala)}</cite> ${esc(fala)}</blockquote>`;
  }
  return `<blockquote>${esc(texto)}</blockquote>`;
}

// Transforma uma lista de textos em vários <p>.
function paragrafos(lista) {
  if (!lista) return "";
  let html = "";
  for (const texto of lista) {
    html += `<p>${esc(texto)}</p>`;
  }
  return html;
}

function htmlFalas(falas) {
  if (!falas) return "";
  return falas.map(htmlFala).join("");
}

// Topo da ficha, em três linhas:
//   SD-010            (código da carta, pequeno)
//   Link              (nome, grande)
//   O Herói do Tempo  (subtítulo)
function htmlTitulo(carta, dados) {
  const ehOlvido = !carta.iconeClasse;

  let codigoHtml = "";
  if (!ehOlvido) codigoHtml = `<p class="ficha-codigo">${esc(carta.id)}</p>`;

  let subtituloHtml = "";
  if (dados && dados.subtitulo) subtituloHtml = `<p class="ficha-sub">${esc(dados.subtitulo)}</p>`;

  return `${codigoHtml}
    <h2 class="ficha-titulo" id="ficha-titulo">${esc(carta.nome)}</h2>
    ${subtituloHtml}`;
}

// Classe, prioridade e as barras de atributos. O Olvido não tem nada disso.
function htmlInfo(carta) {
  if (!carta.iconeClasse) {
    return `<p class="ficha-linha"><strong>Natureza:</strong> Entidade ancestral — sem classe e sem prioridade</p>`;
  }

  const classe = classes[carta.classeCSS];
  const prioridade = prioridadeDe(carta);

  // Prioridade + botão "?" que mostra o que ela significa (o texto fica escondido até clicar).
  let prioridadeHtml = "";
  if (prioridade) {
    prioridadeHtml = `<div class="ficha-linha">
         <span class="chip chip-forte">Prioridade ${prioridade}</span>
         <button type="button" class="ficha-ajuda" aria-expanded="false" aria-controls="ficha-explica" aria-label="O que é Prioridade?">?</button>
       </div>
       <p class="ficha-explica" id="ficha-explica" hidden>
         ${AJUDA_PRIORIDADE}
         <button type="button" class="ficha-link" data-ficha-ir="manual">Ver no Manual →</button>
       </p>`;
  }

  return `<p class="ficha-linha ficha-classe">
         <img src="${esc(classe.pin)}" alt="" class="ficha-pin" decoding="async">
         <span><strong>Classe:</strong> ${esc(classe.nome)}</span>
         <span class="chip">${esc(classe.bonus)}</span>
       </p>
       ${prioridadeHtml}
       <div class="ficha-barras" role="group" aria-label="Atributos">
         ${htmlBarra("ATK", "atk", carta.ataque)}${htmlBarra("DEF", "def", carta.defesa)}${htmlBarra("TECH", "tech", carta.tecnica)}
       </div>`;
}

// Algumas lendas têm seções livres (dados.secoes) em vez das 5 seções padrão.
function htmlSecoesLivres(dados) {
  let html = "";
  for (const secao of dados.secoes) {
    // Tiro a numeração do começo do título ("1. História" vira "História")
    const titulo = secao.titulo.replace(/^\d+\.\s*/, "");
    html += `<section class="ficha-sec"><h3>${esc(titulo)}</h3>${paragrafos(secao.texto)}</section>`;
  }
  if (dados.falas && dados.falas.length > 0) {
    html += `<section class="ficha-sec ficha-falas"><h3>💬 Última Palavra</h3>${htmlFalas(dados.falas)}</section>`;
  }
  return html;
}

// As seções padrão: história, manifestações, análise e falas.
// O Grimório não entra aqui: o texto é o mesmo que está impresso na carta, ao lado.
function htmlSecoesPadrao(dados) {
  let manifestacoes = "";
  for (const m of dados.manifestacoes || []) {
    manifestacoes += `<li><span class="manif-ico" aria-hidden="true">${esc(m.icone)}</span><strong>${esc(m.nome)}</strong><p>${esc(m.desc)}</p></li>`;
  }

  let nota = "";
  if (dados.notaFalas) nota = `<p class="ficha-nota">${esc(dados.notaFalas)}</p>`;

  return `
      <section class="ficha-sec ficha-historia"><h3>📖 História no Nexo</h3>${paragrafos(dados.historia)}</section>
      <section class="ficha-sec"><h3>✨ Manifestações da Essência</h3>
        <ul class="ficha-manif">
          ${manifestacoes}
        </ul>
      </section>
      <section class="ficha-sec"><h3>⚙️ Análise Estratégica</h3>${paragrafos(dados.analise)}</section>
      <section class="ficha-sec ficha-falas"><h3>💬 Falas do Personagem</h3>
        ${nota}
        ${htmlFalas(dados.falas)}
      </section>`;
}

// Botão do fim da ficha, que leva para as outras lendas da mesma classe.
function htmlBotaoClasse(carta) {
  if (!carta.iconeClasse) return "";
  const classe = classes[carta.classeCSS];
  return `<footer class="ficha-acoes">
        <button type="button" class="cta-primario" data-ficha-ir="linhagem" data-classe="${esc(carta.classeCSS)}">Ver as lendas dos ${esc(classe.nome)}</button>
      </footer>`;
}

// Fim da ficha: "← Bowser    Bowser Jr. →", para continuar lendo sem voltar ao topo.
// anterior e proxima são cartas (ou null quando não há para onde ir).
function htmlVizinhas(anterior, proxima) {
  if (!anterior || !proxima) return "";
  return `<nav class="ficha-vizinhas" aria-label="Outras lendas">
      <button type="button" class="vizinha" data-vizinha="-1">
        <span class="vizinha-rotulo">← Anterior</span>
        <span class="vizinha-nome">${esc(anterior.nome)}</span>
      </button>
      <button type="button" class="vizinha vizinha-prox" data-vizinha="1">
        <span class="vizinha-rotulo">Próxima →</span>
        <span class="vizinha-nome">${esc(proxima.nome)}</span>
      </button>
    </nav>`;
}

// Junta todas as partes da ficha.
function htmlPainel(carta, dados, anterior, proxima) {
  let corpo;
  if (!dados) {
    corpo = `<p class="ficha-aviso">A ficha desta lenda ainda está sendo escrita.</p>`;
  } else if (dados.secoes) {
    corpo = htmlSecoesLivres(dados);
  } else {
    corpo = htmlSecoesPadrao(dados);
  }

  const cabecalho = `<header class="ficha-cab">${htmlTitulo(carta, dados)}${htmlInfo(carta)}</header>`;
  return cabecalho + corpo + htmlBotaoClasse(carta) + htmlVizinhas(anterior, proxima);
}

// ---------- Pequenos ajudantes das animações ----------

// Duração do voo: zero se a pessoa pediu para reduzir movimento.
function tempoDoVoo() {
  if (reduzirMovimento()) return 0;
  return VOO_MS;
}

function esperar(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

// Centro de um retângulo (o que getBoundingClientRect devolve).
function centroDe(retangulo) {
  return {
    x: retangulo.left + retangulo.width / 2,
    y: retangulo.top + retangulo.height / 2,
  };
}

// Coloca a carta parada no ponto indicado da tela, no tamanho indicado.
function posicionar(carta, ponto, escala) {
  carta.style.top = `${ponto.y}px`;
  carta.style.left = `${ponto.x}px`;
  carta.style.transform = `translate(-50%, -50%) scale(${escala})`;
}

// Deixa a carta "de frente" na hora, sem animar o giro.
function zerarGiro(inner) {
  inner.style.transition = "none";
  inner.style.transform = "rotateX(0deg) rotateY(0deg)";
}

// Gira a carta 360° (para um lado ou para o outro) durante o voo.
function girar(inner, graus, duracao) {
  inner.style.transition = `transform ${duracao}ms ease-in-out`;
  inner.style.transform = `rotateX(0deg) rotateY(${graus}deg)`;
}

// Tamanho da carta na ficha: grande no computador. No celular ela fica menor
// (no máximo 62%), para o nome e os atributos aparecerem já na primeira tela.
function escalaDaCarta() {
  const largura = window.innerWidth;
  const altura = window.innerHeight;
  if (largura >= 900) {
    const peloAltura = (altura - 150) / ALTURA;
    const pelaLargura = (largura * 0.36) / LARGURA;
    return Math.max(0.6, Math.min(1.35, peloAltura, pelaLargura));
  }
  return Math.min(0.62, (largura - 32) / LARGURA);
}

// Cria uma cópia da carta para usar dentro da ficha.
function criarCarta(carta) {
  const molde = document.createElement("template");
  molde.innerHTML = renderCard(carta).trim();
  const el = molde.content.firstElementChild;
  el.removeAttribute("id");
  el.classList.add("ficha-clone");
  return el;
}

// ---------- A ficha ----------
// Existe uma ficha só no site inteiro. Quem abre (Códice, Linhagens, Início)
// manda junto duas funções:
//   obterLista()       -> as cartas que os botões anterior/próxima percorrem
//   obterOrigem(carta) -> a carta na tela, para onde ela volta quando a ficha fecha

function criarFicha() {
  let contexto = { obterLista: () => [], obterOrigem: () => null };
  let overlay = null;
  let slot, painel, contador, btnAnterior, btnProxima, btnFechar;
  let clone = null; // a carta que voa
  let atual = null; // { carta, origem }
  let aberta = false;
  let ocupado = false; // true durante uma animação, para ignorar cliques repetidos
  let lendas = null;

  // Cria o HTML da ficha na primeira vez que ela abre.
  function montarOverlay() {
    overlay = document.createElement("div");
    overlay.className = "ficha-overlay";
    overlay.hidden = true;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "ficha-titulo");
    overlay.innerHTML = `
      <button type="button" class="ficha-fechar" aria-label="Fechar ficha">×</button>
      <div class="ficha-layout">
        <div class="ficha-carta-col">
          <div class="ficha-slot"></div>
          <div class="ficha-nav">
            <button type="button" class="ficha-nav-btn" data-dir="-1" aria-label="Lenda anterior">‹</button>
            <span class="ficha-contador" aria-live="polite"></span>
            <button type="button" class="ficha-nav-btn" data-dir="1" aria-label="Próxima lenda">›</button>
          </div>
        </div>
        <article class="ficha-painel" tabindex="0"></article>
      </div>`;
    document.body.appendChild(overlay);

    slot = overlay.querySelector(".ficha-slot");
    painel = overlay.querySelector(".ficha-painel");
    contador = overlay.querySelector(".ficha-contador");
    btnFechar = overlay.querySelector(".ficha-fechar");
    btnAnterior = overlay.querySelector('[data-dir="-1"]');
    btnProxima = overlay.querySelector('[data-dir="1"]');

    btnFechar.addEventListener("click", fechar);
    btnAnterior.addEventListener("click", () => navegar(-1));
    btnProxima.addEventListener("click", () => navegar(1));

    // Botão "Ver as lendas dos ..." (ele é recriado a cada carta, por isso escuto no painel)
    painel.addEventListener("click", (e) => {
      const botao = e.target.closest("[data-ficha-ir]");
      if (botao) {
        irPara(botao.dataset.fichaIr, botao.dataset.classe);
        return;
      }

      // "← Anterior" / "Próxima →" do fim da ficha
      const vizinha = e.target.closest("[data-vizinha]");
      if (vizinha) {
        navegar(Number(vizinha.dataset.vizinha));
        return;
      }

      // Botão "?" da Prioridade: mostra ou esconde a explicação
      const ajuda = e.target.closest(".ficha-ajuda");
      if (ajuda) {
        const explicacao = painel.querySelector(".ficha-explica");
        const abrir = explicacao.hidden;
        explicacao.hidden = !abrir;
        ajuda.setAttribute("aria-expanded", String(abrir));
      }
    });

    // Clicar no fundo escuro, fora do painel e da carta, também fecha.
    overlay.addEventListener("click", (e) => {
      const alvo = e.target;
      const ehFundo =
        alvo === overlay ||
        alvo.classList.contains("ficha-layout") ||
        alvo.classList.contains("ficha-carta-col");
      if (ehFundo) fechar();
    });

    document.addEventListener("keydown", aoTeclar);
  }

  // Teclado: Esc fecha, setas trocam de lenda, Tab não deixa o foco sair da ficha.
  function aoTeclar(e) {
    if (!aberta) return;

    const digitando = e.target.closest && e.target.closest("input");
    if (e.key === "Escape") {
      fechar();
    } else if (e.key === "ArrowLeft" && !digitando) {
      navegar(-1);
    } else if (e.key === "ArrowRight" && !digitando) {
      navegar(1);
    } else if (e.key === "Tab") {
      prenderFoco(e);
    }
  }

  // Quem usa teclado não pode "sair" da ficha com Tab e se perder no site atrás dela.
  function prenderFoco(e) {
    const focaveis = [...overlay.querySelectorAll("button, [tabindex='0']")].filter(
      (el) => !el.disabled && el.offsetParent !== null, // ignora os desativados e os escondidos
    );
    if (focaveis.length === 0) return;

    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primeiro.focus();
    }
  }

  // Ao trocar de lenda, a leitura recomeça do topo.
  // No computador quem rola é o painel; no celular, a ficha inteira (o overlay).
  function rolarFichaParaOTopo() {
    painel.scrollTop = 0;
    overlay.scrollTop = 0;
  }

  // A cor da ficha acompanha a classe da carta.
  function aplicarCores(carta) {
    let cor = COR_OLVIDO;
    if (carta.iconeClasse) {
      const classe = classes[carta.classeCSS];
      cor = classe ? classe.rgb : COR_PADRAO;
    }
    overlay.style.setProperty("--ficha-rgb", cor);
  }

  function preencherPainel(carta) {
    const dados = lendas ? lendas[carta.id] : undefined;
    const lista = contexto.obterLista();
    const posicao = lista.findIndex((c) => c.id === carta.id);

    // As lendas vizinhas (a lista dá a volta: antes da primeira vem a última)
    let anterior = null;
    let proxima = null;
    if (lista.length > 1 && posicao >= 0) {
      anterior = lista[(posicao - 1 + lista.length) % lista.length];
      proxima = lista[(posicao + 1) % lista.length];
    }

    painel.innerHTML = htmlPainel(carta, dados, anterior, proxima);
    painel.scrollTop = 0;
    rolarFichaParaOTopo();

    // Contador "12 / 104" e botões anterior/próxima
    if (lista.length > 1 && posicao >= 0) {
      contador.textContent = `${posicao + 1} / ${lista.length}`;
    } else {
      contador.textContent = "";
    }
    const soUmaCarta = lista.length < 2;
    btnAnterior.disabled = soUmaCarta;
    btnProxima.disabled = soUmaCarta;

    // As barras crescem a partir de zero. A classe sai agora e volta dois quadros
    // depois (requestAnimationFrame duas vezes), senão o navegador não anima.
    painel.classList.remove("barras-prontas");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => painel.classList.add("barras-prontas"));
    });
  }

  // No fim do voo, a carta "pousa" dentro da ficha.
  // Assim, no celular, ela rola junto com o resto da página.
  function pousar() {
    clone.classList.add("pousada");
    clone.style.cssText = `--e:${escalaDaCarta()}`;
    clone.removeAttribute("aria-hidden");
    slot.appendChild(clone);

    const inner = clone.querySelector(".card-inner");
    zerarGiro(inner);
    void inner.offsetWidth; // força o navegador a aplicar o "zerar" antes da próxima linha
    inner.style.transition = ""; // devolve as transições para o CSS (senão a carta não vira mais)

    attachCardInteractions(clone, { flip: true });
    ajustarNomes(clone);
  }

  async function abrir(carta, origem, novoContexto) {
    if (aberta || ocupado) return;
    ocupado = true;
    if (novoContexto) contexto = novoContexto;
    if (!overlay) montarOverlay();

    // Espera os textos chegarem. Se der erro, a ficha abre mesmo assim, com um aviso.
    try {
      lendas = await carregarLendas();
    } catch {
      lendas = null;
    }

    atual = { carta, origem };
    aberta = true;
    aplicarCores(carta);
    preencherPainel(carta);

    const escala = escalaDaCarta();
    slot.style.width = `${LARGURA * escala}px`;
    slot.style.height = `${ALTURA * escala}px`;

    overlay.hidden = false;
    document.body.classList.add("no-scroll");
    const voo = tempoDoVoo();
    // A carta que voa fica fora do overlay, então a duração vai numa variável do CSS na raiz.
    document.documentElement.style.setProperty("--voo", `${voo}ms`);

    // 1. Cria a cópia da carta exatamente em cima da carta original
    clone = criarCarta(carta);
    const retanguloOrigem = origem.getBoundingClientRect();
    posicionar(clone, centroDe(retanguloOrigem), retanguloOrigem.width / origem.offsetWidth);
    const inner = clone.querySelector(".card-inner");
    zerarGiro(inner);
    document.body.appendChild(clone);
    ajustarNomes(clone);
    origem.style.opacity = "0"; // esconde a original enquanto a cópia voa

    // 2. Mostra a ficha e mede onde a carta tem que chegar
    void overlay.offsetWidth; // garante que a ficha já está na página antes de medir
    overlay.classList.add("aberta");
    const destino = centroDe(slot.getBoundingClientRect());

    // 3. Dois quadros depois, manda a carta voar e girar até o destino
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        clone.classList.add("voando");
        girar(inner, 360, voo);
        posicionar(clone, destino, escala);
      });
    });

    // 4. O texto aparece um pouco antes do fim do voo
    setTimeout(() => painel.classList.add("visivel"), voo * 0.55);

    // 5. Fim do voo: a carta pousa e o foco vai para o texto
    setTimeout(() => {
      if (!clone) return;
      pousar();
      ocupado = false;
      painel.focus({ preventScroll: true });
    }, voo + 30);
  }

  // Botões anterior (-1) e próxima (+1).
  async function navegar(direcao) {
    if (!aberta || ocupado) return;
    const lista = contexto.obterLista();
    if (lista.length < 2) return;

    const posicao = lista.findIndex((c) => c.id === atual.carta.id);
    // O "+ lista.length" e o "%" fazem a lista dar a volta: depois da última vem a primeira.
    const proxima = lista[(posicao + direcao + lista.length) % lista.length];
    ocupado = true;

    // Mostra de novo a carta antiga na tela e esconde a nova
    atual.origem.style.opacity = "";
    atual.carta = proxima;
    atual.origem = contexto.obterOrigem(proxima) || atual.origem;
    atual.origem.style.opacity = "0";

    // Some com a carta e o texto atuais...
    painel.classList.remove("visivel");
    clone.classList.add("trocando");
    await esperar(reduzirMovimento() ? 0 : 200);

    // ...e coloca os novos no lugar
    clone.remove();
    clone = criarCarta(proxima);
    slot.appendChild(clone);
    clone.classList.add("pousada", "trocando");
    clone.style.cssText = `--e:${escalaDaCarta()}`;
    attachCardInteractions(clone, { flip: true });
    ajustarNomes(clone);
    aplicarCores(proxima);
    preencherPainel(proxima);
    void clone.offsetWidth;
    clone.classList.remove("trocando");
    painel.classList.add("visivel");
    ocupado = false;

    // Se a troca veio do botão do fim da ficha, esse botão foi recriado e o foco se perdeu.
    // Devolvo o foco para o painel (importante para quem navega pelo teclado).
    if (document.activeElement === document.body) painel.focus({ preventScroll: true });
  }

  // Fecha a ficha e, quando a carta terminar de voltar, troca de aba.
  function irPara(destino, classe) {
    if (!aberta || ocupado) return;
    fechar();
    setTimeout(() => {
      if (destino === "linhagem") {
        const linkCodice = document.querySelector('.nav-links a[data-target="codice"]');
        if (linkCodice) linkCodice.click();
        document.dispatchEvent(new CustomEvent("abrir-codice", { detail: { classe } }));
      }

      // "Ver no Manual": abre o Manual do Jogador direto na Anatomia da Carta
      if (destino === "manual") {
        const linkManual = document.querySelector('.nav-links a[data-target="ritual"]');
        if (linkManual) linkManual.click();
        // Espero a animação de entrada da aba (0,3 s) terminar, senão a posição sai errada.
        setTimeout(() => {
          const anatomia = document.getElementById("rit-anatomia");
          if (anatomia) anatomia.scrollIntoView({ block: "start" });
        }, 350);
      }
    }, tempoDoVoo() + 150);
  }

  function fechar() {
    if (!aberta || ocupado) return;
    ocupado = true;
    const origem = atual.origem;
    const voo = tempoDoVoo();

    // Se a pessoa navegou, a carta de origem pode estar fora da tela. Rola até ela antes de medir.
    origem.scrollIntoView({ block: "nearest", inline: "center", behavior: "auto" });

    // 1. Tira a carta da ficha e deixa ela parada no mesmo lugar da tela
    const ondeEsta = centroDe(clone.getBoundingClientRect());
    const inner = clone.querySelector(".card-inner");
    clone.classList.remove("pousada");
    clone.style.cssText = `top:${ondeEsta.y}px;left:${ondeEsta.x}px;transform:translate(-50%,-50%) scale(${escalaDaCarta()});transition:none`;
    document.body.appendChild(clone);
    zerarGiro(inner);
    void clone.offsetWidth;

    // 2. Esconde a ficha
    painel.classList.remove("visivel");
    overlay.classList.remove("aberta");

    // 3. A carta voa de volta, girando para o outro lado
    const retanguloOrigem = origem.getBoundingClientRect();
    clone.style.transition = "";
    clone.classList.add("voando");
    girar(inner, -360, voo);
    posicionar(clone, centroDe(retanguloOrigem), retanguloOrigem.width / origem.offsetWidth);

    // 4. Chegou: apaga a cópia, mostra a original e limpa tudo
    setTimeout(() => {
      if (clone) clone.remove();
      clone = null;
      origem.style.opacity = "";
      overlay.hidden = true;
      painel.classList.remove("visivel", "barras-prontas");
      document.body.classList.remove("no-scroll");
      aberta = false;
      ocupado = false;
      origem.focus({ preventScroll: true });
      atual = null;
    }, voo + 30);
  }

  return { abrir, fechar, isOpen: () => aberta };
}

// Cria a ficha só quando alguém pede pela primeira vez, e depois reaproveita.
let instancia = null;
export function obterFicha() {
  if (instancia === null) instancia = criarFicha();
  return instancia;
}
