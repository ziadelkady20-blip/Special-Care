import "server-only";

import path from "node:path";


export async function readFile(pathname: string) {
  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL === "1") {
    const { get } = await import("@vercel/blob");
    const result = await get(pathname, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return { stream: result.stream, contentType: result.blob.contentType };
  }

  if (!pathname.startsWith("/uploads/")) return null;
  const absolute = path.join(process.cwd(), "public", pathname.replace(/^\//, ""));
  const { readFile: readLocalFile } = await import("node:fs/promises");
  const bytes = await readLocalFile(absolute);
  return { stream: new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(bytes));
      controller.close();
    },
  }), contentType: undefined };
}
