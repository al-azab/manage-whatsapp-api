
-- Add unique constraints for upsert operations
-- wa_accounts: one waba per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_wa_accounts_tenant_waba 
  ON public.wa_accounts (tenant_id, waba_id);

-- wa_numbers: one phone_number_id per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_wa_numbers_tenant_phone_id 
  ON public.wa_numbers (tenant_id, phone_number_id);

-- templates: unique per tenant + account + name + language (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS uq_templates_tenant_account_name_lang 
  ON public.templates (tenant_id, wa_account_id, name, language);
