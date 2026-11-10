// Aba "Manual do Jogador"
// O texto está todo no index.html. Aqui ficam só as partes que se mexem:
//   1. Anatomia: a carta do Mario com pontos que iluminam cada parte.
//   2. Preparação: as cartas voando do baralho para a mão e o Relicário.
//   4. Poder Astral: os números que correm até 110 (exemplo do Mario).
//   5 e 6. Estigmas e Vitória: clicar num card abre a arte grande com o texto completo.
// E também o índice da página e a entrada suave dos blocos ao rolar.

import { classes } from "../classes.js";
import { reduzirMovimento, rolagem } from "../utils.js";

const LOGO_VERSO = "imagens/marca/logo-smash-deck.webp";

function esperar(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

export function initRitual(cartas) {
  const tela = document.getElementById("ritual");
  if (!tela) return;
  let montada = false;
  const jogaveis = cartas.filter((carta) => carta.iconeClasse); // tira o Olvido

  // ============================================================
  // 1. Anatomia da carta
  // ============================================================
  function montarAnatomia() {
    const palco = tela.querySelector("#anatomia-palco");
    // Aqui a carta é só uma imagem (um print da carta do Mario do próprio site):
    // não gira e não brilha com o mouse, só serve para apontar as partes.
    palco.innerHTML = `<div class="anat-wrap" id="anat-wrap">
      <img class="anat-carta" src="imagens/ritual/anatomia-mario.webp" width="630" height="882" alt="Carta do Mario: selo de classe, círculo de prioridade, Tríade de Essência e Grimório" decoding="async">
      <div class="anat-escuro" aria-hidden="true"></div></div>`;
    const wrap = palco.querySelector("#anat-wrap");

    // Onde fica cada parte na imagem, em % do tamanho da carta (medi na carta real).
    //   x, y, w, h: o retângulo que fica iluminado
    //   r: arredondamento das bordas (50% = círculo)
    //   px, py: onde fica o pontinho clicável
    // Se a imagem for trocada, essas medidas precisam ser refeitas.
    const ALVOS = {
      classe: { x: 57.14, y: 2.68, w: 21.59, h: 15.42, r: "50%", px: 67.94, py: 10.39 },
      prioridade: { x: 75.68, y: 3.63, w: 19.05, h: 13.61, r: "50%", px: 85.21, py: 10.43 },
      triade: { x: 4.44, y: 60.77, w: 91.11, h: 10.66, r: "12px", px: 50, py: 66.1 },
      grimorio: { x: 4.44, y: 71.2, w: 93.65, h: 25.85, r: "14px", px: 50, py: 83.2 },
    };
    const NOMES = {
      classe: "Selo de Classe",
      prioridade: "Círculo de Prioridade",
      triade: "Tríade de Essência",
      grimorio: "Grimório",
    };
    const PARTES = Object.keys(ALVOS); // ["classe", "prioridade", "triade", "grimorio"]
    const explicacoes = tela.querySelectorAll(".anat-item"); // os textos ao lado da carta
    const anatomia = tela.querySelector(".anatomia");

    // Cria um pontinho (botão) em cima de cada parte
    const pontos = {};
    for (const parte of PARTES) {
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "ponto";
      botao.dataset.parte = parte;
      botao.style.left = `${ALVOS[parte].px}%`;
      botao.style.top = `${ALVOS[parte].py}%`;
      botao.setAttribute("aria-label", `Explicar: ${NOMES[parte]}`);
      wrap.appendChild(botao);
      pontos[parte] = botao;
    }

    // A carta começa clara. Ao clicar num ponto (ou num texto ao lado),
    // o resto da carta escurece e só a parte escolhida fica iluminada.
    // Clicar de novo na mesma parte, clicar na carta ou apertar Esc volta ao normal.
    let parteAtual = null;

    // Ilumina uma parte: passo as medidas para o CSS em variáveis (--fx, --fy...),
    // e o CSS posiciona o "holofote" ali.
    function iluminar(parte, rolarAteTexto = false) {
      parteAtual = parte;
      const alvo = ALVOS[parte];
      wrap.style.setProperty("--fx", `${alvo.x}%`);
      wrap.style.setProperty("--fy", `${alvo.y}%`);
      wrap.style.setProperty("--fw", `${alvo.w}%`);
      wrap.style.setProperty("--fh", `${alvo.h}%`);
      wrap.style.setProperty("--fr", alvo.r);
      wrap.classList.add("com-foco");
      anatomia.classList.add("com-escolha");

      for (const nome of PARTES) {
        pontos[nome].setAttribute("aria-pressed", String(nome === parte));
      }
      for (const texto of explicacoes) {
        texto.classList.toggle("ativo", texto.dataset.parte === parte);
      }

      // No celular o texto fica embaixo da carta, então rolo até ele.
      if (rolarAteTexto && window.matchMedia("(max-width: 899px)").matches) {
        const texto = tela.querySelector(`.anat-item[data-parte="${parte}"]`);
        if (texto) texto.scrollIntoView({ block: "nearest", behavior: rolagem() });
      }
    }

    // Volta a carta ao normal: tudo claro, nada marcado.
    function limpar() {
      parteAtual = null;
      wrap.classList.remove("com-foco");
      anatomia.classList.remove("com-escolha");
      for (const nome of PARTES) pontos[nome].setAttribute("aria-pressed", "false");
      for (const texto of explicacoes) texto.classList.remove("ativo");
    }

    // Clicar na parte que já está marcada desmarca; clicar em outra troca o foco.
    function alternar(parte, rolarAteTexto) {
      if (parteAtual === parte) limpar();
      else iluminar(parte, rolarAteTexto);
    }

    for (const parte of PARTES) {
      pontos[parte].addEventListener("click", (e) => {
        e.stopPropagation(); // senão o clique "chega" na carta e desmarca na hora
        alternar(parte, true);
      });
    }
    for (const texto of explicacoes) {
      texto.addEventListener("click", (e) => {
        if (e.target.closest("button, a")) return; // o link "Ver as seis linhagens" não conta
        alternar(texto.dataset.parte, false);
      });
    }

    // Clicar em qualquer lugar da carta (fora dos pontos) volta ao normal
    wrap.addEventListener("click", limpar);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && parteAtual !== null) limpar();
    });

    for (const nome of PARTES) pontos[nome].setAttribute("aria-pressed", "false");
  }

  // ============================================================
  // 2. Preparação: o tapete com as cartas voando
  // ============================================================
  function montarTapete() {
    const tapete = tela.querySelector("#tapete");
    const slotsMao = tela.querySelector("#slots-mao");
    const slotsRelicario = tela.querySelector("#slots-relicario");
    const pilhaBaralho = tela.querySelector("#pilha-deck");
    const pilhaAbismo = tela.querySelector("#pilha-abismo");
    const contadorBaralho = tela.querySelector("#contador-deck");
    const passos = tela.querySelectorAll(".prep-passos li");

    // As 5 cartas da mão de exemplo. Cada uma tem uma imagem pronta
    // em imagens/ritual/mao-<nome>.webp, para não precisar encolher a carta real.
    const NOMES_MAO = ["Mario", "Link", "Kratos", "Sonic", "Lara Croft"];
    const ARQUIVOS_MAO = ["mario", "link", "kratos", "sonic", "lara-croft"];
    const cartasMao = [];
    for (const nome of NOMES_MAO) {
      const carta = jogaveis.find((c) => c.nome === nome);
      if (carta) cartasMao.push(carta);
    }
    while (cartasMao.length < 5) cartasMao.push(jogaveis[cartasMao.length * 7]); // reserva, se faltar alguma

    let rodada = 0; // muda a cada vez que a animação começa

    function htmlVerso() {
      return `<img src="${LOGO_VERSO}" alt="" decoding="async">`;
    }

    function criarEspacos(elemento) {
      let html = "";
      for (let i = 0; i < 5; i++) html += '<span class="slot"></span>';
      elemento.innerHTML = html;
    }

    // Uma pilha de cartas viradas (desenho no máximo 6, uma em cima da outra).
    function desenharPilha(elemento, quantas) {
      let html = "";
      for (let i = 0; i < Math.min(quantas, 6); i++) {
        html += `<span class="mini mini-verso" style="--i:${i}">${htmlVerso()}</span>`;
      }
      elemento.innerHTML = html;
    }

    function reiniciar() {
      criarEspacos(slotsMao);
      criarEspacos(slotsRelicario);
      desenharPilha(pilhaBaralho, 6);
      pilhaAbismo.innerHTML = "";
      contadorBaralho.textContent = "50 cartas";
      tela.querySelector("#contador-abismo").textContent = "vazio no início";
      for (const passo of passos) passo.classList.remove("ativo", "feito");
      tapete.dataset.fase = "";
    }

    // Acende o passo "numero" da lista e marca os anteriores como feitos.
    function marcarPasso(numero) {
      passos.forEach((passo, i) => {
        passo.classList.toggle("ativo", i === numero);
        passo.classList.toggle("feito", i < numero);
      });
    }

    // Faz a carta "mini" sair de cima da "origem" e chegar no lugar dela.
    async function voar(mini, origem, duracao = 520) {
      const de = origem.getBoundingClientRect();
      const para = mini.getBoundingClientRect();
      const dx = de.left + de.width / 2 - (para.left + para.width / 2);
      const dy = de.top + de.height / 2 - (para.top + para.height / 2);
      // Só transform, sem opacity: transparência em volta da carta estraga as sombras dela.
      mini.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) rotate(-8deg) scale(.85)` },
          { transform: "translate(0,0) rotate(0) scale(1)" },
        ],
        { duration: duracao, easing: "cubic-bezier(.2,.8,.2,1)" },
      );
      await esperar(duracao * 0.45); // a próxima carta sai antes desta chegar
    }

    async function jogar() {
      // Se a pessoa clicar em "repetir" no meio, a animação antiga tem que parar.
      // Cada vez que começa, "rodada" aumenta; a antiga percebe que não é mais a atual e sai.
      rodada++;
      const minhaRodada = rodada;
      function foiCancelada() {
        return minhaRodada !== rodada;
      }

      reiniciar();
      const semAnimacao = reduzirMovimento();
      const espacosMao = slotsMao.children;
      const espacosRelicario = slotsRelicario.children;
      let noBaralho = 50;

      // Passo 1: o baralho
      marcarPasso(0);
      tapete.dataset.fase = "deck";
      if (!semAnimacao) await esperar(900);
      if (foiCancelada()) return;

      // Passo 2: compra 5 cartas para a mão
      marcarPasso(1);
      tapete.dataset.fase = "mao";
      for (let i = 0; i < 5; i++) {
        const carta = cartasMao[i];
        const classe = classes[carta.classeCSS];
        const cor = classe ? classe.rgb : "255,255,255";
        espacosMao[i].innerHTML = `<span class="mini mini-frente" style="--aura-rgb:${cor}"><img src="imagens/ritual/mao-${ARQUIVOS_MAO[i]}.webp" alt="" decoding="async"></span>`;
        noBaralho--;
        contadorBaralho.textContent = `${noBaralho} cartas`;
        if (!semAnimacao) {
          await voar(espacosMao[i].firstElementChild, pilhaBaralho);
          if (foiCancelada()) return;
        }
      }
      if (!semAnimacao) await esperar(500);

      // Passo 3: 5 cartas viradas para o Relicário
      marcarPasso(2);
      tapete.dataset.fase = "relicario";
      for (let i = 0; i < 5; i++) {
        espacosRelicario[i].innerHTML = `<span class="mini mini-verso">${htmlVerso()}</span>`;
        noBaralho--;
        contadorBaralho.textContent = `${noBaralho} cartas`;
        if (!semAnimacao) {
          await voar(espacosRelicario[i].firstElementChild, pilhaBaralho);
          if (foiCancelada()) return;
        }
      }
      desenharPilha(pilhaBaralho, 6);
      if (!semAnimacao) await esperar(500);

      // Passo 4: pronto para jogar
      marcarPasso(3);
      tapete.dataset.fase = "pronto";
    }

    reiniciar();
    tela.querySelector("#tapete-repetir").addEventListener("click", jogar);

    // Começa sozinha quando quase metade do tapete aparece na tela (só uma vez).
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas[0].isIntersecting) {
          observador.disconnect();
          jogar();
        }
      },
      { threshold: 0.45 },
    );
    observador.observe(tapete);
  }

  // ============================================================
  // 4. Poder Astral: os números contando
  // ============================================================
  function montarExemplo() {
    const bloco = tela.querySelector("#exemplo-mario");
    const numeros = bloco.querySelectorAll("b[data-alvo]");
    let rodada = 0; // mesmo truque do tapete para poder repetir no meio

    // Conta de 0 até "alvo" em "duracao" ms, começando rápido e freando no fim.
    function contarAte(elemento, alvo, duracao, minhaRodada) {
      return new Promise((terminar) => {
        const inicio = performance.now();
        function quadro(agora) {
          if (minhaRodada !== rodada) return terminar();
          const progresso = Math.min(1, (agora - inicio) / duracao); // de 0 a 1
          const freado = 1 - Math.pow(1 - progresso, 3); // curva que desacelera no final
          elemento.textContent = String(Math.round(alvo * freado));
          if (progresso < 1) requestAnimationFrame(quadro);
          else terminar();
        }
        requestAnimationFrame(quadro);
      });
    }

    async function contar() {
      rodada++;
      const minhaRodada = rodada;
      bloco.classList.remove("pronto");
      for (const n of numeros) n.textContent = "0";

      if (reduzirMovimento()) {
        for (const n of numeros) n.textContent = n.dataset.alvo;
        bloco.classList.add("pronto");
        return;
      }

      // Um número de cada vez
      for (const n of numeros) {
        const alvo = Number(n.dataset.alvo);
        const duracao = alvo > 60 ? 900 : 450; // números grandes demoram mais
        await contarAte(n, alvo, duracao, minhaRodada);
        if (minhaRodada !== rodada) return;
        await esperar(180);
      }
      bloco.classList.add("pronto");
    }

    tela.querySelector("#exemplo-repetir").addEventListener("click", contar);
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas[0].isIntersecting) {
          observador.disconnect();
          contar();
        }
      },
      { threshold: 0.6 },
    );
    observador.observe(bloco);
  }

  // ============================================================
  // 5 e 6. Estigmas e Condições de Vitória: janela com a arte grande
  // ============================================================
  // Cada card tem data-detalhe="nome". O texto completo fica num <template id="det-nome">
  // no index.html (assim o texto continua no HTML, e não no JavaScript).
  function montarDetalhes() {
    const cards = tela.querySelectorAll("[data-detalhe]");
    let janela = null;
    let quemAbriu = null;

    function fechar() {
      if (!janela) return;
      document.removeEventListener("keydown", aoTeclar);
      janela.remove();
      janela = null;
      document.body.classList.remove("no-scroll");
      if (quemAbriu) quemAbriu.focus(); // o foco volta para o card clicado
    }

    // Esc fecha. Tab fica preso dentro da janela.
    function aoTeclar(e) {
      if (e.key === "Escape") fechar();
      if (e.key === "Tab") {
        const focaveis = janela.querySelectorAll("button, [tabindex='0']");
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
    }

    function abrir(card) {
      const chave = card.dataset.detalhe;
      const modelo = document.getElementById(`det-${chave}`);
      if (!modelo || janela) return;
      quemAbriu = card;

      // A cor da janela é a mesma do card (variável --aura-rgb)
      const cor = getComputedStyle(card).getPropertyValue("--aura-rgb");
      const icone = card.querySelector("img");

      janela = document.createElement("div");
      janela.className = "det-fundo";
      janela.style.setProperty("--aura-rgb", cor);
      janela.innerHTML = `
        <div class="det-caixa" role="dialog" aria-modal="true" aria-labelledby="det-titulo">
          <button type="button" class="det-fechar" aria-label="Fechar">×</button>
          <figure class="det-arte"><img src="${modelo.dataset.img}" alt=""></figure>
          <div class="det-texto" tabindex="0">
            <p class="det-tipo">${modelo.dataset.tipo}</p>
            <h3 id="det-titulo">${modelo.dataset.titulo}</h3>
          </div>
        </div>`;
      // O texto da arte grande é o mesmo do ícone pequeno (já descreve a imagem)
      janela.querySelector(".det-arte img").alt = icone ? icone.alt : "";
      // Copia o conteúdo do <template> para dentro da janela
      janela.querySelector(".det-texto").appendChild(modelo.content.cloneNode(true));

      document.body.appendChild(janela);
      document.body.classList.add("no-scroll");
      document.addEventListener("keydown", aoTeclar);

      // Clicar no × ou fora da caixa fecha
      janela.addEventListener("click", (e) => {
        if (e.target === janela || e.target.closest(".det-fechar")) fechar();
      });
      janela.querySelector(".det-fechar").focus();
    }

    for (const card of cards) {
      card.addEventListener("click", () => abrir(card));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          abrir(card);
        }
      });
    }
  }

  // ============================================================
  // Índice da página e entrada dos blocos
  // ============================================================
  function montarNavegacao() {
    tela.addEventListener("click", (e) => {
      // Links do índice: rolam até a seção
      const linkIndice = e.target.closest("[data-rit-ir]");
      if (linkIndice) {
        e.preventDefault();
        const secao = document.getElementById(linkIndice.dataset.ritIr);
        if (secao) secao.scrollIntoView({ behavior: rolagem(), block: "start" });
        return;
      }
      // Botões que levam para outra aba
      const botaoAba = e.target.closest("[data-ir]");
      if (botaoAba) {
        const link = document.querySelector(`.nav-links a[data-target="${botaoAba.dataset.ir}"]`);
        if (link) link.click();
      }
    });

    // O índice marca a seção que está no meio da tela.
    // O rootMargin encolhe a "área observada" para uma faixa perto do meio.
    const links = tela.querySelectorAll(".ritual-indice a");
    const observadorIndice = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          for (const link of links) {
            if (link.dataset.ritIr === entrada.target.id) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
          }
        }
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    for (const secao of tela.querySelectorAll(".rit-secao[id]")) observadorIndice.observe(secao);

    // Blocos que aparecem subindo quando entram na tela (classe "visto" no CSS).
    if (!reduzirMovimento()) {
      tela.classList.add("js-reveal");
      const observadorEntrada = new IntersectionObserver(
        (entradas) => {
          for (const entrada of entradas) {
            if (entrada.isIntersecting) {
              entrada.target.classList.add("visto");
              observadorEntrada.unobserve(entrada.target);
            }
          }
        },
        { rootMargin: "0px 0px -10% 0px" },
      );
      const blocos = tela.querySelectorAll(".fase, .estigma, .vit, .aura-item, .rit-cab, .resolucao li");
      blocos.forEach((bloco, i) => {
        bloco.style.setProperty("--i", String(i % 4)); // atraso em grupos de 4
        observadorEntrada.observe(bloco);
      });
    }
  }

  function montar() {
    if (montada) return;
    montada = true;
    montarNavegacao();
    montarAnatomia();
    montarTapete();
    montarExemplo();
    montarDetalhes();
  }

  document.addEventListener("screenchange", (e) => {
    if (e.detail.id === "ritual") {
      montar();
      window.scrollTo(0, 0);
    }
  });
}
