import { getDb } from "../connection";
import { nextId } from "../counter";
import type { Address } from "../types";

const COL = "addresses";

type AddressInput = Omit<Address, "id" | "createdAt">;

export async function listAddressesByUser(userId: number): Promise<Address[]> {
  return getDb().collection<Address>(COL).find({ userId }).toArray();
}

export async function findAddressById(id: number): Promise<Address | null> {
  return getDb().collection<Address>(COL).findOne({ id });
}

export async function createAddress(data: AddressInput): Promise<Address> {
  const address: Address = {
    id: await nextId(COL),
    ...data,
    createdAt: new Date(),
  };
  await getDb().collection<Address>(COL).insertOne(address);
  return address;
}
