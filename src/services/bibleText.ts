export interface BibleBookMetadata {
  name: string;
  file: string;
  chapters: number[];
}

export interface BibleTextBook {
  name: string;
  chapters: Array<Array<string | null>>;
}

export interface BibleTextManifest {
  translation: string;
  language: string;
  source: string;
  books: BibleBookMetadata[];
}

let bibleManifestPromise: Promise<BibleTextManifest> | null = null;
const bibleBookPromises = new Map<string, Promise<BibleTextBook>>();

function normalizeBookName(value: string): string {
  return value.trim().toLocaleLowerCase('ru');
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`${path} request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function loadBibleManifest(): Promise<BibleTextManifest> {
  if (!bibleManifestPromise) {
    bibleManifestPromise = fetchJson<BibleTextManifest>('data/nwt-ru/manifest.json').catch(
      (error: unknown) => {
        bibleManifestPromise = null;
        throw error;
      },
    );
  }

  return bibleManifestPromise;
}

export async function loadBibleBook(book: BibleBookMetadata): Promise<BibleTextBook> {
  const cached = bibleBookPromises.get(book.file);
  if (cached) return cached;

  const promise = fetchJson<BibleTextBook>(`data/nwt-ru/${book.file}`).catch(
    (error: unknown) => {
      bibleBookPromises.delete(book.file);
      throw error;
    },
  );

  bibleBookPromises.set(book.file, promise);
  return promise;
}

export function resetBibleTextCache(): void {
  bibleManifestPromise = null;
  bibleBookPromises.clear();
}

export function findBibleBookMetadata(
  manifest: BibleTextManifest | null,
  bookName: string,
): BibleBookMetadata | null {
  const normalized = normalizeBookName(bookName);
  if (!manifest || !normalized) return null;

  return (
    manifest.books.find((book) => normalizeBookName(book.name) === normalized) ?? null
  );
}

export function getBibleVerseText(
  book: BibleTextBook | null,
  chapter: number,
  verse: number,
): string | null {
  if (!book || chapter <= 0 || verse <= 0) return null;

  return book.chapters[chapter - 1]?.[verse - 1] ?? null;
}
