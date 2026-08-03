import { BetaAnalyticsDataClient } from "@google-analytics/data";

export type GaOverview = {
  todayUsers: number;
  todayPageviews: number;
  weekUsers: number;
  weekPageviews: number;
};

export type GaConfigState = { configured: true } | { configured: false };

export function getGaConfig(): GaConfigState {
  const propertyId = process.env.GA_PROPERTY_ID;
  const serviceAccountB64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64;
  if (!propertyId || !serviceAccountB64) return { configured: false };
  try {
    const credentials = JSON.parse(
      Buffer.from(serviceAccountB64, "base64").toString("utf8"),
    ) as { project_id?: string };
    if (!credentials.project_id) return { configured: false };
  } catch {
    return { configured: false };
  }
  return { configured: true };
}

function createGaClient() {
  const config = getGaConfig();
  if (!config.configured) {
    throw new Error("Google Analytics غير مهيّأ في المتغيرات");
  }
  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_B64 as string, "base64").toString(
      "utf8",
    ),
  ) as Record<string, unknown>;
  return new BetaAnalyticsDataClient({
    credentials,
    projectId: credentials.project_id as string,
  });
}

function toNumber(value: string | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getGaOverview(): Promise<GaOverview> {
  const client = createGaClient();
  const property = `properties/${process.env.GA_PROPERTY_ID as string}`;

  const [todayResponse, weekResponse] = await Promise.all([
    client.runReport({
      property,
      dateRanges: [{ startDate: "today", endDate: "today" }],
      metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
    }),
    client.runReport({
      property,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
    }),
  ]);

  const todayRow = todayResponse[0].rows?.[0];
  const weekRow = weekResponse[0].rows?.[0];

  return {
    todayUsers: toNumber(todayRow?.metricValues?.[0]?.value),
    todayPageviews: toNumber(todayRow?.metricValues?.[1]?.value),
    weekUsers: toNumber(weekRow?.metricValues?.[0]?.value),
    weekPageviews: toNumber(weekRow?.metricValues?.[1]?.value),
  };
}
