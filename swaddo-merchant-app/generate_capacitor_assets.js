const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, 'assets');

if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR);
}

// 1. Generate icon-background.png (1024x1024 solid #16A34A)
const iconBgSvg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#16A34A" />
</svg>
`;

// 2. Generate icon-foreground.png (1024x1024 transparent bg, text in safe zone)
// Adaptive icon safe zone is the inner 66% (diameter 675px out of 1024px).
// So text must easily fit within a ~600x600 box centered.
const iconFgSvg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <style>
    .t { font-family: sans-serif; font-weight: 900; fill: #ffffff; text-anchor: middle; font-size: 110px; letter-spacing: -2px; }
    .m { font-family: sans-serif; font-weight: 900; fill: #ffffff; text-anchor: middle; font-size: 110px; letter-spacing: -2px; }
  </style>
  <text x="512" y="470" class="t">SWADDO</text>
  <text x="512" y="600" class="m">MERCHANT</text>
</svg>
`;

// 3. Generate icon.png (fallback, combining both)
const iconSvg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <style>
    .t { font-family: sans-serif; font-weight: 900; fill: #ffffff; text-anchor: middle; font-size: 140px; letter-spacing: -3px; }
    .m { font-family: sans-serif; font-weight: 900; fill: #ffffff; text-anchor: middle; font-size: 140px; letter-spacing: -3px; }
  </style>
  <rect width="1024" height="1024" rx="200" fill="#16A34A" />
  <text x="512" y="460" class="t">SWADDO</text>
  <text x="512" y="620" class="m">MERCHANT</text>
</svg>
`;

// 4. Generate splash.png (2732x2732)
// For splash screen, center 1/3 of the screen is fully safe for all devices.
const splashSvg = `
<svg width="2732" height="2732" xmlns="http://www.w3.org/2000/svg">
  <style>
    .t { font-family: sans-serif; font-weight: 900; fill: #ffffff; text-anchor: middle; font-size: 280px; letter-spacing: -5px; }
    .m { font-family: sans-serif; font-weight: 900; fill: #ffffff; text-anchor: middle; font-size: 280px; letter-spacing: -5px; }
  </style>
  <rect width="2732" height="2732" fill="#16A34A" />
  <text x="1366" y="1260" class="t">SWADDO</text>
  <text x="1366" y="1580" class="m">MERCHANT</text>
</svg>
`;

async function generate() {
  console.log("Generating icon-background.png...");
  await sharp(Buffer.from(iconBgSvg)).png().toFile(path.join(ASSETS_DIR, 'icon-background.png'));
  
  console.log("Generating icon-foreground.png...");
  await sharp(Buffer.from(iconFgSvg)).png().toFile(path.join(ASSETS_DIR, 'icon-foreground.png'));

  console.log("Generating icon.png...");
  await sharp(Buffer.from(iconSvg)).png().toFile(path.join(ASSETS_DIR, 'icon.png'));

  console.log("Generating splash.png...");
  await sharp(Buffer.from(splashSvg)).png().toFile(path.join(ASSETS_DIR, 'splash.png'));
  
  console.log("Assets generated successfully!");
}

generate().catch(console.error);
