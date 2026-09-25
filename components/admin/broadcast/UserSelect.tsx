"use client";

import { useEffect, useRef, useState } from "react";
import { useAdminUsers } from "@/hooks/admin/useAdminUsers";
import { IconSearch, IconUser, IconX, IconCheck } from "@/components/shared/icons";

export function UserSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (userId: string) => void;
}) {
  const { filteredUsers, search, setSearch, loading } = useAdminUsers();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedUser = value ? filteredUsers.find((u) => u.id === value) : null;

  // Display badge based on role
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "client":
        return <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-500">عميل</span>;
      case "craftsman":
        return <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">فني</span>;
      case "admin":
        return <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold text-danger">مشرف</span>;
      default:
        return null;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {selectedUser ? (
        // Selected State
        <div className="flex items-center justify-between w-full rounded-xl border border-border bg-background px-4 py-2.5">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-bold text-foreground">
                {selectedUser.craftsmanName || selectedUser.displayName}
              </span>
              {getRoleBadge(selectedUser.role)}
            </div>
            {selectedUser.email && (
              <span className="truncate text-[11px] text-muted">{selectedUser.email}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              onChange("");
              setSearch("");
              setIsOpen(true);
            }}
            className="shrink-0 p-1 text-muted hover:text-danger transition-colors"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>
      ) : (
        // Search State
        <div>
          <div className="relative">
            <IconSearch className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="ابحث بالاسم، الإيميل، أو اسم الفني..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-4 pr-10 text-sm outline-none transition-colors focus:border-accent"
            />
          </div>

          {isOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-card custom-scrollbar">
              {loading ? (
                <div className="p-4 text-center text-sm text-muted">جاري التحميل...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted">لم يتم العثور على مستخدمين</div>
              ) : (
                <ul className="space-y-1">
                  {filteredUsers.slice(0, 50).map((user) => (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(user.id);
                          setIsOpen(false);
                        }}
                        className="flex w-full items-start justify-between rounded-lg px-3 py-2 text-right transition-colors hover:bg-accent/10 focus:bg-accent/10 focus:outline-none"
                      >
                        <div className="flex min-w-0 flex-col">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-foreground">
                              {user.craftsmanName || user.displayName}
                            </span>
                            {getRoleBadge(user.role)}
                          </div>
                          {user.email && (
                            <span className="truncate text-[11px] text-muted">{user.email}</span>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
