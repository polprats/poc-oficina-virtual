<script setup>
import { ref, nextTick, onBeforeUnmount } from 'vue';
import PhaserCanvas from './components/PhaserCanvas.vue';
const zonaActiva = ref(null), refCanvas = ref(null), modalObert = ref(false), preparat = ref(false);
const video = ref(null), monitorHost = ref(null), modalHost = ref(null), dialog = ref(null), ampliar = ref(null);
const silenciat = ref(false), bloqueigAutoplay = ref(false), errorVideo = ref(false);
let returnFocus;
async function reproduir() {
  if (!video.value) return;
  video.value.muted = silenciat.value;
  try { await video.value.play(); bloqueigAutoplay.value = false; }
  catch (e) {
    if (e.name === 'NotAllowedError' && !silenciat.value) {
      silenciat.value = true; video.value.muted = true;
      try { await video.value.play(); bloqueigAutoplay.value = true; } catch { bloqueigAutoplay.value = true; }
    } else if (e.name !== 'AbortError') bloqueigAutoplay.value = true;
  }
}
async function canviZona(zona) {
  if (modalObert.value) tancarModalGran();
  video.value?.pause();
  zonaActiva.value = zona; errorVideo.value = false; bloqueigAutoplay.value = false;
  await nextTick();
  if (zona?.streamUrl) { video.value.load(); reproduir(); }
}
async function so() { silenciat.value = !silenciat.value; await reproduir(); }
async function interaccio() { if (bloqueigAutoplay.value && !errorVideo.value) await reproduir(); }
// Move the SAME video element between hosts: no duplicate audio or reset of playback.
async function obrirModalGran() {
  if (!zonaActiva.value?.streamUrl) return;
  returnFocus = document.activeElement;
  refCanvas.value.bloquejarControls(true); modalObert.value = true;
  await nextTick(); modalHost.value.appendChild(video.value); video.value.controls = true;
  dialog.value.showModal(); dialog.value.querySelector('button').focus();
}
function tancarModalGran() {
  if (!modalObert.value) return;
  monitorHost.value?.appendChild(video.value); video.value.controls = false;
  dialog.value.close(); modalObert.value = false; refCanvas.value?.bloquejarControls(false);
  returnFocus?.focus();
}
onBeforeUnmount(() => { video.value?.pause(); });
</script>

<template>
  <div class="app-shell">
    <nav class="rail" aria-label="Espai de treball"><a class="brand" href="#" aria-label="Espai inici">e<span>·</span></a><div class="rail-icons"><span class="selected" title="Oficina">▦</span><span title="Sales">▤</span></div><div class="avatar george-avatar" role="img" aria-label="George"></div></nav>
    <main>
      <header><div class="breadcrumb">EL TEU ESPAI DE TREBALL <span>/</span> OFICINA VIRTUAL</div><span class="connection"><i></i> Entorn de demostració</span></header>
      <div class="page-title"><div><div class="eyebrow">CONNECTA DES D’ON SIGUIS</div><h1>Un lloc per trobar-nos<span>.</span></h1><p>Entra en una sala. Comparteix el moment.</p></div><div class="date-tag">ESPAI <span>01</span></div></div>
      <div class="workspace">
        <section class="map-panel" aria-label="Oficina interactiva">
          <div class="panel-heading"><div><span class="status-dot"></span> La nostra oficina <span class="floor">Planta 01</span></div><span class="map-type">VISTA EN PLANTA ↗</span></div>
          <PhaserCanvas ref="refCanvas" @canvi-zona="canviZona" @preparat="preparat = true" @interaccio="interaccio" />
          <div class="map-footer"><span><i class="location-dot"></i>{{ zonaActiva?.nom || 'Espai comú' }}</span><span class="keys"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>o fletxes per moure’t</span></span></div>
          <div v-if="!preparat" class="loading">Preparant l’oficina…</div>
        </section>
        <aside>
          <section class="presence"><div class="section-label">ARA ETS A <span>↙</span></div><h2>{{ zonaActiva?.nom || 'Espai comú' }}</h2><p>{{ zonaActiva ? 'El monitor d’aquesta sala ja està disponible.' : 'Camina fins a una sala per activar el seu monitor.' }}</p><div class="person"><span class="person-avatar george-avatar" role="img" aria-label="George"><i></i></span><div><strong>George <small>(tu)</small></strong><span>Disponible per connectar</span></div><span class="person-status">EN LÍNIA</span></div></section>
          <section class="monitor-section"><div class="section-label">MONITOR DE SALA <span class="channel-badge">{{ zonaActiva ? 'ACTIU' : 'EN ESPERA' }}</span></div>
            <div v-if="!zonaActiva?.streamUrl" class="empty-monitor"><div class="monitor-symbol">▣<i></i></div><h3>La conversa comença aquí</h3><p>Entra a Reunions o a la Zona Cafè.<br>El canal s’activarà automàticament.</p><span>○ &nbsp; Sense àudio ni vídeo</span></div>
            <template v-else>
              <div class="monitor-info"><i></i><span>{{ zonaActiva.titolMonitor }}</span><span>MP4</span></div>
              <div class="video-frame" ref="monitorHost">
                <video ref="video" :src="zonaActiva.streamUrl" autoplay loop playsinline preload="auto" @error="errorVideo = true" @canplay="reproduir" aria-label="Vídeo de la sala"></video>
                <button ref="ampliar" class="expand-video" @click="obrirModalGran" aria-label="Ampliar monitor">↗</button>
              </div>
              <p v-if="errorVideo" class="video-notice" role="alert">No s’ha pogut carregar el vídeo. Comprova la connexió i torna a entrar a la sala.</p>
              <div class="video-actions"><button @click="so">{{ silenciat ? '♩ Activar so' : '♫ Silenciar' }}</button><button @click="obrirModalGran">Ampliar monitor ↗</button></div>
              <p v-if="bloqueigAutoplay" class="video-notice">Prem «Activar so» per escoltar el canal.</p>
              <p class="simulation-note">Vídeo de prova · canal simulat</p>
            </template>
          </section>
          <section class="rooms"><div class="section-label">EXPLORA LES SALES <span>02</span></div><div class="room-row" :class="{active:zonaActiva?.id===2}"><span class="room-icon">▤</span><div><strong>Sala de Reunions</strong><small>Idees que prenen forma</small></div><i></i></div><div class="room-row" :class="{active:zonaActiva?.id===3}"><span class="room-icon coffee">♧</span><div><strong>Zona Cafè</strong><small>Una pausa, una conversa</small></div><i></i></div></section>
        </aside>
      </div>
      <footer><span><i></i> A prop, encara que siguem lluny.</span><span><a href="https://opengameart.org/content/alternate-lpc-character-sprites-george" target="_blank" rel="noopener noreferrer">George · sheep</a> · <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer">CC BY 3.0</a></span></footer>
    </main>
    <dialog ref="dialog" @cancel.prevent="tancarModalGran" @click="e => { if(e.target === dialog) tancarModalGran(); }" aria-labelledby="modal-title">
      <div class="modal-header"><div><div class="eyebrow">MONITOR DE SALA · VISTA AMPLIADA</div><h2 id="modal-title">{{ zonaActiva?.titolMonitor }}</h2></div><button @click="tancarModalGran" aria-label="Tancar monitor">Tancar ✕</button></div><div ref="modalHost" class="modal-video"></div><div class="modal-footer"><span><i class="status-dot"></i> Vídeo de prova</span><span>Moviment en pausa · <kbd>Esc</kbd> per tornar a l’oficina</span></div>
    </dialog>
  </div>
</template>
