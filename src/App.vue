<script setup>
import { ref, useId, onBeforeUnmount } from "vue";
import PhaserCanvas from "./components/PhaserCanvas.vue";
import MonitorModal from "./components/MonitorModal.vue";

// Vue crea l’inspector i el component modal. RoomMonitor continua sent propietari
// de l’únic vídeo: el mou temporalment al destí buit creat per MonitorModal.vue.
const zonaActiva = ref(null);
const monitor = ref(null);
const refCanvas = ref(null);
const preparat = ref(false);
const seleccionat = ref(false);
const traca = ref([]);
const modalObert = ref(false);
// ID únic del destí, que sempre està muntat encara que el diàleg estigui tancat.
const destiModalId = `monitor-modal-${useId()}`;
let ultimaSignatura = "";

function registrar(direccio, nom) {
  traca.value = [{ direccio, nom }, ...traca.value].slice(0, 6);
}
function canviZona(zona) {
  tancarModal();
  zonaActiva.value = zona;
  monitor.value = null;
  seleccionat.value = false;
  ultimaSignatura = "";
  registrar(
    "Phaser → Vue",
    zona ? `canvi-zona · ${zona.nom}` : "canvi-zona · null",
  );
}
function actualitzarMonitor(dades) {
  // Ignorem missatges tardans d'una sala que l'usuari ja ha abandonat.
  if (dades.id !== zonaActiva.value?.id) return;
  monitor.value = dades;
  // El temps s'actualitza cada segon; la traça només registra canvis rellevants.
  const signatura = [
    dades.pausat,
    dades.silenciat,
    dades.pantallaCompleta,
    dades.modalObert,
    dades.controlsBloquejats,
    dades.amplada,
    dades.avis,
  ].join("|");
  if (signatura !== ultimaSignatura) {
    registrar("Phaser → Vue", "monitor-estat");
    ultimaSignatura = signatura;
  }
}
function seleccionarMonitor(dades) {
  if (dades.id !== zonaActiva.value?.id) return;
  monitor.value = dades;
  seleccionat.value = true;
  registrar("Phaser → Vue", "monitor-seleccionat");
}
function enviarOrdre(accio, extra = {}) {
  if (!monitor.value) return;
  registrar("Vue → Phaser", `monitor-ordre · ${accio}`);
  // El botó de Vue no toca video.play() ni fullscreen: envia una ORDRE.
  // Phaser actua i després confirma l'estat amb monitor-estat (no l'anticipem a Vue).
  refCanvas.value?.enviarOrdre({ id: monitor.value.id, accio, ...extra });
}
function obrirModal() {
  if (!monitor.value) return;
  modalObert.value = true;
  // El destí HTML ja existeix: podem bloquejar Phaser i moure el vídeo de manera
  // síncrona. Vue mostrarà el component al següent tick, sense cap frame de moviment.
  enviarOrdre("obrir-modal", { destiId: destiModalId });
}
function tancarModal() {
  if (!modalObert.value) return;
  // L'ordre retorna el vídeo al mapa ABANS que Vue amagui el component.
  enviarOrdre("tancar-modal");
  modalObert.value = false;
}
onBeforeUnmount(tancarModal);

function temps(segons) {
  return `${Math.floor(segons / 60)}:${String(Math.floor(segons % 60)).padStart(2, "0")}`;
}
</script>

<template>
  <div class="app-shell">
    <nav class="rail" aria-label="Espai de treball">
      <a class="brand" href="#" aria-label="Espai inici">e<span>·</span></a>
      <div class="rail-icons">
        <span class="selected" title="Oficina">▦</span
        ><span title="Sales">▤</span>
      </div>
      <div class="avatar george-avatar" role="img" aria-label="George"></div>
    </nav>
    <main>
      <header>
        <div class="breadcrumb">
          EL TEU ESPAI DE TREBALL <span>/</span> OFICINA VIRTUAL
        </div>
        <span class="connection"><i></i> Entorn de demostració</span>
      </header>
      <div class="page-title">
        <div>
          <div class="eyebrow">CONNECTA DES D’ON SIGUIS</div>
          <h1>Un lloc per trobar-nos<span>.</span></h1>
          <p>Entra en una sala. Comparteix el moment.</p>
        </div>
        <div class="date-tag">ESPAI <span>01</span></div>
      </div>
      <div class="workspace">
        <section class="map-panel" aria-label="Oficina interactiva">
          <div class="panel-heading">
            <div>
              <span class="status-dot"></span> La nostra oficina
              <span class="floor">Planta 01</span>
            </div>
            <span class="map-type">VISTA EN PLANTA ↗</span>
          </div>
          <PhaserCanvas
            ref="refCanvas"
            @canvi-zona="canviZona"
            @preparat="preparat = true"
            @monitor-seleccionat="seleccionarMonitor"
            @monitor-estat="actualitzarMonitor"
          />
          <div class="map-footer">
            <span
              ><i class="location-dot"></i
              >{{ zonaActiva?.nom || "Espai comú" }}</span
            ><span class="keys"
              ><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd
              ><span>o fletxes per moure’t</span></span
            >
          </div>
          <div v-if="!preparat" class="loading">Preparant l’oficina…</div>
        </section>
        <aside>
          <section class="presence">
            <div class="section-label">ARA ETS A <span>↙</span></div>
            <h2>{{ zonaActiva?.nom || "Espai comú" }}</h2>
            <p>
              {{
                zonaActiva
                  ? "El vídeo s’està mostrant al monitor del mapa."
                  : "Camina fins a una sala per activar el seu monitor."
              }}
            </p>
            <div class="person">
              <span
                class="person-avatar george-avatar"
                role="img"
                aria-label="George"
                ><i></i
              ></span>
              <div>
                <strong>George <small>(tu)</small></strong
                ><span>Disponible per connectar</span>
              </div>
              <span class="person-status">EN LÍNIA</span>
            </div>
          </section>
          <section
            class="monitor-section"
            :class="{ 'inspector-selected': seleccionat }"
            aria-label="Inspector del monitor"
          >
            <div class="section-label">
              INSPECTOR DEL MONITOR
              <span class="channel-badge">{{
                monitor ? "ACTIU" : "EN ESPERA"
              }}</span>
            </div>
            <div v-if="!monitor" class="empty-monitor">
              <div class="monitor-symbol">▣<i></i></div>
              <h3>La pantalla és dins la sala</h3>
              <p>
                Entra a Reunions o a la Zona Cafè.<br />El vídeo s’encendrà al
                monitor del mapa.
              </p>
              <span>○ &nbsp; Sense àudio ni vídeo</span>
            </div>
            <template v-else>
              <h3 class="inspector-title">{{ monitor.titolMonitor }}</h3>
              <p class="inspector-hint">
                {{
                  seleccionat
                    ? "Monitor seleccionat al mapa."
                    : "Clica la petita pantalla del mapa per seleccionar-la."
                }}
              </p>
              <dl class="inspector-data">
                <div>
                  <dt>Reproducció</dt>
                  <dd>{{ monitor.pausat ? "En pausa" : "Reproduint" }}</dd>
                </div>
                <div>
                  <dt>Resolució del vídeo</dt>
                  <dd>
                    {{
                      monitor.amplada
                        ? `${monitor.amplada} × ${monitor.alcada}`
                        : "Carregant…"
                    }}
                  </dd>
                </div>
                <div>
                  <dt>Pantalla al mapa</dt>
                  <dd>
                    {{ monitor.pantallaAmplada }} ×
                    {{ monitor.pantallaAlcada }} px
                  </dd>
                </div>
                <div>
                  <dt>Temps</dt>
                  <dd>
                    {{ temps(monitor.temps) }} / {{ temps(monitor.durada) }}
                  </dd>
                </div>
                <div>
                  <dt>Àudio</dt>
                  <dd>{{ monitor.silenciat ? "Silenciat" : "Activat" }}</dd>
                </div>
              </dl>
              <button
                class="fullscreen-action"
                @click="enviarOrdre('pantalla-completa')"
              >
                Pantalla completa ↗
              </button>
              <button class="modal-action" @click="obrirModal">
                Obrir finestra modal ▣
              </button>
              <div class="video-actions">
                <button @click="enviarOrdre('reproduccio')">
                  {{ monitor.pausat ? "Reproduir" : "Pausar" }}
                </button>
                <button @click="enviarOrdre('so')">
                  {{ monitor.silenciat ? "Activar so" : "Silenciar" }}
                </button>
              </div>
              <p v-if="monitor.avis" class="video-notice" role="alert">
                {{ monitor.avis }}
              </p>
              <p class="simulation-note">
                Vídeo MP4 de prova · el reproductor viu al mapa
              </p>
            </template>
            <details class="event-trace">
              <summary>Traça d’esdeveniments</summary>
              <ol>
                <li v-for="(event, index) in traca" :key="index">
                  <small>{{ event.direccio }}</small><code>{{
                    event.nom
                  }}</code>
                </li>
              </ol>
            </details>
          </section>
          <section class="rooms">
            <div class="section-label">EXPLORA LES SALES <span>02</span></div>
            <div class="room-row" :class="{ active: zonaActiva?.id === 2 }">
              <span class="room-icon">▤</span>
              <div>
                <strong>Sala de Reunions</strong
                ><small>Idees que prenen forma</small>
              </div>
              <i></i>
            </div>
            <div class="room-row" :class="{ active: zonaActiva?.id === 3 }">
              <span class="room-icon coffee">♧</span>
              <div>
                <strong>Zona Cafè</strong><small>Una pausa, una conversa</small>
              </div>
              <i></i>
            </div>
          </section>
        </aside>
      </div>
      <footer>
        <span><i></i> A prop, encara que siguem lluny.</span
        ><span
          ><a
            href="https://opengameart.org/content/alternate-lpc-character-sprites-george"
            target="_blank"
            rel="noopener noreferrer"
            >George · sheep</a
          >
          ·
          <a
            href="https://creativecommons.org/licenses/by/3.0/"
            target="_blank"
            rel="noopener noreferrer"
            >CC BY 3.0</a
          ></span
        >
      </footer>
    </main>
    <!-- Component Vue real; la resta de l’app queda visible darrere seu. -->
    <MonitorModal
      :obert="modalObert"
      :titol="monitor?.titolMonitor || 'Monitor de sala'"
      :desti-id="destiModalId"
      :controls-bloquejats="monitor?.controlsBloquejats || false"
      @tancar="tancarModal"
    />
  </div>
</template>
