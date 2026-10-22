const fs = require('fs');
const lines = fs.readFileSync('js/data/heroes.js', 'utf8').split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("id: 'Cocoa'")) {
    console.log('Cocoa line:', i + 1);
    break;
  }
}
