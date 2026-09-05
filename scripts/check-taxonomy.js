const fs = require('fs');
const content = fs.readFileSync('lib/engine/clinical-categories-taxonomy.ts', 'utf8');
const re = /category:\s*"([^"]+)"/g;
let m;
let count = 0;
const categories = [];
while ((m = re.exec(content)) !== null) {
  count++;
  categories.push(m[1]);
  console.log(`${count}. ${m[1]}`);
}
console.log(`Total categories detected: ${categories.length}`);
