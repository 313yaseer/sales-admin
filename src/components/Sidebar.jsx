import { NavLink } from "react-router-dom";
import { FiGrid, FiBox, FiTag, FiFileText, FiSettings } from "react-icons/fi";

const navItems = [
  { name: "Dashboard", to: "/admin", icon: FiGrid },
  { name: "Products", to: "/admin/products", icon: FiBox },
  { name: "Categories", to: "/admin/categories", icon: FiTag },
  { name: "Invoices", to: "/admin/invoices", icon: FiFileText },
  { name: "Settings", to: "/admin/settings", icon: FiSettings },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-20 h-screen w-64 bg-slate-900 text-slate-100">
      <div className="border-b border-slate-800 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">DR APPLE ONLINE SHOP</p>
        <h1 className="mt-1 text-lg font-semibold">Admin Panel</h1>
      </div>

      <nav className="px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <NavLink
                  to={item.to}
                  end={item.to === "/admin"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-slate-800 text-white"
                        : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                    }`
                  }
                >
                  <Icon className="text-base" />
                  {item.name}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
