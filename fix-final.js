const fs = require('fs');

// 1. Fix MCP TS2589
const mcpFiles = ['mcp/index.ts', 'app/api/mcp/route.ts'];
mcpFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/server\.tool\(/g, "// @ts-ignore\n  server.tool(");
    fs.writeFileSync(file, content);
  }
});

// 2. Fix useParams in Next.js 15
const eventFiles = [
  'app/events/[eventId]/analytics/page.tsx',
  'app/events/[eventId]/components/ParticipantList.tsx',
  'app/events/[eventId]/components/SchedulePage.tsx',
  'app/events/[eventId]/EventPage.tsx'
];
eventFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const\s+params\s*=\s*useParams\(\);/g, "const params: any = useParams();");
  content = content.replace(/params\?.eventId/g, "params?.eventId");
  fs.writeFileSync(file, content);
});

// 3. Fix usePathname in header
let headerContent = fs.readFileSync('components/header.tsx', 'utf8');
headerContent = headerContent.replace(/pathname\.startsWith/g, "(pathname || '').startsWith");
headerContent = headerContent.replace(/pathname ===/g, "(pathname || '') ===");
fs.writeFileSync('components/header.tsx', headerContent);
