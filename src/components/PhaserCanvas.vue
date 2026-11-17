<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import * as Phaser from "phaser";
import { OfficeScene } from "../game/OfficeScene.js";
import { OFFICE_EVENTS } from "../game/officeEvents.js";

const contenidorJoc = ref(null);
const emit = defineEmits([
  "canviZona",
  "preparat",
  "monitorSeleccionat",
  "monitorEstat",
]);
let game;

// El pont no crea ni busca vídeos: només transporta missatges.
// Vue coneix un ID i una acció; l'escena decideix quin monitor la pot executar.
function enviarOrdre(ordre) {
  game?.events.emit(OFFICE_EVENTS.COMMAND, ordre);
}
defineExpose({ enviarOrdre });

onMounted(() => {
  game = new Phaser.Game({
    type: Phaser.AUTO,
    width: 800,
    height: 576,
    // DOMElement necessita un pare que contingui canvas + capa HTML.
    parent: contenidorJoc.value,
    // NOVETAT: habilita el contenidor HTML superposat al canvas. Sense aquesta
    // opció, this.add.dom() fallaria. El pare no ha de capturar tots els clics!
    dom: { createContainer: true, pointerEvents: "none" },
    pixelArt: true,
    backgroundColor: "#dce4df",
    // FIT escala conjuntament el canvas i la capa DOM: les pantalles no es desalineen.
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: "arcade", arcade: { debug: false } },
    scene: [OfficeScene],
    callbacks: {
      preBoot(g) {
        // Registrem listeners abans de create() per no perdre els primers missatges.
        g.events.on(OFFICE_EVENTS.ZONE, (z) => emit("canviZona", z));
        g.events.on(OFFICE_EVENTS.SELECT, (m) => emit("monitorSeleccionat", m));
        g.events.on(OFFICE_EVENTS.STATE, (m) => emit("monitorEstat", m));
        g.events.on("preparat", () => emit("preparat"));
      },
    },
  });
});

// En destruir Phaser es tanca l'escena, que allibera els RoomMonitor i els seus vídeos.
onBeforeUnmount(() => {
  game?.destroy(true);
});
</script>

<template>
  <div
    ref="contenidorJoc"
    class="game-canvas"
    aria-label="Mapa de l’oficina. Mou en George amb WASD o les fletxes."
  ></div>
</template>
