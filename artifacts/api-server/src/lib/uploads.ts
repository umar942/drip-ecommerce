import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function findWorkspaceRoot(startDir: string): string {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return startDir;
}

/** Shop public folder — images are served by Vite at /uploads/products/... */
export function getProductUploadDir(): string {
  const root = findWorkspaceRoot(path.dirname(fileURLToPath(import.meta.url)));
  const dir = path.join(root, "artifacts/shop/public/uploads/products");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export { ALLOWED_EXT };
