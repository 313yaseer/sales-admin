import { useEffect, useState } from "react";
import {
  Building2,
  FileText,
  Image,
  Mail,
  MapPin,
  Phone,
  Settings as SettingsIcon,
  ToggleLeft,
} from "lucide-react";
import { supabase } from "../lib/supabase";

const emptySettings = {
  id: null,
  company_name: "",
  address: "",
  phone: "",
  email: "",
  logo_url: "",
  receipt_header: "",
  receipt_footer: "",
  currency: "₦",
  tax_percentage: 0,
  default_invoice_status: "pending",
  auto_invoice_number: true,
  enable_customer_tracking: true,
};

export default function Settings() {
  const [settings, setSettings] = useState(emptySettings);
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("settings")
        .select("*")
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      if (data) {
        setSettings((prev) => ({
          ...prev,
          ...data,
          tax_percentage: Number(data.tax_percentage || 0),
        }));
      }

      setLoading(false);
    };

    fetchSettings();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = (name) => {
    setSettings((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
  };

  const uploadLogo = async () => {
    if (!logoFile) return settings.logo_url;

    const fileExt = logoFile.name.split(".").pop();
    const filePath = `logos/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("company-logos")
      .upload(filePath, logoFile, { upsert: true });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("company-logos").getPublicUrl(filePath);
    return data?.publicUrl || settings.logo_url;
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const logoUrl = await uploadLogo();
      const payload = {
        ...settings,
        logo_url: logoUrl,
        tax_percentage: Number(settings.tax_percentage || 0),
      };

      const { error: upsertError } = await supabase
        .from("settings")
        .upsert(payload, { onConflict: "id" });

      if (upsertError) {
        throw new Error(upsertError.message);
      }

      setSettings((prev) => ({ ...prev, logo_url: logoUrl }));
      setLogoFile(null);
      setSuccess("Settings saved successfully.");
    } catch (err) {
      setError(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold text-slate-900">Settings</h3>
        <p className="mt-1 text-sm text-slate-600">
          Configure your business, receipts, and system behavior.
        </p>
      </div>

      {loading && (
        <p className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
          Loading settings...
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-600">
          {success}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h4 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Building2 size={18} />
            Company Information
          </h4>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Company Name
            </label>
            <div className="relative">
              <Building2
                size={16}
                className="absolute left-3 top-2.5 text-slate-400"
              />
              <input
                name="company_name"
                value={settings.company_name}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Business Address
            </label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                name="address"
                value={settings.address}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Phone Number
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                name="phone"
                value={settings.phone}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                name="email"
                type="email"
                value={settings.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Company Logo Upload
            </label>
            <div className="flex items-center gap-3">
              <label className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 cursor-pointer hover:bg-slate-50">
                <Image size={16} />
                <span>{logoFile ? logoFile.name : "Upload logo"}</span>
                <input type="file" className="hidden" onChange={handleLogoChange} />
              </label>
              {settings.logo_url && (
                <img
                  src={settings.logo_url}
                  alt="Logo"
                  className="h-10 w-10 rounded-lg border object-cover"
                />
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
          >
            {saving ? "Saving..." : "Save Company Info"}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h4 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <FileText size={18} />
            Receipt Settings
          </h4>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Receipt Header Text
            </label>
            <textarea
              name="receipt_header"
              value={settings.receipt_header}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Footer Message
            </label>
            <textarea
              name="receipt_footer"
              value={settings.receipt_footer}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Currency Symbol
              </label>
              <input
                name="currency"
                value={settings.currency}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Tax Percentage
              </label>
              <input
                name="tax_percentage"
                type="number"
                step="0.1"
                value={settings.tax_percentage}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
          >
            {saving ? "Saving..." : "Save Receipt Settings"}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h4 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <SettingsIcon size={18} />
            System Settings
          </h4>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Default Invoice Status
            </label>
            <select
              name="default_invoice_status"
              value={settings.default_invoice_status}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <ToggleLeft size={18} />
              Auto Generate Invoice Number
            </div>
            <button
              type="button"
              onClick={() => handleToggle("auto_invoice_number")}
              className={`h-6 w-11 rounded-full transition ${
                settings.auto_invoice_number ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white transition ${
                  settings.auto_invoice_number ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <ToggleLeft size={18} />
              Enable Customer Tracking
            </div>
            <button
              type="button"
              onClick={() => handleToggle("enable_customer_tracking")}
              className={`h-6 w-11 rounded-full transition ${
                settings.enable_customer_tracking ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white transition ${
                  settings.enable_customer_tracking ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
          >
            {saving ? "Saving..." : "Save System Settings"}
          </button>
        </div>
      </div>
    </section>
  );
}
