"use client";

import { useMemo, useState } from "react";
import type { AdminUserRow } from "@/lib/db/admin";
import { fetchAdminUsers } from "@/lib/db/admin";
import { useAdminQuery } from "./useAdminQuery";

export type UserRoleFilter = "all" | "client" | "craftsman" | "admin";

export interface RoleCounter {
  value: UserRoleFilter;
  label: string;
  count: number;
}

export function useAdminUsers(initialUsers?: AdminUserRow[]) {
  const {
    data: users,
    loading,
    error,
    refresh,
  } = useAdminQuery(() => fetchAdminUsers(), initialUsers);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>("all");

  const userList = users ?? [];

  const clientCount = useMemo(
    () => userList.filter((u) => u.role === "client").length,
    [userList],
  );
  const craftsmanCount = useMemo(
    () => userList.filter((u) => u.role === "craftsman").length,
    [userList],
  );
  const adminCount = useMemo(
    () => userList.filter((u) => u.role === "admin").length,
    [userList],
  );

  const filteredUsers = useMemo(() => {
    return userList.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) {
        return false;
      }
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchesName = user.displayName.toLowerCase().includes(query);
        const matchesEmail = user.email?.toLowerCase().includes(query);
        const matchesCraftsman = user.craftsmanName?.toLowerCase().includes(query);
        const matchesId = user.id.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesCraftsman && !matchesId) {
          return false;
        }
      }
      return true;
    });
  }, [userList, search, roleFilter]);

  const roleCounters: RoleCounter[] = useMemo(
    () => [
      { value: "all", label: "الكل", count: userList.length },
      { value: "client", label: "عملاء", count: clientCount },
      { value: "craftsman", label: "فنيين / صنايعية", count: craftsmanCount },
      { value: "admin", label: "مشرفين", count: adminCount },
    ],
    [userList.length, clientCount, craftsmanCount, adminCount],
  );

  return {
    users: userList,
    filteredUsers,
    loading,
    error,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    roleCounters,
    refresh,
  };
}
