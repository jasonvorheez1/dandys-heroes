const fs = require('fs');
['badges.js', 'badges_extra.js'].forEach(file => {
  const c = fs.readFileSync('js/data/' + file, 'utf8');
  const lines = c.split('\n');
  lines.forEach((l, i) => {
    if (l.includes("owner: 'Ginger'") || l.includes("friend: 'Ginger'") || l.includes("owner: 'Bobette'") || l.includes("owner: 'Rudie'")) {
      console.log(file, i + 1, l.trim());
    }
  });
});
