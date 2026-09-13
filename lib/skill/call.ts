import { CheckInput, CheckOutput } from "@/lib/types/check";

export async function callDailyCareManager(input: CheckInput): Promise<CheckOutput> {
  const raw = await callSkill(input);
  return parseSkillOutput(input, raw);
}

async function callSkill(input: CheckInput): Promise<string> {
  const system = `당신은 대상자별 복약·식사·운동·컨디션을 관리하는 assistant입니다.
현재 상태를 기준으로 충돌/주의/안내를 판단하되, 단정적인 결론을 피하고
애매한 경우 확인 권고 중심으로 답변하세요.
의학적 판단을 대신하지 않습니다.`;

  const user = `아래 대상자 상태 기준입니다.

복약:
${input.medications.map((m) => `${m.name}/${m.time}/${m.beforeAfter}/${m.status}`).join("\n")}

식사:
${input.meals.map((m) => `${m.time}/${m.mealType}/${m.status}`).join("\n")}

운동:
${input.exercises.map((e) => `${e.time}/${e.type}/${e.intensity}/${e.status}`).join("\n")}

컨디션:
${input.conditions.map((c) => `${c.at}/${c.state}/${c.note ?? ""}`).join("\n")}

위 상태를 기준으로 충돌/주의/안내를 요약해 주세요.
출력은 아래 형식으로 주세요.

요약: {한 줄 요약}
수준: ok|caution|warning
항목:
- [category] 메시지 (행동: ...)`;

  return solarProCall({ system, user });
}

async function solarProCall(payload: { system: string; user: string }): Promise<string> {
  const apiKey = process.env.SOLAR_PRO_API_KEY;
  const model = process.env.SOLAR_PRO_MODEL ?? "solar-pro4";
  const endpoint = process.env.SOLAR_PRO_CHAT_ENDPOINT ?? "https://api.upstage.ai/v1/chat/completions";

  if (!apiKey) {
    throw new Error("SOLAR_PRO_API_KEY가 없습니다.");
  }

  const body = {
    model,
    messages: [
      { role: "system", content: payload.system },
      { role: "user", content: payload.user },
    ],
    temperature: 0.2,
    max_tokens: 1024,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`solarProCall failed: ${response.status}`);
  }

  const data = await response.json();
  return extractContent(data);
}

function extractContent(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const obj = data as Record<string, unknown>;
  const choices = obj.choices;
  if (!Array.isArray(choices) || choices.length === 0) return JSON.stringify(data);
  const first = choices[0] as Record<string, unknown>;
  const message = first.message;
  if (!message || typeof message !== "object") return JSON.stringify(data);
  const content = (message as Record<string, unknown>).content;
  return typeof content === "string" ? content : JSON.stringify(data);
}

function parseSkillOutput(input: CheckInput, raw: string): CheckOutput {
  const summary = raw ?? "현재 상태를 확인했습니다.";
  const level = inferLevel(raw);
  const items = extractItems(raw);

  return {
    targetId: input.targetId,
    checkedAt: input.checkedAt,
    summary,
    level,
    items,
    raw,
  };
}

function inferLevel(raw: string): "ok" | "caution" | "warning" {
  const lower = raw.toLowerCase();
  if (lower.includes("warning") || lower.includes("위험") || lower.includes("주의") && lower.includes("높음")) {
    return "warning";
  }
  if (lower.includes("caution") || lower.includes("주의")) {
    return "caution";
  }
  return "ok";
}

function extractItems(raw: string): CheckOutput["items"] {
  const lines = raw.split("\n");
  const items: CheckOutput["items"] = [];

  for (const line of lines) {
    const m = line.match(/^- \[([^\]]+)\]\s*(.*)$/);
    if (m) {
      const category = m[1].trim();
      const rest = m[2].trim();
      const actionMatch = rest.match(/(?:행동|action)[:：]\s*(.*)$/);
      items.push({
        category: category as CheckOutput["items"][number]["category"],
        message: rest.replace(actionMatch?.[0] ?? "", "").trim(),
        action: actionMatch ? actionMatch[1].trim() : null,
      });
    }
  }

  if (items.length === 0) {
    items.push({
      category: "condition",
      message: raw || "현재 상태를 확인했습니다.",
      action: "필요 시 복약/식사/운동/컨디션을 다시 확인해 주세요.",
    });
  }

  return items;
}
