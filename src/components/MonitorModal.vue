<script setup>
import { ref, watch, onBeforeUnmount } from "vue";

/**
 * Aquesta finestra és un COMPONENT VUE. Vue crea el diàleg, el títol i el destí
 * buit del vídeo, però NO crea un altre <video>. RoomMonitor hi mou el seu node
 * original quan rep l'ordre obrir-modal i el retorna al mapa en tancar-modal.
 * Això permet estudiar dues responsabilitats separades sense duplicar l'àudio.
 */
const props = defineProps({
  obert: Boolean,
  titol: String,
  destiId: { type: String, required: true },
  controlsBloquejats: Boolean,
});
const emit = defineEmits(["tancar"]);
const dialog = ref(null);
const botoTancar = ref(null);
let focusAnterior;

watch(
  () => props.obert,
  (obert) => {
    if (obert) {
      focusAnterior = document.activeElement;
      // showModal() posa la finestra sobre el canvas i la capa DOM de Phaser,
      // manté el focus a dins i deixa la resta de la pàgina inerta.
      dialog.value.showModal();
      botoTancar.value.focus();
    } else {
      dialog.value.close();
      if (focusAnterior?.isConnected) focusAnterior.focus();
    }
  },
  { flush: "post" },
);

function clicarFons(event) {
  // El backdrop d'un <dialog> no és un fill HTML. Comprovem els límits reals:
  // un clic al vídeo o al marge interior no ha de tancar accidentalment la finestra.
  if (event.target !== dialog.value) return;
  const r = dialog.value.getBoundingClientRect();
  if (
    event.clientX < r.left ||
    event.clientX > r.right ||
    event.clientY < r.top ||
    event.clientY > r.bottom
  )
    emit("tancar");
}

// El pare envia tancar-modal abans d'amagar/desmuntar aquest component: el vídeo
// torna al seu DOMElement abans que Vue retiri la finestra.
onBeforeUnmount(() => {
  dialog.value?.close();
});
</script>

<template>
  <dialog
    ref="dialog"
    class="monitor-modal"
    aria-labelledby="monitor-modal-title"
    @cancel.prevent="emit('tancar')"
    @click="clicarFons"
  >
    <header class="monitor-modal-header">
      <div>
        <div class="eyebrow">MONITOR DE SALA · FINESTRA VUE</div>
        <h2 id="monitor-modal-title">{{ titol }}</h2>
      </div>
      <button
        ref="botoTancar"
        type="button"
        @click="emit('tancar')"
        aria-label="Tancar finestra modal"
      >
        Tancar ✕
      </button>
    </header>
    <!-- Punt de muntatge persistent, amb un ID de Vue. El bus només passa aquest
         identificador (una dada plana); cap node DOM ni instància Vue viatja al bus. -->
    <div :id="destiId" class="monitor-modal-video"></div>
    <div class="monitor-modal-footer" role="status">
      <span>{{
        controlsBloquejats
          ? "● WASD i fletxes desactivats"
          : "Preparant el monitor…"
      }}</span>
      <span><kbd>Esc</kbd> per tornar al mapa</span>
    </div>
  </dialog>
</template>

<style scoped>
.monitor-modal {
  width: min(640px, calc(100vw - 32px));
  max-width: none;
  max-height: calc(100dvh - 48px);
  padding: 0;
  border: 1px solid #6d9f83;
  border-radius: 14px;
  background: #19372e;
  color: #edf4eb;
  box-shadow: 0 25px 100px #10271e66;
  overflow: auto;
}
.monitor-modal::backdrop {
  background: #10271fb0;
  backdrop-filter: blur(3px);
}
.monitor-modal-header {
  height: auto;
  margin: 0;
  padding: 20px 22px;
  border-bottom: 1px solid #3e5f4c;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  letter-spacing: normal;
}
.monitor-modal-header .eyebrow {
  font-size: 9px;
  color: #a1c6aa;
  letter-spacing: 1.2px;
}
.monitor-modal-header h2 {
  font-size: 19px;
  margin: 7px 0 0;
  color: #edf4eb;
}
.monitor-modal-header button {
  background: #315a43;
  border: 1px solid #719c78;
  color: #fff;
  border-radius: 6px;
  padding: 9px 12px;
  font-size: 11px;
  white-space: nowrap;
}
.monitor-modal-video {
  height: min(360px, 50dvh);
  background: #0b1e17;
}
.monitor-modal-video :deep(video) {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #0b1e17;
}
.monitor-modal-footer {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 22px;
  font-size: 10px;
  color: #bdd6bb;
}
.monitor-modal-footer kbd {
  background: #31543a;
  color: #e1ecda;
  border-color: #63815d;
}
@media (max-width: 480px) {
  .monitor-modal-header {
    padding: 16px;
  }
  .monitor-modal-header h2 {
    font-size: 15px;
  }
  .monitor-modal-header .eyebrow {
    font-size: 7px;
  }
  .monitor-modal-footer {
    padding: 14px 16px;
    font-size: 9px;
    flex-wrap: wrap;
  }
}
</style>
