export default function OfferBar({ offers = [] }) {
  const active = offers.filter((o) => o.title || o.description);
  if (active.length === 0) return null;
  const text = active.map((o) => `⭐ ${o.title}${o.description ? " — " + o.description : ""}`).join("   •   ");
  return (
    <div className="offer-bar">
      <div className="offer-track">{text}</div>
    </div>
  );
}
