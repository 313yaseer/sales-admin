import { NavLink } from "react-router-dom";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  Tags,
  Users,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { name: "Products", to: "/admin/products", icon: Package },
  { name: "Categories", to: "/admin/categories", icon: Tags },
  { name: "Customers", to: "/admin/customers", icon: Users },
  { name: "Invoices", to: "/admin/invoices", icon: FileText },
  { name: "Settings", to: "/admin/settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-20 h-screen w-64 bg-white shadow-md">
      <div className="border-b border-gray-100 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-600">
          DR APPLE
        </p>
        <h1 className="mt-1 text-lg font-semibold text-gray-900">Admin Panel</h1>
      </div>

      <nav className="px-4 py-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (!item.to) {
              return (
                <li
                  key={item.name}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 cursor-not-allowed"
                >
                  <Icon size={18} />
                  {item.name}
                </li>
              );
            }

            return (
              <li key={item.name}>
                <NavLink
                  to={item.to}
                  end={item.to === "/admin"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`
                  }
                >
                  <Icon size={18} />
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
