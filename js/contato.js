// Meus contatos, num lugar só. Eles aparecem no rodapé e na aba "O Arquiteto".
// Se um campo ficar vazio (""), o botão dele some do site.
// No e-mail não precisa escrever "mailto:", o código coloca sozinho.

import { esc } from "./utils.js";

export const CONTATO = {
  github: "https://github.com/gustavomenacho",
  linkedin: "https://www.linkedin.com/in/gustavomenacho/",
  email: "menacho1996@gmail.com",
  curriculo: "downloads/curriculo-gustavo-menacho.pdf",
};

// A ordem desta lista é a ordem dos botões. O currículo vem primeiro: é o que o recrutador procura.
// naBio: true = esse contato também aparece nos botões ao lado da foto (aba O Arquiteto).
const ITENS = [
  { chave: "curriculo", curto: "Currículo", longo: "Baixar o currículo", externo: false, naBio: true },
  { chave: "linkedin", curto: "LinkedIn", longo: "Falar comigo no LinkedIn", externo: true, naBio: true },
  { chave: "email", curto: "E-mail", longo: "Enviar um e-mail", externo: false, naBio: true },
  { chave: "github", curto: "GitHub", longo: "Ver meu GitHub", externo: true, naBio: false },
];


// Monta um link de contato. O "tipo" vem do atributo data-contato-lista do HTML:
//   "botoes": botão grande (fim da aba O Arquiteto)
//   "bio":    botão médio, ao lado da foto (aba O Arquiteto)
//   vazio:    link pequeno (rodapé)
function htmlLink(item, tipo) {
  const valor = CONTATO[item.chave].trim();
  const href = item.chave === "email" ? `mailto:${valor}` : valor;

  let extra = "";
  if (item.externo) extra = ' target="_blank" rel="noopener noreferrer"'; // abre em outra aba, com segurança
  else if (item.chave === "curriculo") extra = " download"; // baixa o PDF

  let classe = "contato-link";
  let texto = item.curto;
  if (tipo === "botoes") {
    classe = item.chave === "curriculo" ? "cta-primario" : "cta-secundario";
    texto = item.longo;
  } else if (tipo === "bio") {
    classe = item.chave === "curriculo" ? "arq-bio-link principal" : "arq-bio-link";
  }

  return `<a class="${classe}" href="${esc(href)}"${extra}>${esc(texto)}</a>`;
}

export function initContato() {
  // Só os contatos preenchidos
  const preenchidos = ITENS.filter((item) => {
    const valor = CONTATO[item.chave];
    return valor && valor.trim() !== "";
  });

  for (const lista of document.querySelectorAll("[data-contato-lista]")) {
    const tipo = lista.dataset.contatoLista;
    let html = "";
    for (const item of preenchidos) {
      if (tipo === "bio" && !item.naBio) continue; // na bio, só os contatos marcados
      html += htmlLink(item, tipo);
    }
    lista.innerHTML = html;
  }

  // Os blocos de contato (título + texto) só aparecem se tiver pelo menos um contato.
  for (const bloco of document.querySelectorAll("[data-contato-bloco]")) {
    bloco.hidden = preenchidos.length === 0;
  }
}
