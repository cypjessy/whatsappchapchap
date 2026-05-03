const fs = require('fs');
const filePath = 'src/app/api/webhook/evolution/route.ts';
let content = fs.readFileSync(filePath, 'utf-8');
let lines = content.split('\n');

// Line 1152 - just remove the emoji and use plain number
lines[1151] = '      .map((brand: string, idx: number) => `${idx + 1}. ${brand}`)';

// Line 1155 - replace 0️⃣ with plain 0
lines[1154] = lines[1154].replace(/0[^\x00-\x7F]+ Back/, '0 Back');

fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
console.log('Fixed lines 1152 and 1155');
