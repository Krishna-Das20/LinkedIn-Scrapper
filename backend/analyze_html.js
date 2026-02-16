const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
const keyword = process.argv[3] || 'profile-card-experience';

if (!filePath) {
    console.error('Please provide a file path');
    process.exit(1);
}

try {
    const content = fs.readFileSync(filePath, 'utf8');
    const index = content.indexOf(keyword);

    if (index === -1) {
        console.log(`Keyword "${keyword}" not found.`);
    } else {
        console.log(`Found "${keyword}" at index ${index}`);
        const start = Math.max(0, index - 1000);
        const end = Math.min(content.length, index + 4000); // Read more after to see list items
        console.log('--- CONTEXT START ---');
        console.log(content.substring(start, end));
        console.log('--- CONTEXT END ---');
    }
} catch (e) {
    console.error(e);
}
