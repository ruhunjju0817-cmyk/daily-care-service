export interface DurTabooItem {
  TYPE_NAME?: string;
  ITEM_NAME?: string;
  MIXTURE_ITEM_NAME?: string;
  INGR_KOR_NAME?: string;
  MIXTURE_INGR_KOR_NAME?: string;
  PROHBT_CONTENT?: string;
}

export interface DurApiResponse {
  header?: { resultCode?: string };
  body?: {
    items?: DurTabooItem[];
  };
}

export async function fetchDurTaboo(options: {
  apiKey: string;
  endpoint: string;
  numOfRows?: number;
  pageNo?: number;
  itemName?: string;
  ingrCode?: string;
}): Promise<DurTabooItem[]> {
  const params = new URLSearchParams();
  params.set("serviceKey", options.apiKey);
  params.set("type", "json");
  if (options.numOfRows) params.set("numOfRows", String(options.numOfRows));
  if (options.pageNo) params.set("pageNo", String(options.pageNo));
  if (options.itemName) params.set("itemName", options.itemName);
  if (options.ingrCode) params.set("ingrCode", options.ingrCode);

  const url = `${options.endpoint}/getUsjntTabooInfoList03?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`DUR API 호출 실패: ${response.status}`);
  }

  const parsed = (await response.json()) as DurApiResponse; // ← 수정: data가 아니라 파싱 결과를 바로 캐스팅

  if (parsed.header?.resultCode !== "00") {
    throw new Error(`DUR API 결과 오류: ${parsed.header?.resultCode}`);
  }

  return parsed.body?.items ?? [];
}
