import fs from "node:fs";
import path from "node:path";
import { QUARTERS } from "@/lib/reports";

/**
 * Quarterly report PDFs, discovered from the filesystem at build time.
 *
 * ── HOW TO PUBLISH A REPORT ─────────────────────────────────────────
 * Save the PDF into  public/media/reports/  named for its quarter:
 *
 *     taizan-2027-q1.pdf
 *
 * That is the whole process. Rebuild and it appears on /performance as a
 * download, with its period and file size filled in. Nobody has to edit a
 * manifest, and no report can be sitting in the folder while the page
 * claims none exists.
 *
 * The returns for that quarter are a separate matter and stay in
 * QUARTERS — a PDF is a document, and a published figure is a claim about
 * money. They should not be the same action. A report can be downloadable
 * before its figures are entered, and the page handles that.
 *
 * ── WHY BUILD TIME AND NOT RUNTIME ──────────────────────────────────
 * The directory is read once, during the build, and baked into static
 * HTML. Nothing scans the disk when a visitor loads the page, and a file
 * that is still copying when the build runs simply is not in that build
 * rather than being served half-written.
 */

const REL = path.join("public", "media", "reports");

/**
 * Locate the reports folder without trusting process.cwd().
 *
 * cwd is whatever directory the process was started from, which is not
 * necessarily the project root — the dev server here is launched from the
 * parent folder with the project passed as an argument, so cwd resolves to
 * a directory with no public/ at all. The first version of this file used
 * cwd alone and swallowed the resulting error, which meant the page
 * rendered "No reports have been published" while the PDFs sat in the
 * folder. On a page whose entire purpose is disclosure, silently reporting
 * the absence of documents that exist is the worst available failure.
 *
 * So: try cwd, then walk up from this module's own location, which is
 * inside the build output and therefore always inside the project.
 */
function resolveDir(): string | null {
  const root = process.env.TAIZAN_PROJECT_ROOT;

  const candidates = [
    // Injected by next.config.ts from its own file location, which is the
    // project root by definition. This is the one that actually works.
    ...(root ? [path.join(root, REL)] : []),
    // Falls back to cwd, which is correct whenever the process was started
    // from the project directory.
    path.join(process.cwd(), REL),
  ];

  return candidates.find((c) => fs.existsSync(c)) ?? null;
}

/** Quarter number to the months it covers. */
const PERIODS: Record<string, string> = {
  "1": "January – March",
  "2": "April – June",
  "3": "July – September",
  "4": "October – December",
};

export interface ReportFile {
  /** Matches QuarterRecord.quarter.id, e.g. "2027-q1". */
  id: string;
  label: string;
  period: string;
  href: string;
  /** Human-readable size, e.g. "1.4 MB". */
  size: string;
  /** Taken from QUARTERS when that quarter has been entered. */
  summary: string | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/**
 * Every report PDF in the folder, newest first.
 *
 * Files whose names do not contain a recognisable quarter are skipped and
 * warned about during the build, rather than being silently ignored or
 * listed under a guessed date.
 */
export function readReportFiles(): ReportFile[] {
  const dir = resolveDir();

  if (dir === null) {
    // Loud, not silent. An empty folder is a normal state; a folder that
    // cannot be found is a broken build, and the two must never look the
    // same on this page.
    console.error(
      `[reports] Could not locate ${REL} from cwd "${process.cwd()}". ` +
        `The performance page will report that no reports exist. If any ` +
        `PDFs are in that folder, this is wrong and must be fixed before deploying.`,
    );
    return [];
  }

  const names = fs.readdirSync(dir);
  const found: ReportFile[] = [];

  for (const name of names) {
    if (!name.toLowerCase().endsWith(".pdf")) continue;

    const match = name.match(/(\d{4})-q([1-4])/i);
    if (!match) {
      console.warn(
        `[reports] Skipped "${name}" — the filename must contain a quarter, ` +
          `e.g. taizan-2027-q1.pdf, or the page cannot say what period it covers.`,
      );
      continue;
    }

    const [, year, q] = match;
    const id = `${year}-q${q}`;
    const record = QUARTERS.find((entry) => entry.quarter.id === id);

    found.push({
      id,
      label: `Q${q} ${year}`,
      period: `${PERIODS[q]} ${year}`,
      href: `/media/reports/${name}`,
      size: formatBytes(fs.statSync(path.join(dir, name)).size),
      summary: record?.report.summary ?? null,
    });
  }

  // Newest first. The id sorts correctly as a string because the year
  // leads and the quarter is a single digit.
  return found.sort((a, b) => b.id.localeCompare(a.id));
}
