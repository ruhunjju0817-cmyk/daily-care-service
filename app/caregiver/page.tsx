"use client";

import { useEffect, useState } from "react";

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

export default function CaregiverPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [selected, setSelected] = useState<Target | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckOutput | null>(null);

  useEffect(() => {
    fetch("/api/targets")
      .then((res) => res.json())
      .then(setTargets)
      .catch(() => setTargets([]));
  }, []);

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

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 720, margin: "0 auto" }}>
      <h1>보호자 뷰</h1>
      <p>대상자 상태를 확인하고, 체크 결과를 보는 최소 뷰입니다.</p>

      <section>
        <h2>대상자 선택</h2>
        {targets.length > 0 && (
          <ul style={{ marginTop: 12 }}>
            {targets.map((t) => (
              <li key={t.id}>
                <button onClick={() => { setSelected(t); setCheckResult(null); }}>
                  {t.profile?.name ?? t.id}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selected && (
        <section style={{ marginTop: 24, border: "1px solid #e5e7eb", padding: 16 }}>
          <h2>대상자: {selected.profile?.name ?? selected.id}</h2>
          <button
            type="button"
            onClick={runCheck}
            disabled={checking}
            style={{ marginTop: 12, padding: "8px 16px", cursor: checking ? "not-allowed" : "auto" }}
          >
            {checking ? "체크 중..." : "상태 체크하기"}
          </button>

          {checkResult && (
            <section style={{ marginTop: 16 }}>
              <h3 style={{ color: levelColor(checkResult.level) }}>
                {checkResult.level.toUpperCase()}
              </h3>
              <p>{checkResult.summary}</p>
              <ul>
                {checkResult.items.map((item, i) => (
                  <li key={i}>
                    <strong>{item.category}</strong>: {item.message}
                    {item.action ? ` → ${item.action}` : ""}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>
      )}
    </div>
  );
}
