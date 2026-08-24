import ChatWidget from "../../../components/ChatWidget.jsx";

export default function ChatTab() {
  return (
    <div className="chat-tab">
      <h2 className="tab-title">Admin AI Assistant</h2>
      <p className="muted">
        Ask about orders, products and sales — connected directly to your Trend Mart database.
        Try: “Which orders were placed today?” · “How many pending orders?” · “Top selling products”
      </p>

      <div className="chat-embed">
        <ChatWidget sessionPrefix="admin-" title="Database Assistant" />
      </div>
    </div>
  );
}
