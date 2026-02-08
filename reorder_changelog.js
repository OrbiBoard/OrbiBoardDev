const fs = require('fs');
const path = require('path');

const changelogsDir = path.join(__dirname, 'CHANGELOGS');

if (!fs.existsSync(changelogsDir)) {
    console.error(`Directory not found: ${changelogsDir}`);
    process.exit(1);
}

// Get all files in the directory
const files = fs.readdirSync(changelogsDir).filter(file => file.endsWith('.md'));

if (files.length === 0) {
    console.error(`No Markdown files found in ${changelogsDir}`);
    process.exit(1);
}

// Find the latest edited file
let latestFile = null;
let latestMtime = 0;

files.forEach(file => {
    const filePath = path.join(changelogsDir, file);
    const stats = fs.statSync(filePath);
    if (stats.mtimeMs > latestMtime) {
        latestMtime = stats.mtimeMs;
        latestFile = filePath;
    }
});

if (!latestFile) {
    console.error('Could not determine the latest file.');
    process.exit(1);
}

console.log(`Processing file: ${latestFile}`);

const content = fs.readFileSync(latestFile, 'utf8');
const lines = content.split('\n');
let newLines = [];
let counter = 1;

lines.forEach(line => {
    const trimmedLine = line.trim();
    
    // Check for section header like [Section Name]
    if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
        counter = 1;
        newLines.push(line);
    } 
    // Check for numbered list item like "1. Item"
    else if (/^\d+\./.test(trimmedLine)) {
        // Replace the number with the current counter, preserving leading whitespace
        const newLine = line.replace(/^(\s*)\d+\./, `$1${counter}.`);
        newLines.push(newLine);
        counter++;
    } else {
        newLines.push(line);
    }
});

const newContent = newLines.join('\n');

fs.writeFileSync(latestFile, newContent, 'utf8');
console.log('Successfully reordered sequence numbers.');
