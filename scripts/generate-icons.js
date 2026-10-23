const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const size = 512;
  const shieldHeight = 350;
  const shieldWidth = Math.round(350 * (3609 / 4580)); // ~275px

  // SVG background with deep stadium gradient + subtle blue/red atmosphere
  const svgBg = Buffer.from(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stop-color="#14214D" />
          <stop offset="55%" stop-color="#090E22" />
          <stop offset="100%" stop-color="#050814" />
        </radialGradient>
        <radialGradient id="glowRed" cx="50%" cy="80%" r="45%">
          <stop offset="0%" stop-color="#E11D48" stop-opacity="0.22" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="glowBlue" cx="50%" cy="20%" r="45%">
          <stop offset="0%" stop-color="#2563EB" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
      </defs>
      <!-- Base Background -->
      <rect width="${size}" height="${size}" fill="url(#bgGrad)" />
      <!-- Subtle Club Lights -->
      <circle cx="256" cy="110" r="180" fill="url(#glowBlue)" />
      <circle cx="256" cy="400" r="180" fill="url(#glowRed)" />
    </svg>
  `);

  // Resize shield
  const resizedShield = await sharp(path.join(__dirname, '../public/Talleres_Futsal.png'))
    .resize(shieldWidth, shieldHeight, { fit: 'contain' })
    .toBuffer();

  const left = Math.round((size - shieldWidth) / 2);
  const top = Math.round((size - shieldHeight) / 2);

  // Composite 512x512 icon
  const icon512 = await sharp(svgBg)
    .composite([
      {
        input: resizedShield,
        top: top,
        left: left,
      }
    ])
    .png()
    .toBuffer();

  const iconsDir = path.join(__dirname, '../public/icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // 1. PWA 512x512
  await sharp(icon512).toFile(path.join(iconsDir, 'icon-512.png'));
  await sharp(icon512).toFile(path.join(iconsDir, 'icon-maskable-512.png'));

  // 2. PWA 192x192
  await sharp(icon512).resize(192, 192).toFile(path.join(iconsDir, 'icon-192.png'));
  await sharp(icon512).resize(192, 192).toFile(path.join(iconsDir, 'icon-maskable-192.png'));

  // 3. Apple Touch Icon 180x180 (for iOS home screen)
  await sharp(icon512).resize(180, 180).toFile(path.join(__dirname, '../public/apple-touch-icon.png'));
  await sharp(icon512).resize(180, 180).toFile(path.join(iconsDir, 'apple-touch-icon.png'));

  // 4. Also create a favicon 32x32 and 64x64
  await sharp(icon512).resize(32, 32).toFile(path.join(__dirname, '../public/favicon.ico'));

  console.log('Icons generated successfully!');
}

generateIcons().catch(console.error);
