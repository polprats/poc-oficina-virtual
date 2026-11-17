import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test('rooms, real movement, video lifecycle and keyboard locking', async ({page}) => {
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/'); await page.bringToFront();
  await page.waitForFunction(()=>!!window.__office?.jugador?.body);
  await expect(page.locator('video')).toHaveCount(0);
  fs.mkdirSync('screenshots',{recursive:true});
  await page.screenshot({path:'screenshots/oficina.png',fullPage:true});
  const pos=()=>page.evaluate(()=>({x:window.__office.jugador.x,y:window.__office.jugador.y}));
  const walk=async(key,ms)=>{await page.keyboard.down(key);await page.waitForTimeout(ms);await page.keyboard.up(key);};
  // Move through the meeting-room door using actual keyboard and physics.
  await walk('a',1300); await walk('w',1600);
  await expect(page.getByRole('heading',{name:'Sala de Reunions',exact:true})).toBeVisible();
  await expect(page.locator('video')).toHaveCount(1);
  await expect(page.locator('video')).toHaveAttribute('src',/flower.mp4/);
  // The MDN fixture has no audio track; the coffee-room fixture has sound.
  await expect.poll(()=>page.locator('video').evaluate(v=>v.readyState),{timeout:30000}).toBeGreaterThanOrEqual(2);
  await expect.poll(()=>page.locator('video').evaluate(v=>v.currentTime),{timeout:10000}).toBeGreaterThan(0);
  await page.screenshot({path:'screenshots/sala-reunions.png',fullPage:true});
  await page.locator('video').evaluate(v=>v.dataset.identity='original');
  await page.keyboard.down('d');
  await page.getByRole('button',{name:'Ampliar monitor',exact:true}).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const stopped=await pos();
  await page.waitForTimeout(250); await page.keyboard.up('d'); await walk('s',250);
  expect(await pos()).toEqual(stopped);
  await expect(page.locator('video')).toHaveCount(1);
  await expect(page.locator('dialog video')).toHaveAttribute('data-identity','original');
  await page.screenshot({path:'screenshots/monitor-ampliat.png',fullPage:true});
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).not.toBeVisible();
  // No stuck key after returning, even though D was held when opening.
  const resumed=await pos();await page.waitForTimeout(250);expect(await pos()).toEqual(resumed);
  await walk('s',1550);await expect(page.locator('video')).toHaveCount(0);
  await walk('d',2600);await walk('w',1600);
  await expect(page.getByRole('heading',{name:'Zona Cafè',exact:true})).toBeVisible();
  await expect(page.locator('video')).toHaveAttribute('src',/sintel/);
  await expect.poll(()=>page.locator('video').evaluate(v=>v.readyState),{timeout:45000}).toBeGreaterThanOrEqual(2);
  await page.getByRole('button',{name:'Ampliar monitor',exact:true}).first().click();
  await page.getByRole('button',{name:'Tancar monitor',exact:true}).click();
  await page.getByRole('button',{name:'Ampliar monitor',exact:true}).first().click();
  await page.locator('dialog').click({position:{x:2,y:2}});
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await walk('s',1550); await expect(page.locator('video')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('mobile layout fits viewport', async ({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/');
  await page.waitForFunction(()=>!!window.__office?.jugador?.body);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({path:'screenshots/mobil.png',fullPage:true});
});
