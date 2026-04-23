"use client";

import useSWR, { SWRConfiguration, mutate } from "swr";
import { useProfileStore } from "../store/profile.store";

/**
 * Generic fetcher for API calls
 */
async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Network error" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Fetcher with authentication token
 */
async function authFetcher<T>(url: string, accessToken?: string | null): Promise<T> {
  if (!accessToken) {
    throw new Error("No access token");
  }

  return fetcher<T>(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// ============================================
// Profile Hooks
// ============================================

export interface ProfileResponse {
  id: string;
  email: string;
  display_name?: string;
  goal: "burn" | "maintain" | "build";
  gender: "male" | "female";
  age: number;
  weight_kg: number;
  height_cm: number;
  activity: "sedentary" | "light" | "moderate" | "active" | "very_active";
  tdee: number;
  onboarding_done: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  display_name?: string;
  goal?: "burn" | "maintain" | "build";
  gender?: "male" | "female";
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  activity?: "sedentary" | "light" | "moderate" | "active" | "very_active";
  tdee?: number;
  onboarding_done?: boolean;
}

const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60000, // 1 minute
  errorRetryCount: 3,
  errorRetryInterval: 5000,
};

/**
 * Hook to fetch user profile from server
 * Syncs with local Zustand store
 */
export function useProfile() {
  const { accessToken } = useProfileStore();
  const { setProfile: setStoreProfile } = useProfileStore();

  const { data, error, mutate: mutateProfile, isLoading } = useSWR<ProfileResponse>(
    accessToken ? "/api/profile" : null,
    (url) => authFetcher<ProfileResponse>(url, accessToken),
    {
      ...swrConfig,
      onSuccess: (data) => {
        // Sync with local store
        const GOAL_FROM_DB: Record<string, "cut" | "maintain" | "bulk"> = {
          burn: "cut",
          maintain: "maintain",
          build: "bulk",
        };
        const ACT_FROM_DB: Record<string, 1.2 | 1.375 | 1.55 | 1.725 | 1.9> = {
          sedentary: 1.2,
          light: 1.375,
          moderate: 1.55,
          active: 1.725,
          very_active: 1.9,
        };

        setStoreProfile({
          fullName: data.display_name || "",
          goal: GOAL_FROM_DB[data.goal] || "maintain",
          gender: data.gender,
          age: data.age,
          weight: data.weight_kg,
          height: data.height_cm,
          activity: ACT_FROM_DB[data.activity] || 1.55,
          tdee: data.tdee,
          onboardingDone: data.onboarding_done,
        });
      },
    }
  );

  /**
   * Update profile on server and sync with local store
   */
  const updateProfile = async (updates: UpdateProfileRequest) => {
    if (!accessToken) throw new Error("No access token");

    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Update failed" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const updated = await response.json();
    
    // Optimistically update cache and store
    mutateProfile(updated, false);
    
    return updated;
  };

  return {
    profile: data,
    isLoading,
    error,
    mutate: mutateProfile,
    updateProfile,
  };
}

// ============================================
// Diary Hooks
// ============================================

export interface DiaryEntry {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  recipe_id?: string;
  notes?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDiaryEntryRequest {
  date: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  recipe_id?: string;
  notes?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface UpdateDiaryEntryRequest extends Partial<CreateDiaryEntryRequest> {}

/**
 * Hook to fetch diary entries for a specific date
 */
export function useDiary(date: string) {
  const { accessToken } = useProfileStore();

  const { data, error, mutate: mutateDiary, isLoading } = useSWR<DiaryEntry[]>(
    accessToken && date ? `/api/log/diary?date=${date}` : null,
    (url) => authFetcher<DiaryEntry[]>(url, accessToken),
    swrConfig
  );

  /**
   * Add a new diary entry
   */
  const addEntry = async (entry: CreateDiaryEntryRequest) => {
    if (!accessToken) throw new Error("No access token");

    const response = await fetch("/api/log/diary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to add entry" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const newEntry = await response.json();
    
    // Optimistically update cache
    mutateDiary((current = []) => [...current, newEntry], false);
    
    return newEntry;
  };

  /**
   * Update an existing diary entry
   */
  const updateEntry = async (id: string, updates: UpdateDiaryEntryRequest) => {
    if (!accessToken) throw new Error("No access token");

    const response = await fetch(`/api/log/diary/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to update entry" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const updated = await response.json();
    
    // Optimistically update cache
    mutateDiary((current = []) => 
      current.map((entry) => entry.id === id ? updated : entry),
      false
    );
    
    return updated;
  };

  /**
   * Delete a diary entry
   */
  const deleteEntry = async (id: string) => {
    if (!accessToken) throw new Error("No access token");

    const response = await fetch(`/api/log/diary/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to delete entry" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    // Optimistically update cache
    mutateDiary((current = []) => current.filter((entry) => entry.id !== id), false);
  };

  return {
    entries: data || [],
    isLoading,
    error,
    mutate: mutateDiary,
    addEntry,
    updateEntry,
    deleteEntry,
  };
}

/**
 * Hook to fetch diary entries for a date range
 */
export function useDiaryRange(startDate: string, endDate: string) {
  const { accessToken } = useProfileStore();

  const { data, error, mutate, isLoading } = useSWR<DiaryEntry[]>(
    accessToken && startDate && endDate 
      ? `/api/log/diary?start=${startDate}&end=${endDate}` 
      : null,
    (url) => authFetcher<DiaryEntry[]>(url, accessToken),
    swrConfig
  );

  return {
    entries: data || [],
    isLoading,
    error,
    mutate,
  };
}

// ============================================
// Weight Log Hooks
// ============================================

export interface WeightEntry {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number;
  notes?: string;
  created_at: string;
}

export interface CreateWeightEntryRequest {
  date: string;
  weight_kg: number;
  notes?: string;
}

/**
 * Hook to fetch weight entries
 */
export function useWeightLogs(limit: number = 30) {
  const { accessToken } = useProfileStore();

  const { data, error, mutate: mutateWeight, isLoading } = useSWR<WeightEntry[]>(
    accessToken ? `/api/log/weight?limit=${limit}` : null,
    (url) => authFetcher<WeightEntry[]>(url, accessToken),
    swrConfig
  );

  /**
   * Add a new weight entry
   */
  const addWeight = async (entry: CreateWeightEntryRequest) => {
    if (!accessToken) throw new Error("No access token");

    const response = await fetch("/api/log/weight", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to log weight" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const newEntry = await response.json();
    
    // Optimistically update cache
    mutateWeight((current = []) => [...current, newEntry], false);
    
    return newEntry;
  };

  /**
   * Delete a weight entry
   */
  const deleteWeight = async (id: string) => {
    if (!accessToken) throw new Error("No access token");

    const response = await fetch(`/api/log/weight/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to delete weight" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    // Optimistically update cache
    mutateWeight((current = []) => current.filter((entry) => entry.id !== id), false);
  };

  return {
    entries: data || [],
    isLoading,
    error,
    mutate: mutateWeight,
    addWeight,
    deleteWeight,
  };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Invalidate all caches related to user data
 */
export function invalidateUserData() {
  mutate((key) => typeof key === "string" && key.startsWith("/api/"));
}

/**
 * Revalidate profile data
 */
export function revalidateProfile() {
  mutate("/api/profile");
}