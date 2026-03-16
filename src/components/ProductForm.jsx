import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ProductForm({ onClose, onSave, initialProduct = null, fetchProducts }) {
  const emptyForm = {
    name: "",
    brand: "",
    category_id: "",
    price: "",
    stock: "",
    description: "",
    specs: "",
    features: "",
  };

  const [formData, setFormData] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase.from("categories").select("id,name").order("name");
      if (error) setError(error.message);
      else setCategories(data || []);
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (initialProduct) {
      setFormData({
        ...emptyForm,
        name: initialProduct.name || "",
        brand: initialProduct.brand || "",
        category_id: initialProduct.category_id || "",
        price: initialProduct.price || "",
        stock: initialProduct.stock || "",
        description: initialProduct.description || "",
        specs: initialProduct.specs || "",
        features: initialProduct.features || "",
      });
    } else {
      setFormData(emptyForm);
    }
  }, [initialProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) setMediaFiles(files);
  };

  const handleSaveProduct = async () => {
    if (saving) return;
    setError("");
    setSaving(true);

    try {
      if (!formData.name || !formData.brand) {
        setError("Name and Brand are required");
        setSaving(false);
        return;
      }

      // 1️⃣ Insert product first
      const { data: productData, error: productError } = await supabase
        .from("products")
        .insert([{
          name: formData.name,
          brand: formData.brand,
          category_id: formData.category_id ? Number(formData.category_id) : null,
          price: Number(formData.price || 0),
          stock: Number(formData.stock || 0),
          description: formData.description,
          specs: formData.specs,
          features: formData.features,
        }])
        .select()
        .single();

      if (productError) {
        console.error(productError);
        setError("Failed to save product");
        setSaving(false);
        return;
      }

      const productId = productData.id;

      // 2️⃣ Upload media files sequentially
      if (mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          try {
            const fileName = `${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage
              .from("product-images")
              .upload(fileName, file);

            if (uploadError) {
              console.error("Upload error:", uploadError);
              continue; // skip failed file
            }

            const { data: publicData } = supabase.storage
              .from("product-images")
              .getPublicUrl(fileName);

            const mediaType = file.type.startsWith("video") ? "video" : "image";

            await supabase.from("product_media").insert([{
              product_id: productId,
              media_url: publicData.publicUrl,
              media_type: mediaType,
            }]);

          } catch (fileErr) {
            console.error("File upload error:", fileErr);
          }
        }
      }

      // 3️⃣ Refresh product list
      if (fetchProducts) await fetchProducts();

      alert("Product saved successfully!");
      setFormData(emptyForm);
      setMediaFiles([]);
      if (onClose) onClose();

    } catch (err) {
      console.error(err);
      setError("Unexpected error during save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      {error && <p className="text-red-600">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label>Name</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="border w-full px-3 py-2 rounded"
          />
        </div>
        <div>
          <label>Brand</label>
          <input
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            className="border w-full px-3 py-2 rounded"
          />
        </div>
        <div>
          <label>Category</label>
          <select
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            className="border w-full px-3 py-2 rounded"
          >
            <option value="">Select category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label>Price</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="border w-full px-3 py-2 rounded"
          />
        </div>
        <div>
          <label>Stock</label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            className="border w-full px-3 py-2 rounded"
          />
        </div>
      </div>

      <div>
        <label>Media (images/videos)</label>
        <input type="file" multiple accept="image/*,video/*" onChange={handleMediaChange} />
      </div>

      {mediaFiles.length > 0 && (
        <div className="flex gap-2 flex-wrap mt-2">
          {mediaFiles.map((file, idx) => {
            const url = URL.createObjectURL(file);
            if (file.type.startsWith("video")) return <video key={idx} src={url} className="w-32" controls />;
            return <img key={idx} src={url} className="w-32" />;
          })}
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={handleSaveProduct}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Product"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="border px-4 py-2 rounded hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
