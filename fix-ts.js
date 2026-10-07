const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('.');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('params.eventId')) {
    content = content.replace(/params\.eventId/g, "(params as any)?.eventId as string");
    changed = true;
  }
  
  if (content.includes('pathname.startsWith')) {
    content = content.replace(/pathname\.startsWith/g, "(pathname || '').startsWith");
    changed = true;
  }
  if (content.includes('pathname ===')) {
    content = content.replace(/pathname ===/g, "(pathname || '') ===");
    changed = true;
  }
  if (content.includes('pathname !==')) {
    content = content.replace(/pathname !==/g, "(pathname || '') !==");
    changed = true;
  }

  if (content.includes('{ params }: { params: { eventId: string } }')) {
    content = content.replace(/\{ params \}: \{ params: \{ eventId: string \} \}/g, "{ params }: { params: Promise<{ eventId: string }> }");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
