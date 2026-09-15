import { fetchDurTaboo, DurTabooItem } from "./api";

export interface DurRefResult {
  hasRef: boolean;
  items: Array<{
    category: "medication" | "warning";
    message: string;
    source?: string;
  }>;
}

export async function buildDurReference(medicationNames: string[]): Promise<DurRefResult> {
  const items: DurRefResult["items"] = [];
  let hasRef = false;

  for (const name of medicationNames) {
    if (!name || name.trim().length === 0) continue;

    try {
      const tabooItems = await fetchDurTaboo({
        apiKey: process.env.DUR_API_KEY ?? "",
        endpoint: process.env.DUR_API_ENDPOINT ?? "https://apis.data.go.kr/1471000/DURPrdlstInfoService03",
        numOfRows: 100,
        pageNo: 1,
        itemName: name.trim(),
      });

      for (const item of tabooItems) {
        const itemName = item.ITEM_NAME?.trim() || name;
        const mixtureName = item.MIXTURE_ITEM_NAME?.trim();
        const content = item.PROHBT_CONTENT?.trim();
        const typeName = item.TYPE_NAME?.trim() || "병용금기";

        if (!mixtureName || !content) continue;

        hasRef = true;
        items.push({
          category: "warning",
          message: `${itemName}은(는) ${mixtureName}와(과) 함께 사용 시 ${typeName} 관련 주의가 필요할 수 있어요. ${content} (출처: 식약처 DUR 품목정보)`,
          source: "식약처 DUR 품목정보",
        });
      }
    } catch {
      items.push({
        category: "warning",
        message: "의약품 병용/주의 정보는 확인되지 않았어요. 복약과 다른 약/일정 조합이 걱정되면 약사나 의료진과 확인해보세요.",
        source: "기본 안내",
      });
    }
  }

  return { hasRef, items };
}
