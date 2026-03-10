import { useEffect, useState } from "react";
import CategoryTable from "../components/CategoryTable";
import CategoryForm from "../components/CategoryForm";
import { supabase } from "../lib/supabase";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("categories")
      .select("*")
      .order("id", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setCategories(data || []);
    setLoading(false);
  };

  const openAddForm = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const openEditForm = (category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  const addCategory = async (categoryData) => {
    const { error: insertError } = await supabase
      .from("categories")
      .insert([{ name: categoryData.name, description: categoryData.description }]);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    await fetchCategories();
  };

  const updateCategory = async (categoryData) => {
    if (!editingCategory) return;

    const { error: updateError } = await supabase
      .from("categories")
      .update({ name: categoryData.name, description: categoryData.description })
      .eq("id", editingCategory.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await fetchCategories();
  };

  const deleteCategory = async (id) => {
    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await fetchCategories();
  };

  const handleSaveCategory = async (categoryData) => {
    if (editingCategory) {
      await updateCategory(categoryData);
      return;
    }

    await addCategory(categoryData);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-slate-900">Category Management</h3>
          <p className="mt-1 text-sm text-slate-600">
            Organize and maintain categories for your product catalog.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Add Category
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading && (
        <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          Loading categories...
        </p>
      )}

      <CategoryTable
        categories={categories}
        onEdit={openEditForm}
        onDelete={deleteCategory}
      />

      <CategoryForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onSave={handleSaveCategory}
        initialCategory={editingCategory}
      />
    </section>
  );
}
