import { useState } from "react";
import {
  useListProducts,
  useListCategories,
  useCreateProduct,
  useUpdateProduct,
  getListProductsQueryKey,
  type Product,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Upload, X } from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { uploadProductImage } from "@/lib/upload-api";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const emptyForm = {
  title: "",
  description: "",
  price: "",
  compareAtPrice: "",
  categoryId: "",
  stock: "",
  sizes: "",
  colors: "",
  featured: false,
};

type FormState = typeof emptyForm;

type ImageItem = {
  id: string;
  file: File | null;
  url: string | null;
  preview: string;
};

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function productToForm(product: Product): FormState {
  return {
    title: product.title,
    description: product.description ?? "",
    price: String(product.price),
    compareAtPrice: product.compareAtPrice != null ? String(product.compareAtPrice) : "",
    categoryId: product.categoryId != null ? String(product.categoryId) : "",
    stock: String(product.stock),
    sizes: product.sizes.join(", "),
    colors: product.colors.join(", "),
    featured: Boolean(product.featured),
  };
}

export default function AdminProducts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: productsData, isLoading } = useListProducts();
  const { data: categories } = useListCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const products = productsData?.products || [];
  const isEditing = editingProduct !== null;

  const resetForm = () => {
    setForm(emptyForm);
    images.forEach((img) => {
      if (img.file) URL.revokeObjectURL(img.preview);
    });
    setImages([]);
    setEditingProduct(null);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) resetForm();
  };

  const openCreateDialog = () => {
    resetForm();
    setOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setForm(productToForm(product));
    setImages(
      product.images.map((url) => ({
        id: url,
        file: null,
        url,
        preview: url,
      })),
    );
    setOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const accepted: ImageItem[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Please choose image files only", variant: "destructive" });
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: `${file.name} is larger than 5MB`, variant: "destructive" });
        continue;
      }
      accepted.push({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        url: null,
        preview: URL.createObjectURL(file),
      });
    }
    if (accepted.length > 0) setImages((prev) => [...prev, ...accepted]);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target?.file) URL.revokeObjectURL(target.preview);
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const category = categories?.find((c) => String(c.id) === form.categoryId);
    if (!category) {
      toast({ title: "Select a category", variant: "destructive" });
      return;
    }

    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!form.title.trim() || !price || price < 0 || stock < 0) {
      toast({ title: "Fill in title, price, and stock", variant: "destructive" });
      return;
    }

    if (images.length === 0) {
      toast({ title: "At least one product image is required", variant: "destructive" });
      return;
    }

    const compareAt = form.compareAtPrice ? Number(form.compareAtPrice) : undefined;

    setUploading(true);
    let imageUrls: string[];
    try {
      imageUrls = await Promise.all(
        images.map((img) => (img.url ? Promise.resolve(img.url) : uploadProductImage(img.file!))),
      );
    } catch (err) {
      toast({
        title: "Image upload failed",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
      setUploading(false);
      return;
    }
    setUploading(false);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      price,
      compareAtPrice: compareAt,
      category: category.name,
      categoryId: category.id,
      stock,
      sizes: parseList(form.sizes),
      colors: parseList(form.colors),
      images: imageUrls,
      featured: form.featured,
    };

    const onSuccess = (title: string) => {
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      toast({ title, description: `"${form.title}" was saved.` });
      handleOpenChange(false);
    };

    const onError = (err: unknown) => {
      toast({
        title: isEditing ? "Could not update product" : "Could not create product",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    };

    if (isEditing && editingProduct) {
      updateProduct.mutate(
        { id: editingProduct.id, data: payload },
        { onSuccess: () => onSuccess("Product updated"), onError },
      );
    } else {
      createProduct.mutate(
        { data: payload },
        { onSuccess: () => onSuccess("Product created"), onError },
      );
    }
  };

  const isSaving = uploading || createProduct.isPending || updateProduct.isPending;

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground uppercase tracking-widest text-sm">Loading Products...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Products</h1>
        <Button
          type="button"
          onClick={openCreateDialog}
          className="rounded-none uppercase tracking-widest text-xs font-bold gap-2"
        >
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex w-[calc(100%-2rem)] max-w-lg max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden rounded-none border-border/40 p-0 sm:max-w-lg">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
            <DialogTitle className="font-display uppercase tracking-tight">
              {isEditing ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 scrollbar-none">
          <form id="add-product-form" onSubmit={handleSubmit} className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                required
                className="rounded-none border-border/40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                className="rounded-none border-border/40 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <div className="space-y-2">
                <Label htmlFor="price">Price (PKR)</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step={1}
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                  required
                  className="rounded-none border-border/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compareAtPrice">Compare at (optional)</Label>
                <Input
                  id="compareAtPrice"
                  type="number"
                  min={0}
                  step={1}
                  value={form.compareAtPrice}
                  onChange={(e) => setForm((p) => ({ ...p, compareAtPrice: e.target.value }))}
                  className="rounded-none border-border/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(value) => setForm((p) => ({ ...p, categoryId: value }))}
                  required
                >
                  <SelectTrigger id="category" className="rounded-none border-border/40">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  min={0}
                  step={1}
                  value={form.stock}
                  onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                  required
                  className="rounded-none border-border/40"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Product Images</Label>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img) => (
                    <div key={img.id} className="relative border border-border/40 bg-secondary/10 p-1">
                      <img
                        src={img.preview}
                        alt="Preview"
                        className="w-full h-24 object-contain bg-secondary/20"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeImage(img.id)}
                        className="absolute top-1 right-1 h-6 w-6 bg-background/80"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <label
                htmlFor="image"
                className="flex flex-col items-center justify-center gap-2 border border-dashed border-border/40 bg-secondary/5 px-4 py-8 cursor-pointer hover:bg-secondary/10 transition-colors"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {images.length > 0 ? "Add more images" : "Click to upload images"}
                </span>
                <span className="text-xs text-muted-foreground">JPEG, PNG, WebP, GIF — max 5MB each</span>
              </label>
              <Input
                id="image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={handleImageChange}
                className="sr-only"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <div className="space-y-2">
                <Label htmlFor="sizes">Sizes (comma-separated)</Label>
                <Input
                  id="sizes"
                  placeholder="S, M, L, XL"
                  value={form.sizes}
                  onChange={(e) => setForm((p) => ({ ...p, sizes: e.target.value }))}
                  className="rounded-none border-border/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="colors">Colors (comma-separated)</Label>
                <Input
                  id="colors"
                  placeholder="Black, White"
                  value={form.colors}
                  onChange={(e) => setForm((p) => ({ ...p, colors: e.target.value }))}
                  className="rounded-none border-border/40"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="featured"
                checked={form.featured}
                onCheckedChange={(checked) =>
                  setForm((p) => ({ ...p, featured: checked === true }))
                }
              />
              <Label htmlFor="featured" className="cursor-pointer">
                Featured on homepage
              </Label>
            </div>
          </form>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-border/40 px-6 py-4 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="rounded-none uppercase tracking-widest text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-product-form"
              disabled={isSaving}
              className="rounded-none uppercase tracking-widest text-xs font-bold"
            >
              {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="border border-border/40 bg-secondary/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border/40 bg-secondary/20">
              <tr>
                <th className="px-4 py-4 font-normal w-16">Image</th>
                <th className="px-4 py-4 font-normal">Product</th>
                <th className="px-4 py-4 font-normal">Category</th>
                <th className="px-4 py-4 font-normal">Price</th>
                <th className="px-4 py-4 font-normal">Stock</th>
                <th className="px-4 py-4 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 bg-secondary/40">
                        {product.images?.[0] && (
                          <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold">{product.title}</td>
                    <td className="px-4 py-3 uppercase tracking-wider text-xs">{product.category}</td>
                    <td className="px-4 py-3">{formatPrice(product.price)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`${product.stock > 0 ? "text-green-500" : "text-destructive"} font-mono`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(product)}
                        className="text-xs uppercase tracking-wider"
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
