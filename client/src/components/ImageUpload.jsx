import { useRef } from "react";
import { api } from "../lib/api.js";

export default function ImageUpload({ value, onChange, folder = "uploads" }) {
  const ref = useRef(null);

  async function upload(file) {
    if (!file) return;
    const form = new FormData();
    form.append("image", file);
    form.append("folder", folder);
    try {
      const res = await api("/admin/upload", { method: "POST", form });
      onChange(res.url);
    } catch (e) {
      alert(e.message || "Upload failed");
    }
  }

  return (
    <div className="img-upload">
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => upload(e.target.files?.[0])}
      />
      <button type="button" className={`upload-box ${value ? "has-img" : ""}`} onClick={() => ref.current?.click()}>
        {value ? (
          <img src={value} alt="" />
        ) : (
          <span>
            <i className="fas fa-cloud-arrow-up" />
            Upload image
          </span>
        )}
      </button>
      <input
        className="upload-url"
        placeholder="…or paste image URL"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
