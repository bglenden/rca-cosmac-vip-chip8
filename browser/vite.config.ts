import { defineConfig } from 'vite';
import { execSync } from 'child_process';
import { resolve, extname } from 'path';
import { readFileSync, existsSync, mkdirSync, copyFileSync, readdirSync } from 'fs';

const rootDir = resolve(__dirname, '..');
const sourceFile = resolve(rootDir, 'VP-710_RCA_COSMAC_VIP_Game_Manual_Dec78.md');
const romsDir = resolve(rootDir, 'roms');

const MIME_TYPES: Record<string, string> = {
  '.json': 'application/json',
  '.ch8': 'application/octet-stream',
  '.rom': 'application/octet-stream',
  '.bin': 'application/octet-stream',
};

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/rca-cosmac-vip-chip8/' : '/',
  build: {
    outDir: resolve(rootDir, 'site'),
    emptyOutDir: true,
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
  plugins: [
    {
      name: 'serve-roms',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/roms/')) {
            const filePath = resolve(romsDir, req.url.slice(6));
            if (existsSync(filePath)) {
              const content = readFileSync(filePath);
              const mime = MIME_TYPES[extname(filePath)] || 'application/octet-stream';
              res.setHeader('Content-Type', mime);
              res.end(content);
              return;
            }
          }
          next();
        });
      },
    },
    {
      name: 'rebuild-rom',
      configureServer(server) {
        server.watcher.add(sourceFile);
        server.watcher.on('change', (path) => {
          if (path === sourceFile) {
            console.log('\n[rebuild-rom] Source changed, rebuilding ROM...');
            try {
              execSync('node roms/build_spacefighters.mjs', { cwd: rootDir, stdio: 'inherit' });
              console.log('[rebuild-rom] ROM rebuilt successfully');
            } catch {
              console.error('[rebuild-rom] ROM build failed');
            }
          }
        });
      },
      buildStart() {
        try {
          execSync('node roms/build_spacefighters.mjs', { cwd: rootDir, stdio: 'inherit' });
        } catch {
          // already reported by npm run dev's pre-command
        }
      },
    },
    {
      name: 'copy-roms',
      writeBundle(options) {
        const outDir = options.dir ?? resolve(rootDir, 'site');
        const destRoms = resolve(outDir, 'roms');
        mkdirSync(destRoms, { recursive: true });
        for (const file of readdirSync(romsDir)) {
          copyFileSync(resolve(romsDir, file), resolve(destRoms, file));
        }
      },
    },
  ],
}));
