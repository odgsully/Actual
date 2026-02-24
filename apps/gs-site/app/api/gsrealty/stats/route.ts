import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      totalContactsRes,
      contactsThisMonthRes,
      activeDealsRes,
      revenueRes,
      callsThisMonthRes,
      allDealsRes,
    ] = await Promise.all([
      supabase
        .from("gsrealty_clients")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("gsrealty_clients")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth),
      supabase
        .from("gsrealty_deals")
        .select("*", { count: "exact", head: true })
        .neq("stage", "closed"),
      supabase
        .from("gsrealty_deals")
        .select("expected_commission")
        .neq("stage", "closed"),
      supabase
        .from("gsrealty_outreach")
        .select("*", { count: "exact", head: true })
        .eq("type", "call")
        .gte("created_at", startOfMonth),
      supabase.from("gsrealty_deals").select("stage"),
    ]);

    const errors = [
      totalContactsRes.error,
      contactsThisMonthRes.error,
      activeDealsRes.error,
      revenueRes.error,
      callsThisMonthRes.error,
      allDealsRes.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      console.error("[GSRealty Stats] Query errors:", errors);
      return NextResponse.json(
        { error: "Failed to fetch CRM stats", details: errors[0]?.message },
        { status: 500 }
      );
    }

    const pipelineRevenue =
      revenueRes.data?.reduce(
        (sum, d) => sum + (Number(d.expected_commission) || 0),
        0
      ) ?? 0;

    const totalDeals = allDealsRes.data?.length ?? 0;
    const closedDeals =
      allDealsRes.data?.filter((d) => d.stage === "closed").length ?? 0;
    const conversionRate =
      totalDeals > 0 ? Math.round((closedDeals / totalDeals) * 1000) / 10 : 0;

    return NextResponse.json({
      totalContacts: totalContactsRes.count ?? 0,
      contactsThisMonth: contactsThisMonthRes.count ?? 0,
      activeDeals: activeDealsRes.count ?? 0,
      pipelineRevenue,
      callsThisMonth: callsThisMonthRes.count ?? 0,
      conversionRate,
    });
  } catch (error) {
    console.error("[GSRealty Stats] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
