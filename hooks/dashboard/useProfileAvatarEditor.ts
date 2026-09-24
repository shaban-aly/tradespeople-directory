"use client";

import { useCallback, useRef, useState, startTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CraftsmanSelfProfile } from "@/lib/db/craftsman-dashboard";
import type { AvatarPosition } from "@/lib/data/craftsmen";
import { validateImage } from "@/lib/storage/images";

export function useProfileAvatarEditor(profile: CraftsmanSelfProfile) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isPositionEditorOpen, setIsPositionEditorOpen] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(
    profile.imageUrl ?? null,
  );
  const [currentAvatarPos, setCurrentAvatarPos] = useState<AvatarPosition | null>(
    profile.avatarPosition ?? null,
  );
  const [selectedNewFile, setSelectedNewFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const isUrlViewerOpen = searchParams?.get("image") === "view";
  const showViewer = isViewerOpen || isUrlViewerOpen;

  const handleFilePicked = useCallback((file: File) => {
    setAvatarError(null);
    const validationErr = validateImage(file);
    if (validationErr) {
      setAvatarError(validationErr);
      return;
    }
    setSelectedNewFile(file);
    setIsPositionEditorOpen(true);
  }, []);

  const handleOpenViewer = useCallback(() => {
    const current = new URLSearchParams(searchParams ? searchParams.toString() : "");
    current.set("image", "view");
    const search = current.toString();
    const query = search ? `?${search}` : "";
    startTransition(() => {
      router.push(`${pathname}${query}`, { scroll: false });
    });
    setIsViewerOpen(true);
  }, [pathname, router, searchParams]);

  const handleCloseViewer = useCallback(() => {
    setIsViewerOpen(false);
    if (searchParams?.get("image") === "view") {
      const current = new URLSearchParams(searchParams.toString());
      current.delete("image");
      const search = current.toString();
      const query = search ? `?${search}` : "";
      startTransition(() => {
        router.push(`${pathname}${query}`, { scroll: false });
      });
    }
  }, [pathname, router, searchParams]);

  const openPositionEditor = useCallback(() => {
    setSelectedNewFile(null);
    setIsPositionEditorOpen((prev) => !prev);
  }, []);

  const handlePositionSaved = useCallback(
    (result: { imageUrl: string | null; position: AvatarPosition }) => {
      setCurrentAvatarUrl(result.imageUrl);
      setCurrentAvatarPos(result.position);
      setSelectedNewFile(null);
      setIsPositionEditorOpen(false);
    },
    [],
  );

  const handlePositionClosed = useCallback(() => {
    setSelectedNewFile(null);
    setIsPositionEditorOpen(false);
  }, []);

  return {
    fileInputRef,
    currentAvatarUrl,
    currentAvatarPos,
    selectedNewFile,
    avatarError,
    isPositionEditorOpen,
    showViewer,
    handleFilePicked,
    handleOpenViewer,
    handleCloseViewer,
    openPositionEditor,
    handlePositionSaved,
    handlePositionClosed,
  };
}
