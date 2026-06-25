const fs = require('fs');
const c = fs.readFileSync('public/chat.html', 'utf8');
const m = c.match(/<script type="module">([\s\S]*?)<\/script>/);
try {
  new Function(m[1].replace(/import[^;]+;/g, '').replace(/await import[^;]+;/g, ''));
  console.log('SINTASSI OK');
} catch(e) {
  console.log('ERRORE: ' + e.message);
}
