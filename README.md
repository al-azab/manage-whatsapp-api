# Manage WhatsApp Business API — لوحة تحكم واتساب للأعمال

منصة متكاملة لإدارة WhatsApp Business عبر Supabase Edge Functions.

## ⚡ تشغيل سريع

```bash
npm install
cp .env.example .env        # أضف VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
supabase db push            # طبّق جميع migrations
supabase secrets set WA_ACCESS_TOKEN="EAAxx" WA_APP_SECRET="xx" WA_BUSINESS_ID="314437023701205" WA_WEBHOOK_VERIFY_TOKEN="secret"
supabase functions deploy
npm run dev
```

## Webhook URL لـ Meta
`https://YOUR_PROJECT.supabase.co/functions/v1/wa_webhook_inbound`

## راجع supabase/.env.example لجميع الأسرار المطلوبة
