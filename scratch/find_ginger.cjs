const fs = require('fs');
const c = fs.readFileSync('js/data/heroes.js', 'utf8');
const lines = c.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("id: 'Ginger'")) {
    console.log('Ginger is on line:', i + 1);
    break;
  }
}
