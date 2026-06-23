import "@workspace/db/load-env";
import type { IncomingMessage, ServerResponse } from "http";
// @ts-expect-error — built by esbuild (build.mjs) before Vercel packages this function
import app from "../dist/app.mjs";
import { connectDb } from "@workspace/db";

let dbReady: Promise<unknown> | null = null;

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (!dbReady) {
    dbReady = connectDb();
  }
  await dbReady;
  app(req, res);
}
