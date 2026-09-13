"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type Alert = {
  alertId: string;
  type: "medication" | "meal" | "exercise" | "check";
  title: string;
  message: string;
  at: string;
  status: "scheduled" | "sent" | "dismissed";
};

type Target = {
  id: string;
  profile?: { name?: string; note?: string };
};

type CheckOutput = {
  targetId: string;
  checkedAt: string;
  summary: string;
  level: "ok" | "caution" | "warning";
  items: Array<{
    category: "medication" | "meal" | "exercise" | "condition";
    message: string;
    action: string | null;
  }>;
  raw: string | null;
};

const SECTION_BG = "#f7f8fc";
const CARD_BORDER = "#e2e5ee";
const CARD_SHADOW = "0 1px 2px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.04)";
const BASE_GAP = 16;

export default function CaregiverPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [selected, setSelected] = useState<Target | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckOutput | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    fetch("/api/targets")
      .then((res) => res.json())
      .then(setTargets)
      .catch(() => setTargets([]));
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetch(`/api/targets/${selected.id}/alerts`)
      .then((res) => res.json())
      .then((data) => setAlerts(data?.alerts ?? []))
      .catch(() => setAlerts([]));
  }, [selected]);

  const runCheck = async () => {
    if (!selected) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/targets/${selected.id}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: selected.id }),
      });
      const data = await res.json();
      setCheckResult(data);
    } catch {
      setCheckResult({
        targetId: selected.id,
        checkedAt: new Date().toISOString(),
        summary: "체크 응답을 받지 못했습니다.",
        level: "caution",
        items: [],
        raw: null,
      });
    } finally {
      setChecking(false);
    }
  };

  const levelColor = (level: string) => {
    if (level === "warning") return "#d32f2f";
    if (level === "caution") return "#f57f17";
    return "#2e7d32";
  };

  const cardStyle: CSSProperties = {
    background: SECTION_BG,
    border: `1px solid ${CARD_BORDER}`,
    borderRadius: 12,
    boxShadow: CARD_SHADOW,
    padding: BASE_GAP,
  };

  const buttonStyle: CSSProperties = {
    padding: "9px 16px",
    background: "#33496f",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: checking ? "not-allowed" : "pointer",
    opacity: checking ? 0.7 : 1,
  };

  return (
    <div
      style={{
        padding: 28,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        maxWidth: 820,
        margin: "0 auto",
        color: "#1f2330",
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 650, margin: "0 0 8px" }}>보호자 뷰</h1>
        <p style={{ fontSize: 15, color: "#5b6478", margin: 0 }}>
          대상자 상태를 확인하고, 체크 결과를 보는 최소 뷰입니다.
        </p>
      </header>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 12 }}>대상자 선택</h2>
        {targets.length > 0 && (
          <ul style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6, padding: 0, listStyle: "none" }}>
            {targets.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => { setSelected(t); setCheckResult(null); setAlerts([]); }}
                  style={{
                    padding: "9px 14px",
                    background: selected?.id === t.id ? "#e7ecf7" : "#fff",
                    border: `1px solid ${selected?.id === t.id ? "#3b5b8a" : "#c7cdd9"}`,
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: selected?.id === t.id ? 600 : 400,
                    color: selected?.id === t.id ? "#1f2330" : "#33415a",
                    cursor: "pointer",
                  }}
                >
                  {t.profile?.name ?? t.id}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selected && (
        <section style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0, color: "#2f3b4f" }}>
                대상자: {selected.profile?.name ?? selected.id}
              </h2>
            </div>

            <button type="button" onClick={runCheck} disabled={checking} style={{ ...buttonStyle, marginTop: 12 }}>
              {checking ? "체크 중..." : "상태 체크하기"}
            </button>

            {checkResult && (
              <div style={{ marginTop: 16, background: "#f7f8fc", border: `1px solid ${CARD_BORDER}`, borderRadius: 12, padding: BASE_GAP, boxShadow: CARD_SHADOW }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span
                    style={{
                      background: levelColor(checkResult.level),
                      color: "#fff",
                      padding: "4px 10px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: 0.5,
                    }}
                  >
                    {checkResult.level.toUpperCase()}
                  </span>
                </div>

                <div style={{ fontSize: 14, color: "#3a4658", lineHeight: 1.6, marginBottom: 8 }}>
                  {checkResult.summary.split(/(?<=[.。!?])/).map((seg, i) => (
                    <p key={i} style={{ margin: "0 0 8px" }}>
                      {seg.trim() || seg}
                    </p>
                  ))}
                </div>

                <ul style={{ padding: 0, margin: 0, listStyle: "disc", paddingLeft: 20 }}>
                  {checkResult.items.map((item, i) => (
                    <li key={i} style={{ marginBottom: 6, fontSize: 14 }}>
                      <strong style={{ color: "#2f3b4f" }}>{item.category}</strong>
                      {" "}
                      {item.message}
                      {item.action ? ` → ${item.action}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {alerts.length > 0 && (
              <div style={{ marginTop: 12, background: "#f7f8fc", border: `1px solid ${CARD_BORDER}`, borderRadius: 12, padding: BASE_GAP, boxShadow: CARD_SHADOW }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 10px", color: "#2f3b4f" }}>알림</h3>
                <ul style={{ padding: 0, margin: 0, listStyle: "disc", paddingLeft: 18 }}>
                  {alerts.map((a) => (
                    <li
                      key={a.alertId}
                      style={{
                        marginBottom: 8,
                        padding: "8px 10px",
                        background: "#fff",
                        border: "1px solid #e6e9f1",
                        borderRadius: 8,
                        fontSize: 13.5,
                      }}
                    >
                      <strong style={{ color: "#2f3b4f" }}>{a.title}</strong>
                      <span style={{ color: "#3a4658" }}> {a.message}</span>
                      <div style={{ fontSize: 11, color: "#9aa2b2", marginTop: 4 }}>
                        {new Date(a.at).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
