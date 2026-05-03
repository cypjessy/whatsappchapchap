const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/api/webhook/evolution/route.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Fix missing emoji on line 1096
content = content.replace(
  "replyMessage = `\\n*Reply with a number:*\\n2️⃣ - Go back\\n3️ - Main menu`;",
  "replyMessage = `\\n*Reply with a number:*\\n2️⃣ - Go back\\n3️⃣ - Main menu`;"
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed missing emoji on line 1096');
