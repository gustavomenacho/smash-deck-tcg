# Smash Deck TCG

Site de um jogo de cartas colecionáveis autoral (TCG) com 103 lendas dos games, seis classes e um sistema de combate próprio (Tríade ATK/DEF/TECH, Poder Astral, Prioridades).

> **Projeto de fã, estritamente não comercial e educacional.** Os personagens pertencem aos seus respectivos detentores (indicados em cada carta). O sistema de regras, o design das cartas e o código são autorais.

Feito **somente com HTML, CSS e JavaScript (ES6+)**, sem frameworks, para praticar os fundamentos da web: manipulação do DOM, modularização, CSS avançado, responsividade e acessibilidade.

## Como rodar

O projeto usa módulos ES6 (`import`), que **não funcionam abrindo o `index.html` direto** (`file://`). Use um servidor local:

- VS Code: extensão **Live Server** → "Go Live"; ou
- Terminal: `npx serve .`

## Estrutura

```
index.html
CONTEXTO.md        resumo do projeto para retomar o trabalho (decisões, regras, pendências)
css/
  global.css       variáveis, fundo, camadas, acessibilidade
  layout.css       menu (barra no desktop / gaveta no celular), abas, rodapé
  cards.css        a carta: faces, HUD, atributos, grimório, giro 3D
  sections.css     Home (hero, altar, carrossel, zoom)
  codice.css, ficha.css, linhagens.css, lore.css, ritual.css, oficina.css, arquiteto.css
  reveal.css       entrada suave (fade-in) dos blocos
js/
  main.js          ponto de entrada
  cartas.js        banco de dados das cartas (somente dados)
  classes.js       as seis classes (cores, bônus, textos)
  lendas.js        textos longos das lendas (ficha)
  contato.js       GitHub, LinkedIn, e-mail e currículo (um só lugar)
  particles.js     partículas do fundo (canvas)
  modules/
    cardRenderer.js      HTML da carta (fonte única, usada em todo o site)
    cardInteractions.js  inclinação, virar carta (mouse, toque e teclado)
    cardZoom.js          zoom 3D da carta no carrossel
    codice.js            galeria do Códice (monta sob demanda)
    ficha.js             ficha da lenda
    linhagens.js         aba Linhagens
    lore.js              Crônicas do Confluente
    ritual.js            Manual do Jogador (anatomia, preparação, turno, exemplo do Poder Astral)
    oficina.js           Oficina do Nexo (conceitos de merchandising)
    arquiteto.js         O Arquiteto: assinatura que "se escreve" ao chegar na tela
    navigation.js        abas, histórico do navegador (#hash) e menu em gaveta
    home.js              slogan, HUD dos pilares e carrossel
    reveal.js            fade-in dos blocos de todas as abas
tools/
  check-assets.mjs       confere se todas as imagens existem (com a caixa exata)
```

## Decisões técnicas

- **Orientado a dados:** cada carta é um objeto em `cartas.js`; o HTML nasce de `renderCard()`. Para adicionar uma lenda, basta incluir um objeto.
- **Uma única função de renderização** para Códice e Home (antes o HTML da carta estava duplicado).
- **Responsivo:** menu em gaveta até 1320 px, galeria em CSS Grid, zoom da carta que se ajusta à tela. Interações funcionam com mouse, toque e teclado.
- **Navegação com URL:** cada aba tem um `#hash`, então o botão Voltar e links diretos funcionam.
- **Desempenho:** o Códice só renderiza as 104 cartas na primeira visita, imagens com `loading="lazy"`, partículas sem `shadowBlur` e com tratamento de `prefers-reduced-motion`.
- **Acessibilidade:** HTML semântico, `alt` nas artes, foco visível, `aria-expanded` no menu, link "Pular para o conteúdo".
- **Segurança básica:** textos entram nos templates com escape de HTML.

## Nomes dos arquivos de imagem

Tudo em minúsculas, sem acentos nem espaços (hífens no lugar), para funcionar igual no Windows e em servidores Linux:

```
imagens/
  artes/<classe>/arte-<nome>.jpg      ex.: artes/soberano/arte-pac-man.jpg
  selos/pin-<classe>.png              selo de cada linhagem
  prioridades/prioridade-<1..4>.png
  atributos/icone-ataque|defesa|tecnica.webp
  altar/base-<cor>.webp, energia-<cor>.webp
  fundos/fundo-<classe>.jpg           fundo de cada linhagem
  marca/logo-smash-deck.webp, favicon.png
  autor/gustavo-menacho.webp          foto da bio (520×520) · assinatura-gustavo.webp (traço marfim, fundo transparente)
  merch/                              artes conceituais da Oficina do Nexo (pins, deck box, tubo: tapete-e-tubo-conceito.jpg no card e tapete-e-tubo-mesa.jpg no modal, artbook-render.jpg, stickers-render.jpg, standees-render.jpg)
  ritual/                             cartas prontas do Manual do Jogador: mao-*.webp (mão de exemplo)
                                      e anatomia-mario.webp (Anatomia da Carta, 630×882, 2x)
  grimorios/livro-do-grimorio.png
downloads/
  livro-de-regras-leitura-digital.pdf, curriculo-gustavo-menacho.pdf
```

`<classe>` é a chave usada no código: soberano, trevas, combate, sentinela, crime, caos (e olvido).

## Antes de publicar

GitHub Pages, Netlify e Vercel rodam em Linux e diferenciam `Imagens/` de `imagens/`. Confira os caminhos:

```bash
node tools/check-assets.mjs
```

O comando lista imagens ausentes ou com a caixa diferente da pasta real no disco.

