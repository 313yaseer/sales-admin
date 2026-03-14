import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const pageTitles = {
  "/admin": "Dashboard",
  "/admin/products": "Products",
  "/admin/categories": "Categories",
  "/admin/invoices": "Invoices",
  "/admin/settings": "Settings",
};

export default function DashboardLayout() {
  const { pathname } = useLocation();
  const title = pageTitles[pathname] ?? "Admin Panel";

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Navbar title={title} />
        <main className="p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
