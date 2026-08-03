"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabase } from "@/lib/db/client";
import {
  copyImageToCraftsman,
  deleteImageByUrl,
  uploadCraftsmanImage,
} from "@/lib/storage/images";
import {
  anyError,
  firstError,
  validateCategoryFields,
  validateCraftsmanFields,
  validateName,
  validateSocialLinks,
} from "@/lib/utils/validation";

export const CATEGORY_ICON_OPTIONS = [
  "plumbing",
  "electrical",
  "carpentry",
  "hvac",
  "painting",
  "tiling",
  "aluminum",
  "metalwork",
  "masonry",
  "marble",
  "glass",
  "welding",
  "locksmith",
  "mechanic",
  "appliances",
  "upholstery",
  "cleaning",
  "pest",
  "moving",
  "elevator",
  "satellite",
  "security",
  "roofing",
  "garden",
  "parquet",
  "kitchen",
  "bathroom",
  "handyman",
] as const;

type CategoryJoin = {
  slug: string;
  name: string;
};

type AreaJoin = {
  name: string;
};

export type JoinRequestRow = {
  id: string;
  type: "register" | "report";
  name: string | null;
  category_id: string | null;
  area_id: string | null;
  phone: string | null;
  whatsapp: string | null;
  description: string | null;
  image_url: string | null;
  craftsman_name: string | null;
  report_message: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  category: CategoryJoin | null;
  area: AreaJoin | null;
  socialLinks?: SocialLinkRow[];
};

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
};

export type AreaRow = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type CraftsmanStats = {
  views: number;
  calls: number;
  whatsapp: number;
};

export type SocialLinkRow = {
  platform: "facebook" | "instagram" | "tiktok" | "other";
  url: string;
};

export type CraftsmanRow = {
  id: string;
  slug: string;
  name: string;
  category_id: string;
  area_id: string;
  phone: string;
  whatsapp: string | null;
  description: string | null;
  image_url: string | null;
  verified: boolean;
  is_published: boolean;
  added_at: string;
  created_at: string;
  category: CategoryJoin | null;
  area: AreaJoin | null;
  stats: CraftsmanStats | null;
  socialLinks?: SocialLinkRow[];
};

export type ContactMessageRow = {
  id: string;
  name: string;
  phone: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type CraftsmanInput = {
  slug: string;
  name: string;
  category_id: string;
  area_id: string;
  phone: string;
  whatsapp: string | null;
  description: string | null;
  verified: boolean;
  is_published: boolean;
  image?: File | null;
  existingImageUrl?: string | null;
  socialLinks?: SocialLinkRow[];
};

// أي البيانات تُحمَّل لكل صفحة — كل صفحة تجيب بياناتها فقط.
export type AdminScope = {
  requests?: boolean;
  categories?: boolean;
  areas?: boolean;
  craftsmen?: boolean;
  messages?: boolean;
  counts?: boolean;
};

type CountRow = {
  category: { slug: string } | null;
  area: { name: string } | null;
};

const REQUESTS_SELECT =
  "id, type, name, category_id, area_id, phone, whatsapp, description, image_url, craftsman_name, report_message, status, created_at, category:categories(slug, name), area:areas(name), social_links";

const CRAFTSMEN_ADMIN_SELECT =
  "id, slug, name, category_id, area_id, phone, whatsapp, description, image_url, verified, is_published, added_at, created_at, category:categories(slug, name), area:areas(name), stats:craftsman_stats(views, calls, whatsapp), social_links:social_links(platform, url)";

const COUNTS_SELECT = "id, category:categories(slug), area:areas(name)";

async function revalidateSearchCache() {
  try {
    await fetch("/api/revalidate?tag=search", { method: "POST" });
  } catch {
    // فشل إبطال الكاش لا يمنع استكمال العملية
  }
}

async function saveSocialLinks(
  craftsmanId: string,
  links: SocialLinkRow[],
): Promise<void> {
  if (links.length === 0) return;
  const { error } = await createSupabase().from("social_links").insert(
    links.map((link) => ({
      craftsman_id: craftsmanId,
      platform: link.platform,
      url: link.url.trim(),
    })),
  );
  if (error) throw new Error("مقدرناش نحفظ روابط السوشيال");
}

export function useAdminDashboard(scope: AdminScope) {
  const loadRequests = scope.requests === true;
  const loadCategories = scope.categories === true;
  const loadAreas = scope.areas === true;
  const loadCraftsmen = scope.craftsmen === true;
  const loadMessages = scope.messages === true;
  const loadCounts = scope.counts === true;

  const [requests, setRequests] = useState<JoinRequestRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [craftsmen, setCraftsmen] = useState<CraftsmanRow[]>([]);
  const [messages, setMessages] = useState<ContactMessageRow[]>([]);
  const [counts, setCounts] = useState<CountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createSupabase();

    const [
      requestsRes,
      categoriesRes,
      areasRes,
      craftsmenRes,
      messagesRes,
      countsRes,
    ] = await Promise.all([
      loadRequests
        ? supabase
            .from("join_requests")
            .select(REQUESTS_SELECT)
            .order("created_at", { ascending: false })
        : null,
      loadCategories
        ? supabase
            .from("categories")
            .select("id, slug, name, icon, sort_order, is_active")
            .order("sort_order")
        : null,
      loadAreas
        ? supabase
            .from("areas")
            .select("id, name, sort_order, is_active")
            .order("sort_order")
        : null,
      loadCraftsmen
        ? supabase
            .from("craftsmen")
            .select(CRAFTSMEN_ADMIN_SELECT)
            .order("created_at", { ascending: false })
        : null,
      loadMessages
        ? supabase
            .from("contact_messages")
            .select("id, name, phone, message, is_read, created_at")
            .order("created_at", { ascending: false })
        : null,
      loadCounts
        ? supabase.from("craftsmen").select(COUNTS_SELECT)
        : null,
    ]);

    const firstError = [
      ["join_requests", requestsRes],
      ["categories", categoriesRes],
      ["areas", areasRes],
      ["craftsmen", craftsmenRes],
      ["contact_messages", messagesRes],
      ["counts", countsRes],
    ].find((entry) => entry[1] && entry[1].error);

    if (firstError) {
      console.error(
        `[admin] فشل تحميل ${firstError[0]}:`,
        JSON.stringify((firstError[1] as { error: unknown }).error),
      );
      setError("مقدرناش نحمّل بيانات لوحة التحكم");
      setLoading(false);
      return;
    }

    if (requestsRes) {
      setRequests(
        ((requestsRes.data ?? []) as Array<
          JoinRequestRow & { social_links?: SocialLinkRow[] }
        >).map((row) => ({
          ...row,
          socialLinks: Array.isArray(row.social_links) ? row.social_links : undefined,
        })),
      );
    }
    if (categoriesRes) setCategories((categoriesRes.data ?? []) as CategoryRow[]);
    if (areasRes) setAreas((areasRes.data ?? []) as AreaRow[]);
    if (craftsmenRes) setCraftsmen((craftsmenRes.data ?? []) as CraftsmanRow[]);
    if (messagesRes) setMessages((messagesRes.data ?? []) as ContactMessageRow[]);
    if (countsRes) setCounts((countsRes.data ?? []) as CountRow[]);
    setLoading(false);
  }, [
    loadRequests,
    loadCategories,
    loadAreas,
    loadCraftsmen,
    loadMessages,
    loadCounts,
  ]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(loadTimer);
  }, [loadData]);

  const categoryCounts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const row of counts) {
      const key = row.category?.slug ?? "unknown";
      result[key] = (result[key] ?? 0) + 1;
    }
    return result;
  }, [counts]);

  const areaCounts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const row of counts) {
      const key = row.area?.name ?? "unknown";
      result[key] = (result[key] ?? 0) + 1;
    }
    return result;
  }, [counts]);

  async function withAction(
    key: string,
    action: () => Promise<void>,
  ): Promise<boolean> {
    setBusyKey(key);
    setError("");
    try {
      await action();
      await loadData();
      void revalidateSearchCache();
      return true;
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "حصلت مشكلة في العملية",
      );
      return false;
    } finally {
      setBusyKey("");
    }
  }

  async function addCategory(payload: {
    slug: string;
    name: string;
    icon: (typeof CATEGORY_ICON_OPTIONS)[number];
  }) {
    return withAction("add-category", async () => {
      const errors = validateCategoryFields({ name: payload.name, slug: payload.slug });
      if (anyError(errors)) {
        throw new Error(firstError(errors) ?? "بيانات التخصص غير صحيحة");
      }
      const sortOrder = (categories.at(-1)?.sort_order ?? 0) + 1;
      const { error } = await createSupabase().from("categories").insert({
        slug: payload.slug,
        name: payload.name,
        icon: payload.icon,
        sort_order: sortOrder,
      });
      if (error) throw new Error("مقدرناش نضيف التخصص");
    });
  }

  async function updateCategory(
    id: string,
    payload: {
      slug: string;
      name: string;
      icon: (typeof CATEGORY_ICON_OPTIONS)[number];
    },
  ) {
    return withAction(`update-category-${id}`, async () => {
      const errors = validateCategoryFields({ name: payload.name, slug: payload.slug });
      if (anyError(errors)) {
        throw new Error(firstError(errors) ?? "بيانات التخصص غير صحيحة");
      }
      const { error } = await createSupabase()
        .from("categories")
        .update({
          slug: payload.slug,
          name: payload.name,
          icon: payload.icon,
        })
        .eq("id", id);
      if (error) throw new Error("مقدرناش نحدّث التخصص");
    });
  }

  async function deleteCategory(id: string) {
    return withAction(`delete-category-${id}`, async () => {
      const { error } = await createSupabase()
        .from("categories")
        .delete()
        .eq("id", id);
      if (error) throw new Error("مقدرناش نحذف التخصص — ممكن عليه صنايعية");
    });
  }

  async function toggleCategoryActive(category: CategoryRow) {
    return withAction(`category-${category.id}`, async () => {
      const { error } = await createSupabase()
        .from("categories")
        .update({ is_active: !category.is_active })
        .eq("id", category.id);
      if (error) throw new Error("مقدرناش نحدّث حالة التخصص");
    });
  }

  async function addArea(name: string) {
    return withAction("add-area", async () => {
      const errorMessage = validateName(name);
      if (errorMessage) throw new Error(errorMessage);
      const sortOrder = (areas.at(-1)?.sort_order ?? 0) + 1;
      const { error } = await createSupabase().from("areas").insert({
        name,
        sort_order: sortOrder,
      });
      if (error) throw new Error("مقدرناش نضيف المنطقة");
    });
  }

  async function updateArea(id: string, name: string) {
    return withAction(`update-area-${id}`, async () => {
      const errorMessage = validateName(name);
      if (errorMessage) throw new Error(errorMessage);
      const { error } = await createSupabase()
        .from("areas")
        .update({ name })
        .eq("id", id);
      if (error) throw new Error("مقدرناش نحدّث المنطقة");
    });
  }

  async function deleteArea(id: string) {
    return withAction(`delete-area-${id}`, async () => {
      const { error } = await createSupabase().from("areas").delete().eq("id", id);
      if (error) throw new Error("مقدرناش نحذف المنطقة — ممكن عليها صنايعية");
    });
  }

  async function toggleAreaActive(area: AreaRow) {
    return withAction(`area-${area.id}`, async () => {
      const { error } = await createSupabase()
        .from("areas")
        .update({ is_active: !area.is_active })
        .eq("id", area.id);
      if (error) throw new Error("مقدرناش نحدّث حالة المنطقة");
    });
  }

  async function toggleCraftsmanVerified(craftsman: CraftsmanRow) {
    return withAction(`craftsman-verified-${craftsman.id}`, async () => {
      const { error } = await createSupabase()
        .from("craftsmen")
        .update({ verified: !craftsman.verified })
        .eq("id", craftsman.id);
      if (error) throw new Error("مقدرناش نحدّث التوثيق");
    });
  }

  async function toggleCraftsmanPublished(craftsman: CraftsmanRow) {
    return withAction(`craftsman-published-${craftsman.id}`, async () => {
      const { error } = await createSupabase()
        .from("craftsmen")
        .update({ is_published: !craftsman.is_published })
        .eq("id", craftsman.id);
      if (error) throw new Error("مقدرناش نحدّث حالة النشر");
    });
  }

  async function createCraftsman(payload: CraftsmanInput) {
    return withAction("create-craftsman", async () => {
      const errors = validateCraftsmanFields({
        name: payload.name,
        slug: payload.slug,
        categoryId: payload.category_id,
        areaId: payload.area_id,
        phone: payload.phone,
        whatsapp: payload.whatsapp ?? "",
        description: payload.description ?? "",
      });
      if (anyError(errors)) {
        throw new Error(firstError(errors) ?? "بيانات الصنايعي غير صحيحة");
      }
      const socialLinks = payload.socialLinks ?? [];
      const socialLinksError = validateSocialLinks(socialLinks);
      if (socialLinksError) {
        throw new Error(socialLinksError);
      }
      let imageUrl = payload.existingImageUrl ?? null;
      if (payload.image) {
        const uploaded = await uploadCraftsmanImage(payload.image, "craftsmen");
        imageUrl = uploaded.url;
      }
      const { data: inserted, error } = await createSupabase()
        .from("craftsmen")
        .insert({
          slug: payload.slug,
          name: payload.name,
          category_id: payload.category_id,
          area_id: payload.area_id,
          phone: payload.phone,
          whatsapp: payload.whatsapp,
          description: payload.description,
          image_url: imageUrl,
          verified: payload.verified,
          is_published: payload.is_published,
        })
        .select("id")
        .single();
      if (error) throw new Error("مقدرناش نضيف الصنايعي");
      await saveSocialLinks(inserted.id, socialLinks);
    });
  }

  async function updateCraftsman(id: string, payload: CraftsmanInput) {
    return withAction(`update-craftsman-${id}`, async () => {
      const errors = validateCraftsmanFields({
        name: payload.name,
        slug: payload.slug,
        categoryId: payload.category_id,
        areaId: payload.area_id,
        phone: payload.phone,
        whatsapp: payload.whatsapp ?? "",
        description: payload.description ?? "",
      });
      if (anyError(errors)) {
        throw new Error(firstError(errors) ?? "بيانات الصنايعي غير صحيحة");
      }
      const socialLinks = payload.socialLinks ?? [];
      const socialLinksError = validateSocialLinks(socialLinks);
      if (socialLinksError) {
        throw new Error(socialLinksError);
      }
      let imageUrl = payload.existingImageUrl ?? null;
      if (payload.image) {
        const uploaded = await uploadCraftsmanImage(payload.image, "craftsmen");
        imageUrl = uploaded.url;
        if (payload.existingImageUrl) {
          await deleteImageByUrl(payload.existingImageUrl);
        }
      }
      const { error } = await createSupabase()
        .from("craftsmen")
        .update({
          slug: payload.slug,
          name: payload.name,
          category_id: payload.category_id,
          area_id: payload.area_id,
          phone: payload.phone,
          whatsapp: payload.whatsapp,
          description: payload.description,
          image_url: imageUrl,
          verified: payload.verified,
          is_published: payload.is_published,
        })
        .eq("id", id);
      if (error) throw new Error("مقدرناش نحدّث الصنايعي");
      const { error: linksDeleteError } = await createSupabase()
        .from("social_links")
        .delete()
        .eq("craftsman_id", id);
      if (linksDeleteError) throw new Error("مقدرناش نحدّث روابط السوشيال");
      await saveSocialLinks(id, socialLinks);
    });
  }

  async function deleteCraftsman(id: string) {
    return withAction(`delete-craftsman-${id}`, async () => {
      const target = craftsmen.find((craftsman) => craftsman.id === id);
      if (target?.image_url) {
        await deleteImageByUrl(target.image_url);
      }
      const { error } = await createSupabase().from("craftsmen").delete().eq("id", id);
      if (error) throw new Error("مقدرناش نحذف الصنايعي");
    });
  }

  async function approveRequest(request: JoinRequestRow) {
    return withAction(`approve-${request.id}`, async () => {
      if (request.type === "report") {
        const { error } = await createSupabase()
          .from("join_requests")
          .update({ status: "approved" })
          .eq("id", request.id);
        if (error) throw new Error("مقدرناش نوافق على البلاغ");
        return;
      }

      if (
        !request.name ||
        !request.category_id ||
        !request.area_id ||
        !request.phone
      ) {
        throw new Error("طلب التسجيل ناقص ومحتاج مراجعة يدوية");
      }

      const { data: createdCraftsmanId, error: rpcError } =
        await createSupabase().rpc("approve_join_request", {
          p_request_id: request.id,
        });
      if (rpcError) {
        if ((rpcError.message ?? "").includes("قبل")) {
          throw new Error("الطلب اتوافق عليه أو اترفض من قبل");
        }
        throw new Error("مقدرناش نوافق على الطلب");
      }

      if (request.image_url && createdCraftsmanId) {
        const imageUrl = await copyImageToCraftsman(
          request.image_url,
          createdCraftsmanId as string,
        );
        const { error: imageError } = await createSupabase()
          .from("craftsmen")
          .update({ image_url: imageUrl })
          .eq("id", createdCraftsmanId);
        if (imageError) throw new Error("مقدرناش نحدّث صورة الصنايعي");
      }
    });
  }

  async function rejectRequest(requestId: string) {
    return withAction(`reject-${requestId}`, async () => {
      const { error } = await createSupabase()
        .from("join_requests")
        .update({ status: "rejected" })
        .eq("id", requestId);
      if (error) throw new Error("مقدرناش نرفض الطلب");
    });
  }

  async function deleteRequest(requestId: string) {
    return withAction(`delete-request-${requestId}`, async () => {
      const target = requests.find((request) => request.id === requestId);
      if (target?.image_url) {
        const { data: shared } = await createSupabase()
          .from("craftsmen")
          .select("id")
          .eq("image_url", target.image_url)
          .limit(1);
        if (!shared?.length) {
          await deleteImageByUrl(target.image_url);
        }
      }
      const { error } = await createSupabase()
        .from("join_requests")
        .delete()
        .eq("id", requestId);
      if (error) throw new Error("مقدرناش نحذف الطلب");
    });
  }

  async function toggleMessageRead(message: ContactMessageRow) {
    return withAction(`message-${message.id}`, async () => {
      const { error } = await createSupabase()
        .from("contact_messages")
        .update({ is_read: !message.is_read })
        .eq("id", message.id);
      if (error) throw new Error("مقدرناش نحدّث حالة الرسالة");
    });
  }

  async function deleteMessage(messageId: string) {
    return withAction(`delete-message-${messageId}`, async () => {
      const { error } = await createSupabase()
        .from("contact_messages")
        .delete()
        .eq("id", messageId);
      if (error) throw new Error("مقدرناش نحذف الرسالة");
    });
  }

  return {
    requests,
    categories,
    areas,
    craftsmen,
    messages,
    loading,
    error,
    busyKey,
    categoryCounts,
    areaCounts,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryActive,
    addArea,
    updateArea,
    deleteArea,
    toggleAreaActive,
    toggleCraftsmanVerified,
    toggleCraftsmanPublished,
    createCraftsman,
    updateCraftsman,
    deleteCraftsman,
    approveRequest,
    rejectRequest,
    deleteRequest,
    toggleMessageRead,
    deleteMessage,
    refresh: loadData,
  };
}
