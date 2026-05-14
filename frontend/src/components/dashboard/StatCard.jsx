export default function StatCard({ label, value, icon = null, detail = "", children }) {
  return (
    <div className="stat-card">
      <div className="stat-card-head">
        {icon ? <div className="stat-card-icon">{icon}</div> : null}
        <div className="stat-label">{label}</div>
      </div>
      <div className="stat-value">{value}</div>
      {detail ? <div className="stat-detail">{detail}</div> : null}
      {children}
    </div>
  );
}
