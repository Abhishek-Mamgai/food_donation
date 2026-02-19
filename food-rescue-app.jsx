import { useState, useEffect, useCallback } from "react";

// ─── Mock Data ────────────────────────────────────────────────
const INITIAL_TASKS = [
  {
    id: "1", food_type: "Hot Biryani", quantity: "40 portions", weight_kg: 20,
    description: "Freshly cooked chicken biryani from wedding event. Still warm.",
    priority: "urgent", status: "available", version: 1,
    donor_name: "Ravi Catering Co.", address: "12 MG Road, Bengaluru",
    pickup_start: new Date(Date.now() - 10 * 60000).toISOString(),
    pickup_end: new Date(Date.now() + 35 * 60000).toISOString(),
    posted_at: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "2", food_type: "Bread & Pastries", quantity: "60 pieces", weight_kg: 8,
    description: "End-of-day unsold bakery items. Mix of sourdough, croissants, muffins.",
    priority: "high", status: "available", version: 1,
    donor_name: "The Daily Loaf Bakery", address: "45 Church Street, Bengaluru",
    pickup_start: new Date(Date.now() - 5 * 60000).toISOString(),
    pickup_end: new Date(Date.now() + 90 * 60000).toISOString(),
    posted_at: new Date(Date.now() - 20 * 60000).toISOString(),
  },
  {
    id: "3", food_type: "Mixed Vegetables", quantity: "15 kg", weight_kg: 15,
    description: "Fresh produce — tomatoes, spinach, carrots. Surplus from market.",
    priority: "normal", status: "available", version: 1,
    donor_name: "Devaraja Market", address: "Devaraja Market, Mysuru",
    pickup_start: new Date(Date.now() + 30 * 60000).toISOString(),
    pickup_end: new Date(Date.now() + 4 * 3600000).toISOString(),
    posted_at: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: "4", food_type: "Rice & Dal", quantity: "25 portions", weight_kg: 12,
    description: "Office canteen surplus. Sealed containers.",
    priority: "normal", status: "available", version: 1,
    donor_name: "Infosys Cafeteria", address: "Electronics City, Bengaluru",
    pickup_start: new Date(Date.now() + 15 * 60000).toISOString(),
    pickup_end: new Date(Date.now() + 2 * 3600000).toISOString(),
    posted_at: new Date(Date.now() - 2 * 60000).toISOString(),
  },
  {
    id: "5", food_type: "Fruit Box", quantity: "30 packs", weight_kg: 18,
    description: "Surplus hotel breakfast fruit. Apples, bananas, oranges.",
    priority: "low", status: "available", version: 1,
    donor_name: "ITC Windsor Hotel", address: "25 Windsor Square, Bengaluru",
    pickup_start: new Date(Date.now() + 60 * 60000).toISOString(),
    pickup_end: new Date(Date.now() + 6 * 3600000).toISOString(),
    posted_at: new Date(Date.now() - 30 * 60000).toISOString(),
  },
];

const RECEIVERS = [
  { id: "r1", name: "Asha Children's Home",    address: "Hebbal, Bengaluru" },
  { id: "r2", name: "Shanti Old Age Home",     address: "Rajajinagar, Bengaluru" },
  { id: "r3", name: "Hope Street Shelter",     address: "Shivajinagar, Bengaluru" },
];

// ─── Helpers ──────────────────────────────────────────────────
function timeLeft(iso) {
  const diff = new Date(iso) - Date.now();
  if (diff <= 0) return { text: "EXPIRED", urgent: true, expired: true };
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const rm = m % 60;
  if (m < 30) return { text: `${m}m left`, urgent: true, expired: false };
  if (h < 2)  return { text: `${m}m left`, urgent: false, expired: false };
  return { text: `${h}h ${rm}m left`, urgent: false, expired: false };
}

function fmt(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric", minute: "2-digit", hour12: true,
    weekday: "short",
  }).format(new Date(iso));
}

function calcImpact(kg) {
  if (!kg) return null;
  return { meals: Math.floor(kg / 0.5), co2: (kg * 2.5).toFixed(1), water: Math.round(kg * 290) };
}

const PRIORITY = {
  urgent: { label: "URGENT 🔥", color: "#E63946", bg: "#FFF0F0", ring: "#E63946" },
  high:   { label: "High ⚡",   color: "#F4A261", bg: "#FFFBF0", ring: "#F4A261" },
  normal: { label: "Normal",    color: "#2A9D8F", bg: "#F0FAFA", ring: "#2A9D8F" },
  low:    { label: "Low",       color: "#9E9E9E", bg: "#F8F8F8", ring: "#BDBDBD" },
};

const foodEmoji = (type) => {
  const t = type.toLowerCase();
  if (t.includes("rice") || t.includes("biryani")) return "🍚";
  if (t.includes("bread") || t.includes("baker")) return "🥖";
  if (t.includes("veg") || t.includes("fruit")) return "🥦";
  if (t.includes("hot") || t.includes("meal")) return "🍛";
  return "🍱";
};

// ─── Styles ───────────────────────────────────────────────────
const S = {
  app: {
    minHeight: "100vh",
    background: "#0F1117",
    fontFamily: "'Syne', 'Helvetica Neue', sans-serif",
    color: "#F0F0F0",
  },
  nav: {
    background: "rgba(15,17,23,0.95)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    padding: "0 24px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    height: "64px", position: "sticky", top: 0, zIndex: 200,
  },
  logo: {
    fontSize: "20px", fontWeight: 800, letterSpacing: "-0.03em",
    background: "linear-gradient(90deg, #52B788, #95D5B2)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  tab: (active) => ({
    padding: "6px 16px", borderRadius: "99px", cursor: "pointer",
    border: "none", fontFamily: "inherit", fontSize: "13px", fontWeight: 600,
    background: active ? "rgba(82,183,136,0.18)" : "transparent",
    color: active ? "#52B788" : "#777",
    transition: "all 0.2s",
  }),
  card: (urgent) => ({
    background: "#1A1D27",
    borderRadius: "20px",
    border: `1px solid ${urgent ? "rgba(230,57,70,0.35)" : "rgba(255,255,255,0.07)"}`,
    padding: "22px",
    transition: "transform 0.18s ease, border-color 0.18s ease",
    cursor: "default",
    animation: "fadeUp 0.3s ease",
  }),
  btn: (variant = "primary") => ({
    padding: "12px 20px", borderRadius: "12px", border: "none",
    cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
    fontSize: "14px", transition: "all 0.18s ease",
    ...(variant === "primary" ? {
      background: "linear-gradient(135deg, #2D6A4F, #52B788)",
      color: "#fff",
      boxShadow: "0 4px 16px rgba(82,183,136,0.3)",
    } : variant === "danger" ? {
      background: "rgba(230,57,70,0.15)", color: "#E63946",
      border: "1px solid rgba(230,57,70,0.3)",
    } : variant === "ghost" ? {
      background: "rgba(255,255,255,0.05)", color: "#aaa",
      border: "1px solid rgba(255,255,255,0.1)",
    } : {
      background: "rgba(82,183,136,0.12)", color: "#52B788",
      border: "1px solid rgba(82,183,136,0.25)",
    }),
  }),
  input: {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px", padding: "11px 14px", color: "#F0F0F0",
    fontFamily: "inherit", fontSize: "14px", outline: "none", width: "100%",
  },
  label: { fontSize: "12px", color: "#888", marginBottom: "6px", display: "block", fontWeight: 600, letterSpacing: "0.05em" },
  badge: (p) => ({
    display: "inline-block", padding: "3px 10px", borderRadius: "99px",
    fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em",
    background: PRIORITY[p].bg, color: PRIORITY[p].color,
    border: `1px solid ${PRIORITY[p].ring}40`,
  }),
  section: { maxWidth: "900px", margin: "0 auto", padding: "28px 16px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" },
  impact: {
    display: "flex", gap: "10px", marginTop: "10px",
  },
  impactChip: (c) => ({
    flex: 1, background: `${c}15`, border: `1px solid ${c}30`,
    borderRadius: "10px", padding: "8px 10px", textAlign: "center",
    fontSize: "11px", color: c,
  }),
};

// ─── Toast ────────────────────────────────────────────────────
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  const colors = { success: "#52B788", error: "#E63946", info: "#F4A261" };
  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
      background: "#1E2130", border: `1px solid ${colors[type] || colors.info}50`,
      color: "#F0F0F0", padding: "14px 24px", borderRadius: "14px",
      boxShadow: `0 8px 32px ${colors[type] || colors.info}30`,
      fontSize: "14px", fontWeight: 600, zIndex: 999,
      maxWidth: "90vw", textAlign: "center", animation: "fadeUp 0.25s ease",
    }}>
      {msg}
    </div>
  );
}

// ─── TaskCard ─────────────────────────────────────────────────
function TaskCard({ task, onClaim, claimingId, activeTask }) {
  const [tl, setTl] = useState(() => timeLeft(task.pickup_end));
  useEffect(() => {
    const iv = setInterval(() => setTl(timeLeft(task.pickup_end)), 20000);
    return () => clearInterval(iv);
  }, [task.pickup_end]);

  if (tl.expired) return null;
  const p = PRIORITY[task.priority];
  const imp = calcImpact(task.weight_kg);
  const isClaiming = claimingId === task.id;

  return (
    <div style={S.card(tl.urgent)}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = tl.urgent ? "rgba(230,57,70,0.6)" : "rgba(82,183,136,0.35)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = tl.urgent ? "rgba(230,57,70,0.35)" : "rgba(255,255,255,0.07)"; }}
    >
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{
            width: 44, height: 44, borderRadius: "12px",
            background: `${p.color}18`, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "22px",
          }}>
            {foodEmoji(task.food_type)}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "16px", letterSpacing: "-0.02em" }}>{task.food_type}</div>
            <div style={{ fontSize: "13px", color: "#888", marginTop: "1px" }}>{task.quantity}</div>
          </div>
        </div>
        <span style={S.badge(task.priority)}>{p.label}</span>
      </div>

      {task.description && (
        <p style={{ fontSize: "13px", color: "#9A9A9A", lineHeight: 1.55, marginBottom: "12px" }}>
          {task.description}
        </p>
      )}

      {/* Meta */}
      <div style={{ fontSize: "12px", color: "#777", display: "flex", flexDirection: "column", gap: "5px", marginBottom: "14px" }}>
        <span>📍 {task.address}</span>
        <span>👤 {task.donor_name}</span>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
          <span>🕐 Opens {fmt(task.pickup_start)}</span>
          <span style={{ color: tl.urgent ? "#E63946" : "#52B788", fontWeight: 700 }}>⏱ {tl.text}</span>
        </div>
        <span style={{ color: "#666" }}>Must pick up by {fmt(task.pickup_end)}</span>
      </div>

      {/* Impact */}
      {imp && (
        <div style={S.impact}>
          <div style={S.impactChip("#52B788")}>🍽 {imp.meals} meals</div>
          <div style={S.impactChip("#74C69D")}>🌿 {imp.co2}kg CO₂</div>
          <div style={S.impactChip("#95D5B2")}>💧 {imp.water}L water</div>
        </div>
      )}

      <button
        onClick={() => onClaim(task)}
        disabled={isClaiming || !!activeTask}
        style={{
          ...S.btn(activeTask ? "ghost" : "primary"),
          width: "100%", marginTop: "14px",
          opacity: activeTask ? 0.5 : 1,
        }}
      >
        {isClaiming ? "⏳ Claiming…" : activeTask ? "Complete active rescue first" : "🙋 Claim This Rescue"}
      </button>
    </div>
  );
}

// ─── Active Task Banner ───────────────────────────────────────
function ActiveBanner({ task, onPickup, onDeliver, loading }) {
  const [tl, setTl] = useState(() => timeLeft(task.pickup_end));
  useEffect(() => {
    const iv = setInterval(() => setTl(timeLeft(task.pickup_end)), 20000);
    return () => clearInterval(iv);
  }, [task.pickup_end]);

  const imp = calcImpact(task.weight_kg);

  return (
    <div style={{
      background: "linear-gradient(135deg, #0D3B2E, #1B5E40)",
      border: "1px solid rgba(82,183,136,0.3)",
      borderRadius: "20px", padding: "22px", marginBottom: "24px",
      animation: "fadeUp 0.3s ease",
    }}>
      <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "#52B788", marginBottom: "8px" }}>
        ● ACTIVE RESCUE IN PROGRESS
      </div>
      <div style={{ fontSize: "22px", fontWeight: 800, marginBottom: "4px", letterSpacing: "-0.02em" }}>
        {foodEmoji(task.food_type)} {task.food_type}
      </div>
      <div style={{ fontSize: "14px", color: "#95D5B2", marginBottom: "4px" }}>{task.quantity}</div>
      <div style={{ fontSize: "13px", color: "#74C69D", marginBottom: "14px" }}>📍 {task.address}</div>

      <div style={{
        display: "flex", justifyContent: "space-between",
        background: "rgba(0,0,0,0.25)", borderRadius: "10px",
        padding: "10px 14px", fontSize: "12px", marginBottom: "16px",
      }}>
        <span style={{ color: "#aaa" }}>Claimed at {fmt(task.claimed_at)}</span>
        <span style={{ color: tl.urgent ? "#FFB700" : "#52B788", fontWeight: 700 }}>{tl.text}</span>
      </div>

      {imp && (
        <div style={{ ...S.impact, marginBottom: "16px" }}>
          <div style={S.impactChip("#52B788")}>🍽 {imp.meals} meals</div>
          <div style={S.impactChip("#74C69D")}>🌿 {imp.co2}kg CO₂</div>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px" }}>
        {task.status === "claimed" && (
          <button onClick={() => onPickup(task.id)} disabled={loading}
            style={{ ...S.btn("primary"), flex: 1 }}>
            ✅ Mark as Picked Up
          </button>
        )}
        {task.status === "in_transit" && (
          <button onClick={() => onDeliver(task.id)} disabled={loading}
            style={{ ...S.btn("primary"), flex: 1, background: "linear-gradient(135deg,#1B7A4A,#52B788)" }}>
            🎉 Mark as Delivered
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Donor Form ───────────────────────────────────────────────
function DonorForm({ onPost, currentUser }) {
  const [form, setForm] = useState({
    food_type: "", quantity: "", weight_kg: "", description: "",
    address: "", priority: "normal",
    pickup_start_offset: "0", pickup_window_hours: "2",
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.food_type || !form.quantity || !form.address) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 600));
    const now = Date.now();
    const start = now + parseInt(form.pickup_start_offset) * 60000;
    const end = start + parseFloat(form.pickup_window_hours) * 3600000;
    onPost({
      id: Date.now().toString(),
      ...form,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      donor_name: currentUser.name,
      status: "available", version: 1,
      pickup_start: new Date(start).toISOString(),
      pickup_end: new Date(end).toISOString(),
      posted_at: new Date(now).toISOString(),
    });
    setForm({ food_type: "", quantity: "", weight_kg: "", description: "", address: "", priority: "normal", pickup_start_offset: "0", pickup_window_hours: "2" });
    setSubmitting(false);
  };

  return (
    <div style={{ background: "#1A1D27", borderRadius: "20px", padding: "28px", border: "1px solid rgba(255,255,255,0.07)" }}>
      <h2 style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "22px" }}>
        📦 Post a Food Donation
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
        <div>
          <label style={S.label}>FOOD TYPE *</label>
          <input style={S.input} placeholder="e.g. Hot meals, Produce, Bakery items"
            value={form.food_type} onChange={e => set("food_type", e.target.value)} />
        </div>
        <div>
          <label style={S.label}>QUANTITY *</label>
          <input style={S.input} placeholder="e.g. 30 portions, 10 kg"
            value={form.quantity} onChange={e => set("quantity", e.target.value)} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
        <div>
          <label style={S.label}>WEIGHT (KG) — for impact tracking</label>
          <input style={S.input} type="number" placeholder="0.0"
            value={form.weight_kg} onChange={e => set("weight_kg", e.target.value)} />
        </div>
        <div>
          <label style={S.label}>PRIORITY</label>
          <select style={{ ...S.input }}
            value={form.priority} onChange={e => set("priority", e.target.value)}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High ⚡</option>
            <option value="urgent">Urgent 🔥 (hot meals)</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label style={S.label}>PICKUP ADDRESS *</label>
        <input style={S.input} placeholder="e.g. 12 MG Road, Bengaluru"
          value={form.address} onChange={e => set("address", e.target.value)} />
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label style={S.label}>DESCRIPTION</label>
        <textarea style={{ ...S.input, minHeight: "72px", resize: "vertical" }}
          placeholder="Any relevant details — packaging, allergies, storage needs…"
          value={form.description} onChange={e => set("description", e.target.value)} />
      </div>

      {/* Food safety timestamps */}
      <div style={{
        background: "rgba(82,183,136,0.07)", border: "1px solid rgba(82,183,136,0.2)",
        borderRadius: "12px", padding: "14px", marginBottom: "20px",
      }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "#52B788", letterSpacing: "0.05em", marginBottom: "10px" }}>
          🕐 FOOD SAFETY PICKUP WINDOW
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={S.label}>PICKUP AVAILABLE FROM</label>
            <select style={S.input} value={form.pickup_start_offset} onChange={e => set("pickup_start_offset", e.target.value)}>
              <option value="0">Right now</option>
              <option value="15">In 15 minutes</option>
              <option value="30">In 30 minutes</option>
              <option value="60">In 1 hour</option>
            </select>
          </div>
          <div>
            <label style={S.label}>PICKUP WINDOW DURATION</label>
            <select style={S.input} value={form.pickup_window_hours} onChange={e => set("pickup_window_hours", e.target.value)}>
              <option value="0.5">30 minutes</option>
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="4">4 hours</option>
              <option value="8">8 hours</option>
            </select>
          </div>
        </div>
      </div>

      <button onClick={handleSubmit} disabled={submitting || !form.food_type || !form.quantity || !form.address}
        style={{ ...S.btn("primary"), width: "100%", padding: "14px", fontSize: "15px" }}>
        {submitting ? "⏳ Posting…" : "🚀 Broadcast to Marketplace"}
      </button>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────
function StatsBar({ tasks, delivered }) {
  const totalMeals = delivered.reduce((s, t) => s + (calcImpact(t.weight_kg)?.meals || 0), 0);
  const totalCo2   = delivered.reduce((s, t) => s + (parseFloat(calcImpact(t.weight_kg)?.co2) || 0), 0);
  const available  = tasks.filter(t => t.status === "available").length;

  return (
    <div style={{
      display: "flex", gap: "1px", background: "rgba(255,255,255,0.05)",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      overflowX: "auto",
    }}>
      {[
        { icon: "🍽", val: totalMeals, label: "Meals Rescued" },
        { icon: "🌿", val: `${totalCo2.toFixed(1)}kg`, label: "CO₂ Avoided" },
        { icon: "📦", val: available,  label: "Live Donations" },
        { icon: "✅", val: delivered.length, label: "Deliveries Done" },
      ].map(s => (
        <div key={s.label} style={{ flex: 1, padding: "14px 20px", textAlign: "center", minWidth: "120px" }}>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#52B788" }}>{s.icon} {s.val}</div>
          <div style={{ fontSize: "11px", color: "#666", marginTop: "2px", letterSpacing: "0.04em" }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────────
function HistoryTab({ delivered }) {
  if (delivered.length === 0) return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: "#555" }}>
      <div style={{ fontSize: "48px", marginBottom: "12px" }}>📋</div>
      <p style={{ fontSize: "16px" }}>No deliveries yet. Claim and complete a rescue to see history here!</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {delivered.map(t => {
        const imp = calcImpact(t.weight_kg);
        return (
          <div key={t.id} style={{
            background: "#1A1D27", borderRadius: "16px",
            border: "1px solid rgba(82,183,136,0.15)", padding: "18px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            animation: "fadeUp 0.25s ease",
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>
                {foodEmoji(t.food_type)} {t.food_type} — {t.quantity}
              </div>
              <div style={{ fontSize: "12px", color: "#777" }}>
                📍 {t.address} · Delivered {fmt(t.delivered_at)}
              </div>
            </div>
            {imp && (
              <div style={{ textAlign: "right", fontSize: "12px", color: "#52B788" }}>
                <div style={{ fontWeight: 700 }}>🍽 {imp.meals} meals</div>
                <div style={{ color: "#74C69D" }}>🌿 {imp.co2}kg CO₂</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Receiver Tab ─────────────────────────────────────────────
function ReceiverTab({ tasks }) {
  const assigned = tasks.filter(t => t.status === "in_transit" || t.status === "delivered");
  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "6px" }}>🏠 Registered Receivers</h2>
        <p style={{ color: "#777", fontSize: "14px" }}>These organizations receive rescued food donations.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px", marginBottom: "28px" }}>
        {RECEIVERS.map(r => (
          <div key={r.id} style={{
            background: "#1A1D27", borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.07)", padding: "18px",
          }}>
            <div style={{ fontSize: "20px", marginBottom: "6px" }}>🏛</div>
            <div style={{ fontWeight: 700, marginBottom: "4px" }}>{r.name}</div>
            <div style={{ fontSize: "13px", color: "#777" }}>📍 {r.address}</div>
            <div style={{
              marginTop: "10px", fontSize: "12px", fontWeight: 600,
              color: "#52B788", background: "rgba(82,183,136,0.1)",
              borderRadius: "8px", padding: "4px 10px", display: "inline-block",
            }}>
              ✅ Active
            </div>
          </div>
        ))}
      </div>

      {assigned.length > 0 && (
        <>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px", color: "#888" }}>INCOMING RESCUES</h3>
          {assigned.map(t => (
            <div key={t.id} style={{
              background: "#1A1D27", borderRadius: "14px",
              border: "1px solid rgba(82,183,136,0.2)", padding: "16px", marginBottom: "10px",
              display: "flex", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontWeight: 700 }}>{foodEmoji(t.food_type)} {t.food_type} — {t.quantity}</div>
                <div style={{ fontSize: "12px", color: "#777", marginTop: "4px" }}>From {t.donor_name}</div>
              </div>
              <span style={{
                fontSize: "12px", fontWeight: 700, padding: "4px 12px", borderRadius: "99px",
                background: t.status === "delivered" ? "rgba(82,183,136,0.15)" : "rgba(244,162,97,0.15)",
                color: t.status === "delivered" ? "#52B788" : "#F4A261",
                alignSelf: "center",
              }}>
                {t.status === "delivered" ? "✅ Delivered" : "🚗 On the way"}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const [role, setRole] = useState("volunteer");
  const [tab, setTab] = useState("marketplace");
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [activeTask, setActiveTask] = useState(null);
  const [delivered, setDelivered] = useState([]);
  const [claimingId, setClaimingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState("all");

  const currentUser = {
    volunteer: { id: "u1", name: "Priya Sharma", role: "volunteer" },
    donor:     { id: "u2", name: "Rajan Mehta",  role: "donor"     },
    receiver:  { id: "u3", name: "Asha Home",    role: "receiver"  },
  }[role];

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
  }, []);

  // Simulate new urgent task every 45s
  useEffect(() => {
    const iv = setInterval(() => {
      const newTask = {
        id: Date.now().toString(),
        food_type: "Sambar & Rice", quantity: "20 portions", weight_kg: 10,
        description: "Temple prasad — freshly prepared. Needs pickup ASAP.",
        priority: "urgent", status: "available", version: 1,
        donor_name: "Sri Ganesh Temple", address: "Malleswaram, Bengaluru",
        pickup_start: new Date().toISOString(),
        pickup_end: new Date(Date.now() + 30 * 60000).toISOString(),
        posted_at: new Date().toISOString(),
      };
      setTasks(prev => [newTask, ...prev]);
      showToast("🔥 New urgent rescue posted: Sambar & Rice!", "info");
    }, 45000);
    return () => clearInterval(iv);
  }, [showToast]);

  const handleClaim = useCallback(async (task) => {
    if (activeTask) { showToast("Complete your current rescue first!", "error"); return; }
    setClaimingId(task.id);
    setTasks(prev => prev.filter(t => t.id !== task.id)); // optimistic remove
    await new Promise(r => setTimeout(r, 700));

    // Simulate 5% concurrent claim failure
    if (Math.random() < 0.05) {
      setTasks(prev => [task, ...prev]); // rollback
      setClaimingId(null);
      showToast("Someone else just claimed it. Try another!", "error");
      return;
    }

    const claimed = { ...task, status: "claimed", claimed_at: new Date().toISOString() };
    setActiveTask(claimed);
    setClaimingId(null);
    showToast(`🎉 Claimed! Head to ${task.address}`, "success");
  }, [activeTask, showToast]);

  const handlePickup = useCallback(async (id) => {
    await new Promise(r => setTimeout(r, 400));
    setActiveTask(t => ({ ...t, status: "in_transit", picked_up_at: new Date().toISOString() }));
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: "in_transit" } : t));
    showToast("✅ Food picked up! Now deliver safely.", "success");
  }, [showToast]);

  const handleDeliver = useCallback(async (id) => {
    await new Promise(r => setTimeout(r, 400));
    const done = { ...activeTask, status: "delivered", delivered_at: new Date().toISOString() };
    setDelivered(prev => [done, ...prev]);
    setActiveTask(null);
    const imp = calcImpact(done.weight_kg);
    showToast(
      imp ? `🌱 Delivered! ~${imp.meals} meals saved, ${imp.co2}kg CO₂ avoided!` : "🌱 Delivery complete!",
      "success"
    );
  }, [activeTask, showToast]);

  const handlePost = useCallback((task) => {
    setTasks(prev => [task, ...prev]);
    showToast("🚀 Posted to the Marketplace! Volunteers notified.", "success");
  }, [showToast]);

  const allTasks = tasks.filter(t => t.status === "available");
  const filteredTasks = allTasks.filter(t => {
    if (filter === "urgent") return t.priority === "urgent" || t.priority === "high";
    if (filter === "soon") return (new Date(t.pickup_end) - Date.now()) < 60 * 60000;
    return true;
  });

  return (
    <div style={S.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: #555 !important; }
        select option { background: #1A1D27; color: #F0F0F0; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      {/* Nav */}
      <nav style={S.nav}>
        <div style={S.logo}>🌿 FoodRescue</div>

        {/* Role switcher */}
        <div style={{ display: "flex", gap: "6px", background: "rgba(255,255,255,0.04)", borderRadius: "99px", padding: "4px" }}>
          {["donor", "volunteer", "receiver"].map(r => (
            <button key={r} onClick={() => { setRole(r); setTab(r === "volunteer" ? "marketplace" : r === "donor" ? "post" : "receivers"); }}
              style={{ ...S.tab(role === r), padding: "6px 14px", borderRadius: "99px" }}>
              {{ donor: "🧑‍🍳 Donor", volunteer: "🚴 Volunteer", receiver: "🏠 Receiver" }[r]}
            </button>
          ))}
        </div>

        <div style={{ fontSize: "13px", color: "#666" }}>Hi, {currentUser.name} 👋</div>
      </nav>

      {/* Stats bar */}
      <StatsBar tasks={tasks} delivered={delivered} />

      {/* Tabs */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 24px",
        display: "flex", gap: "4px", overflowX: "auto",
      }}>
        {(role === "volunteer"
          ? [["marketplace", "🛒 Marketplace"], ["history", "📋 My Deliveries"]]
          : role === "donor"
          ? [["post", "📦 Post Donation"], ["history", "📋 My Posts"]]
          : [["receivers", "🏠 Receivers"], ["history", "📋 History"]]
        ).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              padding: "14px 18px", background: "none", border: "none",
              fontFamily: "inherit", fontSize: "14px", fontWeight: 600, cursor: "pointer",
              color: tab === key ? "#52B788" : "#666",
              borderBottom: tab === key ? "2px solid #52B788" : "2px solid transparent",
              transition: "all 0.15s", whiteSpace: "nowrap",
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={S.section}>

        {/* ── VOLUNTEER: Marketplace ── */}
        {role === "volunteer" && tab === "marketplace" && (
          <>
            {activeTask && (
              <ActiveBanner task={activeTask} onPickup={handlePickup} onDeliver={handleDeliver} loading={false} />
            )}

            {/* Filter bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em" }}>Food Marketplace</h2>
                <p style={{ fontSize: "13px", color: "#666", marginTop: "2px" }}>
                  {filteredTasks.length} rescue{filteredTasks.length !== 1 ? "s" : ""} available
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {[["all", "All"], ["urgent", "🔥 Priority"], ["soon", "⏰ Expiring"]].map(([k, l]) => (
                  <button key={k} onClick={() => setFilter(k)}
                    style={{
                      padding: "7px 14px", border: "none", borderRadius: "99px",
                      cursor: "pointer", fontFamily: "inherit", fontSize: "12px", fontWeight: 700,
                      background: filter === k ? "rgba(82,183,136,0.18)" : "rgba(255,255,255,0.04)",
                      color: filter === k ? "#52B788" : "#777",
                      transition: "all 0.15s",
                    }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 20px", color: "#555" }}>
                <div style={{ fontSize: "52px", marginBottom: "12px" }}>🌱</div>
                <p style={{ fontSize: "16px", fontWeight: 600, color: "#777" }}>No rescues available right now</p>
                <p style={{ fontSize: "13px", marginTop: "6px" }}>Donors post throughout the day — check back soon.</p>
              </div>
            ) : (
              <div style={S.grid}>
                {filteredTasks.map(t => (
                  <TaskCard key={t.id} task={t} onClaim={handleClaim} claimingId={claimingId} activeTask={activeTask} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── DONOR: Post ── */}
        {role === "donor" && tab === "post" && (
          <DonorForm onPost={handlePost} currentUser={currentUser} />
        )}

        {/* ── RECEIVER tab ── */}
        {role === "receiver" && tab === "receivers" && (
          <ReceiverTab tasks={tasks} />
        )}

        {/* ── HISTORY (all roles) ── */}
        {tab === "history" && (
          <>
            <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "20px", letterSpacing: "-0.02em" }}>
              {role === "volunteer" ? "📋 My Deliveries" : role === "donor" ? "📋 My Posts" : "📋 Rescue History"}
            </h2>
            <HistoryTab delivered={role === "donor" ? tasks.filter(t => t.donor_name === currentUser.name) : delivered} />
          </>
        )}
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
