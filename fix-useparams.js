const fs = require('fs');
const files = [
  'app/events/[eventId]/analytics/page.tsx',
  'app/events/[eventId]/components/ParticipantList.tsx',
  'app/events/[eventId]/components/SchedulePage.tsx',
  'app/events/[eventId]/EventPage.tsx'
];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const \{ eventId \} = useParams\(\)/g, "const params: any = useParams(); const eventId = params?.eventId");
  fs.writeFileSync(file, content);
});
