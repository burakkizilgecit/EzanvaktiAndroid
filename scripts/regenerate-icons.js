const path = require('path');
const fs   = require('fs');
const { generateImageAsync } = require('@expo/image-utils');

const ROOT    = path.resolve(__dirname, '..');
const SRC_PNG = path.join(ROOT, 'assets', 'images', 'icon.png');
const RES_DIR = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');

const DENSITIES = [
  { folder: 'mipmap-mdpi',    fg: 108, ic: 48  },
  { folder: 'mipmap-hdpi',    fg: 162, ic: 72  },
  { folder: 'mipmap-xhdpi',   fg: 216, ic: 96  },
  { folder: 'mipmap-xxhdpi',  fg: 324, ic: 144 },
  { folder: 'mipmap-xxxhdpi', fg: 432, ic: 192 },
];

async function resize(dest, size) {
  const result = await generateImageAsync(
    { projectRoot: ROOT },
    { src: SRC_PNG, width: size, height: size, resizeMode: 'cover', backgroundColor: 'transparent' }
  );
  fs.writeFileSync(dest, Buffer.from(result.source));
}

async function main() {
  console.log('Source icon:', SRC_PNG);
  for (const d of DENSITIES) {
    const dir = path.join(RES_DIR, d.folder);
    fs.mkdirSync(dir, { recursive: true });

    process.stdout.write(`  [${d.folder}] fg=${d.fg}px... `);
    await resize(path.join(dir, 'ic_launcher_foreground.png'), d.fg);

    process.stdout.write(`ic=${d.ic}px... `);
    await resize(path.join(dir, 'ic_launcher.png'), d.ic);
    fs.copyFileSync(path.join(dir, 'ic_launcher.png'), path.join(dir, 'ic_launcher_round.png'));
    console.log('ok');
  }
  console.log('\nDone! All mipmap icons updated from icon.png');
}

main().catch(err => { console.error(err); process.exit(1); });
