const fs = require('fs');
const { execSync } = require('child_process');

const content = fs.readFileSync('js/item-sheet.js', 'utf8');
const match = content.match(/const GAME_SCRIPTS = (\[[\s\S]*?\]);/);
if (!match) {
  console.error('Could not find GAME_SCRIPTS');
  process.exit(1);
}
const scripts = eval(match[1]);
let failed = 0;
scripts.forEach(s => {
  try {
    execSync(`node --check "${s}"`, { stdio: 'pipe' });
  } catch (err) {
    console.error('FAILED:', s, err.message);
    failed++;
  }
});
console.log(`Checked ${scripts.length} scripts. Failures: ${failed}`);
if (failed > 0) process.exit(1);
