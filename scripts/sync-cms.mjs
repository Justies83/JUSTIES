// Copies the CMS bundle out of node_modules into public/admin/ before a build.
//
// Why not a CDN <script> tag: the admin screen has to keep working on a NAS
// with no outbound internet, and a pinned npm version is easier to reason
// about than "whatever the CDN serves today". The copy is gitignored — npm
// owns the file, git does not.
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const pkgPath = fileURLToPath(new URL('node_modules/@sveltia/cms/package.json', root));
const src = fileURLToPath(new URL('node_modules/@sveltia/cms/dist/sveltia-cms.js', root));
const destDir = fileURLToPath(new URL('public/admin/', root));

try {
  const { version } = JSON.parse(readFileSync(pkgPath, 'utf8'));
  mkdirSync(destDir, { recursive: true });
  copyFileSync(src, `${destDir}sveltia-cms.js`);
  console.log(`[cms] vendored sveltia-cms.js v${version}`);
} catch (error) {
  // A missing CMS must not break the public site — /admin simply won't load.
  console.warn('[cms] skipped:', error.message);
}
