const fs = require('fs');

const files = ['mcp/index.ts', 'app/api/mcp/route.ts'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\} as any,/g, "},");
  
  // Fix return type literal string issue
  content = content.replace(/type: "text"/g, 'type: "text" as const');
  fs.writeFileSync(file, content);
});
