<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as Phaser from 'phaser';
import { OfficeScene } from '../game/OfficeScene.js';
const contenidorJoc = ref(null);
const emit = defineEmits(['canviZona','preparat','interaccio']);
let game;
function bloquejarControls(estat) { game?.scene.getScene('OfficeScene')?.bloquejarControls(estat); }
defineExpose({ bloquejarControls });
onMounted(() => {
  game = new Phaser.Game({ type:Phaser.AUTO, width:800, height:576, parent:contenidorJoc.value, pixelArt:true, backgroundColor:'#dce4df', scale:{ mode:Phaser.Scale.FIT, autoCenter:Phaser.Scale.CENTER_BOTH }, physics:{ default:'arcade',arcade:{debug:false} }, scene:[OfficeScene], callbacks:{ preBoot(g) { g.events.on('canvi-zona',z=>emit('canviZona',z)); g.events.on('preparat',()=>emit('preparat')); g.events.on('interaccio',()=>emit('interaccio')); } } });
});
onBeforeUnmount(() => { game?.events.removeAllListeners(); game?.destroy(true); });
</script>
<template><div ref="contenidorJoc" class="game-canvas" aria-label="Mapa de l’oficina. Mou en George amb WASD o les fletxes."></div></template>
