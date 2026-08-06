import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * Development-only capture sink.
 *
 * Accepts a data URL from the page and writes it to disk so the rendered
 * WebGL frame can be inspected outside the browser. Refuses to run in a
 * production build.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const { dataUrl, name } = (await request.json()) as {
    dataUrl?: string;
    name?: string;
  };

  if (!dataUrl?.startsWith("data:image/")) {
    return new Response("Expected an image data URL", { status: 400 });
  }

  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const safeName = (name ?? "frame").replace(/[^a-z0-9._-]/gi, "_");
  const dir = path.join(process.cwd(), ".captures");

  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${safeName}.jpg`);
  await writeFile(file, Buffer.from(base64, "base64"));

  return Response.json({ ok: true, file });
}
