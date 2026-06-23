import "@workspace/db/load-env";
import app from "../dist/app.mjs";
import { connectDb } from "@workspace/db";

let dbReady = null;

export default async function handler(req, res) {
  if (!dbReady) {
    dbReady = connectDb();
  }
  await dbReady;
  app(req, res);
}
