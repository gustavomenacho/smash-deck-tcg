// As seis classes (linhagens) do jogo. Este arquivo só tem dados.
//   rgb: a cor da linhagem
//   rgbTexto: um tom mais claro para texto, quando a cor é escura demais (opcional)
//   rgbSobre: a cor do texto escrito em cima da cor da linhagem (opcional)
//   regra: o bônus em cada atributo (ataque, defesa, tecnica)
//   regraForte: o bônus maior das Lendas do Crime, e condicaoForte diz quando ele vale
export const ORDEM_CLASSES = ["soberano", "trevas", "combate", "sentinela", "crime", "caos"];

export const classes = {
  soberano: {
    nome: "Soberanos",
    subtitulo: "Os Arquitetos da Indústria",
    pin: "imagens/selos/pin-soberano.png",
    rgb: "237, 184, 33",
    bonus: "+5 em ATK, DEF e TECH",
    resumo: "A classe mais versátil e equilibrada do jogo.",
    destaque: 'A realeza absoluta dos videogames.',
    identidade: 'Os Soberanos reúnem os pioneiros, os mascotes e os grandes arquitetos que pavimentaram a indústria do entretenimento. Por serem as lendas mais completas e versáteis do Nexo, eles não dependem de truques sujos: ostentam um equilíbrio impecável e trazem para a mesa habilidades de adaptabilidade pura.',
    regra: { ataque: 5, defesa: 5, tecnica: 5 },
    comentario:
      "Por oferecer bônus em todos os atributos simultaneamente, os Soberanos são ideais para jogadores que preferem uma estratégia adaptável, sendo capazes de responder a qualquer tipo de desafio com a mesma eficiência.",
    pontos: [
      ["Versatilidade", "É a única classe que oferece um bônus constante, independente de qual atributo o Atacante escolher para o duelo."],
      ["Equilíbrio", "Ideal para lendas que possuem números sólidos em todas as frentes (como Mario ou Link), garantindo uma vantagem mínima de 5 pontos."],
    ],
    criterio:
      "Para ingressar nesta linhagem, o personagem deve ser um pilar fundamental da história dos videogames. Aqui residem as lendas que pavimentaram o caminho, definiram gêneros inteiros e transformaram o entretenimento digital em um fenômeno global. Foram escolhidos por sua versatilidade, representando a base sólida sobre a qual toda a Arena foi construída.",
  },
  trevas: {
    nome: "Forças das Trevas",
    subtitulo: "A Necessidade do Conflito",
    pin: "imagens/selos/pin-trevas.png",
    rgb: "219, 116, 39",
    bonus: "+10 em ATK",
    resumo: "A classe de maior impacto ofensivo do jogo.",
    destaque: 'Os catalisadores do pesadelo.',
    identidade: 'Esta classe reúne os grandes chefões, monstros e mentes diabólicas que forçam os heróis a evoluir. As Forças das Trevas não jogam para empatar: com um foco brutal em ofensiva, eles esmagam a oposição usando puro poder de ataque e habilidades impiedosas que infectam e debilitam o inimigo.',
    regra: { ataque: 10, defesa: 0, tecnica: 0 },
    comentario:
      "Voltada para o esmagamento bruto, as Forças das Trevas funcionam como um rolo compressor na Arena; seu foco total em bônus de Ataque obriga o oponente a jogar defensivamente.",
    pontos: [
      ["Foco Ofensivo", "Esta classe é voltada para a destruição bruta. O bônus de +10 só é contabilizado se o duelo ocorrer no domínio do Ataque."],
    ],
    criterio:
      "Os vilões desta classe não são apenas malvados; eles são as forças catalisadoras que obrigam os heróis a evoluírem. Escolhemos personagens que personificam o esmagamento bruto e a imposição de vontade. Eles estão aqui porque sua presença na história dos jogos representa o desafio definitivo, o \"chefe final\" que exige nada menos que a perfeição ofensiva para ser superado.",
  },
  combate: {
    nome: "Mestres do Combate",
    subtitulo: "A Poesia do Movimento",
    pin: "imagens/selos/pin-combate.png",
    rgb: "83, 218, 248",
    bonus: "+10 em TECH",
    resumo: "A classe da precisão e do contra-ataque técnico.",
    destaque: 'A elite marcial do Nexo.',
    identidade: 'Os Mestres do Combate abrigam os lutadores mais icônicos, ninjas e guerreiros de torneio de todos os tempos. Suas mecânicas traduzem os movimentos e combos dos fliperamas diretamente para as cartas. Com foco na precisão e na técnica impecável, eles ditam o ritmo da batalha desferindo golpes clássicos inesquecíveis.',
    regra: { ataque: 0, defesa: 0, tecnica: 10 },
    comentario:
      "Os Mestres do Combate recompensam a leitura de jogo, pois utilizam seu alto bônus de Técnica para superar adversários fisicamente mais fortes.",
    pontos: [
      ["Maestria Mística", "Representa a técnica apurada e o uso de energias especiais. O bônus de +10 é aplicado apenas em confrontos de Técnica."],
      ["Estratégia", "Personagens como Ryu, Ken e Sora dependem deste bônus para sobrepujar oponentes que possuem mais força física, mas menos astúcia."],
    ],
    criterio:
      "Esta classe abriga as lendas cuja existência é definida pelo aperfeiçoamento da técnica. Foram escolhidos personagens que transformaram o combate em uma forma de arte, priorizando a precisão e a estratégia mística sobre a força bruta. Eles representam a era de ouro dos jogos de luta e ação, onde a vitória pertence àquele que possui o reflexo mais apurado e a melhor leitura de jogo.",
  },
  sentinela: {
    nome: "Sentinelas",
    subtitulo: "Os Baluartes da Sobrevivência",
    pin: "imagens/selos/pin-sentinela.png",
    rgb: "118, 118, 118",
    rgbTexto: "185, 185, 185", // cinza mais claro só para textos (legível no fundo escuro)
    bonus: "+10 em DEF",
    resumo: "A classe de resistência e controle de dano.",
    destaque: 'A linha de frente da sobrevivência.',
    identidade: 'Os Sentinelas são formados pelos grandes sobreviventes, atiradores e agentes táticos dos games. Habituados a lutar contra hordas quase impossíveis, as habilidades desta classe giram em torno de equipamento, contra-ataque e resiliência máxima. Eles são os pilares da defesa que simplesmente se recusam a cair.',
    regra: { ataque: 0, defesa: 10, tecnica: 0 },
    comentario:
      "Funcionando como uma muralha viva, os Sentinelas são especialistas em frustrar as investidas ofensivas do oponente para vencer pelo cansaço.",
    pontos: [
      ["Muralha Intransponível", "Esta classe foca na sobrevivência e na resistência. O bônus de +10 só entra no cálculo se o domínio da rodada for a Defesa."],
      ["Contra-Ataque", "Excelente para lendas como Master Chief e Marcus Fenix, que buscam resistir e vencer pela exaustão defensiva do inimigo."],
    ],
    criterio:
      "Foram selecionados para esta classe os heróis que enfrentaram as probabilidades mais sombrias e se recusaram a cair. O critério aqui é a resistência inabalável. São personagens que definiram o gênero de tiro, sobrevivência e exploração militar, servindo como a muralha que protege seus mundos. Eles estão aqui para ensinar que, muitas vezes, vencer significa simplesmente ser o último a permanecer em pé.",
  },
  crime: {
    nome: "Lendas do Crime",
    subtitulo: "Os Rebeldes do Sistema",
    pin: "imagens/selos/pin-crime.png",
    rgb: "101, 59, 33",
    rgbTexto: "200, 152, 110", // marrom claro só para textos (o #653B21 some no fundo escuro)
    rgbSobre: "245, 236, 226", // texto claro sobre o fundo marrom (botões cheios)
    bonus: "+5 ATK · +15 contra Soberanos, Sentinelas e Trevas",
    resumo: "O mecanismo de equilíbrio contra as lendas mais poderosas.",
    destaque: 'Os rebeldes que ditam as próprias regras.',
    identidade: 'A classe das Lendas do Crime é formada por anti-heróis, mafiosos, assassinos furtivos e foras-da-lei. Perigosos e imprevisíveis, eles vencem roubando atributos, manipulando as leis da matemática e usando o próprio bando a seu favor. Eles são a resposta impiedosa das ruas contra o poder dos chefões.',
    regra: { ataque: 5, defesa: 0, tecnica: 0 },
    regraForte: { ataque: 15 },
    condicaoForte: "O oponente é Soberano, Sentinela ou das Forças das Trevas",
    comentario:
      "Uma das classes mais estratégicas do jogo, pois funciona como um mecanismo de equilíbrio contra as lendas mais poderosas. Sua natureza oportunista pune severamente os \"Chefões\" e as classes de autoridade.",
    pontos: [
      ["Oportunismo", "Ganham um bônus leve de +5 em Ataque contra lendas comuns."],
      ["Anti-Sistema", "O bônus triplica para +15 quando enfrentam os representantes do poder estabelecido: Soberanos, Sentinelas e Forças das Trevas (os chefões)."],
      ["Exemplo", "O bônus de Arthur Morgan contra Mario (Soberano), Master Chief (Sentinela) ou Bowser (Trevas) será sempre +15; contra Cloud (Combate) ou Geralt (Caos), +5."],
    ],
    criterio:
      "Esta classe foca nos anti-heróis e foras-da-lei que desafiaram as regras estabelecidas, tanto na narrativa quanto no design de jogos. Foram escolhidos por sua natureza oportunista e estratégica. Eles representam a quebra de paradigmas e o equilíbrio de poder, servindo no Smash Deck como o mecanismo necessário para garantir que nenhuma lenda se torne poderosa demais para ser contestada.",
  },
  caos: {
    nome: "Caos e Magia",
    subtitulo: "A Essência do Imprevisível",
    pin: "imagens/selos/pin-caos.png",
    rgb: "138, 74, 168",
    bonus: "+10 em TECH · Imune ao estigma Desvinculado",
    resumo: "A classe da resiliência mística e do imprevisível.",
    destaque: 'Aqueles que operam muito além da lógica.',
    identidade: 'A classe Caos e Magia é a essência pura do video game, englobando desde a bruxaria ancestral e sinais mágicos até quebras completas da quarta parede e física de cartoons. Suas mecânicas trazem para a mesa distorções da realidade que viram as regras da partida do avesso de forma totalmente caótica.',
    regra: { ataque: 0, defesa: 0, tecnica: 10 },
    comentario:
      "Ocupando o posto de baralho mais difícil de ser neutralizado, o Caos oferece segurança contra estratégias de bloqueio e estigmas que retiram bônus.",
    pontos: [
      ["Imprevisibilidade", "Esta é a única classe que não pode ser silenciada por habilidades que aplicam o estigma Desvinculado."],
      ["Inviolável", "Mesmo sob o efeito de habilidades que tentem retirar as raízes da lenda, o bônus de +10 do Caos permanece ativo."],
    ],
    criterio:
      "Os escolhidos para esta classe são seres que operam fora das leis da lógica e da física convencional. O critério de seleção é a resiliência mística e a capacidade de alterar a realidade ao seu redor. Eles representam o lado fantástico e lúdico dos videogames, garantindo que o bônus da imaginação seja imune a qualquer tentativa de silenciamento ou bloqueio.",
  },
};

// Monta as variáveis CSS com as cores de uma linhagem, para usar em style="...":
//   --aura-rgb: a cor da linhagem (bordas, fundos, brilhos)
//   --aura-txt: a cor do texto em fundo escuro
//   --aura-on: a cor do texto em cima da cor da linhagem (botões)
export function varsAura(chave) {
  const classe = classes[chave];
  if (!classe) return "";
  const corTexto = classe.rgbTexto || classe.rgb;
  const corSobre = classe.rgbSobre || "10, 14, 23";
  return `--aura-rgb:${classe.rgb};--aura-txt:${corTexto};--aura-on:${corSobre}`;
}
