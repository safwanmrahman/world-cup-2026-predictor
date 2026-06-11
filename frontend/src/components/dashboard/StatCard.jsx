export default function StatCard({
  label,
  value,
  icon = null,
  detail = "",
  children,
  inlineSupport = false,
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-head">
        {icon ? <div className="stat-card-icon">{icon}</div> : null}
        <div className="stat-label">{label}</div>
      </div>
      <div className="stat-value">{value}</div>
      {inlineSupport ? (
        <div className="stat-detail-row">
          {detail ? <div className="stat-detail">{detail}</div> : <div />}
          {children ? <div className="stat-support-inline">{children}</div> : null}
        </div>
      ) : (
        <>
          {detail ? <div className="stat-detail">{detail}</div> : null}
          {children}
        </>
      )}
    </div>
  );
}
