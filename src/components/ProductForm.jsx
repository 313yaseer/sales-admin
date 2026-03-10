import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const emptyForm = {
  name: "",
  brand: "",
  category_id: "",
  price: "",
  stock: "",
  description: "",
  specs: "",
  features: "",
  manuals_url: "",
  images_urls: [],
};

export default function ProductForm({
  onClose,
  onSave,
  initialProduct = null,
}) {
  const [formData, setFormData] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingManual, setUploadingManual] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      const { data, error: fetchError } = await supabase
        .from("categories")
        .select("id, name")
        .order("name", { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setCategories(data || []);
    };

    loadCategories();
  }, []);

  useEffect(() => {
    if (initialProduct) {
      setFormData({
        name: initialProduct.name || "",
        brand: initialProduct.brand || "",
        category_id: initialProduct.category_id ?? "",
        price: initialProduct.price ?? "",
        stock: initialProduct.stock ?? "",
        description: initialProduct.description || "",
        specs: initialProduct.specs || "",
        features: initialProduct.features || "",
        manuals_url: initialProduct.manuals_url || "",
        images_urls: Array.isArray(initialProduct.images_urls)
          ? initialProduct.images_urls
          : initialProduct.images_urls
            ? [initialProduct.images_urls]
            : [],
      });
    } else {
      setFormData(emptyForm);
    }

    setError("");
    setUploadingImages(false);
    setUploadingManual(false);
  }, [initialProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const uploadFile = async (bucket, file, prefix) => {
    const extension = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const filePath = `${prefix}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleImagesChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingImages(true);
    setError("");

    try {
      const urls = await Promise.all(
        files.map((file) => uploadFile("product-images", file, "products"))
      );

      setFormData((prev) => ({
        ...prev,
        images_urls: [...prev.images_urls, ...urls],
      }));
    } catch (err) {
      setError(err.message || "Image upload failed.");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleManualChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingManual(true);
    setError("");

    try {
      const url = await uploadFile("product-manuals", file, "manuals");
      setFormData((prev) => ({ ...prev, manuals_url: url }));
    } catch (err) {
      setError(err.message || "Manual upload failed.");
    } finally {
      setUploadingManual(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.brand.trim() || !formData.category_id) {
      setError("Name, brand, and category are required.");
      return;
    }

    if (uploadingImages || uploadingManual) {
      setError("Please wait for uploads to finish.");
      return;
    }

    onSave({
      ...formData,
      category_id: Number(formData.category_id),
      price: Number(formData.price || 0),
      stock: Number(formData.stock || 0),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Product Name</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Brand</label>
          <input
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Price</label>
          <input
            type="number"
            min="0"
            step="0.01"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Stock</label>
          <input
            type="number"
            min="0"
            step="1"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            rows={4}
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 min-h-30"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Specifications</label>
          <textarea
            rows={4}
            name="specs"
            value={formData.specs}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 min-h-30"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Features</label>
          <textarea
            rows={4}
            name="features"
            value={formData.features}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 min-h-30"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Manual Upload</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleManualChange}
            className="w-full border rounded-lg px-3 py-2"
          />
          {uploadingManual && (
            <p className="mt-2 text-xs text-slate-500">Uploading manual...</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Image Upload</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImagesChange}
            className="w-full border rounded-lg px-3 py-2"
          />
          {uploadingImages && (
            <p className="mt-2 text-xs text-slate-500">Uploading images...</p>
          )}
        </div>
      </div>

      {formData.images_urls.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Image Preview</p>
          <div className="flex flex-wrap gap-2">
            {formData.images_urls.map((url) => (
              <img
                key={url}
                src={url}
                alt="Preview"
                className="h-20 w-20 rounded-lg border object-cover"
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={uploadingImages || uploadingManual}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Save Product
        </button>
      </div>
    </form>
  );
}
