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
      return;
    }

    // If there's already a direct HTTP URL, use it
    if (media.url && media.url.startsWith("http")) {
      setResolvedUrl(media.url);
      return;
    }

    // If there's a storage_key, resolve via signed URL
    if (media.storage_key && media.storage_bucket === "wa-media") {
      setLoading(true);
      supabase.storage
        .from("wa-media")
        .createSignedUrl(media.storage_key, 300)
        .then(({ data, error }) => {
          if (data?.signedUrl) {
            setResolvedUrl(data.signedUrl);
          } else {
            console.error("Failed to create signed URL:", error);
            setResolvedUrl(null);
          }
          setLoading(false);
        });
      return;
    }

    // If there's a media_file_id, resolve via edge function
    if (media.media_file_id && tenantId) {
      setLoading(true);
      supabase.functions
        .invoke("media_signed_url", {
          body: { tenant_id: tenantId, media_id: media.media_file_id },
        })
        .then(({ data, error }) => {
          if (data?.url) {
            setResolvedUrl(data.url);
          } else {
            console.error("media_signed_url error:", error);
            setResolvedUrl(null);
          }
          setLoading(false);
        });
      return;
    }

    // No resolvable media
    setResolvedUrl(null);
  }, [media?.url, media?.storage_key, media?.media_file_id, tenantId]);

  return { url: resolvedUrl, loading };
}
