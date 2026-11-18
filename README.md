# Espai · Oficina virtual

Vue 3 + Vite + Phaser 4. Dues sales, George original, mapa Tiled editable i monitors de píxel art que mostren vídeo HTML real dins d’un **DOMElement de Phaser**.

## Demos allotjades: una URL per a cada estat

[**Obrir la portada amb les tres demos**](https://espai-oficina-lab.classicpage2.chatgpt.site/)

| Estat | Demo executable | Codi exacte a GitHub |
|---|---|---|
| 01 · Inicial | [Provar la versió inicial](https://espai-oficina-lab.classicpage2.chatgpt.site/inicial/) | [v1.0.0](https://github.com/polprats/poc-oficina-virtual/tree/v1.0.0) |
| 02 · George | [Provar el George original](https://espai-oficina-lab.classicpage2.chatgpt.site/george/) | [v1.1.0](https://github.com/polprats/poc-oficina-virtual/tree/v1.1.0) |
| 03 · DOMElement + modal | [Provar monitors i modal Vue](https://espai-oficina-lab.classicpage2.chatgpt.site/dom/) | [v1.3.0](https://github.com/polprats/poc-oficina-virtual/tree/v1.3.0) |

La tercera demo incorpora el modal nou. La [v1.2.0](https://github.com/polprats/poc-oficina-virtual/tree/v1.2.0) conserva el pas intermedi amb DOMElement i només fullscreen. Les tres etiquetes anteriors continuen intactes.

El Site de demos és **públic des del 18 de novembre de 2026**: la portada i les tres demos es poden obrir sense iniciar sessió amb ChatGPT. El repositori de GitHub continua privat; els enllaços al codi requereixen accés al repositori. Les demos són estàtiques i no necessiten el servidor de desenvolupament local.

## Executar

Requereix Node.js 22.12 o superior (verificat amb Node 26.13.1).

```powershell
cd C:\Users\polpr\Documents\ChatGPT\Tech\poc-oficina-virtual
npm ci
npm run dev
```

Obre http://127.0.0.1:5173. `npm run build` genera `dist/`; `npm run preview` serveix aquesta compilació localment.

## Provar l’experiment

1. Mou George amb WASD o fletxes. A l’espai comú els dos monitors estan apagats.
2. Entra a Reunions per la porta esquerra: el monitor del mapa reprodueix el vídeo petit.
3. Clica la pantalla del monitor: l’inspector de Vue rep `monitor-seleccionat`. No mostra cap altre vídeo.
4. Prova Pausar, Reproduir i Activar so: Vue envia ordres a Phaser, que confirma l’estat.
5. Prem «Obrir finestra modal»: apareix el component Vue, d’un màxim de 640 px d’amplada, sobre el mapa. El vídeo és el mateix node, amb controls natius. La resta de l’oficina continua visible al darrere.
6. Amb el modal obert, prem WASD i les fletxes: George queda immòbil i el peu del modal confirma que els controls estan desactivats. Tanca amb el botó, Escape o clic al fons. El vídeo torna al mapa i el moviment es recupera sense tecles enganxades.
7. Prem «Pantalla completa»: és l’altra opció, fullscreen real del navegador. També bloqueja el moviment. Torna amb Escape o el botó superior.
8. Surt de la sala: es destrueix el DOMElement i s’atura completament el vídeo. A la Zona Cafè s’activa un altre canal.
9. Obre «Traça d’esdeveniments» per seguir la comunicació entre Vue i Phaser.

El vídeo de flors de MDN no té pista d’àudio; prova el so amb Sintel a la Zona Cafè. L’autoplay comença silenciat. Els dos vídeos depenen dels servidors externs. Si el navegador denega una acció, l’inspector mostra l’avís. Aquesta fase utilitza teclat per moure’s; la interfície s’adapta a pantalles estretes.

## Aprendre DOMElement

Llegeix **[DOM_ELEMENT.md](DOM_ELEMENT.md)**. Explica les dues capes, el contenidor HTML, el sistema de coordenades, l’escala, els esdeveniments natius, fullscreen i la neteja. El codi nou està comentat en català, especialment `RoomMonitor.js` i `PhaserCanvas.vue`.

| Fitxer | Responsabilitat |
|---|---|
| `src/game/RoomMonitor.js` | Marc de píxel art, creació del vídeo, `this.add.dom`, reproducció, fullscreen, transferència temporal al modal i destrucció. |
| `src/game/OfficeScene.js` | Mapa, George, col·lisions, zones, activació de monitors i recepció d’ordres. |
| `src/game/officeEvents.js` | Contracte del bus d’esdeveniments. |
| `src/components/PhaserCanvas.vue` | Activa `dom.createContainer` i connecta el bus Phaser amb els esdeveniments Vue. |
| `src/App.vue` | Inspector, estat del modal i botons que envien ordres. No crea cap vídeo. |
| `src/components/MonitorModal.vue` | Component Vue amb diàleg natiu, focus, Escape i destí buit on Phaser allotja temporalment el seu vídeo. |
| `src/style.css` | Interfície, pantalla HTML i estat `:fullscreen`. |

## Posició i mida dels monitors a Tiled

Obre `public/assets/maps/oficina.tmx`, capa **Objectes**, i selecciona «Monitor Reunions» o «Monitor Cafè».

- El rectangle defineix l’àrea exacta del vídeo: `x`, `y`, `width` i `height` es llegeixen directament de Tiled.
- El marc decoratiu es dibuixa al voltant i s’adapta a aquestes dimensions.
- Propietats: `tipus = monitor` i `zonaId` amb l’ID de l’objecte zona associat (`2` o `3` al mapa inicial).
- La zona manté `nomSala`, `titolMonitor` i `streamUrl`; el monitor no duplica aquestes dades.
- Utilitza rectangles sense rotació. Després d’editar, exporta sobre `public/assets/maps/oficina.json`.

`scripts/create_assets.py` reprodueix el mapa inicial i el tileset original amb Pillow. **Sobreescriu els canvis manuals del mapa**; no cal executar-lo per iniciar l’app. Conserva el spritesheet original de George.

## Les tres etiquetes de referència

Aquestes tres versions queden **intactes** i són punts de comparació de l’experiment:

| Etiqueta | Què hi trobaràs | Què permet estudiar |
|---|---|---|
| [`v1.0.0`](https://github.com/polprats/poc-oficina-virtual/releases/tag/v1.0.0) | Personatge provisional, dues sales, vídeo petit al panell Vue i modal Vue ampliat. | Base de zones Phaser → Vue i bloqueig del teclat en obrir un modal. |
| [`v1.1.0`](https://github.com/polprats/poc-oficina-virtual/releases/tag/v1.1.0) | La mateixa experiència amb el George original, també als avatars. | Integració del spritesheet original, animacions i atribució. Encara utilitza el reproductor lateral Vue. |
| [`v1.2.0`](https://github.com/polprats/poc-oficina-virtual/releases/tag/v1.2.0) | Vídeo petit en monitors del mapa amb DOMElement; rectangles de pantalla a Tiled; inspector Vue sense vídeo i fullscreen natiu. | HTML posicionat per Phaser, escala amb el canvas, metadades i ordres bidireccionals. No inclou el nou modal. |

### Ampliació actual: `v1.3.0`

La nova etiqueta [`v1.3.0`](https://github.com/polprats/poc-oficina-virtual/releases/tag/v1.3.0) parteix de `v1.2.0` i afegeix **una opció de finestra modal Vue a més de la pantalla completa**. No substitueix ni mou les etiquetes anteriors.

| Aspecte | Finestra modal | Pantalla completa |
|---|---|---|
| Qui crea la vista | `MonitorModal.vue`, amb un `<dialog>` natiu. | API Fullscreen del navegador, des de `RoomMonitor`. |
| Mida | Màxim 640 px, amb l’oficina visible al darrere. | Ocupa la pantalla. |
| Vídeo | El mateix node es mou al destí buit de Vue i torna al DOMElement en tancar. | S’amplia el mateix node del monitor. |
| Controls de George | WASD i fletxes bloquejats fins que es tanca. | Bloquejats mentre continua fullscreen. |
| Sortida | Botó, Escape o clic al fons. | Escape, botó o controls del navegador. |

Per comparar una etiqueta en una carpeta independent, per exemple:

```powershell
git clone --branch v1.2.0 --single-branch https://github.com/polprats/poc-oficina-virtual.git oficina-v1.2.0
cd oficina-v1.2.0
npm ci
npm run dev
```

Canvia `v1.2.0` per qualsevol de les etiquetes. Git deixa aquesta còpia sobre l’etiqueta (*detached HEAD*); les proves i la documentació són les que tenia aquella versió.

## Com funciona el modal Vue

1. Vue manté `MonitorModal.vue` muntat amb un destí buit d’ID únic, encara que el diàleg estigui tancat.
2. El botó envia `monitor-ordre` amb `{ id, accio: 'obrir-modal', destiId }`. Només viatgen dades planes.
3. `RoomMonitor` atura George, neteja les tecles i desactiva l’entrada de teclat. Mou el seu vídeo al destí de Vue i activa els controls natius.
4. Phaser retorna `monitor-estat` amb `modalObert` i `controlsBloquejats`; el component mostra aquesta confirmació real.
5. En tancar, Vue envia `tancar-modal` **abans** d’amagar el diàleg. Phaser retorna el vídeo al mapa i restaura els controls.
6. El focus torna al botó d’obertura. Un reinici de l’escena amb el modal obert també tanca la finestra i allibera el vídeo.

Si el vídeo estava pausat, continua pausat. Si s’estava reproduint, es recupera la reproducció quan el navegador la pausa en moure el node. No es clona el vídeo ni es reinicia expressament `currentTime`.

El George original és de sheep (OpenGameArt, CC BY 3.0). La imatge es conserva sense modificar; vegeu `THIRD_PARTY_NOTICES.md`. El mapa i els gràfics d’oficina són originals de la demostració.

## Validació

```powershell
npx playwright install chromium
npm test
npm run build
```

Les proves verifiquen el DOMElement real, la reproducció, l’absència de vídeo a Vue, els botons de l’inspector, el mateix vídeo en fullscreen i al modal, el bloqueig real de WASD/fletxes, els tres tancaments del modal, la pausa conservada, el focus i el retorn de moviment, l’alineació després de redimensionar la finestra, el canvi de sala, la neteja del vídeo anterior i l’amplada mòbil. Captures a `screenshots/`, inclosa `monitor-modal.png`.

La compilació avisa de la mida del motor Phaser (~357 kB gzip). L’auditoria de dependències manté els avisos coneguts de les eines de desenvolupament (`picomatch` / `tinyglobby` / Vite). El servidor es limita a 127.0.0.1; aquestes eines no formen part dels fitxers estàtics de `dist/`.

## Reconstruir l’allotjament estàtic

```powershell
npm ci
npm run build:demos
python -m http.server 4174 --bind 127.0.0.1 --directory hosting-dist
# En un altre terminal:
node scripts/check_demos.mjs
```

Obre http://127.0.0.1:4174/. La carpeta `hosting-dist/` conté la portada i els tres directoris `inicial/`, `george/` i `dom/`, cadascun amb una compilació independent. Es pot allotjar com a contingut estàtic a l’arrel d’un domini, sense backend ni Vite en producció. El servidor ha de servir el `index.html` de cada directori.

El constructor `scripts/build_demos.py` extreu `v1.0.0` i `v1.1.0` en carpetes temporals ignorades per Git, adapta les rutes d’assets només en aquestes còpies i executa Vite amb el prefix corresponent. La demo DOM es construeix des del checkout actual. Les etiquetes no es reescriuen. `hosting/index.html` és el codi de la portada.

Per indicar una carpeta de publicació concreta:

```powershell
python scripts/build_demos.py --output C:\ruta\del-site\dist
```

`check_demos.mjs` prova les compilacions resultants des d’HTTP: recursos sense errors locals, moviment, vídeo als tres estats, modal i retorn al monitor. No depèn de les dades de depuració del servidor Vite.

## Abast

Els canals són vídeos MP4 de prova. No hi ha encara multijugador ni SimplePeer real. Un futur `MediaStream` s’assignaria a `video.srcObject` dins de `RoomMonitor`, mantenint el mateix inspector i el contracte d’esdeveniments. La senyalització, la gestió de peers, els permisos i STUN/TURN serien una ampliació separada.

## Referències

- [Fase 4.a · Guia conceptual](https://docs.google.com/presentation/d/1r32IR4PM78spyuMOJTZhFeUvnAI-ISuX/edit)
- [Fase 4.b · Implementació](https://docs.google.com/presentation/d/12b4I-y0dnlDUdO7y8A9b27_uOuHGU0F5kcT2szA364w/edit)
- [DOM Element · Documentació oficial Phaser](https://phaser.io/oss/docs/phaser/concepts/gameobjects/dom-element)
