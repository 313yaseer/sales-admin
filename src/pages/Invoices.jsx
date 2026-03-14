import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import InvoiceForm from "../components/InvoiceForm";
import InvoiceTable from "../components/InvoiceTable";
import QRCode from "react-qr-code";
import { generateReceipt } from "../utils/generateReceipt";
import { Filter, Search, X } from "lucide-react";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editingLines, setEditingLines] = useState([]);
  const [receiptInvoice, setReceiptInvoice] = useState(null);
  const [receiptItems, setReceiptItems] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [receiptReady, setReceiptReady] = useState(false);
  const receiptRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

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

  const handleDownloadReceipt = async () => {
    if (downloading) {
      return;
    }
    try {
      if (!receiptRef || !receiptRef.current || !receiptInvoice) {
        console.error("Receipt element not found");
        setError("Receipt preview not ready");
        return;
      }

      setDownloading(true);
      setError("");
      const itemsForPdf = receiptItems.map((item) => ({
        name: item.product_name || "Unknown",
        quantity: item.quantity,
        price: item.price,
      }));

      let logoDataUrl = "";
      let qrDataUrl = "";
      try {
        logoDataUrl = await getImageDataUrl(
          receiptRef.current.querySelector("img")
        );
      } catch (err) {
        console.warn("Logo capture failed:", err);
      }
      try {
        qrDataUrl = await getQrPngDataUrl(
          receiptRef.current.querySelector("svg")
        );
      } catch (err) {
        console.warn("QR capture failed:", err);
      }

      await generateReceipt(receiptInvoice, itemsForPdf, {
        logoDataUrl: logoDataUrl || "",
        qrDataUrl: qrDataUrl || "",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      setError("Failed to generate receipt PDF");
    } finally {
      setDownloading(false);
    }
  };

  const viewReceipt = async (invoice) => {
    setError("");
    setReceiptInvoice(invoice);

    const { data, error: fetchError } = await supabase
      .from("invoice_items")
      .select("id, quantity, price, products(name)")
      .eq("invoice_id", invoice.id);

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    const items = (data || []).map((item) => ({
      id: item.id,
      product_name: item.products?.name || "Unknown",
      quantity: item.quantity,
      price: item.price,
    }));

    setReceiptItems(items);
  };

  const handleDownloadFromRow = async (invoice) => {
    await viewReceipt(invoice);
    await new Promise((resolve) => setTimeout(resolve, 50));
    await handleDownloadReceipt();
  };

  useEffect(() => {
    if (!receiptInvoice) {
      setReceiptReady(false);
      return;
    }

    const raf = requestAnimationFrame(() => {
      setReceiptReady(Boolean(receiptRef.current));
    });

    return () => cancelAnimationFrame(raf);
  }, [receiptInvoice, receiptItems.length]);

  const numberToWords = (num) => {
    const ones = [
      "zero",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve",
      "thirteen",
      "fourteen",
      "fifteen",
      "sixteen",
      "seventeen",
      "eighteen",
      "nineteen",
    ];
    const tens = [
      "",
      "",
      "twenty",
      "thirty",
      "forty",
      "fifty",
      "sixty",
      "seventy",
      "eighty",
      "ninety",
    ];

    if (num < 20) return ones[num];
    if (num < 100) {
      const t = Math.floor(num / 10);
      const r = num % 10;
      return r ? `${tens[t]} ${ones[r]}` : tens[t];
    }
    if (num < 1000) {
      const h = Math.floor(num / 100);
      const r = num % 100;
      return r ? `${ones[h]} hundred ${numberToWords(r)}` : `${ones[h]} hundred`;
    }
    if (num < 1000000) {
      const k = Math.floor(num / 1000);
      const r = num % 1000;
      return r ? `${numberToWords(k)} thousand ${numberToWords(r)}` : `${numberToWords(k)} thousand`;
    }
    return `${num}`;
  };

  const amountInWords = (amount) => {
    const whole = Math.floor(Number(amount || 0));
    const words = numberToWords(whole);
    return `${words} naira only`;
  };

  const getImageDataUrl = (imgElement) =>
    new Promise((resolve) => {
      if (!imgElement) {
        resolve("");
        return;
      }

      const loadAndConvert = () => {
        const canvas = document.createElement("canvas");
        const width = imgElement.naturalWidth || imgElement.width || 80;
        const height = imgElement.naturalHeight || imgElement.height || 80;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve("");
          return;
        }
        ctx.drawImage(imgElement, 0, 0, width, height);
        resolve(canvas.toDataURL("image/png"));
      };

      if (imgElement.complete) {
        loadAndConvert();
      } else {
        imgElement.onload = loadAndConvert;
        imgElement.onerror = () => resolve("");
      }
    });

  const getQrPngDataUrl = (svgElement) =>
    new Promise((resolve) => {
      if (!svgElement) {
        resolve("");
        return;
      }

      try {
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        const svgDataUrl = `data:image/svg+xml;base64,${window.btoa(
          unescape(encodeURIComponent(svgString))
        )}`;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const width = svgElement.clientWidth || 80;
          const height = svgElement.clientHeight || 80;
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve("");
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => resolve("");
        img.src = svgDataUrl;
      } catch (err) {
        resolve("");
      }
    });

  const handleEditInvoice = async (invoice) => {
    setError("");
    setEditingInvoice(invoice);

    const { data, error: fetchError } = await supabase
      .from("invoice_items")
      .select("product_id, quantity")
      .eq("invoice_id", invoice.id);

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    const lines = (data || []).map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
    }));

    setEditingLines(lines.length ? lines : [{ product_id: "", quantity: 1 }]);
    setShowInvoiceForm(true);
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      invoice.customer_name?.toLowerCase().includes(query) ||
      String(invoice.id || "").toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;

    let matchesDate = true;
    if (dateFilter !== "all" && invoice.created_at) {
      const createdAt = new Date(invoice.created_at);
      const now = new Date();
      if (dateFilter === "today") {
        matchesDate = createdAt.toDateString() === now.toDateString();
      } else if (dateFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        matchesDate = createdAt >= weekAgo;
      } else if (dateFilter === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        matchesDate = createdAt >= monthAgo;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-slate-900">Invoices</h3>
          <p className="mt-1 text-sm text-slate-600">Track and manage customer invoices.</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingInvoice(null);
            setEditingLines([]);
            setShowInvoiceForm(true);
          }}
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

      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl shadow">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <Filter size={16} />
          Filters
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search invoice or customer..."
              className="pl-9 pr-3 py-2 border rounded-lg w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="border rounded-lg px-3 py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>

          <select
            className="border rounded-lg px-3 py-2"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setDateFilter("all");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <X size={16} /> Reset
          </button>
        </div>
      </div>

      <InvoiceTable
        invoices={filteredInvoices}
        onEdit={handleEditInvoice}
        onViewReceipt={viewReceipt}
        onDownloadReceipt={handleDownloadFromRow}
      />

      <InvoiceForm
        isOpen={showInvoiceForm}
        invoice={editingInvoice}
        initialItems={editingLines}
        onClose={() => {
          setShowInvoiceForm(false);
          setEditingInvoice(null);
          setEditingLines([]);
        }}
        onSaved={fetchInvoices}
      />

      {receiptInvoice && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-xl p-6 relative">
            {receiptInvoice.status === "paid" && (
              <div className="absolute top-12 right-10 rotate-12 text-red-600 text-4xl font-bold opacity-70 border-4 border-red-600 px-4 py-2">
                PAID
              </div>
            )}

            <div className="bg-white print:p-0 print:shadow-none">
              <div
                ref={receiptRef}
                id="receipt-preview"
                className="mx-auto w-full max-w-xl space-y-4 text-sm leading-relaxed"
              >
                <div className="text-center border-b pb-4 mb-4">
                  <img
                    src="/logo.png"
                    alt="Company Logo"
                    className="mx-auto h-16 mb-2"
                  />
                  <h1 className="text-2xl font-bold tracking-wide">DR APPLE MOBILE STORE</h1>
                  <p>No 12 Rahama Plaza, Farmcenter Kano</p>
                  <p>Phone: +234 813 784 3328</p>
                  <p>Email: sales@drapple.com</p>
                </div>

                <div className="text-center mb-4">
                  <h2 className="text-lg font-semibold tracking-widest">SALES RECEIPT</h2>
                </div>

                <div className="space-y-1">
                  <p><strong>Invoice ID:</strong> {receiptInvoice.id}</p>
                  <p><strong>Customer:</strong> {receiptInvoice.customer_name}</p>
                  <p><strong>Phone:</strong> {receiptInvoice.customer_phone}</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        <th className="border px-2 py-1">Product</th>
                        <th className="border px-2 py-1">Qty</th>
                        <th className="border px-2 py-1">Price</th>
                        <th className="border px-2 py-1">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiptItems.map((item) => (
                        <tr key={item.id}>
                          <td className="border px-2 py-1">{item.product_name}</td>
                          <td className="border px-2 py-1">x{item.quantity}</td>
                          <td className="border px-2 py-1">
                            ₦{Number(item.price || 0).toFixed(2)}
                          </td>
                          <td className="border px-2 py-1">
                            ₦{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="font-semibold">
                  Total: ₦{Number(receiptInvoice.total || 0).toFixed(2)}
                </div>
                <div className="text-xs text-slate-500">
                  Amount in words: {amountInWords(receiptInvoice.total)}
                </div>

                <div className="flex justify-center mt-6">
                  <QRCode
                    value={`Invoice:${receiptInvoice.id}|Total:${receiptInvoice.total}`}
                    size={80}
                  />
                </div>
                <p className="text-center text-xs mt-2 text-gray-500">
                  Scan to verify receipt
                </p>

                <div className="grid grid-cols-2 gap-10 mt-10 text-center text-sm">
                  <div>
                    <div className="border-t pt-2">Manager Signature</div>
                  </div>
                  <div>
                    <div className="border-t pt-2">Customer Signature</div>
                  </div>
                </div>

                <div className="text-center text-xs mt-6 text-gray-500">
                  Thank you for your purchase.
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setReceiptInvoice(null)}
                    className="px-4 py-2 border rounded"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadReceipt}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                    disabled={downloading || !receiptReady}
                  >
                    {downloading ? "Generating..." : "Download PDF"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
