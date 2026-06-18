export const STORE_COUNTRY = "Pakistan";

export function isPakistanCountry(country: string): boolean {
  const n = country.trim().toLowerCase();
  return n === "pakistan" || n === "pk";
}

export function validatePakistanAddress(fields: {
  country: string;
  zip: string;
}): string | null {
  if (!isPakistanCountry(fields.country)) {
    return "This store only ships within Pakistan";
  }
  if (!/^\d{5}$/.test(fields.zip.trim())) {
    return "Postal code must be a 5-digit Pakistan code";
  }
  return null;
}
