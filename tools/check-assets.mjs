#!/usr/bin/env node
/**
 * Confere se TODAS as imagens usadas pelo site existem, com a caixa (maiúsculas/
 * minúsculas) exata. No Windows "imagens/" e "Imagens/" funcionam igual, mas no
 * GitHub Pages / Netlify / Vercel (Linux) são pastas diferentes e a imagem dá 404.
 *
 * Uso (na raiz do projeto):
 *   node tools/check-assets.mjs          confere e lista problemas
 *   node tools/check-assets.mjs --list   só lista todos os caminhos referenciados
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve, relative, posix } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const APENAS_LISTAR = process.argv.includes("--list");
const EXT_IMAGEM = /\.(png|jpe?g|gif|webp|svg|ico|avif|mp3|ogg|wav|mp4|webm)$/i;

/** Percorre pastas em busca de arquivos com certas extensões. */
function arquivos(pasta, extensoes, achados = []) {
  for (const nome of readdirSync(pasta)) {
    if (["node_modules", ".git", "tools"].includes(nome)) continue;
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) arquivos(caminho, extensoes, achados);
    else if (extensoes.some((e) => nome.endsWith(e))) achados.push(caminho);
  }
  return achados;
}

/** { caminho (relativo à raiz, com "/"): [arquivos que o usam] } */
function coletarReferencias() {
  const refs = new Map();
  const adicionar = (caminho, origem) => {
    if (!caminho || caminho.includes("${") || /^(https?:|data:|#)/.test(caminho)) return;
    const limpo = decodeURIComponent(caminho.split(/[?#]/)[0]);
    if (!EXT_IMAGEM.test(limpo)) return;
    const norm = posix.normalize(limpo.replaceAll("\\", "/"));
    if (!refs.has(norm)) refs.set(norm, new Set());
    refs.get(norm).add(origem);
  };

  for (const arq of arquivos(RAIZ, [".html", ".css", ".js"])) {
    const texto = readFileSync(arq, "utf8");
    const origem = relative(RAIZ, arq).replaceAll("\\", "/");
    const base = posix.dirname(origem); // pasta do arquivo, para resolver urls de CSS

    if (arq.endsWith(".css")) {
      for (const m of texto.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g))
        adicionar(posix.join(base, m[1]), origem);
    } else if (arq.endsWith(".html")) {
      for (const m of texto.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g))
        adicionar(m[1], origem);
    } else {
      // JS: textos entre aspas; os caminhos são relativos ao index.html.
      for (const m of texto.matchAll(/(["'`])((?:(?!\1)[^\n\\])*?\.[A-Za-z0-9]{2,4})\1/g))
        adicionar(m[2], origem);
    }
  }
  return refs;
}

/** Procura o arquivo segmento a segmento, exigindo a mesma caixa. */
function verificar(caminho) {
  let atual = RAIZ;
  const real = [];
  for (const segmento of caminho.split("/")) {
    if (!existsSync(atual) || !statSync(atual).isDirectory()) return { status: "ausente" };
    const itens = readdirSync(atual);
    if (itens.includes(segmento)) {
      real.push(segmento);
      atual = join(atual, segmento);
      continue;
    }
    const parecido = itens.find((i) => i.toLowerCase() === segmento.toLowerCase());
    if (!parecido) return { status: "ausente" };
    real.push(parecido);
    atual = join(atual, parecido);
  }
  const igual = real.join("/") === caminho;
  return igual ? { status: "ok" } : { status: "caixa", real: real.join("/") };
}

const refs = coletarReferencias();

if (APENAS_LISTAR) {
  [...refs.keys()].sort().forEach((c) => console.log(c));
  process.exit(0);
}

const ausentes = [];
const caixa = [];
for (const [caminho, origens] of [...refs].sort()) {
  const r = verificar(caminho);
  if (r.status === "ausente") ausentes.push([caminho, origens]);
  if (r.status === "caixa") caixa.push([caminho, r.real, origens]);
}

console.log(`\n${refs.size} imagens referenciadas no código.\n`);

if (caixa.length) {
  console.log(`⚠  CAIXA DIFERENTE (funciona no Windows, QUEBRA no deploy): ${caixa.length}`);
  for (const [usado, real, origens] of caixa)
    console.log(`   código: ${usado}\n   disco:  ${real}\n   em:     ${[...origens].join(", ")}\n`);
}
if (ausentes.length) {
  console.log(`✗  NÃO ENCONTRADAS: ${ausentes.length}`);
  for (const [usado, origens] of ausentes) console.log(`   ${usado}   (em ${[...origens].join(", ")})`);
  console.log();
}
if (!caixa.length && !ausentes.length) console.log("✓ Todas as imagens existem com a caixa exata.\n");

process.exit(caixa.length || ausentes.length ? 1 : 0);
