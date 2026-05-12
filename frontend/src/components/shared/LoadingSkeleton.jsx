export default function LoadingSkeleton() {
  return (
    <div className="dashboard-skeleton">
      {[0, 1, 2, 3].map((index) => (
        <div className="dashboard-skeleton-row" key={index}>
          <span className="dashboard-skeleton-pill" />
          <span className="dashboard-skeleton-bar" />
          <span className="dashboard-skeleton-value" />
        </div>
      ))}
    </div>
  );
}
