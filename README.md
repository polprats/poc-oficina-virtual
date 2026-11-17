# Espai · Oficina virtual

Vue 3 + Vite + Phaser 4. Dues sales, George original, mapa Tiled editable i monitors de píxel art que mostren vídeo HTML real dins d’un **DOMElement de Phaser**.

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
5. Prem «Pantalla completa»: s’amplia el mateix vídeo i George queda immòbil. Torna amb Escape o el botó superior.
6. Surt de la sala: es destrueix el DOMElement i s’atura completament el vídeo. A la Zona Cafè s’activa un altre canal.
7. Obre «Traça d’esdeveniments» per seguir la comunicació entre Vue i Phaser.

El vídeo de flors de MDN no té pista d’àudio; prova el so amb Sintel a la Zona Cafè. L’autoplay comença silenciat. Els dos vídeos depenen dels servidors externs. Si el navegador denega una acció, l’inspector mostra l’avís. Aquesta fase utilitza teclat per moure’s; la interfície s’adapta a pantalles estretes.

## Aprendre DOMElement

Llegeix **[DOM_ELEMENT.md](DOM_ELEMENT.md)**. Explica les dues capes, el contenidor HTML, el sistema de coordenades, l’escala, els esdeveniments natius, fullscreen i la neteja. El codi nou està comentat en català, especialment `RoomMonitor.js` i `PhaserCanvas.vue`.

| Fitxer | Responsabilitat |
|---|---|
| `src/game/RoomMonitor.js` | Marc de píxel art, creació del vídeo, `this.add.dom`, reproducció, fullscreen i destrucció. |
| `src/game/OfficeScene.js` | Mapa, George, col·lisions, zones, activació de monitors i recepció d’ordres. |
| `src/game/officeEvents.js` | Contracte del bus d’esdeveniments. |
| `src/components/PhaserCanvas.vue` | Activa `dom.createContainer` i connecta el bus Phaser amb els esdeveniments Vue. |
| `src/App.vue` | Inspector de metadades i botons que envien ordres. No crea cap vídeo. |
| `src/style.css` | Interfície, pantalla HTML i estat `:fullscreen`. |

## Posició i mida dels monitors a Tiled

Obre `public/assets/maps/oficina.tmx`, capa **Objectes**, i selecciona «Monitor Reunions» o «Monitor Cafè».

- El rectangle defineix l’àrea exacta del vídeo: `x`, `y`, `width` i `height` es llegeixen directament de Tiled.
- El marc decoratiu es dibuixa al voltant i s’adapta a aquestes dimensions.
- Propietats: `tipus = monitor` i `zonaId` amb l’ID de l’objecte zona associat (`2` o `3` al mapa inicial).
- La zona manté `nomSala`, `titolMonitor` i `streamUrl`; el monitor no duplica aquestes dades.
- Utilitza rectangles sense rotació. Després d’editar, exporta sobre `public/assets/maps/oficina.json`.

`scripts/create_assets.py` reprodueix el mapa inicial i el tileset original amb Pillow. **Sobreescriu els canvis manuals del mapa**; no cal executar-lo per iniciar l’app. Conserva el spritesheet original de George.

## Versions conservades

- `v1.0.0`: versió inicial amb el personatge provisional i reproductor lateral Vue.
- `v1.1.0`: mateixa experiència amb el George original.
- `v1.2.0`: experiment DOMElement, monitors al mapa i inspector Vue sense vídeo.

El George original és de sheep (OpenGameArt, CC BY 3.0). La imatge es conserva sense modificar; vegeu `THIRD_PARTY_NOTICES.md`. El mapa i els gràfics d’oficina són originals de la demostració.

## Validació

```powershell
npx playwright install chromium
npm test
npm run build
```

Les proves verifiquen el DOMElement real, la reproducció, l’absència de vídeo a Vue, els botons de l’inspector, el mateix vídeo en fullscreen, el bloqueig i retorn de moviment, l’alineació després de redimensionar la finestra, el canvi de sala, la neteja del vídeo anterior i l’amplada mòbil. Captures a `screenshots/`.

La compilació avisa de la mida del motor Phaser (~357 kB gzip). L’auditoria de dependències manté els avisos coneguts de les eines de desenvolupament (`picomatch` / `tinyglobby` / Vite). El servidor es limita a 127.0.0.1; aquestes eines no formen part dels fitxers estàtics de `dist/`.

## Abast

Els canals són vídeos MP4 de prova. No hi ha encara multijugador ni SimplePeer real. Un futur `MediaStream` s’assignaria a `video.srcObject` dins de `RoomMonitor`, mantenint el mateix inspector i el contracte d’esdeveniments. La senyalització, la gestió de peers, els permisos i STUN/TURN serien una ampliació separada.

## Referències

- [Fase 4.a · Guia conceptual](https://docs.google.com/presentation/d/1r32IR4PM78spyuMOJTZhFeUvnAI-ISuX/edit)
- [Fase 4.b · Implementació](https://docs.google.com/presentation/d/12b4I-y0dnlDUdO7y8A9b27_uOuHGU0F5kcT2szA364w/edit)
- [DOM Element · Documentació oficial Phaser](https://phaser.io/oss/docs/phaser/concepts/gameobjects/dom-element)
