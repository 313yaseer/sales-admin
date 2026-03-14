import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import CustomerForm from "../components/CustomerForm";
import { Eye, MoreVertical, Pencil, Search, UserPlus } from "lucide-react";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest("[data-customer-menu]")) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setCustomers(data || []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditingCustomer(null);
    setViewingCustomer(null);
    setIsFormOpen(true);
  };

  const openEdit = (customer) => {
    setViewingCustomer(null);
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const openView = (customer) => {
    setEditingCustomer(null);
    setViewingCustomer(customer);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingCustomer(null);
    setViewingCustomer(null);
  };

  const filteredCustomers = customers.filter((customer) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      customer.name?.toLowerCase().includes(query) ||
      customer.phone?.includes(query) ||
      customer.email?.toLowerCase().includes(query)
    );
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-slate-900">Customers</h3>
          <p className="mt-1 text-sm text-slate-600">
            Manage your customer records and contact details.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <UserPlus size={18} />
          Add Customer
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search customers..."
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          Loading customers...
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Created Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-slate-500"
                    colSpan={6}
                  >
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {customer.name}
                    </td>
                    <td className="px-4 py-3">{customer.phone || "-"}</td>
                    <td className="px-4 py-3">{customer.email || "-"}</td>
                    <td className="px-4 py-3">{customer.address || "-"}</td>
                    <td className="px-4 py-3">
                      {customer.created_at
                        ? new Date(customer.created_at).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div
                        className="relative inline-flex"
                        data-customer-menu={customer.id}
                      >
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenDropdown(
                              openDropdown === customer.id ? null : customer.id
                            );
                          }}
                          className="rounded-lg p-2 hover:bg-slate-100"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {openDropdown === customer.id && (
                          <div className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-200 bg-white shadow-lg z-50">
                            <button
                              type="button"
                              onClick={() => {
                                openView(customer);
                                setOpenDropdown(null);
                              }}
                              onMouseDown={(event) => event.stopPropagation()}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                            >
                              <Eye size={16} />
                              View Customer
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                openEdit(customer);
                                setOpenDropdown(null);
                              }}
                              onMouseDown={(event) => event.stopPropagation()}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                            >
                              <Pencil size={16} />
                              Edit Customer
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
      )}

      <CustomerForm
        isOpen={isFormOpen}
        initialCustomer={editingCustomer || viewingCustomer}
        readOnly={Boolean(viewingCustomer)}
        onClose={closeForm}
        onSaved={fetchCustomers}
      />
    </section>
  );
}
