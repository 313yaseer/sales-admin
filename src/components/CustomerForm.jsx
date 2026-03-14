import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const emptyCustomer = {
  name: "",
  phone: "",
  email: "",
  address: "",
};

export default function CustomerForm({
  isOpen,
  onClose,
  onSaved,
  initialCustomer = null,
  readOnly = false,
}) {
  const [formData, setFormData] = useState(emptyCustomer);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    if (initialCustomer) {
      setFormData({
        name: initialCustomer.name || "",
        phone: initialCustomer.phone || "",
        email: initialCustomer.email || "",
        address: initialCustomer.address || "",
      });
    } else {
      setFormData(emptyCustomer);
    }
    setError("");
    setSaving(false);
  }, [isOpen, initialCustomer]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (readOnly) {
      onClose();
      return;
    }

    if (!formData.name.trim()) {
      setError("Customer name is required.");
      return;
    }

    setSaving(true);
    setError("");

    if (initialCustomer?.id) {
      const { error: updateError } = await supabase
        .from("customers")
        .update({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
        })
        .eq("id", initialCustomer.id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("customers").insert([
        {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
        },
      ]);

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onSaved();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-xl font-semibold text-slate-900">
          {readOnly
            ? "Customer Details"
            : initialCustomer
              ? "Edit Customer"
              : "Add Customer"}
        </h3>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Customer Name
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={readOnly}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Phone Number
            </label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={readOnly}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={readOnly}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={readOnly}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            {!readOnly && (
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-70"
              >
                {saving ? "Saving..." : "Save Customer"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
