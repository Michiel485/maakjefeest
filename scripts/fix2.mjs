import { readFileSync, writeFileSync } from 'fs';

const filePath = 'components/EventProgramPreview.tsx';
let content = readFileSync(filePath, 'utf8');

// Fix 1: restore broken array header
// Current: export const PROGRAM_ICONS: { id: string; label: string }[
// Needed:  export const PROGRAM_ICONS: { id: string; label: string }[] = [
content = content.replace(
  /^(export const PROGRAM_ICONS: \{ id: string; label: string \})\[(\n)/m,
  '$1[] = [$2'
);

// Fix 2: remove trailing spaces from inside quoted id and label values
// e.g., "car       " -> "car"  and  "Auto       " -> "Auto"
content = content.replace(/"([^"]+?) +"/g, '"$1"');

// Fix 3: trim the empty line before the closing ] of PROGRAM_ICONS
// The array ends with \n\n] — collapse to \n]
// We only want to fix the PROGRAM_ICONS array, not accidentally touch other code.
// Find the array block and replace \n\n] with \n]
const arrayStart = content.indexOf('export const PROGRAM_ICONS');
const arrayClose = content.indexOf('\n]', arrayStart);
if (content[arrayClose - 1] === '\n') {
  // There's a double newline before ]; remove one
  content = content.slice(0, arrayClose) + content.slice(arrayClose + 1);
}

writeFileSync(filePath, content, 'utf8');
console.log('Fixed!');
