import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/use-tenant";

/**
 * Resolves a media reference to a viewable signed URL.
 * Supports:
 * - Direct URLs (http/https) — returned as-is
 * - Storage references (storage_key + storage_bucket) — resolved via media_signed_url edge function
 */
export function useMediaUrl(media: {
  url?: string;
  storage_key?: string;
  storage_bucket?: string;
  media_file_id?: string;
  id?: string; // WhatsApp media ID (not yet processed)
  mime_type?: string;
  mime?: string;
} | null | undefined) {
  const { tenantId } = useTenant();
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!media) {
      setResolvedUrl(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const parseSignedStorageRef = (url?: string | null) => {
      if (!url) return null;
      try {
        const parsed = new URL(url);
        const match = parsed.pathname.match(/\/storage\/v1\/object\/sign\/([^/]+)\/(.+)$/);
        if (!match) return null;
        return {
          storage_bucket: decodeURIComponent(match[1]),
          storage_key: decodeURIComponent(match[2]),
        };
      } catch {
        return null;
      }
    };

    const resolvedFromUrl = parseSignedStorageRef(media.url);
    const resolvedBucket = media.storage_bucket || resolvedFromUrl?.storage_bucket;
    const resolvedStorageKey = media.storage_key || resolvedFromUrl?.storage_key;

    // Prefer fresh signed URLs for private wa-media files to avoid expired links
    if (resolvedStorageKey && resolvedBucket === "wa-media") {
      setLoading(true);
      supabase.storage
        .from("wa-media")
        .createSignedUrl(resolvedStorageKey, 300)
        .then(({ data, error }) => {
          if (cancelled) return;
          if (data?.signedUrl) {
            setResolvedUrl(data.signedUrl);
          } else {
            console.error("Failed to create signed URL:", error);
            setResolvedUrl(null);
          }
          setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }

    // If there's a media_file_id, resolve via edge function
    if (media.media_file_id && tenantId) {
      setLoading(true);
      supabase.functions
        .invoke("media_signed_url", {
          body: { tenant_id: tenantId, media_id: media.media_file_id },
        })
        .then(({ data, error }) => {
          if (cancelled) return;
          if (data?.url) {
            setResolvedUrl(data.url);
          } else {
            console.error("media_signed_url error:", error);
            setResolvedUrl(null);
          }
          setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }

    if (media.url && media.url.startsWith("http")) {
      setResolvedUrl(media.url);
    } else {
      setResolvedUrl(null);
    }
    setLoading(false);

    return () => {
      cancelled = true;
    };
  }, [media?.url, media?.storage_key, media?.storage_bucket, media?.media_file_id, tenantId]);

  return { url: resolvedUrl, loading };
}
