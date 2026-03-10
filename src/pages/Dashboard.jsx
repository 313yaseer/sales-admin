export default function Dashboard() {
  const stats = [
    { label: "Total Products", value: "1,248" },
    { label: "Categories", value: "36" },
    { label: "Customer Messages", value: "87" },
    { label: "AI Agent Status", value: "Online" },
  ];

  return (
    <section>
      <div className="mb-6">
        <h3 className="text-2xl font-semibold text-slate-900">Dashboard Overview</h3>
        <p className="mt-1 text-sm text-slate-600">
          Monitor your AI Sales Agent performance.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
