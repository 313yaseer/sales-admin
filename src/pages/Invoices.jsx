import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import InvoiceForm from "../components/InvoiceForm";
import InvoiceTable from "../components/InvoiceTable";
import { generateReceipt } from "../utils/generateReceipt";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
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

  const editInvoice = (invoice) => {
    setEditingInvoice(invoice);
  };

  const updateInvoice = async () => {
    if (!editingInvoice) return;

    const { error: updateError } = await supabase
      .from("invoices")
      .update({ status: editingInvoice.status })
      .eq("id", editingInvoice.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setEditingInvoice(null);
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
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-lg font-semibold mb-4">Edit Invoice</h2>
            <label className="block text-sm mb-1">Status</label>
            <select
              value={editingInvoice.status}
              onChange={(e) =>
                setEditingInvoice({
                  ...editingInvoice,
                  status: e.target.value,
                })
              }
              className="w-full border rounded px-3 py-2 mb-4"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
            <button
              onClick={updateInvoice}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
