const fs = require('fs');
const c = fs.readFileSync('js/ui/hero.js', 'utf8');
const lines = c.split('\n');
lines.forEach((l, i) => {
  if (l.includes('FLUTTER_SKILL_PREVIEWS') || l.includes('ASTRO_SKILL_PREVIEWS') || l.includes('COLLAB_SKILL_PREVIEWS')) {
    console.log(i + 1, l.trim());
  }
});
