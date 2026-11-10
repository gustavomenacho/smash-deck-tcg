// Aba "O Arquiteto": a minha assinatura "se escreve" da esquerda para a direita
// quando aparece na tela, e escreve de novo a cada visita à aba.
// Sem JavaScript, ou com "reduzir movimento" ligado, ela já aparece pronta.
import { reduzirMovimento } from "../utils.js";

export function initArquiteto() {
  const assinatura = document.querySelector(".arq-assinatura");
  if (!assinatura) return;
  const semAnimacao = reduzirMovimento();
  if (semAnimacao || !("IntersectionObserver" in window)) return;

  // Quando 60% da assinatura aparece, a animação do CSS começa ("escrevendo")
  const observador = new IntersectionObserver(
    (entradas) => {
      if (!entradas[0].isIntersecting) return;
      observador.unobserve(assinatura);
      assinatura.classList.add("escrevendo");
    },
    { threshold: 0.6 },
  );

  function preparar() {
    assinatura.classList.remove("escrevendo");
    assinatura.classList.add("a-escrever"); // escondida até entrar na tela
    observador.observe(assinatura);
  }

  document.addEventListener("screenchange", (e) => {
    if (e.detail.id === "arquiteto") preparar();
  });
  preparar();
}
