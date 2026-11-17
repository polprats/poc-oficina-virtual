# Espai · Oficina virtual

Implementació funcional de la Fase 4.a i 4.b amb Vue 3, Vite i Phaser 4. Inclou les dues sales, mapa editable amb Tiled i gràfics originals creats per a aquesta demostració. La carpeta inicial era buida: no s'han modificat les presentacions ni s'han utilitzat els assets d'una Fase 3 existent.

## Executar

Requereix Node.js 22.12 o superior (verificat amb Node 26.13.1).

```powershell
cd C:\Users\polpr\Documents\ChatGPT\Tech\poc-oficina-virtual
npm ci
npm run dev
```

Obre http://127.0.0.1:5173. Per generar la versió distribuïble, executa `npm run build`; el resultat és a `dist/`. `npm run preview` serveix aquest resultat localment.

## Provar la solució

1. Mou George amb WASD o les fletxes. El punt d'aparició és a l'espai comú, sense reproductor ni àudio.
2. Travessa la porta de la Sala de Reunions, a l'esquerra: apareix el vídeo de flors de MDN.
3. Clica el vídeo o «Ampliar monitor»: s'obre el modal i George queda immòbil. Prem WASD per comprovar-ho.
4. Tanca amb el botó, Escape o clic al marge del modal. El mateix vídeo torna al panell, conserva la reproducció i el moviment es reactiva.
5. Surt al passadís: el vídeo es destrueix i s'atura. Entra per la porta dreta a la Zona Cafè per veure el canal de Sintel.

El vídeo de flors de MDN no té pista d'àudio; prova el so amb Sintel a la Zona Cafè. Quan el navegador bloqueja l'autoplay amb so, es prova la reproducció silenciada i apareix el botó «Activar so». Els vídeos depenen de la connexió als servidors externs i els errors es mostren al panell. La interfície s'adapta a mòbil; aquesta fase utilitza teclat per moure el personatge.

## Fitxers i arquitectura

- `src/game/OfficeScene.js`: carrega el mapa Tiled, aplica col·lisions de parets, anima el personatge, comprova zones pels peus i emet `canvi-zona` amb `{ id, nom, titolMonitor, streamUrl }` o `null`.
- `src/components/PhaserCanvas.vue`: pont bidireccional; reenvia `canviZona` i exposa `bloquejarControls` amb `defineExpose`. Destrueix Phaser en desmuntar-se.
- `src/App.vue`: monitor, gestió d'autoplay, so, errors i modal natiu accessible. Mou un únic element `<video>` entre miniatura i modal per evitar dues reproduccions simultànies.
- `public/assets/maps/oficina.tmx`: mapa editable de Tiled. Després de canviar-lo, exporta a `oficina.json`, a la mateixa carpeta. Les capes són `Terra`, `Parets` i `Objectes`. Les sales tenen `tipus`, `nomSala`, `titolMonitor` i `streamUrl`.
- `scripts/create_assets.py`: reprodueix el mapa i els gràfics originals amb Pillow. Executar-lo sobreescriu aquests assets; no cal per iniciar l'aplicació.

## Correccions respecte del codi de les guies

- Phaser 4 s'importa amb `import * as Phaser from 'phaser'`, segons la [documentació oficial](https://phaser.io/news/2026/06/how-to-update-phaser-4-to-the-latest-version-without-breaking-your-project).
- Bloquejar el teclat també neteja les tecles premudes i atura el bucle de moviment. El personatge no pot continuar movent-se per una tecla mantinguda abans d'obrir el modal.
- Les zones es comparen per ID, així que dues sales amb el mateix nom també funcionen.
- Un únic reproductor evita eco i reinicis del vídeo quan s'amplia.
- El modal gestiona el focus, Escape i la restauració del focus; els controls es desbloquegen en tancar.
- Es mostra «canal simulat» perquè els MP4 no són una emissió en directe.

## SimplePeer: abast d'aquesta fase

No s'ha implementat una sessió WebRTC real, tal com estableix la prova de concepte de les guies. El punt de reproducció està centralitzat a `App.vue`: per reproduir un `MediaStream`, cal retirar `src` i assignar `video.value.srcObject = remoteStream`. Un sistema real també necessita senyalització, negociació de peers per sala, permisos de càmera/micròfon, configuració STUN/TURN i neteja dels peers en sortir. Aquestes peces no estan incloses en els documents com a implementació d'aquesta fase.

## Validació

```powershell
npx playwright install chromium
npm test
npm run build
```

Les proves recorren les portes amb teclat i física reals, verifiquen els dos canals, la reproducció efectiva, la desaparició en sortir, el mateix element vídeo al modal, el bloqueig amb una tecla prèviament premuda, la recuperació del moviment, els tres tancaments del modal i l'absència de desbordament a 390 px. Les captures són a `screenshots/`.

La compilació genera un avís de mida pel motor Phaser (aproximadament 357 kB gzip). `npm audit` també informa d'una cadena d'avisos a les eines de desenvolupament (`picomatch` / `tinyglobby` / Vite) sense una actualització corregida disponible a les versions consultades. El servidor es limita a 127.0.0.1; els fitxers estàtics de `dist/` no incorporen aquestes eines de desenvolupament.

## Documents de referència

- [Fase 4.a · Guia conceptual](https://docs.google.com/presentation/d/1r32IR4PM78spyuMOJTZhFeUvnAI-ISuX/edit)
- [Fase 4.b · Implementació completa](https://docs.google.com/presentation/d/12b4I-y0dnlDUdO7y8A9b27_uOuHGU0F5kcT2szA364w/edit)
