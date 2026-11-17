# Historial de versions

## v1.2.0 — 2026-11-17

- Monitors de píxel art al mapa amb vídeo HTML posicionat mitjançant Phaser DOMElement.
- Inspector Vue sense vídeo, amb metadades i ordres de reproducció, so i pantalla completa.
- Bus bidireccional amb contracte compartit i traça visible d’esdeveniments.
- Pantalla completa real sobre el mateix vídeo, amb bloqueig de moviment.
- Posicions i associacions dels monitors definides a Tiled.
- Codi nou comentat en català i guia `DOM_ELEMENT.md` sobre capes, coordenades, input, escala i neteja.
- Proves d’alineació responsive, fullscreen, ordres i alliberament del vídeo.

## v1.1.0 — 2026-11-17

- Substituït el personatge provisional pel George original de sheep, indicat a la guia de la Fase 3.
- Conservades les animacions en quatre direccions, el hitbox dels peus i el bloqueig del moviment al modal.
- Avatars de la interfície amb el mateix George i crèdit visible de l'autor.
- Afegits la procedència i la llicència a `THIRD_PARTY_NOTICES.md`.
- El generador del mapa ja no sobreescriu el spritesheet de George.

L'etiqueta `v1.0.0` conserva la versió anterior amb el personatge provisional.

## v1.0.0 — 2026-11-17

Primera versió de l'oficina virtual, conservada abans d'integrar el personatge George original.

- Oficina amb dues sales i col·lisions de parets, mapa Tiled editable i moviment amb WASD/fletxes.
- Monitor contextual per sala, vídeos MP4 de prova, control de so i gestió d'autoplay.
- Modal ampliat amb un únic reproductor, bloqueig del moviment i restauració dels controls i del focus.
- Interfície en català adaptable a pantalles estretes.
- Mapa, tiles i personatge provisionals originals d'aquesta demostració. L'asset intern `george.png` és una il·lustració pròpia; encara no és el George original sol·licitat.
- Compilació verificada i dues proves Playwright superades.

La integració del George original s'ha de fer en una versió posterior, mantenint aquesta etiqueta intacta.
