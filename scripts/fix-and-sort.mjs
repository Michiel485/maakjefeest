import { readFileSync, writeFileSync } from 'fs';

const filePath = 'components/EventProgramPreview.tsx';
let content = readFileSync(filePath, 'utf8');

// ── 1. Fix the broken ] = [ from the previous script ────────────────────────
content = content.replace(
  /^(export const PROGRAM_ICONS[^\n]+\[\s*)\n\s*\] = \[/m,
  '$1'
);

// ── 2. Parse and sort PROGRAM_ICONS entries ──────────────────────────────────
// Find the array body between the opening `= [` and closing `]`
const arrayHeaderMatch = content.match(/export const PROGRAM_ICONS[^\[]+\[/);
if (!arrayHeaderMatch) { console.error('Could not find PROGRAM_ICONS'); process.exit(1); }

const headerEnd = content.indexOf(arrayHeaderMatch[0]) + arrayHeaderMatch[0].length;
// Find the closing ] of the array (first ] on its own line after headerEnd)
const bodyAndRest = content.slice(headerEnd);
const closingMatch = bodyAndRest.match(/\n\]/);
if (!closingMatch) { console.error('Could not find closing ]'); process.exit(1); }

const bodyEnd = headerEnd + closingMatch.index;
const body = content.slice(headerEnd, bodyEnd);

// Parse entries - handle labels with apostrophes and variable whitespace
const entryRegex = /\{ id: "([^"]+)",\s*label: "([^"]+)"\s*\}/g;
let entries = [];
let m;
while ((m = entryRegex.exec(body)) !== null) {
  entries.push({ id: m[1], label: m[2] });
}

console.log(`Found ${entries.length} icons`);

// Sort by Dutch label
entries.sort((a, b) => a.label.localeCompare(b.label, 'nl', { sensitivity: 'base' }));

// Build consistent new entries
const maxIdLen = Math.max(...entries.map(e => e.id.length));
const maxLabelLen = Math.max(...entries.map(e => e.label.length));
const newBody = '\n' + entries.map(e => {
  const idPad = e.id.padEnd(maxIdLen);
  const labelPad = e.label.padEnd(maxLabelLen);
  return `  { id: "${idPad}", label: "${labelPad}" },`;
}).join('\n') + '\n';

const newContent =
  content.slice(0, headerEnd) +
  newBody +
  content.slice(bodyEnd);

writeFileSync(filePath, newContent, 'utf8');
console.log('Done! Sorted order:', entries.map(e => e.label).join(', '));
