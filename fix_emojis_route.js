const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/api/webhook/evolution/route.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Fix all broken emoji sequences
// Replace corrupted keycap sequences with proper ones
content = content.replace(/1\uFE0F\u20E3/g, '1️⃣');
content = content.replace(/2\uFE0F\u20E3/g, '2️⃣');
content = content.replace(/3\uFE0F\u20E3/g, '3️');
content = content.replace(/0\uFE0F\u20E3/g, '0️⃣');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed broken emoji sequences');
