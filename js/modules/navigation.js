// Navegação do site.
// O site é uma página só (SPA): as abas são <section class="screen"> e só uma
// fica visível. O endereço ganha um #hash (#codice, #lore...), então o botão
// Voltar do navegador e os links diretos funcionam.
// No celular, o menu vira uma gaveta lateral.

const TITULO_BASE = "Smash Deck TCG";

export function initNavigation() {
  const nav = document.getElementById("hud-menu");
  const botaoMenu = document.getElementById("mobile-menu-btn");
  const overlay = document.getElementById("menu-overlay");
  const links = [...document.querySelectorAll(".nav-links a")];
  const telas = [...document.querySelectorAll(".screen")];
  const idsValidos = telas.map((tela) => tela.id); // ["home", "codice", ...]

  // ---------- Gaveta (menu mobile) ----------
  function gavetaAberta() {
    return nav.classList.contains("drawer-open");
  }

  function alternarGaveta(abrir = !gavetaAberta()) {
    nav.classList.toggle("drawer-open", abrir);
    overlay.classList.toggle("active", abrir);
    document.body.classList.toggle("no-scroll", abrir);
    botaoMenu.setAttribute("aria-expanded", String(abrir));
    botaoMenu.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
    if (abrir) links[0].focus();
  }

  botaoMenu.addEventListener("click", () => alternarGaveta());
  overlay.addEventListener("click", () => alternarGaveta(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && gavetaAberta()) {
      alternarGaveta(false);
      botaoMenu.focus();
    }
  });
  // Ao voltar para a tela larga, a gaveta não pode ficar "presa" aberta.
  window.matchMedia("(min-width: 1321px)").addEventListener("change", (e) => {
    if (e.matches) alternarGaveta(false);
  });

  // ---------- Abas ----------
  // moverFoco: leva o foco para o título da aba (ajuda quem usa leitor de tela)
  function mostrarTela(id, moverFoco = false) {
    const tela = document.getElementById(id);
    if (!tela) return;

    for (const t of telas) t.classList.remove("active", "fade-in");
    tela.classList.add("active", "fade-in");

    for (const link of links) {
      const ativo = link.dataset.target === id;
      link.classList.toggle("active", ativo);
      if (ativo) {
        link.setAttribute("aria-current", "page");
        document.title = `${link.textContent.trim()} | ${TITULO_BASE}`;
      } else {
        link.removeAttribute("aria-current");
      }
    }

    window.scrollTo(0, 0);
    if (moverFoco) {
      const titulo = tela.querySelector("h1");
      if (titulo) titulo.focus({ preventScroll: true });
    }

    // Evento criado por mim: avisa os outros arquivos que uma aba apareceu.
    // Assim cada aba só monta o seu conteúdo quando alguém abre ela.
    document.dispatchEvent(new CustomEvent("screenchange", { detail: { id } }));
  }

  // A aba que está no endereço agora ("#codice" vira "codice"; sem # é a home).
  // O Códice pode ter filtros depois do "?" (#codice?classe=trevas): eles ficam de fora aqui.
  function abaDoEndereco() {
    const semFiltros = location.hash.slice(1).split("?")[0];
    return semFiltros || "home";
  }

  for (const link of links) {
    link.addEventListener("click", (e) => {
      e.preventDefault(); // não deixa o navegador pular para a âncora
      const id = link.dataset.target;
      // pushState muda o endereço sem recarregar a página
      if (id !== abaDoEndereco()) history.pushState(null, "", `#${id}`);
      mostrarTela(id, true);
      alternarGaveta(false);
    });
  }

  // Links fora do menu (rodapé, por exemplo) que levam para uma aba:
  // clico no link do menu, para seguir o mesmo caminho.
  for (const atalho of document.querySelectorAll("[data-ir-aba]")) {
    atalho.addEventListener("click", (e) => {
      e.preventDefault();
      const link = links.find((l) => l.dataset.target === atalho.dataset.irAba);
      if (link) link.click();
    });
  }

  // Botões Voltar e Avançar do navegador. Endereços que não são abas são ignorados.
  window.addEventListener("popstate", () => {
    const id = abaDoEndereco();
    if (idsValidos.includes(id)) mostrarTela(id);
  });

  // Ao abrir o site (ou apertar F5), mostra a aba que está no endereço.
  const inicial = abaDoEndereco();
  mostrarTela(idsValidos.includes(inicial) ? inicial : "home");

  // Abrindo o site direto em "#lore", o navegador pula sozinho até o elemento com id="lore"
  // quando a página termina de carregar. Aqui eu volto para o topo depois disso.
  window.addEventListener("load", () => window.scrollTo(0, 0));
}
