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

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const normalizedProducts = (data || []).map((item) => ({
      ...item,
      images_urls: Array.isArray(item.images_urls)
        ? item.images_urls
        : item.images_urls
        ? [item.images_urls]
        : [],
    }));

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
      images_urls: productData.images_urls || [],
    };

    const { error: insertError } = await supabase.from("products").insert([payload]);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    await fetchProducts();
  };

  const updateProduct = async (productData) => {
    if (!editingProduct) return;

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
      images_urls: productData.images_urls || [],
    };

    const { error: updateError } = await supabase
      .from("products")
      .update(payload)
      .eq("id", editingProduct.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await fetchProducts();
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

  const handleSaveProduct = async (productData) => {
    if (editingProduct) {
      await updateProduct(productData);
      setShowModal(false);
      return;
    }

    await addProduct(productData);
    setShowModal(false);
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
            />
          </div>
        </div>
      )}
    </section>
  );
}
