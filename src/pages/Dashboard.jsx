import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Card from "../components/Card";
import { supabase } from "../lib/supabase";
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const formatCurrency = (value) =>
  `₦${Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [totalUnitsSold, setTotalUnitsSold] = useState(0);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    const [invoiceRes, itemsRes, lowStockRes] = await Promise.all([
      supabase
        .from("invoices")
        .select("id, customer_name, total, status, created_at")
        .order("created_at", { ascending: true }),
      supabase
        .from("invoice_items")
        .select("quantity, price, products(name)"),
      supabase
        .from("products")
        .select("id, name, stock")
        .lt("stock", 5)
        .order("stock", { ascending: true }),
    ]);

    if (invoiceRes.error || itemsRes.error || lowStockRes.error) {
      setError(
        invoiceRes.error?.message ||
          itemsRes.error?.message ||
          lowStockRes.error?.message ||
          "Failed to load dashboard data."
      );
      setLoading(false);
      return;
    }

    const invoiceData = invoiceRes.data || [];
    const itemData = itemsRes.data || [];
    const lowStockData = lowStockRes.data || [];

    setInvoices(invoiceData);
    setLowStock(lowStockData);

    const productMap = new Map();
    let unitsSold = 0;
    itemData.forEach((item) => {
      const name = item.products?.name || "Unknown";
      const entry = productMap.get(name) || { name, units: 0, revenue: 0 };
      const qty = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      entry.units += qty;
      entry.revenue += qty * price;
      productMap.set(name, entry);
      unitsSold += qty;
    });
    setTotalUnitsSold(unitsSold);

    const sortedProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    setTopProducts(sortedProducts);

    const today = new Date();
    const days = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);
      return {
        key,
        label: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        total: 0,
      };
    });

    const trendMap = new Map(days.map((day) => [day.key, day]));
    invoiceData.forEach((invoice) => {
      const dayKey = new Date(invoice.created_at).toISOString().slice(0, 10);
      const entry = trendMap.get(dayKey);
      if (entry) {
        entry.total += Number(invoice.total || 0);
      }
    });

    setTrendData(days.map((day) => ({ date: day.label, total: day.total })));
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const metrics = useMemo(() => {
    const totalSales = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.total || 0),
      0
    );
    const totalOrders = invoices.length;
    const productsSold = totalUnitsSold;
    const pendingPayments = invoices
      .filter((invoice) => invoice.status === "pending")
      .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);

    return { totalSales, totalOrders, productsSold, pendingPayments };
  }, [invoices, totalUnitsSold]);

  const recentSales = useMemo(
    () =>
      [...invoices]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5),
    [invoices]
  );

  return (
    <section className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold text-slate-900">
          Sales Analytics Dashboard
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Monitor key sales metrics and operational signals.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Loading analytics...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[
              {
                label: "Total Sales",
                value: formatCurrency(metrics.totalSales),
                icon: DollarSign,
                color: "bg-blue-100 text-blue-600",
              },
              {
                label: "Total Orders",
                value: metrics.totalOrders,
                icon: ShoppingCart,
                color: "bg-green-100 text-green-600",
              },
              {
                label: "Products Sold",
                value: metrics.productsSold,
                icon: Package,
                color: "bg-violet-100 text-violet-600",
              },
              {
                label: "Pending Payments",
                value: formatCurrency(metrics.pendingPayments),
                icon: Clock,
                color: "bg-orange-100 text-orange-600",
              },
            ].map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-white rounded-xl shadow p-5 flex items-center gap-4"
              >
                <div className={`p-3 rounded-lg ${card.color}`}>
                  <card.icon size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <Card title="Sales Trend" icon={TrendingUp}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `₦${value / 1000}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card title="Top Selling Products" icon={Package} className="lg:col-span-2">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="py-2">Product Name</th>
                    <th className="py-2">Units Sold</th>
                    <th className="py-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-400">
                        No sales data yet.
                      </td>
                    </tr>
                  ) : (
                    topProducts.map((product) => (
                      <tr key={product.name} className="border-t">
                        <td className="py-3">{product.name}</td>
                        <td className="py-3">{product.units}</td>
                        <td className="py-3">{formatCurrency(product.revenue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Card>

            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <h2 className="flex items-center gap-2 text-red-600 font-semibold mb-3">
                <AlertTriangle size={18} /> Low Stock Alert
              </h2>
              {lowStock.length === 0 ? (
                <p className="text-sm text-red-500">All products are stocked.</p>
              ) : (
                <div className="space-y-2 text-sm text-red-700">
                  {lowStock.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.name}</span>
                      <span>{item.stock} left</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Card title="Recent Sales" icon={ShoppingCart}>
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2">Invoice</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400">
                      No recent sales.
                    </td>
                  </tr>
                ) : (
                  recentSales.map((sale) => (
                    <tr key={sale.id} className="border-t">
                      <td className="py-3">#{sale.id}</td>
                      <td className="py-3">{sale.customer_name || "Unknown"}</td>
                      <td className="py-3">{formatCurrency(sale.total)}</td>
                      <td className="py-3 capitalize">{sale.status}</td>
                      <td className="py-3">
                        {new Date(sale.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </section>
  );
}
