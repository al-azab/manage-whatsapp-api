#!/usr/bin/env bash
set -euo pipefail

# ========= ثوابت =========
META_TOKEN="EAAMoxxxxxxxxxxxxxxTtgZDZD"
BUSINESS_ID="314437023701205"
API="https://graph.facebook.com/v24.0"
OUT="meta_all.json"

req () {
  curl -s "$1" -H "Authorization: Bearer $META_TOKEN"
}

# ========= تهيئة الملف =========
jq -n '{
  meta: {},
  business: {},
  wabas: []
}' > "$OUT"

# ========= 1) token =========
req "$API/debug_token?input_token=$META_TOKEN&access_token=$META_TOKEN" \
| jq '.data' \
| jq '{meta: .}' \
| jq -s '.[0] * .[1]' "$OUT" - > /tmp/_tmp && mv /tmp/_tmp "$OUT"

# ========= 2) business =========
req "$API/$BUSINESS_ID?fields=id,name,verification_status,created_time" \
| jq '{business: .}' \
| jq -s '.[0] * .[1]' "$OUT" - > /tmp/_tmp && mv /tmp/_tmp "$OUT"

# ========= 3) WABAs =========
WABAS=$(req "$API/$BUSINESS_ID/owned_whatsapp_business_accounts?limit=100")

for WABA_ID in $(echo "$WABAS" | jq -r '.data[].id'); do
  WABA_OBJ=$(jq -n '{id:"",info:{},phones:[],templates:[],apps:[],webhooks:[]}')
  WABA_OBJ=$(echo "$WABA_OBJ" | jq --arg id "$WABA_ID" '.id=$id')

  # info
  INFO=$(req "$API/$WABA_ID?fields=id,name,currency,timezone_id,message_template_namespace")
  WABA_OBJ=$(echo "$WABA_OBJ" | jq --argjson v "$INFO" '.info=$v')

  # phone numbers (← هنا كان الخطأ واتصلح)
  PHONES=$(req "$API/$WABA_ID/phone_numbers?limit=100")
  for PID in $(echo "$PHONES" | jq -r '.data[].id'); do
    P=$(req "$API/$PID?fields=id,display_phone_number,verified_name,quality_rating,status,account_mode")
    WABA_OBJ=$(echo "$WABA_OBJ" | jq --argjson p "$P" '.phones += [$p]')
  done

  # templates
  TPL=$(req "$API/$WABA_ID/message_templates?limit=100")
  WABA_OBJ=$(echo "$WABA_OBJ" | jq --argjson t "$TPL" '.templates=$t.data')

  # apps
  APPS=$(req "$API/$WABA_ID/subscribed_apps")
  WABA_OBJ=$(echo "$WABA_OBJ" | jq --argjson a "$APPS" '.apps=$a.data')

  # webhooks
  WH=$(req "$API/$WABA_ID/webhooks")
  WABA_OBJ=$(echo "$WABA_OBJ" | jq --argjson w "$WH" '.webhooks=$w.data')

  jq --argjson w "$WABA_OBJ" '.wabas += [$w]' "$OUT" > /tmp/_tmp && mv /tmp/_tmp "$OUT"
done

echo "✅ DONE → $OUT"
