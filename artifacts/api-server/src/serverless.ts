import "@workspace/db/load-env";
import type { IncomingMessage, ServerResponse } from "http";
import { connectDb } from "@workspace/db";
import app from "./app";

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
