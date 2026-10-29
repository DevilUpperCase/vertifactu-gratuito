const { rcedit } = require('rcedit');
const path = require('path');
const fs = require('fs');

async function patchBinary(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`[patch-exe] File not found, skipping: ${filePath}`);
    return;
  }

  const iconPath = path.resolve(__dirname, '../icon.ico');
  const hasIcon = fs.existsSync(iconPath);

  try {
    const options = {
      'file-version': '1.0.0',
      'product-version': '1.0.0',
      'version-string': {
        'FileDescription': 'Verifactu Gratuito - Taratic',
        'ProductName': 'Verifactu Gratuito Taratic',
        'LegalCopyright': 'Copyright (c) 2026 Taratic',
        'OriginalFilename': path.basename(filePath),
        'CompanyName': 'Taratic Software',
        'InternalName': 'VerifactuGratuito',
        'Comments': 'Software de Facturación Verifactu 100% Local y Gratuito para España'
      }
    };

    if (hasIcon) {
      options.icon = iconPath;
    }

    await rcedit(filePath, options);
    console.log(`[patch-exe] Patched PE metadata and icon for: ${filePath}`);
  } catch (err) {
    console.error(`[patch-exe] Error patching ${filePath}:`, err.message);
  }
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const targets = [
    path.join(rootDir, 'bin/verifactu-gratuito-win_x64.exe'),
    path.join(rootDir, 'bin/neutralino-win_x64.exe'),
  ];

  // Also search in dist/ and release directories for any win_x64.exe
  const searchDirs = [
    path.join(rootDir, 'dist'),
    path.join(rootDir, 'verifactu-gratuito-taratic-release'),
    path.join(rootDir, 'verifactu-gratuito-release'),
  ];

  for (const dir of searchDirs) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir, { recursive: true });
      for (const file of files) {
        if (typeof file === 'string' && file.endsWith('.exe')) {
          targets.push(path.join(dir, file));
        }
      }
    }
  }

  const uniqueTargets = [...new Set(targets)];
  for (const target of uniqueTargets) {
    await patchBinary(target);
  }
}

main();

