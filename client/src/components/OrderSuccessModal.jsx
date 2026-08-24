import { useConfig } from "../context/ConfigContext.jsx";

export default function OrderSuccessModal({ result, onClose }) {
  const { storeName } = useConfig();
  if (!result) return null;

  function share() {
    const text = result.trackingCode
      ? `I just placed an order on ${storeName}. Track my order with code: ${result.trackingCode}`
      : `I just placed an order on ${storeName}.`;
    const url = `${location.origin}/track`;
    if (navigator.share) {
      navigator.share({ title: "Order Confirmed", text, url }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank");
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal success-modal">
        <div className="success-icon">
          <i className="fas fa-check" />
        </div>
        <h3>Order Placed!</h3>

        <div className="success-product">
          {result.firstItem && <img src={result.firstItem.img || "/logo.png"} alt="" />}
          <div>
            <b>{result.firstItem?.name || "Your order"}</b>
            <span className="price">₹{Number(result.total).toLocaleString("en-IN")}</span>
          </div>
        </div>

        {result.trackingCode && (
          <div className="tracking-box">
            <span>Your Tracking Code</span>
            <strong>{result.trackingCode}</strong>
          </div>
        )}

        {result.trackingCode && (
          <button className="btn btn-blue btn-block" onClick={share}>
            <i className="fas fa-share-nodes" /> Share
          </button>
        )}
        <button className="btn btn-light btn-block" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
