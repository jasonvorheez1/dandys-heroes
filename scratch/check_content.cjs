const fs = require('fs');
const c = fs.readFileSync('js/data/content.js', 'utf8');
const lines = c.split('\n');
lines.forEach((l, i) => {
  if (l.includes('Ginger') || l.includes('ginger')) {
    console.log(i + 1, l.trim());
  }
});
