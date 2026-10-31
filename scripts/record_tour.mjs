import puppeteer from 'file:///C:/Users/David/Documents/antigravity-proyects/create-videos-app/shared/tools/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rawVideoFile = path.join(__dirname, '..', 'verifactu_gratuito_raw.mp4');
const masterOutputFile = path.join(__dirname, '..', 'verifactu_gratuito_master_tour_16x9.mp4');
const musicFile = 'C:/Users/David/Documents/antigravity-proyects/create-videos-app/assets/audio/music/orchestral/cinematic_dark_deliverance.mp3';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('=== STARTING 1080p SCREEN RECORDING TOUR (VERIFACTU GRATUITO) ===');

  if (fs.existsSync(rawVideoFile)) {
    try { fs.unlinkSync(rawVideoFile); } catch {}
  }

  const ffmpeg = spawn('ffmpeg', [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', '25',
    '-i', '-',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'fast',
    '-crf', '18',
    '-movflags', '+faststart',
    rawVideoFile
  ]);

  ffmpeg.stderr.on('data', () => {});
  ffmpeg.on('close', code => {
    console.log(`[ffmpeg raw] closed with code ${code}`);
  });

  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: [
      '--window-size=1920,1080',
      '--no-sandbox',
      '--disable-infobars'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('Navigating to http://localhost:5190/...');
  await page.goto('http://localhost:5190/', { waitUntil: 'domcontentloaded' });

  // Ensure default dark mode in page
  await page.evaluate(() => {
    localStorage.setItem('app_theme', 'dark');
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  });

  await sleep(2500); // Wait for SQLite WASM and React initialization

  // Inject High Visibility Presentation Cursor & Click Ripple Animation (from taratic-human-anatomy-3d)
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.id = 'cursor-presentation-styles';
    style.textContent = `
      #virtual-cursor {
        position: fixed;
        top: 0;
        left: 0;
        width: 44px;
        height: 44px;
        pointer-events: none;
        z-index: 2147483647;
        transform: translate(960px, 500px);
        transition: transform 0.02s linear;
        filter: drop-shadow(0 4px 14px rgba(0, 0, 0, 0.85));
      }
      #virtual-cursor svg {
        display: block;
        width: 44px;
        height: 44px;
      }
      .cursor-click-wave {
        position: fixed;
        width: 76px;
        height: 76px;
        margin-left: -38px;
        margin-top: -38px;
        border-radius: 50%;
        border: 4px solid #00f0ff;
        background: radial-gradient(circle, rgba(0, 240, 255, 0.6) 0%, rgba(0, 240, 255, 0.15) 55%, transparent 75%);
        pointer-events: none;
        z-index: 2147483646;
        transform: scale(0.15);
        opacity: 1;
        animation: clickWaveAnim 0.55s cubic-bezier(0.1, 0.85, 0.25, 1) forwards;
      }
      @keyframes clickWaveAnim {
        0% { transform: scale(0.15); opacity: 1; }
        60% { opacity: 0.9; }
        100% { transform: scale(1.75); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    const cursor = document.createElement('div');
    cursor.id = 'virtual-cursor';
    cursor.innerHTML = `
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 2L13.5 25.5L17.5 17.5L25.5 13.5L4 2Z" fill="#000000" stroke="#000000" stroke-width="4.5" stroke-linejoin="round"/>
        <path d="M4 2L13.5 25.5L17.5 17.5L25.5 13.5L4 2Z" fill="#00e5ff" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="5" cy="3.5" r="2.5" fill="#ffffff"/>
      </svg>
    `;
    document.body.appendChild(cursor);

    window.__cursorX = 960;
    window.__cursorY = 500;

    window.__moveCursor = (x, y) => {
      window.__cursorX = x;
      window.__cursorY = y;
      cursor.style.transform = `translate(${x}px, ${y}px)`;
    };

    window.__clickCursor = (x, y) => {
      window.__moveCursor(x, y);
      const wave = document.createElement('div');
      wave.className = 'cursor-click-wave';
      wave.style.left = `${x}px`;
      wave.style.top = `${y}px`;
      document.body.appendChild(wave);
      setTimeout(() => wave.remove(), 600);
    };
  });

  const client = await page.target().createCDPSession();
  let frameCount = 0;

  client.on('Page.screencastFrame', async ({ data, sessionId }) => {
    try {
      const buffer = Buffer.from(data, 'base64');
      ffmpeg.stdin.write(buffer);
      frameCount++;
      await client.send('Page.screencastFrameAck', { sessionId });
    } catch (e) {}
  });

  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 94,
    maxWidth: 1920,
    maxHeight: 1080,
    everyNthFrame: 1
  });

  console.log('Screencast started. Recording scenes...');

  let curX = 960;
  let curY = 500;

  async function smoothMouseMove(x1, y1, x2, y2, steps = 18) {
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const x = Math.round(x1 + (x2 - x1) * ease);
      const y = Math.round(y1 + (y2 - y1) * ease);
      await page.evaluate((cx, cy) => window.__moveCursor(cx, cy), x, y);
      await page.mouse.move(x, y);
      await sleep(14);
    }
    curX = x2;
    curY = y2;
  }

  async function animatedClick(targetX, targetY, waitAfter = 1500) {
    await smoothMouseMove(curX, curY, targetX, targetY);
    await sleep(150);
    await page.evaluate((cx, cy) => window.__clickCursor(cx, cy), targetX, targetY);
    await page.mouse.click(targetX, targetY);
    await sleep(waitAfter);
  }

  async function clickByText(selector, text, waitAfter = 1500) {
    const elements = await page.$$(selector);
    for (const el of elements) {
      const content = await page.evaluate(e => e.textContent, el);
      if (content && content.toLowerCase().includes(text.toLowerCase())) {
        const box = await el.boundingBox();
        if (box) {
          const tx = Math.round(box.x + box.width / 2);
          const ty = Math.round(box.y + box.height / 2);
          await animatedClick(tx, ty, waitAfter);
          return true;
        }
      }
    }
    return false;
  }

  // 1. SCENE 1: Tour initial survol des métriques Dashboard
  console.log('Scene 1: Gliding over Dashboard metrics & cards...');
  await sleep(1200);
  await smoothMouseMove(curX, curY, 400, 160, 22); // Total Facturado
  await sleep(800);
  await smoothMouseMove(curX, curY, 700, 160, 18); // Pendiente
  await sleep(700);
  await smoothMouseMove(curX, curY, 1000, 160, 18); // IGIC / IVA
  await sleep(700);
  await smoothMouseMove(curX, curY, 1300, 160, 18); // Verifactu AEAT
  await sleep(1000);

  // 2. SCENE 2: Scroll doux vers la section de benchmark mémoire (< 3 MB vs Chrome 100-500 MB)
  console.log('Scene 2: Scrolling to Memory Benchmark Section (<3MB vs Chrome)...');
  await page.evaluate(() => {
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollBy({ top: 350, behavior: 'smooth' });
  });
  await sleep(1000);

  // Hover over the 2.8 MB card
  await smoothMouseMove(curX, curY, 500, 390, 20);
  await sleep(1200);

  // Hover over Google Chrome 100-500 MB card
  await smoothMouseMove(curX, curY, 960, 390, 20);
  await sleep(1400);

  // Hover over the detailed comparison table
  await smoothMouseMove(curX, curY, 800, 560, 20);
  await sleep(1200);

  // Scroll back to top
  await page.evaluate(() => {
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
  });
  await sleep(900);

  // 3. SCENE 3: Open Invoice Modal & demonstrate creation
  console.log('Scene 3: Opening Nueva Factura Modal...');
  await clickByText('button', 'Nueva Factura', 1800);

  // Select client or type concept
  console.log('Interacting inside InvoiceFormModal...');
  const conceptInput = await page.$('input[placeholder*="concepto"], input[name*="concept"], textarea');
  if (conceptInput) {
    const box = await conceptInput.boundingBox();
    if (box) {
      await animatedClick(Math.round(box.x + 80), Math.round(box.y + box.height / 2), 600);
      await conceptInput.type('Desarrollo y Consultoria Verifactu AEAT', { delay: 40 });
    }
  }

  // Hover over price and Verifactu badge
  await smoothMouseMove(curX, curY, 1100, 480, 18);
  await sleep(1500);

  // Close modal with close button
  console.log('Closing Invoice Modal...');
  const closeBtn = await page.$('button[aria-label="Cerrar"], button svg[data-icon="times"]');
  if (closeBtn) {
    const box = await closeBtn.boundingBox();
    if (box) {
      await animatedClick(Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2), 1200);
    }
  } else {
    await page.keyboard.press('Escape');
    await sleep(1000);
  }

  // 4. SCENE 4: Navigate to Facturas page
  console.log('Scene 4: Navigating to Facturas page...');
  await clickByText('aside nav button', 'Facturas', 1600);
  await smoothMouseMove(curX, curY, 800, 280, 20);
  await sleep(1200);

  // 5. SCENE 5: Navigate to Informe de ventas
  console.log('Scene 5: Navigating to Generar informe de ventas...');
  await clickByText('aside nav button', 'Generar informe de ventas', 1600);
  await smoothMouseMove(curX, curY, 700, 280, 20);
  await sleep(1200);

  // 6. SCENE 6: Navigate to Configuración & Toggle Theme
  console.log('Scene 6: Navigating to Configuración & theme switch...');
  await clickByText('aside nav button', 'Configuración', 1500);
  await smoothMouseMove(curX, curY, 800, 320, 20);
  await sleep(1200);

  // Toggle theme button in Header
  console.log('Toggling Light Mode and Dark Mode...');
  const themeBtn = await page.$('header button[title*="tema"], header button:has(svg)');
  if (themeBtn) {
    const box = await themeBtn.boundingBox();
    if (box) {
      await animatedClick(Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2), 1800);
      // Toggle back to Dark Mode
      await animatedClick(Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2), 1400);
    }
  }

  // 7. SCENE 7: Return to Dashboard
  console.log('Scene 7: Returning to Dashboard...');
  await clickByText('aside nav button', 'Panel Principal', 1800);
  await smoothMouseMove(curX, curY, 960, 450, 22);
  await sleep(1600);

  console.log(`Stopping screencast... Total recorded frames: ${frameCount}`);
  await client.send('Page.stopScreencast');
  await browser.close();

  ffmpeg.stdin.end();

  await new Promise(resolve => {
    ffmpeg.on('close', resolve);
  });

  console.log(`Raw video created: ${rawVideoFile}`);

  // Mux audio soundtrack with audio ducking and smooth fades (from taratic-human-anatomy-3d)
  console.log('Muxing soundtrack with audio ducking and smooth fades...');
  try {
    const durationCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${rawVideoFile}"`;
    const durRaw = execSync(durationCmd, { encoding: 'utf-8' }).trim();
    const duration = parseFloat(durRaw) || 35.0;
    const fadeOutStart = Math.max(0, duration - 2.5);

    const muxCmd = `ffmpeg -y -i "${rawVideoFile}" -i "${musicFile}" -filter_complex "[1:a]volume=0.20,afade=t=in:st=0:d=1.5,afade=t=out:st=${fadeOutStart.toFixed(2)}:d=2.5[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest "${masterOutputFile}"`;
    console.log(`Executing: ${muxCmd}`);
    execSync(muxCmd, { stdio: 'inherit' });
    console.log(`=== MASTER TOUR VIDEO PRODUCED: ${masterOutputFile} ===`);
  } catch (err) {
    console.error('Error muxing audio:', err);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
