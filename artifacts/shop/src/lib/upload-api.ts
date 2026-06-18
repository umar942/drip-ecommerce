export async function uploadProductImage(file: File): Promise<string> {
  const token = localStorage.getItem("drip_token");
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch("/api/uploads/product-image", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Image upload failed");
  }

  const data = (await res.json()) as { url: string };
  return data.url;
}
