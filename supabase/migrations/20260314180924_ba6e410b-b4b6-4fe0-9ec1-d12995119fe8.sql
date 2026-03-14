-- Enable secure access to wa-media bucket for tenant members based on first folder segment = tenant_id (UUID)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'wa_media_select_tenant_members'
  ) THEN
    CREATE POLICY "wa_media_select_tenant_members"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'wa-media'
      AND CASE
        WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        THEN public.is_tenant_member(((storage.foldername(name))[1])::uuid)
        ELSE false
      END
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'wa_media_insert_tenant_operators'
  ) THEN
    CREATE POLICY "wa_media_insert_tenant_operators"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'wa-media'
      AND CASE
        WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        THEN public.has_tenant_role(((storage.foldername(name))[1])::uuid, 'operator'::public.member_role)
        ELSE false
      END
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'wa_media_update_tenant_operators'
  ) THEN
    CREATE POLICY "wa_media_update_tenant_operators"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'wa-media'
      AND CASE
        WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        THEN public.has_tenant_role(((storage.foldername(name))[1])::uuid, 'operator'::public.member_role)
        ELSE false
      END
    )
    WITH CHECK (
      bucket_id = 'wa-media'
      AND CASE
        WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        THEN public.has_tenant_role(((storage.foldername(name))[1])::uuid, 'operator'::public.member_role)
        ELSE false
      END
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'wa_media_delete_tenant_operators'
  ) THEN
    CREATE POLICY "wa_media_delete_tenant_operators"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'wa-media'
      AND CASE
        WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        THEN public.has_tenant_role(((storage.foldername(name))[1])::uuid, 'operator'::public.member_role)
        ELSE false
      END
    );
  END IF;
END $$;