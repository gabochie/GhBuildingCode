// capture-screenshots.mjs
// Captures real screenshots of the LIVE ghbc.gabochie.com for the README.
// Usage: node scripts/capture-screenshots.mjs
import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const BASE = process.env.CAPTURE_BASE || 'https://ghbc.gabochie.com'
const OUT = path.resolve('docs/screenshots')

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'code-explorer', path: '/code' },
  { name: 'academy', path: '/academy' },
  { name: 'developers', path: '/developers' },
  { name: 'register', path: '/register' },
]

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
})
const page = await ctx.newPage()

for (const p of PAGES) {
  const url = BASE + p.path
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(2500)
    const raw = await page.screenshot({ fullPage: false })
    const file = path.join(OUT, `${p.name}.jpg`)
    await sharp(raw)
      .resize({ width: 1280, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(file)
    console.log(`ok  ${p.name}  ${url}`)
  } catch (e) {
    console.warn(`ERR ${p.name}  ${url}  ${e.message}`)
  }
}

await browser.close()
console.log(`\nSaved to ${OUT}`)
