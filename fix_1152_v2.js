const fs = require('fs');
const filePath = 'src/app/api/webhook/evolution/route.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// Replace all instances of the broken pattern
// The broken pattern is: ${idx + 1} followed by just FE0F 20E3 (missing the digit)
// We need to ensure the digit "1" is included

// Strategy: Replace the entire template string pattern
content = content.replace(
  /\$\{idx \+ 1\}[^\x00-\x7F]+/g,
  (match) => {
    // Return the correct sequence: digit + variation selector + keycap
    return '${idx + 1}\uFE0F\u20E3';
  }
);

// Also fix line 1155 with 0️⃣
content = content.replace(
  /0[^\x00-\x7F]+ Back to categories/g,
  '0️ Back to categories'
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed all broken emojis');
