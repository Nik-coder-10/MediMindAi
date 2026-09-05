const fs = require('fs');
const content = fs.readFileSync('lib/engine/clinical-categories-taxonomy.ts', 'utf8');

// Match each category block: between `id: "XYZ"` and the next category block or end
const blocks = content.split(/\n\s*([A-Z0-9_]+):\s*\{\s*\n\s*id:\s*"/g);
// blocks[0] is header
console.log(`Split segments: ${blocks.length}`);

let allTen = true;
let validCategories = 0;

for (let i = 1; i < blocks.length; i += 2) {
  const catKey = blocks[i];
  const blockContent = blocks[i + 1];
  validCategories++;
  
  const catNameMatch = blockContent.match(/category:\s*"([^"]+)"/);
  const catName = catNameMatch ? catNameMatch[1] : catKey;
  
  const qIds = [...blockContent.matchAll(/\bid:\s*"([a-z0-9_]+)"/g)].map(m => m[1]);
  console.log(`${validCategories}. [${catKey}] ${catName} -> ${qIds.length} questions`);
  if (qIds.length !== 10) {
    console.error(`  ERROR: Expected 10, got ${qIds.length}: ${qIds.join(', ')}`);
    allTen = false;
  }
}

console.log(`\nTotal categories verified: ${validCategories}`);
if (allTen && validCategories === 30) {
  console.log('SUCCESS: All 30 clinical categories have EXACTLY 10 dedicated questions each (300 total questions)!');
} else {
  console.log('FAILURE: Mismatch in categories or questions count.');
}
