"use client";

import { useEffect } from "react";
import { useProfileStore } from "../store/profile.store";
import { useProfile } from "../lib/swr-hooks";

/**
 * Component to sync profile data from API to local store
 * This ensures that when the app reloads, the latest data from server is loaded
 */
export function ProfileSyncProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useProfileStore();
  const { profile, isLoading } = useProfile();

  // The useProfile hook already syncs data to store via onSuccess callback
  // This component just ensures the hook is always mounted when user is logged in

  if (!accessToken) {
    return <>{children}</>;
  }

  if (isLoading) {
    // Show loading state while fetching profile
    return <>{children}</>;
  }

  return <>{children}</>;
}