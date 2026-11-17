import { test, expect } from "@playwright/test";
import fs from "node:fs";

test("DOM monitor, inspector events, fullscreen, scaling and room lifecycle", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.bringToFront();
  await page.waitForFunction(() => !!window.__office?.jugador?.body);
  await expect(page.locator("video")).toHaveCount(0);
  fs.mkdirSync("screenshots", { recursive: true });
  await page.screenshot({ path: "screenshots/oficina.png", fullPage: true });
  const pos = () =>
    page.evaluate(() => ({
      x: window.__office.jugador.x,
      y: window.__office.jugador.y,
    }));
  const walk = async (key, ms) => {
    await page.keyboard.down(key);
    await page.waitForTimeout(ms);
    await page.keyboard.up(key);
  };
  // Recorreguts amb teclat i física reals. Centrem cada porta explícitament:
  // una durada fixa pot fallar si un clic/fullscreen consumeix uns fotogrames.
  const moveAxis = async (axis, target) => {
    const current = (await pos())[axis];
    if (Math.abs(current - target) < 2) return;
    const positive = current < target;
    const key = axis === "x" ? (positive ? "d" : "a") : positive ? "s" : "w";
    await page.keyboard.down(key);
    try {
      await page.waitForFunction(
        ({ axis, target, positive }) =>
          positive
            ? window.__office.jugador[axis] >= target
            : window.__office.jugador[axis] <= target,
        { axis, target, positive },
        { timeout: 8000 },
      );
    } finally {
      await page.keyboard.up(key);
    }
  };
  await moveAxis("x", 192);
  await moveAxis("y", 230);
  await expect(
    page.getByRole("heading", { name: "Sala de Reunions", exact: true }),
  ).toBeVisible();
  await expect(page.locator("video")).toHaveCount(1);
  await expect(page.locator(".room-monitor-screen video")).toHaveAttribute(
    "src",
    /flower.mp4/,
  );
  // El vídeo és propietat d'un DOMElement real, dins el contenidor de Phaser.
  // Vue només renderitza metadades: no hi ha cap vídeo al panell de l'inspector.
  await expect(page.locator("aside video")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => window.__office.monitors.find((m) => m.actiu).dom.type,
    ),
  ).toBe("DOMElement");
  await page
    .getByRole("button", {
      name: "Inspeccionar monitor de Sala de Reunions",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Monitor seleccionat al mapa.", { exact: true }),
  ).toBeVisible();
  // Una ordre de Vue arriba a Phaser i l'estat real torna a l'inspector.
  await page.getByRole("button", { name: "Pausar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Reproduir", exact: true }),
  ).toBeVisible();
  expect(await page.locator("video").evaluate((v) => v.paused)).toBe(true);
  await page.getByRole("button", { name: "Reproduir", exact: true }).click();
  await page.getByRole("button", { name: "Activar so", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Silenciar", exact: true }),
  ).toBeVisible();
  expect(await page.locator("video").evaluate((v) => v.muted)).toBe(false);
  // La mostra de MDN no té àudio; el vídeo de la Zona Cafè sí.
  await expect
    .poll(() => page.locator("video").evaluate((v) => v.readyState), {
      timeout: 30000,
    })
    .toBeGreaterThanOrEqual(2);
  await expect
    .poll(() => page.locator("video").evaluate((v) => v.currentTime), {
      timeout: 10000,
    })
    .toBeGreaterThan(0);
  await page.screenshot({
    path: "screenshots/sala-reunions.png",
    fullPage: true,
  });
  await page
    .locator("video")
    .evaluate((v) => (v.dataset.identity = "original"));
  await page.keyboard.down("d");
  await page
    .getByRole("button", { name: "Pantalla completa ↗", exact: true })
    .click();
  await page.waitForFunction(() => !!document.fullscreenElement);
  const stopped = await pos();
  await page.waitForTimeout(250);
  await page.keyboard.up("d");
  await walk("s", 250);
  expect(await pos()).toEqual(stopped);
  await expect(page.locator("video")).toHaveCount(1);
  await expect(page.locator(":fullscreen video")).toHaveAttribute(
    "data-identity",
    "original",
  );
  await page.screenshot({
    path: "screenshots/monitor-ampliat.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Tornar a l’oficina · Esc", exact: true })
    .click();
  await page.waitForFunction(() => !document.fullscreenElement);
  // En tornar no queda cap tecla enganxada, tot i mantenir D en entrar al fullscreen.
  const resumed = await pos();
  await page.waitForTimeout(250);
  expect(await pos()).toEqual(resumed);
  // Redimensionar no ha de separar l'HTML del seu marc de píxel art.
  for (const width of [1120, 1440]) {
    await page.setViewportSize({ width, height: 1050 });
    await page.waitForTimeout(250);
    const error = await page.evaluate(() => {
      const scene = window.__office,
        m = scene.monitors.find((m) => m.actiu);
      const canvas = scene.game.canvas.getBoundingClientRect(),
        screen = m.host.getBoundingClientRect();
      const scale = canvas.width / 800;
      return Math.max(
        Math.abs(screen.x - (canvas.x + m.objecte.x * scale)),
        Math.abs(screen.y - (canvas.y + m.objecte.y * scale)),
        Math.abs(screen.width - m.objecte.width * scale),
      );
    });
    expect(error).toBeLessThan(2);
  }
  const videoAnterior = await page.locator("video").elementHandle();
  await moveAxis("x", 192);
  await moveAxis("y", 480);
  await expect(page.locator("video")).toHaveCount(0);
  expect(
    await videoAnterior.evaluate(
      (v) => v.paused && !v.hasAttribute("src") && !v.isConnected,
    ),
  ).toBe(true);
  await moveAxis("x", 608);
  await moveAxis("y", 230);
  await expect(
    page.getByRole("heading", { name: "Zona Cafè", exact: true }),
  ).toBeVisible();
  await expect(page.locator("video")).toHaveAttribute("src", /sintel/);
  await expect
    .poll(() => page.locator("video").evaluate((v) => v.readyState), {
      timeout: 45000,
    })
    .toBeGreaterThanOrEqual(2);
  await page
    .getByRole("button", {
      name: "Inspeccionar monitor de Zona Cafè",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Càmera Descans · Canal 02", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Pantalla completa ↗", exact: true })
    .click();
  await page.waitForFunction(() => !!document.fullscreenElement);
  await page
    .getByRole("button", { name: "Tornar a l’oficina · Esc", exact: true })
    .click();
  await page.waitForFunction(() => !document.fullscreenElement);
  await moveAxis("x", 608);
  await moveAxis("y", 480);
  await expect(page.locator("video")).toHaveCount(0);
  await expect(
    page.getByText("La pantalla és dins la sala", { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("mobile layout fits viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForFunction(() => !!window.__office?.jugador?.body);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "screenshots/mobil.png", fullPage: true });
});

test("Tiled defines screen position and size; scene restart removes DOM and listeners", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // Canviem NOMÉS el mapa servit, com si l'usuari hagués editat el rectangle a Tiled.
  // Si el codi tingués dimensions hardcoded, aquesta prova fallaria.
  const map = JSON.parse(
    fs.readFileSync("public/assets/maps/oficina.json", "utf8"),
  );
  const obj = map.layers
    .find((l) => l.name === "Objectes")
    .objects.find((o) => o.id === 4);
  Object.assign(obj, { x: 169, y: 111, width: 120, height: 68 });
  await page.route("**/assets/maps/oficina.json", (route) =>
    route.fulfill({ json: map }),
  );
  await page.goto("/");
  await page.bringToFront();
  await page.waitForFunction(() => !!window.__office?.jugador?.body);
  await page.keyboard.down("a");
  await page.waitForFunction(() => window.__office.jugador.x <= 192);
  await page.keyboard.up("a");
  await page.keyboard.down("w");
  await page.waitForFunction(() => window.__office.jugador.y <= 230);
  await page.keyboard.up("w");
  const host = page.locator(".room-monitor-screen");
  await expect(host).toBeVisible();
  await expect(page.getByText("120 × 68 px", { exact: true })).toBeVisible();
  const error = await host.evaluate((el) => {
    const c = window.__office.game.canvas.getBoundingClientRect(),
      r = el.getBoundingClientRect(),
      s = c.width / 800;
    return Math.max(
      Math.abs(r.x - (c.x + 169 * s)),
      Math.abs(r.y - (c.y + 111 * s)),
      Math.abs(r.width - 120 * s),
      Math.abs(r.height - 68 * s),
    );
  });
  expect(error).toBeLessThan(2);
  const oldVideo = await page.locator("video").elementHandle();
  await page.evaluate(() => window.__office.scene.restart());
  await expect(page.locator("video")).toHaveCount(0);
  await expect(
    page.getByText("La pantalla és dins la sala", { exact: true }),
  ).toBeVisible();
  expect(
    await oldVideo.evaluate(
      (v) => !v.isConnected && v.paused && !v.hasAttribute("src"),
    ),
  ).toBe(true);
  await page.waitForFunction(() => !!window.__office?.jugador?.body);
  expect(
    await page.evaluate(() =>
      window.__office.game.events.listenerCount("monitor-ordre"),
    ),
  ).toBe(1);
  expect(errors).toEqual([]);
});
