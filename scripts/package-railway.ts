import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const stage = '.deploy/railway';
const targets = [['aarch64-apple-darwin', 'aarch64'], ['x86_64-apple-darwin', 'x86_64']] as const;
// Fail before staging unless both distribution archives passed notarization.
for (const [target, arch] of targets) {
  for (const kind of ['app', 'dmg']) {
    const record = JSON.parse(await readFile(`dist-release/${target}/notary-${kind}-${arch}.json`, 'utf8'));
    if (record.status !== 'Accepted') throw new Error(`${target} ${kind} is not notarized`);
  }
  const sums = await readFile(`dist-release/${target}/SHA256SUMS-${arch}.txt`, 'utf8');
  for (const ext of ['dmg', 'app.tar.gz']) {
    const name = `Honu_${arch}.${ext}`;
    const digest = createHash('sha256').update(await readFile(`dist-release/${target}/${name}`)).digest('hex');
    if (!sums.split('\n').some(line => line === `${digest}  ${name}`)) throw new Error(`Checksum mismatch: ${name}`);
  }
}
await rm(stage, { recursive: true, force: true });
await mkdir(`${stage}/public/downloads`, { recursive: true });
await cp('site/dist', `${stage}/public`, { recursive: true });
for (const name of ['Dockerfile', 'nginx.conf', 'railway.json']) await cp(`deploy/${name}`, `${stage}/${name}`);
for (const [target, arch] of targets) {
  // Only public distribution files enter the Docker context. Never app source,
  // Keychain data, credentials, or the rest of the local workspace.
  for (const name of [`Honu_${arch}.dmg`, `Honu_${arch}.app.tar.gz`, `SHA256SUMS-${arch}.txt`]) {
    await cp(`dist-release/${target}/${name}`, `${stage}/public/downloads/${name}`);
  }
}
await writeFile(`${stage}/.dockerignore`, '.DS_Store\n');
console.log(`Railway upload ready: ${stage} (static site and verified installers only)`);
