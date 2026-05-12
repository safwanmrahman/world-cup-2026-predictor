export default function Button({ className = "", children, ...props }) {
  const merged = `button ${className}`.trim();
  return (
    <button type="button" className={merged} {...props}>
      {children}
    </button>
  );
}
