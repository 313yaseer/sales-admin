import { useEffect, useState } from "react";
import { Download, Eye, MoreVertical, Pencil } from "lucide-react";

export default function InvoiceTable({
  invoices,
  onEdit,
  onViewReceipt,
  onDownloadReceipt,
}) {
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    const handleClick = (event) => {
      if (!event.target.closest("[data-invoice-menu]")) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="overflow-x-auto rounded-xl shadow">
      <table className="min-w-full bg-white">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
          <tr>
            <th className="px-4 py-3">Invoice ID</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
          {invoices.length === 0 ? (
            <tr>
              <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>
                No invoices yet. Click "Create Invoice" to add one.
              </td>
            </tr>
          ) : (
            invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-slate-50/80">
                <td className="px-4 py-3 font-medium text-slate-900">#{invoice.id}</td>
                <td className="px-4 py-3">{invoice.customer_name}</td>
                <td className="px-4 py-3">{invoice.customer_phone}</td>
                <td className="px-4 py-3">${Number(invoice.total || 0).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    {invoice.status || "pending"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : "-"}
                </td>
                <td className="px-4 py-3">
                  <div
                    className="relative flex justify-end"
                    data-invoice-menu={invoice.id}
                  >
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenDropdown(openDropdown === invoice.id ? null : invoice.id);
                      }}
                      className="rounded-lg p-2 hover:bg-slate-100"
                      aria-label="Open actions"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {openDropdown === invoice.id && (
                      <div className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-200 bg-white shadow-lg z-50">
                        <button
                          type="button"
                          onClick={() => {
                            onViewReceipt(invoice);
                            setOpenDropdown(null);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          <Eye size={16} />
                          View Receipt
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDownloadReceipt?.(invoice);
                            setOpenDropdown(null);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          <Download size={16} />
                          Download Receipt
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onEdit(invoice);
                            setOpenDropdown(null);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          <Pencil size={16} />
                          Edit Invoice
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
