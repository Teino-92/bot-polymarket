const fs = require('fs');

function countTags(content) {
  const lines = content.split('\n');
  const stack = [];
  let lineNum = 0;

  for (const line of lines) {
    lineNum++;
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue;
    }

    // Count opening tags (but not self-closing)
    const openTags = (line.match(/<div[^>]*(?<!\/)>/g) || []).length;
    // Count self-closing tags
    const selfClosing = (line.match(/<[^>]+\/>/g) || []).length;
    // Count closing tags
    const closeTags = (line.match(/<\/div>/g) || []).length;

    for (let i = 0; i < openTags; i++) {
      stack.push(lineNum);
    }

    for (let i = 0; i < closeTags; i++) {
      if (stack.length === 0) {
        console.log(`Line ${lineNum}: Extra closing tag!`);
      } else {
        stack.pop();
      }
    }

    if (openTags > 0 || closeTags > 0) {
      console.log(`Line ${lineNum}: +${openTags} -${closeTags} (stack: ${stack.length})`);
    }
  }

  if (stack.length > 0) {
    console.log(`\nUnclosed tags! Stack size: ${stack.length}`);
    console.log(`First unclosed tag at line: ${stack[0]}`);
  } else {
    console.log('\nAll tags balanced!');
  }
}

const file = process.argv[2];
if (!file) {
  console.log('Usage: node validate-jsx.js <file>');
  process.exit(1);
}

const content = fs.readFileSync(file, 'utf8');
console.log(`Validating: ${file}\n`);
countTags(content);
