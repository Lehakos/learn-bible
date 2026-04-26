#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const [epubPath, outputDir = 'public/data/nwt-ru'] = process.argv.slice(2);

if (!epubPath) {
  console.error('Usage: node scripts/import-nwt-epub.mjs /path/to/nwt.epub [output-dir]');
  process.exit(1);
}

function unzip(args) {
  return execFileSync('unzip', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

function readEntry(path) {
  return unzip(['-p', epubPath, path]);
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;|&#160;|&#xA0;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number.parseInt(number, 10)));
}

function stripTags(value) {
  return decodeEntities(
    value
      .replace(/<span[^>]*id="footnotesource[^"]*"[^>]*><\/span>\s*<a[^>]*epub:type="noteref"[^>]*>.*?<\/a>/gis, '')
      .replace(/<span[^>]*class="[^"]*\bw_ch\b[^"]*"[^>]*>.*?<\/span>/gis, '')
      .replace(/<span[^>]*class="[^"]*\bpageNum\b[^"]*"[^>]*>.*?<\/span>/gis, '')
      .replace(/<sup[^>]*>.*?<\/sup>/gis, '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/(?:p|div|h[1-6]|li)>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[\u00a0\u202f]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?»])/g, '$1')
    .replace(/([«])\s+/g, '$1')
    .trim();
}

function extractBookName(html) {
  const navMatch = html.match(/<p[^>]*class="[^"]*\bw_biblebookname\b[^"]*"[^>]*>[\s\S]*?<a[^>]*href="biblebooknav\.xhtml"[^>]*>([\s\S]*?)<\/a>/i);
  if (navMatch) return stripTags(navMatch[1]);

  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!titleMatch) return null;

  return stripTags(titleMatch[1]).replace(/\s+\d+$/, '');
}

function extractVerses(html) {
  const markerRe = /<span\s+id="chapter(\d+)_verse(\d+)"\s*><\/span>/gi;
  const markers = [...html.matchAll(markerRe)].map((match) => ({
    chapter: Number.parseInt(match[1], 10),
    verse: Number.parseInt(match[2], 10),
    start: match.index + match[0].length,
  }));

  return markers.map((marker, index) => {
    const next = markers[index + 1]?.start ?? html.search(/<div[^>]*class="[^"]*\bgroupFootnote\b/i);
    const end = next > marker.start ? next : html.length;
    return {
      chapter: marker.chapter,
      verse: marker.verse,
      text: stripTags(html.slice(marker.start, end)),
    };
  }).filter((entry) => entry.text.length > 0);
}

const entries = unzip(['-Z1', epubPath])
  .split(/\r?\n/)
  .filter((entry) => /^OEBPS\/.*\.xhtml$/.test(entry));

const books = [];
const booksByName = new Map();

for (const entry of entries) {
  const html = readEntry(entry);
  if (!/id="chapter\d+_verse\d+"/.test(html)) continue;

  const bookName = extractBookName(html);
  if (!bookName) continue;

  let book = booksByName.get(bookName);
  if (!book) {
    book = { name: bookName, chapters: [] };
    booksByName.set(bookName, book);
    books.push(book);
  }

  for (const { chapter, verse, text } of extractVerses(html)) {
    book.chapters[chapter - 1] ??= [];
    book.chapters[chapter - 1][verse - 1] = text;
  }
}

const verseCount = books.reduce(
  (sum, book) => sum + book.chapters.reduce((bookSum, chapter) => bookSum + chapter.filter(Boolean).length, 0),
  0,
);

const data = {
  translation: 'Новый мир',
  language: 'ru',
  source: basename(epubPath),
  books: books.map((book, index) => ({
    name: book.name,
    file: `books/${String(index + 1).padStart(2, '0')}.json`,
    chapters: book.chapters.map((chapter) => chapter.filter(Boolean).length),
  })),
};

mkdirSync(join(outputDir, 'books'), { recursive: true });
writeFileSync(join(outputDir, 'manifest.json'), JSON.stringify(data));

books.forEach((book, index) => {
  const fileName = `${String(index + 1).padStart(2, '0')}.json`;
  writeFileSync(join(outputDir, 'books', fileName), JSON.stringify(book));
});

console.log(`Imported ${books.length} books and ${verseCount} verses to ${outputDir}`);
