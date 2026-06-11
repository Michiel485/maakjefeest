import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const filePath = resolve('components/EventProgramPreview.tsx');
let lines = readFileSync(filePath, 'utf8').split('\n');

// Helper: extract path d from SVG string
function extractPath(svgContent) {
  const m = svgContent.match(/d="([^"]+)"/s);
  return m ? m[1] : '';
}

// Read SVG files
const hotelSvg = readFileSync('C:/Users/m.vanbendegem_smartp/Desktop/SpeedDate/Docs/Maakjefeest.nl/Iconen/ChatGPT/In gebruik/hotel.svg', 'utf8');
const koffieSvg = readFileSync('C:/Users/m.vanbendegem_smartp/Desktop/SpeedDate/Docs/Maakjefeest.nl/Iconen/ChatGPT/In gebruik/koffie.svg', 'utf8');
const trouwjurkSvg = readFileSync('C:/Users/m.vanbendegem_smartp/Desktop/SpeedDate/Docs/Maakjefeest.nl/Iconen/ChatGPT/In gebruik/Trouwjurk.svg', 'utf8');

const hotelPath = extractPath(hotelSvg);
const koffiePath = extractPath(koffieSvg);
const dressPath = extractPath(trouwjurkSvg);

// New case blocks (4 spaces indent, as per file style)
const dressCase = [
  `    case "dress": return (`,
  `      <svg {...p} viewBox="0 0 387 554" fill="currentColor" stroke="none">`,
  `        <path fillRule="evenodd" d="${dressPath}" />`,
  `      </svg>`,
  `    )`,
];

const koffieCase = [
  `    case "koffie": return (`,
  `      <svg {...p} viewBox="0 0 796 770" fill="currentColor" stroke="none">`,
  `        <path fillRule="evenodd" d="${koffiePath}" />`,
  `      </svg>`,
  `    )`,
];

const hotelCase = [
  `    case "hotel": return (`,
  `      <svg {...p} viewBox="0 0 860 789" fill="currentColor" stroke="none">`,
  `        <path fillRule="evenodd" d="${hotelPath}" />`,
  `      </svg>`,
  `    )`,
];

// Find line indices (0-based)
let dressStart = -1, dressEnd = -1;
let koffieStart = -1, koffieEnd = -1;
let hotelStart = -1, hotelEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('case "dress": return (') && dressStart === -1) dressStart = i;
  if (lines[i].includes('case "cupid": return (') && dressStart !== -1 && dressEnd === -1) dressEnd = i - 1;
  if (lines[i].includes('case "koffie": return (') && koffieStart === -1) koffieStart = i;
  if (lines[i].includes('case "hotel": return (') && koffieStart !== -1 && koffieEnd === -1) koffieEnd = i - 1;
  if (lines[i].includes('case "hotel": return (') && hotelStart === -1) hotelStart = i;
  if (lines[i].includes('case "boot": return (') && hotelStart !== -1 && hotelEnd === -1) hotelEnd = i - 1;
}

console.log(`dress: lines ${dressStart+1}-${dressEnd+1} (${dressEnd - dressStart + 1} lines)`);
console.log(`koffie: lines ${koffieStart+1}-${koffieEnd+1} (${koffieEnd - koffieStart + 1} lines)`);
console.log(`hotel: lines ${hotelStart+1}-${hotelEnd+1} (${hotelEnd - hotelStart + 1} lines)`);

// Perform replacements in reverse order so line numbers don't shift
// Replace hotel first (highest line number)
lines.splice(hotelStart, hotelEnd - hotelStart + 1, ...hotelCase);

// Re-find koffie (not affected since it's before hotel)
lines.splice(koffieStart, koffieEnd - koffieStart + 1, ...koffieCase);

// Re-find dress (not affected since it's before koffie)
lines.splice(dressStart, dressEnd - dressStart + 1, ...dressCase);

writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Done! Icons replaced successfully.');
