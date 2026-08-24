import { useEffect } from "react";

export default function PopupModal({ popup, onClose }) {
  useEffect(() => {
    if (!popup) return;
    const key = `tm_popup_${popup.id}`;
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [popup, onClose]);

  if (!popup) return null;

  return (
    <div className="modal-overlay popup-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="popup-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
        {popup.link ? (
          <a href={popup.link} target="_blank" rel="noreferrer" onClick={onClose}>
            <img src={popup.image_url} alt={popup.title} />
          </a>
        ) : (
          <img src={popup.image_url} alt={popup.title} />
        )}
        <p className="popup-title">{popup.title}</p>
      </div>
    </div>
  );
}
