#!/usr/bin/env node
// Rebuild the canonical VIP Programmable Spacefighters ROM.
//
// Canonical identity:
//   filename: Programmable Spacefighters [Jef Winsor].ch8
//   sha1:     726cb39afa7e17725af7fab37d153277d86bff77
//
// Cross-check sources:
//   - chip8-database (metadata/hash)
//   - historical ROM archive file with the same filename/hash

import { createHash } from 'crypto';
import { writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const EXPECTED_SHA1 = '726cb39afa7e17725af7fab37d153277d86bff77';
const ROM_BASE64 = [
  'YR5iDqXV0SNlACVwdQE1BhIKpfv1ZUQAZAFCAGIBQQBhAUAAYAFmCIYCNgBgCIYQgVCl+/RVg2BkAADgbgCL4GoDpaUlXvJl',
  'agWmACVe9FUlZH4BpfvwZVDgEj6lvWU+ZgHVbWYQ1W1mH3X31WE1ERJqZQBhAGIIJZJ1AXIGNQMSeKX+8GUUcCWSYQRyAaXV',
  '0SNy+jIDEpBgABKmJTjwZSVApaTwZXABQGRgACU48FUlQP4KTgAS0H7/ZgiG4jYAbgclLCUYJQZHEBLGJRgSsqX1+WUlLEPw',
  'E2L6CiUYpf3wZY0AJPxoAGAO8FV4ATgPEuok3n3/JOQlLCUGNxD3CqX+8GVAABMa+Ac4ABMaJOR5/yTeSQATPCTkRxAS+DcL',
  'EyYk5BLeNw4TLiTkEzwk/P0egHDwVSTkPQAS9CUsJRil/PBlhgCl+vVlJSxGABNWhURPAWX/hFBqBaYAJNjqnhNepfvwZX4B',
  'UOAS0KXw/WV9/24AJSxD8BOEJPz9HvBlQAUUEn4BpfvwZVDgE3RuAGkAJSxDABQGQ/ATuiT8/R7wZTAOaf9AAhPkQAET1kAD',
  'E9ZABBPeQAYT3n4BpfvwZWwA/BX8BzwAE8ReABOSOQBNABKcE3BwA4UAJMAT6IUAJMAT/CUsJWSGACSOpchvANEiTwEUAIBg',
  '0SIk0iVkE7rRIiUsE/xj8CTSJHglZCR4E7olLEQAE4R0/yTShwAkjk//E4RmA4twi2JqA6XfJV5vAv8Y0SOM8NEjgHA8ARQe',
  'hRCGIGsAm+AUZCUuQ/AUZFFQFGRSYBRkMwBz/yTUJIIkghOEewGl+/BlULAURhOEMAASiHL6EopvA6Xf0SOl4tEj/xil6NEj',
  'peXRIwDupfHwHvBlggRgAfAe8GWBBG8AMQ4UqGE7b/8xPhSwYRFv/zL9FLhiG2//Mh4A7mIAFLYlLIYAJWSAYEUEcP5wAWYH',
  'gGKL4GoFpgAlXvRVAO5o8PgVAO5lB2YU/SnVZaX+8GVAAADuZhr5KdVlAO6L4GoPpiglXgDuJWRnAOehFRR3ATcQFQolZADu',
  'fgFlB2YI/inVZWYO8ynVZX7/AO6L4GoFpgAlXvRlAO6lpGUAZgEA7qYw8DPyZfEp1WXyKXUF1WUA7mwASgAA7oy0ev8VVCVS',
  '/B4A7moDiwClyCVe0SMA7mINYRolkmEhJZ6l+/Ue8FVmePYV9gc2ABWEYRolkmEhFaCl6/Ue8GXwKdElAO7zCoAwFZgBBjsP',
  'AhEMACkbBCMAAB0bBC8AADUbBBcASQAAQAAAQAAAQAAAQKAAwECAQIBAwACgQABAYAAgQCAAYEBAQCBAgADgAIBAIAUNDgwP',
  'Cv39AAMDAwD9/f3U',
].join('');

const outputPath = resolve(dirname(fileURLToPath(import.meta.url)), 'spacefighters.ch8');
const rom = Buffer.from(ROM_BASE64, 'base64');
const sha1 = createHash('sha1').update(rom).digest('hex');

if (sha1 !== EXPECTED_SHA1) {
  throw new Error(`Embedded ROM hash mismatch: got ${sha1}, expected ${EXPECTED_SHA1}`);
}

writeFileSync(outputPath, rom);
console.log(`Wrote ${rom.length} bytes to ${outputPath}`);
console.log(`SHA1: ${sha1}`);
