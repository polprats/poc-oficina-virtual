# Experiment: vídeo dins d'un DOMElement de Phaser

## Què aporta aquesta versió?

Abans, Vue dibuixava el vídeo al panell lateral. Ara cada sala té un monitor físic al mapa. La carcassa és píxel art dibuixat per Phaser; la pantalla és un `<video>` HTML real, col·locat per un **Phaser.GameObjects.DOMElement**. Vue mostra l’inspector, crea una finestra modal opcional i envia ordres.

No és una textura de vídeo de Phaser: el navegador compon dues capes.

```text
Pare del joc: <div class="game-canvas"> (position: relative)
├── Contenidor DOM creat per Phaser (superposat i escalat amb el joc)
│   └── <div class="room-monitor-screen">  ← Game Object DOMElement
│       ├── <video>                        ← vídeo HTML natiu
│       ├── <button>Inspeccionar</button>
│       └── <button>Tornar a l'oficina</button> (només en fullscreen)
└── <canvas>                               ← mapa, George i carcasses
```

L'ordre de dibuix és una capa de DOM sobre el canvas, independentment de l'ordre físic d'aquests dos nodes al document.

## 1. Habilitar la capa HTML

A `src/components/PhaserCanvas.vue`:

```js
parent: contenidorJoc.value,
dom: { createContainer: true, pointerEvents: 'none' },
```

`createContainer` fa que Phaser afegeixi un contenidor absolut sobre el canvas. El `parent` és obligatori. El CSS `position: relative` del pare evita que la capa s'ancori a una altra part de la pàgina.

El contenidor general no captura clics (`pointer-events: none`); cada DOMElement interactiu activa els seus propis clics (`dom.pointerEvents = 'auto'`). Això evita que una capa transparent tapi tot el joc.

## 2. Encaixar HTML dins el món

A `src/game/RoomMonitor.js`, llegeix `activar()`:

```js
this.dom = this.scene.add.dom(objecte.x, objecte.y, this.host).setOrigin(0, 0);
```

`host` pren la mida exacta `objecte.width × objecte.height` del rectangle de Tiled. Inicialment és **96 × 54 px**, una relació 16:9. Són píxels del món de Phaser. El marc es calcula al voltant d’aquest rectangle, amb un marge decoratiu de 8 px. El vídeo utilitza `object-fit: contain`: si canvies la proporció del rectangle, manté la seva proporció i deixa bandes en lloc de deformar-se. `setOrigin(0,0)` fa coincidir la cantonada HTML amb la cantonada interior del marc.

Phaser escriu transformacions CSS al node en cada render. No cal calcular manualment la seva posició a la finestra. El Scale Manager amb `FIT` escala conjuntament el canvas i el contenidor HTML. Els objectes de Tiled amb `tipus=monitor` defineixen la posició; `zonaId` els associa a una sala.

### Editar posició i mida des de Tiled

1. Obre `public/assets/maps/oficina.tmx` i selecciona la capa d’objectes `Objectes`.
2. Selecciona «Monitor Reunions» o «Monitor Cafè». El rectangle representa només l’àrea del vídeo.
3. Mou el rectangle i modifica’n amplada i alçada. No cal tocar JavaScript ni CSS.
4. Conserva `tipus = monitor` i `zonaId = 2` (Reunions) o `3` (Cafè). `zonaId` és l’ID de l’objecte zona al mateix mapa.
5. Exporta sobre `public/assets/maps/oficina.json`. Phaser llegirà les noves coordenades i dimensions.

Són rectangles alineats als eixos, sense rotació. Les propietats `streamUrl` i `titolMonitor` continuen a la zona: el monitor les rep mitjançant `zonaId`, no les duplica.

## 3. Qui gestiona els clics?

El botó de la pantalla és HTML, així que utilitzem `addEventListener('click', ...)`, no `setInteractive()` de Phaser. El clic natiu acaba emetent `monitor-seleccionat` al bus del joc; el component pont el reenvia com un esdeveniment Vue.

## 4. Comunicació en dos sentits

| Direcció | Esdeveniment | Dades / efecte |
|---|---|---|
| Phaser → Vue | `canvi-zona` | Sala actual o `null`; neteja l'inspector anterior. |
| Phaser → Vue | `monitor-seleccionat` | Clic al vídeo petit: identifica el monitor a l'inspector. |
| Phaser → Vue | `monitor-estat` | Resolució, temps, pausa, so, fullscreen i avisos reals. |
| Vue → Phaser | `monitor-ordre` | `{ id, accio, destiId? }`; accions: `reproduccio`, `so`, `pantalla-completa`, `obrir-modal`, `tancar-modal`. |

El contracte és a `src/game/officeEvents.js`. Els missatges contenen dades planes, sense referències al vídeo ni a l'escena. L'escena només accepta ordres per a la sala actual. Vue espera el missatge de retorn per actualitzar l'estat: no pressuposa que el navegador hagi acceptat una petició.

Obre «Traça d'esdeveniments» a l'inspector per veure el recorregut durant l'experiment.

## 5. Pantalla completa amb el mateix vídeo

El botó de Vue envia una ordre; Phaser crida `host.requestFullscreen()`. El bus és síncron, de manera que la crida conserva el gest d'usuari que necessita el navegador. No afegim `setTimeout` ni operacions asíncrones prèvies a la petició.

El navegador presenta el mateix node al seu *top layer*. La regla CSS `:fullscreen` n'ajusta dimensions i transformació. No creem cap reproductor a Vue, ni clonem el vídeo: el temps i l'àudio continuen al mateix element. `fullscreenchange` activa els controls natius, bloqueja el moviment de George i confirma l'estat a Vue. En sortir amb Escape, el botó o els controls del navegador, el moviment es recupera.

Si el navegador denega l'acció, l'inspector mostra l'avís. La pantalla completa requereix suport del navegador i permís del contenidor; un iframe extern podria necessitar `allowfullscreen`.

## 5.b. Finestra modal: un component Vue que allotja temporalment el vídeo

`MonitorModal.vue` és un component separat i comentat. Renderitza un `<dialog>` amb títol, botó de tancament, confirmació de controls bloquejats i un contenidor buit. No té cap `<video>` al seu template.

La diferència amb fullscreen és qui presenta la vista: aquí Vue mostra un component de màxim 640 px d’amplada, sense ocupar tota la pantalla. El diàleg natiu apareix al *top layer*, per sobre tant del canvas com de la capa HTML de Phaser. La resta de la pàgina queda inerta i el focus queda dins del component.

El flux complet és:

```text
Clic al botó de Vue
  → monitor-ordre { id, accio: 'obrir-modal', destiId }
  → RoomMonitor bloqueja la física/teclat i mou el <video> al destí de Vue
  → monitor-estat { modalObert: true, controlsBloquejats: true, ... }
  → Vue mostra el modal amb la confirmació real

Botó / Escape / clic al backdrop
  → Vue envia monitor-ordre { id, accio: 'tancar-modal' }
  → RoomMonitor retorna el mateix <video> al seu host DOMElement
  → restaura WASD/fletxes i envia monitor-estat
  → Vue tanca el diàleg i recupera el focus anterior
```

`destiId` és una cadena creada amb `useId()` de Vue. El bus continua sense transportar nodes ni instàncies de components. Phaser resol aquest destí explícit i només accepta un contenidor amb la classe prevista.

El DOMElement **es queda al mapa**; només es mou el seu fill vídeo. Durant la visita al modal, la carcassa diu «VISTA MODAL». En tornar, el vídeo recupera la posició i mida de Tiled perquè torna al mateix host. Aquest destí buit és l’única àrea de Vue que admet contingut DOM gestionat externament; Vue no intenta reconciliar fills de vídeo que no ha creat.

Bloquejar no vol dir només desactivar events: també cal frenar la velocitat i netejar les tecles ja premudes. Les proves mantenen D premuda en obrir i intenten moure George amb totes les tecles WASD i les quatre fletxes. La posició real no canvia; en tancar, es pot tornar a caminar sense tecles enganxades.

Si s’utilitza el fullscreen natiu del vídeo mentre el modal és obert, els motius de bloqueig es combinen: sortir de fullscreen no pot desbloquejar George fins que també es tanqui el modal. El reinici o la destrucció de l’escena retornen i alliberen el vídeo abans de deixar el component buit.

## 6. Activar, sortir i destruir

`activar()` crea el DOMElement només en entrar a la sala. `desactivar()` fa més que ocultar-lo:

1. Invalida operacions `play()` encara pendents.
2. Elimina els listeners amb `AbortController`.
3. Pausa el vídeo, retira `src` i crida `load()` per cancel·lar la càrrega.
4. Destrueix el DOMElement, que retira el node del contenidor HTML.
5. Deixa la carcassa al mapa, apagada, i restaura els controls.

En tancar l'escena també s'eliminen els listeners del bus i tots els monitors. Aquest és el punt que evita àudio fantasma, nodes duplicats o ordres que continuen actuant després de sortir.

## Límits que convé experimentar

- Un DOMElement és HTML sobre el canvas: no es pot intercalar entre sprites amb `setDepth()`.
- Utilitzem una sola càmera. Múltiples càmeres i retalls parcials necessiten un disseny específic.
- `pixelArt` controla els sprites i el canvas; el vídeo continua sent vídeo HTML normal. El que és píxel art és el monitor.
- El monitor petit no mostra controls natius perquè no hi caben. L'inspector els substitueix amb ordres.
- L'autoplay comença silenciat. «Activar so» és una acció explícita; el vídeo de flors de MDN no té pista d'àudio.
- Els canals encara són MP4 de prova. Un futur `MediaStream` s'assignaria a `video.srcObject` dins `RoomMonitor`, conservant aquest model de propietat i esdeveniments.

## Proves incloses

`npm test` verifica un DOMElement real, absència de vídeo a Vue, reproducció, clic al monitor, pausa/so des de l'inspector, un únic node en fullscreen, immobilitat de George, retorn al mapa, alineació després d'un canvi de mida, canvi de canal i alliberament del vídeo anterior.

Referències oficials: [DOM Element](https://phaser.io/oss/docs/phaser/concepts/gameobjects/dom-element), [API DOMElement](https://phaser.io/oss/docs/api-documentation/class/gameobjects-domelement), [exemple amb vídeo](https://phaser.io/oss/examples/v4.1.0/game%20objects/dom%20element/view/video-element).
