import { OFFICE_EVENTS } from "./officeEvents.js";

/**
 * Monitor híbrid: carcassa de píxel art al canvas + vídeo HTML en un DOMElement.
 *
 * CONCEPTE NOU: scene.add.dom(x, y, node) crea un Game Object que Phaser posiciona
 * al món, però el navegador continua renderitzant node com a HTML real SOBRE el
 * canvas. No convertim el vídeo en una textura, ni el renderitzem des d'App.vue.
 * Phaser aplica a l'HTML la posició i les transformacions de la càmera. El Scale
 * Manager escala el contenidor DOM amb el canvas quan canvia la mida de finestra.
 *
 * Límit: és una capa separada. setDepth() ordena DOM entre DOM; un sprite del
 * canvas no es pot intercalar davant del vídeo. El marc envolta l'HTML, no el tapa.
 */
export class RoomMonitor {
  constructor(scene, zona, objecte) {
    this.scene = scene;
    this.zona = zona;
    this.objecte = objecte;
    this.actiu = false;
    this.modalObert = false;
    this.generacio = 0; // Invalida play() pendents quan sortim de la sala.
    this.avis = "";
    this.dibuixarMarc();
  }

  dibuixarMarc() {
    // A Tiled el rectangle ÉS LA PANTALLA, no la carcassa: la seva posició i mida
    // es traslladen directament al DOMElement. Només el gruix decoratiu és constant.
    const { x, y, width: w, height: h } = this.objecte;
    const g = this.scene.add.graphics();
    g.fillStyle(0x253d42).fillRect(x - 8, y - 8, w + 16, h + 18);
    g.fillStyle(0x74918a).fillRect(x - 5, y - 5, w + 10, 3);
    g.fillStyle(0x101f26).fillRect(x, y, w, h);
    g.fillStyle(0x1d3037)
      .fillRect(x + w / 2 - 10, y + h + 10, 20, 8)
      .fillRect(x + w / 2 - 24, y + h + 18, 48, 5);
    g.fillStyle(0x9eb1a3).fillRect(x + w / 2 - 8, y + h + 4, 16, 2);
    this.led = this.scene.add.rectangle(x + w - 3, y + h + 5, 3, 3, 0x83918c);
    this.textApagat = this.scene.add
      .text(x + w / 2, y + h / 2, "EN ESPERA", {
        fontFamily: "monospace",
        fontSize: "7px",
        color: "#7a9895",
      })
      .setOrigin(0.5);
    this.marc = g;
  }

  async activar() {
    if (this.actiu || !this.zona.streamUrl) return;
    this.actiu = true;
    const generacio = ++this.generacio;
    this.avis = "";
    this.led.setFillStyle(0x9ce4ae);
    this.textApagat.setVisible(false);

    // 1. HTML normal, amb dimensions explícites en píxels del MÓN, no de pantalla.
    // Construïm nodes sense innerHTML: els noms/URLs de Tiled no s'injecten com a markup.
    this.host = document.createElement("div");
    this.host.className = "room-monitor-screen";
    this.host.dataset.monitorId = String(this.zona.id);
    this.host.style.width = `${this.objecte.width}px`;
    this.host.style.height = `${this.objecte.height}px`;
    this.video = document.createElement("video");
    this.video.src = this.zona.streamUrl;
    this.video.loop = true;
    this.video.playsInline = true;
    this.video.preload = "auto";
    // Silenciat per autoplay; el so s'activa amb un gest explícit a l'inspector.
    this.video.muted = true;
    this.video.setAttribute("aria-label", `Vídeo: ${this.zona.nom}`);
    this.boto = document.createElement("button");
    this.boto.type = "button";
    this.boto.className = "room-monitor-hit";
    this.boto.setAttribute(
      "aria-label",
      `Inspeccionar monitor de ${this.zona.nom}`,
    );
    this.boto.title = "Obrir inspector del monitor";
    this.boto.textContent = "↗";
    this.host.append(this.video, this.boto);
    this.sortir = document.createElement("button");
    this.sortir.type = "button";
    this.sortir.className = "room-monitor-exit";
    this.sortir.textContent = "Tornar a l’oficina · Esc";
    this.host.append(this.sortir);

    // 2. Aquesta línia converteix el node HTML en un Game Object DOMElement.
    // Origen (0,0): la cantonada encaixa exactament dins el marc dibuixat al canvas.
    // No calculem posicions amb getBoundingClientRect() ni position:fixed.
    this.dom = this.scene.add
      .dom(this.objecte.x, this.objecte.y, this.host)
      .setOrigin(0, 0);
    this.dom.pointerEvents = "auto";

    // 3. L'input és NATIU del navegador, no el de Phaser setInteractive().
    // El pare deixa passar els clics al canvas; només aquesta pantalla els captura.
    this.listeners = new AbortController();
    const options = { signal: this.listeners.signal };
    this.sortir.addEventListener(
      "click",
      () => document.exitFullscreen().catch(() => {}),
      options,
    );
    this.boto.addEventListener(
      "click",
      () => {
        this.scene.game.events.emit(OFFICE_EVENTS.SELECT, this.dades());
      },
      options,
    );
    for (const event of [
      "loadedmetadata",
      "playing",
      "pause",
      "volumechange",
      "error",
    ]) {
      this.video.addEventListener(
        event,
        () => {
          if (event === "error")
            this.avis = "No s’ha pogut carregar el vídeo. Revisa la connexió.";
          this.emetreEstat();
        },
        options,
      );
    }
    // Limitem timeupdate a canvis de segon: Vue no necessita un esdeveniment per frame.
    let ultimSegon = -1;
    this.video.addEventListener(
      "timeupdate",
      () => {
        const segon = Math.floor(this.video.currentTime);
        if (segon !== ultimSegon) {
          ultimSegon = segon;
          this.emetreEstat();
        }
      },
      options,
    );
    document.addEventListener(
      "fullscreenchange",
      () => this.canviPantallaCompleta(),
      options,
    );
    this.emetreEstat();
    try {
      await this.video.play();
    } catch (error) {
      if (
        this.actiu &&
        generacio === this.generacio &&
        error.name !== "AbortError"
      ) {
        this.avis = "Prem Reproduir a l’inspector per iniciar el vídeo.";
        this.emetreEstat();
      }
    }
  }

  dades() {
    const v = this.video;
    return {
      id: this.zona.id,
      nom: this.zona.nom,
      titolMonitor: this.zona.titolMonitor,
      streamUrl: this.zona.streamUrl,
      amplada: v?.videoWidth || 0,
      alcada: v?.videoHeight || 0,
      pantallaAmplada: this.objecte.width,
      pantallaAlcada: this.objecte.height,
      temps: v?.currentTime || 0,
      durada: Number.isFinite(v?.duration) ? v.duration : 0,
      pausat: v?.paused ?? true,
      silenciat: v?.muted ?? true,
      pantallaCompleta:
        !!this.host &&
        (document.fullscreenElement === this.host ||
          document.fullscreenElement === this.video),
      modalObert: this.modalObert,
      controlsBloquejats: this.scene.bloquejat,
      avis: this.avis,
    };
  }

  emetreEstat() {
    if (this.actiu)
      this.scene.game.events.emit(OFFICE_EVENTS.STATE, this.dades());
  }

  async executar(accio, destiId) {
    if (!this.actiu) return; // Una ordre antiga no ha d'encendre una altra sala.
    const generacio = this.generacio;
    const video = this.video;
    try {
      this.avis = "";
      if (accio === "reproduccio") {
        if (video.paused) await video.play();
        else video.pause();
      } else if (accio === "so") {
        video.muted = !video.muted;
      } else if (accio === "obrir-modal") {
        // Vue crea el component i un destí buit; Phaser conserva la propietat
        // del vídeo. El bus només transporta l'ID del destí, no referències DOM.
        const desti = document.getElementById(destiId);
        if (!desti || !desti.classList.contains("monitor-modal-video"))
          throw new Error("Destí modal no disponible");
        this.modalObert = true;
        this.scene.bloquejarControls(true); // Aturem velocitat i netegem WASD ABANS del següent frame.
        this.textApagat.setText("VISTA MODAL").setVisible(true);
        const reproduint = !video.paused;
        desti.appendChild(video); // Mateix node, mateix currentTime: no clonem el reproductor.
        video.controls = true;
        // Reparentar HTML pot pausar un vídeo en alguns navegadors. Recuperem
        // la reproducció només si abans estava en marxa; una pausa voluntària es conserva.
        if (reproduint) await video.play();
      } else if (accio === "tancar-modal") {
        this.tancarModal();
      } else if (accio === "pantalla-completa") {
        // EventEmitter és síncron: mantenim el gest original del clic de Vue,
        // necessari per al permís de fullscreen. No posem timers abans d'aquesta crida.
        // Ampliem EL MATEIX host: un únic vídeo, sense reinici de temps ni doble àudio.
        if (!this.host.requestFullscreen)
          throw new Error("Fullscreen no disponible");
        await this.host.requestFullscreen();
      }
    } catch {
      if (this.actiu && generacio === this.generacio)
        this.avis =
          "El navegador no ha permès aquesta acció. Torna-ho a provar.";
    }
    if (this.actiu && generacio === this.generacio) this.emetreEstat();
  }

  canviPantallaCompleta() {
    const ampliat =
      document.fullscreenElement === this.host ||
      document.fullscreenElement === this.video;
    this.video.controls = ampliat || this.modalObert;
    this.boto.hidden = ampliat;
    // Són dos motius de bloqueig independents: sortir del fullscreen natiu del
    // vídeo no pot reactivar WASD si la finestra modal encara continua oberta.
    this.scene.bloquejarControls(ampliat || this.modalObert);
    this.emetreEstat(); // Confirmem l'estat REAL del navegador, no només la petició de Vue.
  }

  tancarModal() {
    if (!this.modalObert) return;
    this.modalObert = false;
    const reproduint = !this.video.paused;
    this.host.prepend(this.video);
    const ampliat =
      document.fullscreenElement === this.host ||
      document.fullscreenElement === this.video;
    this.video.controls = ampliat;
    // Durant SHUTDOWN, Phaser ja pot haver destruït el Text i el plugin d'input.
    // Retornem el node HTML igualment, però només actualitzem objectes encara vius.
    if (this.textApagat.scene)
      this.textApagat.setText("EN ESPERA").setVisible(false);
    if (this.scene.sys.isActive()) this.scene.bloquejarControls(ampliat);
    // El node ja ha tornat al mapa de manera síncrona abans que Vue tanqui el diàleg.
    // Si el navegador l'ha pausat en moure'l, el play és una recuperació, no un reinici.
    if (reproduint && this.scene.sys.isActive())
      this.video.play().catch(() => {});
    this.emetreEstat();
  }

  desactivar() {
    if (!this.actiu) return;
    this.tancarModal(); // També retorna el vídeo si l'escena es reinicia amb el modal obert.
    this.actiu = false;
    ++this.generacio;
    // 4. Cicle de vida: ocultar el node deixaria el vídeo sonant!
    // Abort elimina listeners; pause + retirar src + load alliberen la reproducció.
    // DOMElement.destroy() retira el node HTML del contenidor de Phaser.
    const eraPantallaCompleta =
      document.fullscreenElement === this.host ||
      document.fullscreenElement === this.video;
    if (eraPantallaCompleta) document.exitFullscreen().catch(() => {});
    this.listeners.abort();
    this.video.pause();
    this.video.removeAttribute("src");
    this.video.load();
    this.dom.destroy();
    // Eliminem també les referències pròpies als botons: cap node desconnectat
    // ha de mantenir indirectament el vell host o el vídeo a la memòria.
    this.host = this.video = this.boto = this.sortir = this.dom = null;
    this.listeners = null;
    this.led.setFillStyle(0x83918c);
    this.textApagat.setVisible(true);
    // Sortir caminant d'una sala NO ha de netejar la tecla de moviment premuda:
    // només restaurem controls aquí si els havia bloquejat aquesta pantalla completa.
    if (eraPantallaCompleta) this.scene.bloquejarControls(false);
  }

  destroy() {
    this.desactivar();
    this.marc.destroy();
    this.led.destroy();
    this.textApagat.destroy();
  }
}
