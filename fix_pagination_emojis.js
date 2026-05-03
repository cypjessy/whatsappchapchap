const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/api/webhook/evolution/route.ts');
let content = fs.readFileSync(filePath, 'utf-8');
let lines = content.split('\n');

let fixed = 0;

// Fix all instances of "3️ - Main menu" (missing emoji) to "3️⃣ - Main menu"
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('3️ - Main menu') && !lines[i].includes('3️⃣')) {
    lines[i] = lines[i].replace('3️ - Main menu', '3️ - Main menu');
    fixed++;
    console.log(`Fixed line ${i + 1}`);
  }
  
  // Also fix "2️ - Go back" if missing emoji
  if (lines[i].includes('2️ - Go back') && !lines[i].includes('2️⃣')) {
    lines[i] = lines[i].replace('2️ - Go back', '2️⃣ - Go back');
    fixed++;
    console.log(`Fixed line ${i + 1}`);
  }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
console.log(`Total fixes: ${fixed}`);
