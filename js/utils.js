// Funções pequenas que vários arquivos do site usam.
// Antes cada arquivo tinha a sua cópia; agora ficam todas aqui.

// Cor padrão (azul do Nexo) para quando a carta não tem classe.
export const COR_PADRAO = "150, 170, 255";

// Troca os caracteres especiais do HTML por códigos seguros.
// Uso antes de colocar um texto dentro de innerHTML.
const CODIGOS_HTML = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function esc(texto) {
  if (texto === undefined || texto === null) return "";
  return String(texto).replace(/[&<>"']/g, (letra) => CODIGOS_HTML[letra]);
}

// true quando a pessoa ligou "reduzir movimento" no sistema.
// Nesse caso o site mostra tudo pronto, sem animação.
export function reduzirMovimento() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Rolagem suave, ou instantânea para quem pediu "reduzir movimento".
// Uso: elemento.scrollIntoView({ behavior: rolagem() })
export function rolagem() {
  return reduzirMovimento() ? "auto" : "smooth";
}

// Roda a função quando o navegador estiver sem nada para fazer.
// O Safari não tem requestIdleCallback, então lá espero 1,5 segundo.
export function quandoLivre(funcao) {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(funcao);
  } else {
    setTimeout(funcao, 1500);
  }
}
