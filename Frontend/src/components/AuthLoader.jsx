import "./AuthLoader.css";

export default function AuthLoader({ visible, label = "Loading..." }) {
  if (!visible) return null;
  return (
    <div className="authLoaderOverlay" role="status" aria-live="polite" aria-label={label}>
      <div className="authLoaderBox">
        <div className="spinner" aria-hidden="true"></div>
        <div className="loaderLabel">{label}</div>
      </div>
    </div>
  );
}
