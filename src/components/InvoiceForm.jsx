import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const emptyCustomer = {
  customer_name: "",
  customer_phone: "",
  status: "pending",
};

const emptyLine = {
  product_id: "",
  quantity: 1,
};

export default function InvoiceForm({
  isOpen,
  onClose,
  onSaved,
  invoice = null,
  initialItems = [],
}) {
  const [formData, setFormData] = useState(emptyCustomer);
  const [lines, setLines] = useState([emptyLine]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const loadProducts = async () => {
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("id, name, price")
        .order("name", { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setProducts(data || []);
    };

    loadProducts();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (invoice) {
      setFormData({
        customer_name: invoice.customer_name || "",
        customer_phone: invoice.customer_phone || "",
        status: invoice.status || "pending",
      });
      const normalizedLines = initialItems.length
        ? initialItems.map((item) => ({
            product_id: item.product_id || "",
            quantity: item.quantity || 1,
          }))
        : [emptyLine];
      setLines(normalizedLines);
    } else {
      setFormData(emptyCustomer);
      setLines([emptyLine]);
    }
    setError("");
    setLoading(false);
  }, [isOpen, invoice, initialItems]);

  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach((product) => map.set(String(product.id), product));
    return map;
  }, [products]);

  const total = useMemo(() => {
    return lines.reduce((sum, line) => {
      const product = productMap.get(String(line.product_id));
      const price = product ? Number(product.price || 0) : 0;
      const qty = Number(line.quantity || 0);
      return sum + price * qty;
    }, 0);
  }, [lines, productMap]);

  const updateCustomer = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updateLine = (index, field, value) => {
    setLines((prev) =>
      prev.map((line, idx) => (idx === index ? { ...line, [field]: value } : line))
    );
  };

  const addLine = () => {
    setLines((prev) => [...prev, emptyLine]);
  };

  const removeLine = (index) => {
    setLines((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customer_name.trim() || !formData.customer_phone.trim()) {
      setError("Customer name and phone are required.");
      return;
    }

    const validLines = lines.filter((line) => line.product_id && Number(line.quantity) > 0);
    if (validLines.length === 0) {
      setError("Please add at least one product.");
      return;
    }

    setLoading(true);
    setError("");

    let invoiceId = invoice?.id;
    if (invoiceId) {
      const { error: updateError } = await supabase
        .from("invoices")
        .update({
          customer_name: formData.customer_name.trim(),
          customer_phone: formData.customer_phone.trim(),
          total,
          status: formData.status,
        })
        .eq("id", invoiceId);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      const { error: deleteError } = await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", invoiceId);

      if (deleteError) {
        setError(deleteError.message);
        setLoading(false);
        return;
      }
    } else {
      const { data: createdInvoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert([
          {
            customer_name: formData.customer_name.trim(),
            customer_phone: formData.customer_phone.trim(),
            total,
            status: formData.status,
          },
        ])
        .select("id")
        .single();

      if (invoiceError) {
        setError(invoiceError.message);
        setLoading(false);
        return;
      }

      invoiceId = createdInvoice.id;
    }

    const itemsPayload = validLines.map((line) => {
      const product = productMap.get(String(line.product_id));
      const price = product ? Number(product.price || 0) : 0;
      const qty = Number(line.quantity || 0);
      return {
        invoice_id: invoiceId,
        product_id: Number(line.product_id),
        quantity: qty,
        price,
      };
    });

    const { error: itemsError } = await supabase.from("invoice_items").insert(itemsPayload);

    if (itemsError) {
      setError(itemsError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onSaved();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-xl font-semibold text-slate-900">
          {invoice ? "Edit Invoice" : "Create Invoice"}
        </h3>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Customer Name</label>
              <input
                name="customer_name"
                value={formData.customer_name}
                onChange={updateCustomer}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Customer Phone</label>
              <input
                name="customer_phone"
                value={formData.customer_phone}
                onChange={updateCustomer}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={updateCustomer}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700">Products</h4>
              <button
                type="button"
                onClick={addLine}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Add Product
              </button>
            </div>

            {lines.map((line, index) => (
              <div key={`line-${index}`} className="grid gap-3 sm:grid-cols-[1fr_120px_80px]">
                <select
                  value={line.product_id}
                  onChange={(e) => updateLine(index, "product_id", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (${Number(product.price || 0).toFixed(2)})
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  value={line.quantity}
                  onChange={(e) => updateLine(index, "quantity", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />

                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <span className="font-medium text-slate-700">Invoice Total</span>
            <span className="text-base font-semibold text-slate-900">${total.toFixed(2)}</span>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Saving..." : "Save Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
