export default function Card({ title, icon: Icon, children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl shadow p-6 ${className}`}>
      {title ? (
        <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
          {Icon ? <Icon size={18} /> : null}
          {title}
        </h2>
      ) : null}
      {children}
    </div>
  );
}
