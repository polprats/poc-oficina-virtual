/** Contracte compartit. Només viatgen objectes plans, mai nodes HTML ni l'escena. */
export const OFFICE_EVENTS = Object.freeze({
  ZONE: "canvi-zona", // Phaser -> Vue: sala actual o null.
  SELECT: "monitor-seleccionat", // Phaser -> Vue: clic al monitor del mapa.
  STATE: "monitor-estat", // Phaser -> Vue: reproducció i metadades.
  COMMAND: "monitor-ordre", // Vue -> Phaser: { id, accio }.
});
