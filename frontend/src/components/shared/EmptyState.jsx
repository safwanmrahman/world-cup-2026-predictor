export default function EmptyState({ children, className = "empty-message" }) {
  return <div className={className}>{children}</div>;
}
