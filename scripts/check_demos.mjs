// QA de les compilacions estàtiques reals, sense dependre del servidor Vite ni de __office.
// Executar després de build:demos i de servir hosting-dist/ amb un servidor HTTP.
import { chromium, expect } from "@playwright/test";
import fs from "node:fs";

const base = process.env.DEMO_BASE_URL || "http://127.0.0.1:4174";
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (
      r.url().startsWith(base) &&
      r.status() >= 400 &&
      !r.url().endsWith("/favicon.ico")
    )
      errors.push(`${r.status()} ${r.url()}`);
  });
  await page.goto(base + "/");
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(3);
  fs.mkdirSync("screenshots", { recursive: true });
  await page.screenshot({ path: "screenshots/tres-demos.png", fullPage: true });
  for (const slug of ["inicial", "george", "dom"]) {
    await page.goto(`${base}/${slug}/`);
    await page.bringToFront();
    await expect(page.locator("canvas")).toBeVisible();
    await expect(page.locator(".loading")).toHaveCount(0);
    await page.keyboard.down("a");
    await page.waitForTimeout(1300);
    await page.keyboard.up("a");
    await page.keyboard.down("w");
    await page.waitForTimeout(1600);
    await page.keyboard.up("w");
    await expect(
      page.getByRole("heading", { name: "Sala de Reunions", exact: true }),
    ).toBeVisible();
    await expect(page.locator("video")).toHaveCount(1);
    await expect
      .poll(() => page.locator("video").evaluate((v) => v.readyState), {
        timeout: 30000,
      })
      .toBeGreaterThanOrEqual(2);
    if (slug === "dom") {
      await expect(page.locator("aside video")).toHaveCount(0);
      await page
        .getByRole("button", { name: "Obrir finestra modal ▣", exact: true })
        .click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page.getByText("● WASD i fletxes desactivats", { exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Tancar finestra modal", exact: true })
        .click();
      await expect(page.getByRole("dialog")).not.toBeVisible();
      await expect(page.locator(".room-monitor-screen video")).toHaveCount(1);
    }
    await expect(
      page.getByRole("link", { name: "← Tres demos", exact: true }),
    ).toHaveAttribute("href", "/");
    console.log(`Verified /${slug}/: map, assets, movement and video`);
  }
  expect(errors).toEqual([]);
} finally {
  await browser.close();
}
