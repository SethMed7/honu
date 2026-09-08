import { readFileSync } from 'node:fs';
import { parse } from 'smol-toml';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const config = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'));
const cargo = parse(readFileSync('src-tauri/Cargo.toml', 'utf8')) as { package: { version: string } };
const lock = parse(readFileSync('src-tauri/Cargo.lock', 'utf8')) as { package: { name: string; version: string }[] };
if (![config.version, cargo.package.version, lock.package.find(p => p.name === 'honu')?.version].every(v => v === pkg.version)) {
  throw new Error('Version mismatch between package.json, tauri.conf.json, Cargo.toml, and Cargo.lock');
}
if (process.env.GITHUB_REF_TYPE === 'tag' && process.env.GITHUB_REF_NAME !== `v${pkg.version}`) {
  throw new Error('Release tag must exactly match the configured version');
}
console.log(`Honu ${pkg.version}: versions match`);
