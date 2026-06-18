import { getDb } from "./connection";

export async function nextId(collection: string): Promise<number> {
  const result = await getDb().collection<{ _id: string; seq: number }>("counters").findOneAndUpdate(
    { _id: collection },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" },
  );
  return result!.seq;
}
