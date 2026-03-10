export default function InvoiceTable({ invoices, onEdit, onDelete, onViewReceipt }) {
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
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(invoice)}
                      className="text-blue-600 hover:underline text-xs font-medium"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onViewReceipt(invoice)}
                      className="text-blue-600 hover:underline text-xs font-medium"
                    >
                      View Receipt
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(invoice.id)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
                    >
                      Delete
                    </button>
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
