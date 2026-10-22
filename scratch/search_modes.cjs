const fs = require('fs');
const c = fs.readFileSync('js/ui/hero.js', 'utf8');
const lines = c.split('\n');
lines.forEach((l, i) => {
  if (l.includes('flutterMode') || l.includes('scrapsMode') || l.includes('delilahMode')) {
    console.log(i + 1, l.trim());
  }
});
