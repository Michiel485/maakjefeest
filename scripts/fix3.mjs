import { readFileSync, writeFileSync } from 'fs';

const filePath = 'components/EventProgramPreview.tsx';
let content = readFileSync(filePath, 'utf8');

// The sorted icons in correct order (sorted by Dutch label)
const sortedIcons = [
  { id: "car",       label: "Auto"         },
  { id: "baby",      label: "Baby"         },
  { id: "bouquet",   label: "Boeket"       },
  { id: "boot",      label: "Boot"         },
  { id: "letter",    label: "Brief"        },
  { id: "cadeau",    label: "Cadeau"       },
  { id: "camera",    label: "Camera"       },
  { id: "champagne", label: "Champagne"    },
  { id: "cocktail",  label: "Cocktail"     },
  { id: "cupid",     label: "Cupido"       },
  { id: "calendar",  label: "Datum"        },
  { id: "cutlery",   label: "Diner"        },
  { id: "dresscode", label: "Dresscode"    },
  { id: "dove",      label: "Duif"         },
  { id: "feest",     label: "Feest"        },
  { id: "geen_fotos",label: "Geen Foto's"  },
  { id: "geen_smart",label: "Geen Smart"   },
  { id: "heart",     label: "Hart"         },
  { id: "couple",    label: "Honeymoon"    },
  { id: "hotel",     label: "Hotel"        },
  { id: "dress",     label: "Jurk"         },
  { id: "church",    label: "Kerk"         },
  { id: "koffie",    label: "Koffie"       },
  { id: "suit",      label: "Pak"          },
  { id: "parkeren",  label: "Parkeren"     },
  { id: "ringen",    label: "Ringen"       },
  { id: "snack",     label: "Snack"        },
  { id: "speech",    label: "Speech"       },
  { id: "cake",      label: "Taart"        },
  { id: "taxi",      label: "Taxi"         },
  { id: "toost",     label: "Toost"        },
  { id: "video",     label: "Video"        },
  { id: "vliegtuig", label: "Vliegtuig"    },
  { id: "welkom",    label: "Welkom"       },
];

// Build new array block
const newEntries = sortedIcons
  .map(e => `  { id: "${e.id}", label: "${e.label}" },`)
  .join('\n');

const newArrayBlock =
  `export const PROGRAM_ICONS: { id: string; label: string }[] = [\n` +
  newEntries + '\n' +
  `]`;

// Find the PROGRAM_ICONS declaration in the file
const declPos = content.indexOf('export const PROGRAM_ICONS');
if (declPos === -1) { console.error('Not found'); process.exit(1); }

// Find the opening "= [" of the array (after the type annotation)
const openBracket = content.indexOf('= [', declPos);
// Find the closing "]" — first "\n]" on its own line after the opening bracket
const closeBracket = content.indexOf('\n]', openBracket);
if (closeBracket === -1) { console.error('No closing bracket found'); process.exit(1); }

const before = content.slice(0, declPos);
const after = content.slice(closeBracket + 2); // skip "\n]"

content = before + newArrayBlock + '\n' + after;

writeFileSync(filePath, content, 'utf8');
console.log('Fixed and sorted successfully!');
