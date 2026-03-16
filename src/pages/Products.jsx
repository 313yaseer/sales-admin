import { useEffect, useState } from "react";
import ProductTable from "../components/ProductTable";
import ProductForm from "../components/ProductForm";
import { supabase } from "../lib/supabase";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("products")
      .select(
        `
        *,
        product_media (*)
      `
      )
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error(fetchError);
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const normalizedProducts = (data || []).map((item) => {
      const media = Array.isArray(item.product_media) ? item.product_media : [];
      const mediaUrls = media.map((entry) => entry.media_url).filter(Boolean);
      return {
        ...item,
        product_media: media,
        images_urls: mediaUrls.length > 0 ? mediaUrls : item.image_url ? [item.image_url] : [],
      };
    });

    setProducts(normalizedProducts);
    setLoading(false);
  };

  const fetchCategories = async () => {
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

  const openAddForm = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const openEditForm = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const closeForm = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const addProduct = async (productData) => {
    const imageUrl =
      Array.isArray(productData.images_urls) && productData.images_urls.length > 0
        ? productData.images_urls[0]
        : productData.image_url || "";
    const imagesValue = Array.isArray(productData.images_urls)
      ? productData.images_urls
      : productData.images_urls
        ? [productData.images_urls]
        : imageUrl
          ? [imageUrl]
          : [];
    const payload = {
      name: productData.name,
      brand: productData.brand,
      category_id: productData.category_id,
      price: Number(productData.price || 0),
      stock: Number(productData.stock || 0),
      description: productData.description || "",
      specs: productData.specs || "",
      features: productData.features || "",
      manuals_url: productData.manuals_url || "",
      images_urls: imagesValue,
      image_url: imageUrl,
    };

    const { data, error: insertError } = await supabase
      .from("products")
      .insert([payload])
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      alert("Product save failed");
      setError(insertError.message);
      return false;
    }

    console.log("Product inserted:", data);

    await fetchProducts();
    return true;
  };

  const updateProduct = async (productData) => {
    if (!editingProduct) return;

    const imageUrl =
      Array.isArray(productData.images_urls) && productData.images_urls.length > 0
        ? productData.images_urls[0]
        : productData.image_url || "";
    const imagesValue = Array.isArray(productData.images_urls)
      ? productData.images_urls
      : productData.images_urls
        ? [productData.images_urls]
        : imageUrl
          ? [imageUrl]
          : [];
    const payload = {
      name: productData.name,
      brand: productData.brand,
      category_id: productData.category_id,
      price: Number(productData.price || 0),
      stock: Number(productData.stock || 0),
      description: productData.description || "",
      specs: productData.specs || "",
      features: productData.features || "",
      manuals_url: productData.manuals_url || "",
      images_urls: imagesValue,
      image_url: imageUrl,
    };

    const { error: updateError } = await supabase
      .from("products")
      .update(payload)
      .eq("id", editingProduct.id);

    if (updateError) {
      console.error("Update error:", updateError);
      setError(updateError.message);
      return false;
    }

    await fetchProducts();
    return true;
  };

  const deleteProduct = async (id) => {
    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await fetchProducts();
  };

  const handleSaveProduct = async (productData, mediaFiles) => {
    if (saving) return false;

    setSaving(true);
    setError("");
    console.log("Saving product...");
    console.log("Media files:", mediaFiles);

    try {
      const { data: productDataResp, error: productError } = await supabase
        .from("products")
        .insert([
          {
            name: productData.name,
            brand: productData.brand,
            price: productData.price,
            stock: productData.stock,
          },
        ])
        .select()
        .single();

      if (productError) {
        console.error(productError);
        alert("Failed to create product");
        setSaving(false);
        return false;
      }

      const productId = productDataResp.id;

      if (mediaFiles && mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          const fileName = `${Date.now()}-${file.name}`;

          const { error: uploadError } = await supabase.storage
            .from("product-images")
            .upload(fileName, file);

          if (uploadError) {
            console.error("Upload error:", uploadError);
            continue;
          }

          const { data } = supabase.storage
            .from("product-images")
            .getPublicUrl(fileName);

          const mediaType = file.type.startsWith("video") ? "video" : "image";

          await supabase.from("product_media").insert([
            {
              product_id: productId,
              media_url: data.publicUrl,
              media_type: mediaType,
            },
          ]);
        }
      }

      alert("Product saved successfully");
      await fetchProducts();
      return true;
    } catch (err) {
      console.error("Save error:", err);
      alert("Unexpected error while saving");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-slate-900">Products</h3>
          <p className="mt-1 text-sm text-slate-600">
            Create and maintain AI-ready product knowledge for your sales agent.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Add Product
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading && (
        <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          Loading products...
        </p>
      )}

      <ProductTable products={products} onEdit={openEditForm} onDelete={deleteProduct} />

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {editingProduct ? "Edit Product" : "Add Product"}
              </h3>
              <button
                type="button"
                onClick={closeForm}
                className="text-slate-500 hover:text-slate-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <ProductForm
              onClose={closeForm}
              onSave={handleSaveProduct}
              initialProduct={editingProduct}
              categories={categories}
              loading={saving}
            />
          </div>
        </div>
      )}
    </section>
  );
}
