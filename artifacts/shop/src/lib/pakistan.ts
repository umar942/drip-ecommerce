export const STORE_COUNTRY = "Pakistan";
export const STORE_CURRENCY = "PKR";
export const STORE_NOTICE = "We deliver across Pakistan only. All prices are in PKR.";

export const PK_PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu and Kashmir",
] as const;

export function formatPKR(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString("en-PK")}`;
}

export function formatPakistanAddress(addr: {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
}): string {
  const lines = [addr.line1];
  if (addr.line2) lines.push(addr.line2);
  lines.push(`${addr.city}, ${addr.state} ${addr.zip}`);
  lines.push(addr.country);
  return lines.join(", ");
}

export function isValidPakistanPostalCode(zip: string): boolean {
  return /^\d{5}$/.test(zip.trim());
}
