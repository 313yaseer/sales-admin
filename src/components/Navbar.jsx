import { Bell, LogOut, Search, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Navbar({ title = "Dashboard" }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  return (
    <header className="bg-white shadow px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <div className="relative hidden md:block">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search..."
            className="w-64 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          <Bell size={20} />
        </button>
        <UserCircle size={28} className="text-gray-400" />
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
