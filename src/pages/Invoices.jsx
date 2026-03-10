import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import InvoiceForm from "../components/InvoiceForm";
import InvoiceTable from "../components/InvoiceTable";
import { generateReceipt } from "../utils/generateReceipt";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editingItems, setEditingItems] = useState([]);

  useEffect(() => {
    fetchInvoices();
    fetchProducts();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setInvoices(data || []);
    setLoading(false);
  };

  const fetchInvoiceItems = async (invoiceId) => {
    const { data, error: fetchError } = await supabase
      .from("invoice_items")
      .select("quantity, price, products(name)")
      .eq("invoice_id", invoiceId);

    if (fetchError) {
      setError(fetchError.message);
      return [];
    }

    return (data || []).map((item) => ({
      name: item.products?.name || "Unknown",
      quantity: item.quantity,
      price: item.price,
    }));
  };

  const fetchProducts = async () => {
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

  const handleDeleteInvoice = async (invoiceId) => {
    const { error: itemsError } = await supabase
      .from("invoice_items")
      .delete()
      .eq("invoice_id", invoiceId);

    if (itemsError) {
      setError(itemsError.message);
      return;
    }

    const { error: invoiceError } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoiceId);

    if (invoiceError) {
      setError(invoiceError.message);
      return;
    }

    await fetchInvoices();
  };

  const handleDownloadReceipt = async (invoice) => {
    const items = await fetchInvoiceItems(invoice.id);
    if (items.length === 0) {
      setError("No invoice items found for this invoice.");
      return;
    }

    generateReceipt(invoice, items);
  };

  const editInvoice = async (invoice) => {
    setEditingInvoice(invoice);

    const { data, error: fetchError } = await supabase
      .from("invoice_items")
      .select("id, product_id, quantity, price")
      .eq("invoice_id", invoice.id);

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setEditingItems(data || []);
  };

  const updateItemField = (index, field, value) => {
    setEditingItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const updateInvoice = async () => {
    if (!editingInvoice) return;

    const total = editingItems.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0),
      0
    );

    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        customer_name: editingInvoice.customer_name,
        customer_phone: editingInvoice.customer_phone,
        status: editingInvoice.status,
        total,
      })
      .eq("id", editingInvoice.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    for (const item of editingItems) {
      const { error: itemError } = await supabase
        .from("invoice_items")
        .update({
          product_id: item.product_id,
          quantity: Number(item.quantity || 0),
          price: Number(item.price || 0),
        })
        .eq("id", item.id);

      if (itemError) {
        setError(itemError.message);
        return;
      }
    }

    setEditingInvoice(null);
    setEditingItems([]);
    await fetchInvoices();
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-slate-900">Invoices</h3>
          <p className="mt-1 text-sm text-slate-600">Track and manage customer invoices.</p>
        </div>

        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Create Invoice
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading && (
        <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          Loading invoices...
        </p>
      )}

      <InvoiceTable
        invoices={invoices}
        onEdit={editInvoice}
        onDelete={handleDeleteInvoice}
        onDownload={handleDownloadReceipt}
      />

      <InvoiceForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaved={fetchInvoices}
      />

      {editingInvoice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h2 className="text-lg font-semibold mb-4">Edit Invoice</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm mb-1">Customer Name</label>
                <input
                  value={editingInvoice.customer_name}
                  onChange={(e) =>
                    setEditingInvoice({
                      ...editingInvoice,
                      customer_name: e.target.value,
                    })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Customer Phone</label>
                <input
                  value={editingInvoice.customer_phone}
                  onChange={(e) =>
                    setEditingInvoice({
                      ...editingInvoice,
                      customer_phone: e.target.value,
                    })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Status</label>
                <select
                  value={editingInvoice.status}
                  onChange={(e) =>
                    setEditingInvoice({
                      ...editingInvoice,
                      status: e.target.value,
                    })
                  }
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">Items</h3>
              {editingItems.map((item, index) => (
                <div key={item.id} className="grid gap-3 sm:grid-cols-[1fr_120px_120px]">
                  <select
                    value={item.product_id}
                    onChange={(e) =>
                      updateItemField(index, "product_id", Number(e.target.value))
                    }
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItemField(index, "quantity", e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => updateItemField(index, "price", e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditingInvoice(null);
                  setEditingItems([]);
                }}
                className="bg-gray-200 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={updateInvoice}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
