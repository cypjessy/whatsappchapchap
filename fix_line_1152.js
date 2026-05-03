const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/api/webhook/evolution/route.ts');
let content = fs.readFileSync(filePath, 'utf-8');
let lines = content.split('\n');

// Read the file as hex to see the actual bytes
const buffer = Buffer.from(content, 'utf-8');
const hex = buffer.toString('hex');

// Find and replace the corrupted emoji at line 1152
// The correct sequence for 1️⃣ is: 31 FE0F 20E3
// Let's just replace the entire line

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('1}️') || lines[i].includes('${idx + 1}')) {
    console.log(`Line ${i + 1}: ${lines[i].substring(0, 80)}`);
    console.log(`Hex: ${Buffer.from(lines[i]).toString('hex').substring(0, 200)}`);
  }
}

// Replace the specific line with correct emoji
const line1152 = lines[1151]; // 0-indexed
if (line1152 && line1152.includes('idx + 1')) {
  // Create the correct line with proper emoji
  const correctLine = '      .map((brand: string, idx: number) => `${idx + 1}\uFE0F\u20E3 ${brand}`)';
  lines[1151] = correctLine;
  console.log('Replaced line 1152 with correct emoji sequence');
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
console.log('Done!');
