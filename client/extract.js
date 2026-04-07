const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../UI_IMPLEMENTATION.md'), 'utf-8');
const lines = content.split('\n');

let currentFile = null;
let capturing = false;
let fileContents = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Match '## STEP X — `client/src/pages/Filename.jsx`'
  const stepMatch = line.match(/## STEP \d+ [—-]\s+`?(client\/src\/pages\/[a-zA-Z0-9_]+\.jsx)`?/);
  if (stepMatch) {
    currentFile = stepMatch[1];
    capturing = false;
    continue;
  }
  
  if (currentFile && line.trim().startsWith('```jsx')) {
    capturing = true;
    fileContents = [];
    continue;
  }
  
  if (capturing && line.trim() === '```') {
    capturing = false;
    const fullPath = path.join(__dirname, '..', currentFile);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, fileContents.join('\n'));
    console.log(`Wrote ${fullPath}`);
    currentFile = null; // done with this file
    continue;
  }
  
  if (capturing) {
    // Keep raw line formatting
    fileContents.push(line.replace('\r', ''));
  }
}
console.log("Extraction complete.");
