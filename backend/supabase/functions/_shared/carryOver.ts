import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"; 

export async function carryOverCategories(
    db: SupabaseClient,
    userId: string,
    added: any[]
) {
    const posted = added.filter((t) => t.pending_transaction_id);
    if (posted.length === 0) return;

    const { data: pendingRows, error } = await db
        .from("transactions")
        .select("external_id, category_id")
        .eq("user_id", userId)
        .in("external_id", posted.map((t) => t.pending_transaction_id))
        .not("category_id", "is", null);

    if(error) {
        console.error("carry-over lookup failed:", error.message);
        return;
    }

    const categoryByPendingId = Object.fromEntries(
        pendingRows.map((r) => [r.external_id, r.category_id]),
    );

    for (const t of posted) {
        const categoryId = categoryByPendingId[t.pending_transaction_id];
        if (!categoryId) continue;

        const { error } = await db
            .from("transactions")
            .update({ suggested_category_id: categoryId })
            .eq("external_id", t.transaction_id)
            .is("category_id", null);

        if (error) console.error("carry-over update failed:", error.message);
    }
}