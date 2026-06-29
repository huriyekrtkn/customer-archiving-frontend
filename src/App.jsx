import { useState, useEffect, useCallback } from "react";

// ─── API CONFIG ────────────────────────────────────────────────────────────────
const BASE_URL = "http://localhost:8080";

const api = async (path, options = {}, token = null) => {
  let currentToken = token;
  
  // 1. Her istekten önce session'ı kontrol et (token arka planda yenilenmiş olabilir)
  const sessionAuth = JSON.parse(sessionStorage.getItem("auth") || "null");
  if (sessionAuth && sessionAuth.accessToken) {
    currentToken = sessionAuth.accessToken;
  }

  const headers = { "Content-Type": "application/json" };
  if (currentToken) headers["Authorization"] = `Bearer ${currentToken}`;
  
  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  
  // 2. INTERCEPTOR MANTIĞI: Eğer Token süresi dolduysa (401) ve elimizde Refresh Token varsa
  if (res.status === 401 && sessionAuth?.refreshToken && path !== "/authenticate" && path !== "/refresh-token") {
    try {
      // Backend'deki /refresh-token uç noktasına gidip yeni anahtar talep ediyoruz
      const refreshRes = await fetch(`${BASE_URL}/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: sessionAuth.refreshToken })
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        
        // 3. Yeni gelen güncel token'ları tarayıcıya kaydet
        sessionAuth.accessToken = refreshData.accessToken;
        sessionAuth.refreshToken = refreshData.refreshToken;
        sessionStorage.setItem("auth", JSON.stringify(sessionAuth));

        // 4. KULLANICIYA HİSSETTİRME: Yarım kalan orijinal isteği YENİ token ile tekrarla!
        headers["Authorization"] = `Bearer ${refreshData.accessToken}`;
        res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
      }
    } catch (err) {
      console.error("Token yenileme işlemi başarısız:", err);
      // Refresh token da ölmüşse yapacak bir şey yok, aşağıdaki hata fırlatma kodu çalışır ve kullanıcı login'e atılır.
    }
  }

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  
  if (!res.ok) {
    // eslint-disable-next-line no-throw-literal
    throw { status: res.status, data };
  }
  return data;
};

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const Icons = {
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  lock: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
  plus: "M12 5v14M5 12h14",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  trash: "M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
  file: "M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM13 2v7h7",
  folder: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  search: "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z",
  chevron: "M9 18l6-6-6-6",
  x: "M18 6L6 18M6 6l12 12",
  check: "M20 6L9 17l-5-5",
  alert: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  archive: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12",
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  calendar: "M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4zM16 2v4M8 2v4M3 10h18",
};

// ─── TOAST ────────────────────────────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        background: t.type === "error" ? "#1a0a0a" : t.type === "success" ? "#0a1a0f" : "#0a0f1a",
        border: `1px solid ${t.type === "error" ? "#c0392b" : t.type === "success" ? "#27ae60" : "#2980b9"}`,
        borderLeft: `4px solid ${t.type === "error" ? "#e74c3c" : t.type === "success" ? "#2ecc71" : "#3498db"}`,
        color: "#eee", padding: "12px 16px", borderRadius: 8, minWidth: 280, maxWidth: 380,
        display: "flex", alignItems: "center", gap: 10, animation: "slideIn 0.3s ease",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
      }}>
        <Icon d={t.type === "error" ? Icons.alert : Icons.check} size={16}
          color={t.type === "error" ? "#e74c3c" : t.type === "success" ? "#2ecc71" : "#3498db"} />
        <span style={{ flex: 1, fontSize: 13 }}>{t.message}</span>
        <button onClick={() => removeToast(t.id)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer" }}>
          <Icon d={Icons.x} size={14} />
        </button>
      </div>
    ))}
  </div>
);

// ─── MODAL ────────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    backdropFilter: "blur(4px)"
  }} onClick={e => e.target === e.currentTarget && onClose()}>
    <div style={{
      background: "#0f1117", border: "1px solid #1e2333", borderRadius: 16,
      width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto",
      boxShadow: "0 24px 80px rgba(0,0,0,0.8)"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #1e2333" }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#e8eaf6", fontFamily: "'DM Sans', sans-serif" }}>{title}</h2>
        <button onClick={onClose} style={{ background: "#1e2333", border: "none", color: "#888", cursor: "pointer", borderRadius: 8, padding: 6, display: "flex" }}>
          <Icon d={Icons.x} size={16} />
        </button>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>
);

// ─── FORM FIELD ───────────────────────────────────────────────────────────────
const Field = ({ label, icon, error, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</label>
    <div style={{ position: "relative" }}>
      {icon && <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#444" }}>
        <Icon d={icon} size={15} />
      </div>}
      <input {...props} style={{
        width: "100%", background: "#080c14", border: `1px solid ${error ? "#c0392b" : "#1e2333"}`,
        borderRadius: 10, padding: icon ? "10px 12px 10px 38px" : "10px 12px",
        color: "#e8eaf6", fontSize: 14, outline: "none", transition: "border-color 0.2s",
        boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif",
        ...props.style
      }}
        onFocus={e => e.target.style.borderColor = "#4f6ef7"}
        onBlur={e => e.target.style.borderColor = error ? "#c0392b" : "#1e2333"}
      />
    </div>
    {error && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#e74c3c" }}>{error}</p>}
  </div>
);

const Btn = ({ children, variant = "primary", loading, icon, ...props }) => {
  const styles = {
    primary: { background: "linear-gradient(135deg, #4f6ef7, #7c4dff)", color: "#fff", border: "none" },
    secondary: { background: "#1e2333", color: "#aaa", border: "1px solid #2a3050" },
    danger: { background: "linear-gradient(135deg, #c0392b, #e74c3c)", color: "#fff", border: "none" },
    ghost: { background: "transparent", color: "#4f6ef7", border: "1px solid #4f6ef733" },
  };
  return (
    <button {...props} disabled={loading || props.disabled} style={{
      ...styles[variant], padding: "10px 18px", borderRadius: 10, cursor: loading ? "wait" : "pointer",
      fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 7,
      transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.7 : 1,
      ...props.style
    }}>
      {icon && <Icon d={icon} size={15} />}
      {loading ? "Yükleniyor..." : children}
    </button>
  );
};

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────
const AuthPage = ({ onLogin }) => {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "login") {
        const data = await api("/authenticate", { method: "POST", body: JSON.stringify(form) });
        onLogin(data.accessToken, data.refreshToken, form.username);
      } else {
        await api("/register", { method: "POST", body: JSON.stringify(form) });
        setMode("login");
        setError("Kayıt başarılı! Giriş yapabilirsiniz.");
      }
    } catch (e) {
      const msg = e?.data?.errors || e?.data?.message || "Bir hata oluştu.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#070a11", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden"
    }}>
      {/* Background decoration */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, #4f6ef722 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #7c4dff18 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: "40%", left: "30%", width: 2, height: 2, borderRadius: "50%", boxShadow: "0 0 80px 40px #4f6ef711" }} />
      </div>

      <div style={{ width: "100%", maxWidth: 420, padding: 24, position: "relative" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg, #4f6ef7, #7c4dff)",
            display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
            boxShadow: "0 8px 32px #4f6ef744"
          }}>
            <Icon d={Icons.archive} size={28} color="#fff" />
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#e8eaf6", letterSpacing: "-0.5px" }}>
            Müşteri Arşivi
          </h1>
          <p style={{ margin: "6px 0 0", color: "#556", fontSize: 14 }}>Güvenli müşteri yönetim sistemi</p>
        </div>

        {/* Card */}
        <div style={{
          background: "#0f1117", border: "1px solid #1e2333", borderRadius: 20,
          padding: 32, boxShadow: "0 32px 80px rgba(0,0,0,0.6)"
        }}>
          {/* Tab */}
          <div style={{ display: "flex", background: "#080c14", borderRadius: 10, padding: 4, marginBottom: 28 }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
                flex: 1, padding: "8px 0", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: mode === m ? "linear-gradient(135deg, #4f6ef7, #7c4dff)" : "transparent",
                color: mode === m ? "#fff" : "#556", transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif"
              }}>
                {m === "login" ? "Giriş Yap" : "Kayıt Ol"}
              </button>
            ))}
          </div>

          <Field label="Kullanıcı Adı" icon={Icons.user} type="text" placeholder="kullanici_adi"
            value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
          <Field label="Şifre" icon={Icons.lock} type="password" placeholder="••••••••"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
            onKeyDown={e => e.key === "Enter" && handle()} />

          {error && (
            <div style={{
              background: error.includes("başarılı") ? "#0a1a0f" : "#1a0808",
              border: `1px solid ${error.includes("başarılı") ? "#27ae60" : "#c0392b"}`,
              borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13,
              color: error.includes("başarılı") ? "#2ecc71" : "#e74c3c", display: "flex", gap: 8, alignItems: "center"
            }}>
              <Icon d={error.includes("başarılı") ? Icons.check : Icons.alert} size={14} color="currentColor" />
              {error}
            </div>
          )}

          <Btn onClick={handle} loading={loading} style={{ width: "100%", justifyContent: "center", padding: "12px" }}>
            {mode === "login" ? "Giriş Yap" : "Kayıt Ol"}
          </Btn>
        </div>
      </div>
    </div>
  );
};

// ─── CUSTOMER FORM ────────────────────────────────────────────────────────────
const CustomerForm = ({ initial, onSubmit, onClose, loading }) => {
  const [form, setForm] = useState(initial || { firstName: "", lastName: "", dateOfBirth: "", email: "", phoneNumber: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.firstName || form.firstName.length < 2) e.firstName = "En az 2 karakter olmalı";
    if (!form.lastName || form.lastName.length < 2) e.lastName = "En az 2 karakter olmalı";
    if (!form.dateOfBirth) e.dateOfBirth = "Doğum tarihi zorunlu";
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Geçerli e-posta giriniz";
    if (!form.phoneNumber || form.phoneNumber.length !== 10) e.phoneNumber = "10 haneli numara (başında 0 olmadan)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label="Ad" icon={Icons.user} placeholder="Ahmet" value={form.firstName} error={errors.firstName}
          onChange={e => setForm({ ...form, firstName: e.target.value })} />
        <Field label="Soyad" placeholder="Yılmaz" value={form.lastName} error={errors.lastName}
          onChange={e => setForm({ ...form, lastName: e.target.value })} />
      </div>
      <Field label="Doğum Tarihi" icon={Icons.calendar} type="date" value={form.dateOfBirth} error={errors.dateOfBirth}
        onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
      <Field label="E-posta" icon={Icons.mail} type="email" placeholder="ahmet@ornek.com" value={form.email} error={errors.email}
        onChange={e => setForm({ ...form, email: e.target.value })} />
      <Field label="Telefon (10 hane, 0 olmadan)" icon={Icons.phone} placeholder="5XXXXXXXXX" value={form.phoneNumber} error={errors.phoneNumber}
        onChange={e => setForm({ ...form, phoneNumber: e.target.value })} />
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="secondary" onClick={onClose}>İptal</Btn>
        <Btn loading={loading} onClick={() => validate() && onSubmit(form)} icon={Icons.check}>Kaydet</Btn>
      </div>
    </div>
  );
};

// ─── FILE FORM ────────────────────────────────────────────────────────────────
const FileForm = ({ initial, onSubmit, onClose, loading }) => {
  const [form, setForm] = useState(initial || { fileName: "", fileType: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.fileName) e.fileName = "Dosya adı zorunlu";
    if (!form.fileType) e.fileType = "Dosya tipi zorunlu";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const fileTypes = ["PDF", "DOCX", "XLSX", "JPG", "PNG", "TXT", "CSV", "ZIP", "Diğer"];

  return (
    <div>
      <Field label="Dosya Adı" icon={Icons.file} placeholder="Sözleşme_2024" value={form.fileName} error={errors.fileName}
        onChange={e => setForm({ ...form, fileName: e.target.value })} />
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>Dosya Tipi</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {fileTypes.map(t => (
            <button key={t} onClick={() => setForm({ ...form, fileType: t })} style={{
              padding: "6px 14px", borderRadius: 8, border: `1px solid ${form.fileType === t ? "#4f6ef7" : "#1e2333"}`,
              background: form.fileType === t ? "#4f6ef722" : "#080c14", color: form.fileType === t ? "#7c9fff" : "#666",
              cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s"
            }}>{t}</button>
          ))}
        </div>
        {/* Allow custom type */}
        <input placeholder="Veya özel tip yaz..." value={fileTypes.includes(form.fileType) ? "" : form.fileType}
          onChange={e => setForm({ ...form, fileType: e.target.value })}
          style={{ marginTop: 8, width: "100%", background: "#080c14", border: "1px solid #1e2333", borderRadius: 8, padding: "8px 12px", color: "#e8eaf6", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif" }} />
        {errors.fileType && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#e74c3c" }}>{errors.fileType}</p>}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="secondary" onClick={onClose}>İptal</Btn>
        <Btn loading={loading} onClick={() => validate() && onSubmit(form)} icon={Icons.check}>Kaydet</Btn>
      </div>
    </div>
  );
};

// ─── CUSTOMER CARD ────────────────────────────────────────────────────────────
const CustomerCard = ({ customer, onEdit, onDelete, onViewFiles, selected, onClick }) => {
  const initials = `${customer.firstName?.[0] || ""}${customer.lastName?.[0] || ""}`.toUpperCase();
  const colors = ["#4f6ef7", "#7c4dff", "#e91e8c", "#00bcd4", "#ff6b35", "#43a047"];
  const color = colors[customer.id % colors.length];

  return (
    <div onClick={onClick} style={{
      background: selected ? "#0d1526" : "#0f1117",
      border: `1px solid ${selected ? "#4f6ef7" : "#1e2333"}`,
      borderRadius: 14, padding: 20, cursor: "pointer", transition: "all 0.2s",
      boxShadow: selected ? "0 0 0 1px #4f6ef744" : "none",
      position: "relative", overflow: "hidden"
    }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = "#2a3050"; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = "#1e2333"; }}
    >
      {selected && <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: "linear-gradient(to bottom, #4f6ef7, #7c4dff)" }} />}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: `${color}22`,
          border: `2px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, fontWeight: 700, color, flexShrink: 0
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: "#e8eaf6", fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {customer.firstName} {customer.lastName}
          </div>
          <div style={{ fontSize: 12, color: "#556", marginTop: 2 }}>ID: #{customer.id}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
        {[
          { icon: Icons.mail, value: customer.email },
          { icon: Icons.phone, value: customer.phoneNumber },
          { icon: Icons.calendar, value: customer.dateOfBirth },
        ].map(({ icon, value }, i) => value && (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon d={icon} size={13} color="#444" />
            <span style={{ fontSize: 12, color: "#778", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, borderTop: "1px solid #1e2333", paddingTop: 14 }}>
        <Btn variant="ghost" icon={Icons.folder} onClick={e => { e.stopPropagation(); onViewFiles(customer); }}
          style={{ flex: 1, justifyContent: "center", fontSize: 12, padding: "7px 10px" }}>
          Dosyalar {customer.files?.length > 0 && `(${customer.files.length})`}
        </Btn>
        <button onClick={e => { e.stopPropagation(); onEdit(customer); }} style={{
          background: "#1e2333", border: "1px solid #2a3050", color: "#aaa", borderRadius: 8,
          cursor: "pointer", padding: "7px 10px", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontFamily: "'DM Sans', sans-serif"
        }}>
          <Icon d={Icons.edit} size={13} />
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(customer); }} style={{
          background: "#1a0808", border: "1px solid #c0392b33", color: "#e74c3c", borderRadius: 8,
          cursor: "pointer", padding: "7px 10px", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontFamily: "'DM Sans', sans-serif"
        }}>
          <Icon d={Icons.trash} size={13} />
        </button>
      </div>
    </div>
  );
};

// ─── FILES PANEL ──────────────────────────────────────────────────────────────
const FilesPanel = ({ customer, token, toast }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | {file}
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api(`/customer-archive/customer/list-files/${customer.id}`, {}, token);
      setFiles(Array.isArray(data) ? data : []);
    } catch (e) {
      if (e?.status === 404) setFiles([]);
      else toast("Dosyalar yüklenemedi", "error");
    } finally { setLoading(false); }
  }, [customer.id, token, toast]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const addFile = async (form) => {
    setSaving(true);
    try {
      await api(`/customer-archive/customer/add-file/${customer.id}`, { method: "POST", body: JSON.stringify(form) }, token);
      toast("Dosya eklendi!", "success");
      setModal(null);
      loadFiles();
    } catch { toast("Dosya eklenemedi", "error"); }
    finally { setSaving(false); }
  };

  const updateFile = async (form) => {
    setSaving(true);
    try {
      await api(`/customer-archive/customer/update-file/${customer.id}/${modal.file.id}`, { method: "PUT", body: JSON.stringify(form) }, token);
      toast("Dosya güncellendi!", "success");
      setModal(null);
      loadFiles();
    } catch { toast("Dosya güncellenemedi", "error"); }
    finally { setSaving(false); }
  };

  const deleteFile = async (fileId) => {
    setDeleting(fileId);
    try {
      await api(`/customer-archive/customer/delete-file/${customer.id}/${fileId}`, { method: "DELETE" }, token);
      toast("Dosya silindi!", "success");
      loadFiles();
    } catch { toast("Dosya silinemedi", "error"); }
    finally { setDeleting(null); }
  };

  const deleteAll = async () => {
    if (!window.confirm("Tüm dosyalar silinecek. Emin misiniz?")) return;
    try {
      await api(`/customer-archive/customer/delete-all-files/${customer.id}`, { method: "DELETE" }, token);
      toast("Tüm dosyalar silindi!", "success");
      loadFiles();
    } catch { toast("Silinemedi", "error"); }
  };

  const fileTypeColor = (type) => {
    const map = { PDF: "#e74c3c", DOCX: "#2980b9", XLSX: "#27ae60", JPG: "#f39c12", PNG: "#8e44ad", TXT: "#95a5a6", CSV: "#16a085", ZIP: "#d35400" };
    return map[type?.toUpperCase()] || "#4f6ef7";
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: "#556" }}>{files.length} dosya</span>
        <div style={{ display: "flex", gap: 8 }}>
          {files.length > 0 && <Btn variant="danger" onClick={deleteAll} style={{ fontSize: 12, padding: "6px 12px" }}>Tümünü Sil</Btn>}
          <Btn icon={Icons.plus} onClick={() => setModal("add")} style={{ fontSize: 12, padding: "6px 12px" }}>Dosya Ekle</Btn>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 32, color: "#444" }}>Yükleniyor...</div>
      ) : files.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#444" }}>
          <Icon d={Icons.folder} size={40} color="#2a3050" />
          <p style={{ margin: "12px 0 0", fontSize: 14 }}>Henüz dosya yok</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {files.map(f => (
            <div key={f.id} style={{ background: "#080c14", border: "1px solid #1e2333", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: `${fileTypeColor(f.fileType)}22`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                <Icon d={Icons.file} size={16} color={fileTypeColor(f.fileType)} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "#ccd", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.fileName}</div>
                <div style={{ fontSize: 11, color: fileTypeColor(f.fileType), marginTop: 2, fontWeight: 600 }}>{f.fileType}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setModal({ file: f })} style={{ background: "#1e2333", border: "none", color: "#888", borderRadius: 7, padding: 6, cursor: "pointer", display: "flex" }}>
                  <Icon d={Icons.edit} size={13} />
                </button>
                <button onClick={() => deleteFile(f.id)} disabled={deleting === f.id} style={{ background: "#1a0808", border: "none", color: "#e74c3c", borderRadius: 7, padding: 6, cursor: "pointer", display: "flex" }}>
                  <Icon d={Icons.trash} size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === "add" ? "Dosya Ekle" : "Dosyayı Düzenle"} onClose={() => setModal(null)}>
          <FileForm
            initial={modal !== "add" ? { fileName: modal.file.fileName, fileType: modal.file.fileType } : undefined}
            onSubmit={modal === "add" ? addFile : updateFile}
            onClose={() => setModal(null)}
            loading={saving}
          />
        </Modal>
      )}
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [auth, setAuth] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("auth") || "null"); } catch { return null; }
  });
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | 'add' | {customer} | {files, customer}
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const toast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);

  const login = (accessToken, refreshToken, username) => {
    const authData = { accessToken, refreshToken, username };
    sessionStorage.setItem("auth", JSON.stringify(authData));
    setAuth(authData);
  };

const logout = useCallback(() => {
  sessionStorage.removeItem("auth");
  setAuth(null);
  setCustomers([]);
}, []);

  const loadCustomers = useCallback(async () => {
    if (!auth?.accessToken) return;
    setLoading(true);
    try {
      const data = await api("/customer-archive/customer/list", {}, auth.accessToken);
      setCustomers(Array.isArray(data) ? data : []);
    } catch (e) {
      if (e?.status === 401) { logout(); toast("Oturum süresi doldu", "error"); }
      else toast("Müşteriler yüklenemedi", "error");
    } finally { setLoading(false); }
  }, [auth?.accessToken, logout, toast]);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const addCustomer = async (form) => {
    setSaving(true);
    try {
      await api("/customer-archive/customer/save", { method: "POST", body: JSON.stringify(form) }, auth.accessToken);
      toast("Müşteri eklendi!", "success");
      setModal(null);
      loadCustomers();
    } catch (e) {
      const msg = e?.data?.errors;
      if (msg && typeof msg === "object") {
        const msgs = Object.entries(msg).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ");
        toast(msgs, "error");
      } else toast("Müşteri eklenemedi", "error");
    } finally { setSaving(false); }
  };

  const updateCustomer = async (form) => {
    setSaving(true);
    try {
      await api(`/customer-archive/customer/update/${modal.customer.id}`, { method: "PUT", body: JSON.stringify(form) }, auth.accessToken);
      toast("Müşteri güncellendi!", "success");
      setModal(null);
      loadCustomers();
    } catch { toast("Güncelleme başarısız", "error"); }
    finally { setSaving(false); }
  };

  const deleteCustomer = async (customer) => {
    try {
      await api(`/customer-archive/customer/delete/${customer.id}`, { method: "DELETE" }, auth.accessToken);
      toast(`${customer.firstName} ${customer.lastName} silindi`, "success");
      if (selected?.id === customer.id) setSelected(null);
      loadCustomers();
    } catch { toast("Silme başarısız", "error"); }
    finally { setDeleteConfirm(null); }
  };

  const findCustomerById = async () => {
    const idToSearch = prompt("Aramak istediğiniz müşterinin ID'sini girin:");
    if (!idToSearch) return;

    setLoading(true);
    try {
      const data = await api(`/customer-archive/customer/list/${idToSearch}`, {}, auth.accessToken);
      setCustomers([data]);
      toast("Müşteri bulundu!", "success");
    } catch (e) {
      toast("Bu ID'ye ait müşteri bulunamadı", "error");
    } finally { 
      setLoading(false); 
    }
  };

  if (!auth) return <AuthPage onLogin={login} />;

  const filtered = customers.filter(c =>
    `${c.id} ${c.firstName} ${c.lastName} ${c.email} ${c.phoneNumber}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: "#070a11", fontFamily: "'DM Sans', sans-serif", color: "#e8eaf6" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0f1117; }
        ::-webkit-scrollbar-thumb { background: #2a3050; border-radius: 3px; }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
      `}</style>

      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <header style={{
        background: "#0a0d15", borderBottom: "1px solid #1e2333", padding: "0 24px",
        height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #4f6ef7, #7c4dff)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={Icons.archive} size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.3px" }}>Müşteri Arşivi</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#556" }}>Hoş geldin, <span style={{ color: "#7c9fff" }}>{auth.username}</span></span>
          <button onClick={logout} style={{
            background: "#1e2333", border: "1px solid #2a3050", color: "#888", borderRadius: 8,
            padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: "'DM Sans', sans-serif"
          }}>
            <Icon d={Icons.logout} size={14} />
            Çıkış
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#444" }}>
              <Icon d={Icons.search} size={15} />
            </div>
            <input placeholder="Müşteri ara..." value={search} onChange={e => setSearch(e.target.value)} style={{
              width: "100%", background: "#0f1117", border: "1px solid #1e2333", borderRadius: 10,
              padding: "10px 12px 10px 38px", color: "#e8eaf6", fontSize: 14, outline: "none",
              fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.2s"
            }} onFocus={e => e.target.style.borderColor = "#4f6ef7"} onBlur={e => e.target.style.borderColor = "#1e2333"} />
          </div>

          <Btn variant="secondary" icon={Icons.search} onClick={findCustomerById}>ID ile Bul</Btn>          

          <Btn icon={Icons.plus} onClick={() => setModal("add")}>Yeni Müşteri</Btn>
          <button onClick={loadCustomers} disabled={loading} style={{
            background: "#1e2333", border: "1px solid #2a3050", color: "#888", borderRadius: 10, padding: "10px 14px",
            cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif"
          }}>{loading ? "..." : "↻ Yenile"}</button>
        </div>

        {/* Stats bar */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { label: "Toplam Müşteri", value: customers.length, color: "#4f6ef7" },
            { label: "Toplam Dosya", value: customers.reduce((a, c) => a + (c.files?.length || 0), 0), color: "#7c4dff" },
            { label: "Arama Sonucu", value: filtered.length, color: "#00bcd4" },
          ].map(s => (
            <div key={s.label} style={{ background: "#0f1117", border: "1px solid #1e2333", borderRadius: 12, padding: "12px 20px", display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#556", marginTop: 1 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 80, color: "#444" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⟳</div>
            <p>Yükleniyor...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80, color: "#444", animation: "fadeIn 0.4s ease" }}>
            <Icon d={Icons.user} size={48} color="#2a3050" />
            <p style={{ marginTop: 16, fontSize: 15 }}>{search ? "Sonuç bulunamadı" : "Henüz müşteri yok"}</p>
            {!search && <Btn icon={Icons.plus} onClick={() => setModal("add")} style={{ marginTop: 12 }}>İlk Müşteriyi Ekle</Btn>}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, animation: "fadeIn 0.3s ease" }}>
            {filtered.map(c => (
              <CustomerCard
                key={c.id}
                customer={c}
                selected={selected?.id === c.id}
                onClick={() => setSelected(selected?.id === c.id ? null : c)}
                onEdit={customer => setModal({ customer })}
                onDelete={customer => setDeleteConfirm(customer)}
                onViewFiles={customer => setModal({ files: true, customer })}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Customer Modal */}
      {(modal === "add" || modal?.customer) && !modal?.files && (
        <Modal title={modal === "add" ? "Yeni Müşteri Ekle" : "Müşteriyi Düzenle"} onClose={() => setModal(null)}>
          <CustomerForm
            initial={modal?.customer}
            onSubmit={modal === "add" ? addCustomer : updateCustomer}
            onClose={() => setModal(null)}
            loading={saving}
          />
        </Modal>
      )}

      {/* Files Modal */}
      {modal?.files && (
        <Modal title={`${modal.customer.firstName} ${modal.customer.lastName} — Dosyalar`} onClose={() => setModal(null)}>
          <FilesPanel customer={modal.customer} token={auth.accessToken} toast={toast} />
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#0f1117", border: "1px solid #c0392b44", borderRadius: 16, padding: 32, maxWidth: 380, width: "90%", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#1a0808", border: "2px solid #c0392b44", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Icon d={Icons.trash} size={22} color="#e74c3c" />
            </div>
            <h3 style={{ margin: "0 0 8px", color: "#e8eaf6" }}>Müşteriyi Sil</h3>
            <p style={{ margin: "0 0 24px", color: "#778", fontSize: 14 }}>
              <strong style={{ color: "#e8eaf6" }}>{deleteConfirm.firstName} {deleteConfirm.lastName}</strong> adlı müşteri ve tüm dosyaları kalıcı olarak silinecek.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Btn variant="secondary" onClick={() => setDeleteConfirm(null)}>İptal</Btn>
              <Btn variant="danger" onClick={() => deleteCustomer(deleteConfirm)} icon={Icons.trash}>Evet, Sil</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
