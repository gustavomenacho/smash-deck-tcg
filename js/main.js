// Arquivo de entrada do site: liga cada parte.
// Como o index.html carrega este arquivo com type="module", ele só roda
// depois que o HTML está pronto, então não preciso esperar o DOMContentLoaded.

import "./particles.js";
import { installImageFallbacks } from "./modules/cardRenderer.js";
import { initNavigation } from "./modules/navigation.js";
import { initCodice } from "./modules/codice.js";
import { initLinhagens } from "./modules/linhagens.js";
import { initLore } from "./modules/lore.js";
import { initRitual } from "./modules/ritual.js";
import { initHomeEffects, initHomeCarousel, initHomeDuelo } from "./modules/home.js";
import { initOficina } from "./modules/oficina.js";
import { initReveal } from "./modules/reveal.js";
import { initContato } from "./contato.js";
import { initArquiteto } from "./modules/arquiteto.js";
import { cartas } from "./cartas.js";

installImageFallbacks();
initCodice(cartas); // as abas vêm antes da navegação: precisam estar ouvindo o "screenchange"
initLinhagens(cartas);
initLore(cartas);
initRitual(cartas);
initNavigation();
initHomeEffects(cartas);
initHomeCarousel(cartas);
initHomeDuelo(cartas);
initOficina();
initContato();
initArquiteto();
initReveal(); // por último: anima o conteúdo que as outras partes já montaram
