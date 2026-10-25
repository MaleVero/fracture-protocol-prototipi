// Percorsi condivisi dagli script di audit. Si lanciano da tools/audit:
//   BUILD=v2026-09-16 node missions.js aggro      (BUILD di default: l'ultima in builds/)
const fs = require('fs');
const path = require('path');
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('/opt/node-tools/node_modules/playwright'); }
const builds = path.resolve(__dirname, '../../builds');
const build = process.env.BUILD || fs.readdirSync(builds).filter(d => d.startsWith('v')).sort().pop();
const OUT = path.resolve(process.env.OUT || path.join(__dirname, 'out'));
fs.mkdirSync(OUT, { recursive: true });
module.exports = {
  pw,
  URL: 'file://' + path.join(builds, build, 'index.html'),
  OUT,
  chromium: process.env.CHROMIUM || '/opt/pw-browsers/chromium',
};
