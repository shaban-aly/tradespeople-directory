"use server";

import { getCraftsmanReviews, getCraftsmanRatingSummary } from "@/lib/db/reviews";
import { getUserReviewForCraftsman } from "@/lib/db/reviews-queries";

export async function fetchCraftsmanReviewsAction(craftsmanId: string, limit?: number) {
  return getCraftsmanReviews(craftsmanId, limit);
}

export async function fetchCraftsmanRatingSummaryAction(craftsmanId: string) {
  return getCraftsmanRatingSummary(craftsmanId);
}

export async function fetchUserReviewAction(userId: string, craftsmanId: string) {
  return getUserReviewForCraftsman(userId, craftsmanId);
}
