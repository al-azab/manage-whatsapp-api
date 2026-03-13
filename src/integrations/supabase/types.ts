export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_extractions: {
        Row: {
          confidence: number | null
          created_at: string
          entities: Json
          error_message: string | null
          extracted_fields: Json
          id: string
          media_file_id: string | null
          message_id: string | null
          model_used: string | null
          processed_at: string | null
          raw_text: string | null
          status: string
          summary: string | null
          tenant_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          entities?: Json
          error_message?: string | null
          extracted_fields?: Json
          id?: string
          media_file_id?: string | null
          message_id?: string | null
          model_used?: string | null
          processed_at?: string | null
          raw_text?: string | null
          status?: string
          summary?: string | null
          tenant_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          entities?: Json
          error_message?: string | null
          extracted_fields?: Json
          id?: string
          media_file_id?: string | null
          message_id?: string | null
          model_used?: string | null
          processed_at?: string | null
          raw_text?: string | null
          status?: string
          summary?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_extractions_media_file_id_fkey"
            columns: ["media_file_id"]
            isOneToOne: false
            referencedRelation: "media_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_extractions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_extractions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          disabled_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          scopes: Json
          tenant_id: string
        }
        Insert: {
          created_at?: string
          disabled_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          scopes?: Json
          tenant_id: string
        }
        Update: {
          created_at?: string
          disabled_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          scopes?: Json
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          ip: string | null
          meta: Json
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          ip?: string | null
          meta?: Json
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          ip?: string | null
          meta?: Json
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast: {
        Row: {
          contact_tags: string[] | null
          created_at: string
          delivered_count: number
          failed_count: number
          id: string
          language: string
          name: string
          processed_count: number
          read_count: number
          replied_count: number
          scheduled_count: number | null
          sent_count: number
          template_name: string
        }
        Insert: {
          contact_tags?: string[] | null
          created_at?: string
          delivered_count?: number
          failed_count?: number
          id?: string
          language: string
          name: string
          processed_count?: number
          read_count?: number
          replied_count?: number
          scheduled_count?: number | null
          sent_count?: number
          template_name: string
        }
        Update: {
          contact_tags?: string[] | null
          created_at?: string
          delivered_count?: number
          failed_count?: number
          id?: string
          language?: string
          name?: string
          processed_count?: number
          read_count?: number
          replied_count?: number
          scheduled_count?: number | null
          sent_count?: number
          template_name?: string
        }
        Relationships: []
      }
      broadcast_batch: {
        Row: {
          broadcast_id: string
          created_at: string
          ended_at: string | null
          id: string
          scheduled_count: number
          sent_count: number
          started_at: string | null
          status: string | null
        }
        Insert: {
          broadcast_id: string
          created_at?: string
          ended_at?: string | null
          id: string
          scheduled_count: number
          sent_count?: number
          started_at?: string | null
          status?: string | null
        }
        Update: {
          broadcast_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          scheduled_count?: number
          sent_count?: number
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      broadcast_contact: {
        Row: {
          batch_id: string
          broadcast_id: string
          contact_id: number
          created_at: string
          delivered_at: string | null
          failed_at: string | null
          id: string
          processed_at: string | null
          read_at: string | null
          replied_at: string | null
          reply_counted: boolean
          sent_at: string | null
          wam_id: string | null
        }
        Insert: {
          batch_id: string
          broadcast_id: string
          contact_id: number
          created_at?: string
          delivered_at?: string | null
          failed_at?: string | null
          id?: string
          processed_at?: string | null
          read_at?: string | null
          replied_at?: string | null
          reply_counted?: boolean
          sent_at?: string | null
          wam_id?: string | null
        }
        Update: {
          batch_id?: string
          broadcast_id?: string
          contact_id?: number
          created_at?: string
          delivered_at?: string | null
          failed_at?: string | null
          id?: string
          processed_at?: string | null
          read_at?: string | null
          replied_at?: string | null
          reply_counted?: boolean
          sent_at?: string | null
          wam_id?: string | null
        }
        Relationships: []
      }
      contact_tag: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          assigned_to: string | null
          created_at: string
          display_name: string | null
          id: string
          in_chat: boolean
          last_message_received_at: string | null
          phone_e164: string
          tags: string[] | null
          tenant_id: string
          unread_count: number | null
          updated_at: string
          wa_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          in_chat?: boolean
          last_message_received_at?: string | null
          phone_e164: string
          tags?: string[] | null
          tenant_id: string
          unread_count?: number | null
          updated_at?: string
          wa_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          in_chat?: boolean
          last_message_received_at?: string | null
          phone_e164?: string
          tags?: string[] | null
          tenant_id?: string
          unread_count?: number | null
          updated_at?: string
          wa_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_notes: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          note: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          note: string
          tenant_id: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          note?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_notes_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_to: string | null
          contact_id: string
          created_at: string
          id: string
          last_message_at: string | null
          status: Database["public"]["Enums"]["conv_status"]
          tenant_id: string
          wa_number_id: string
        }
        Insert: {
          assigned_to?: string | null
          contact_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: Database["public"]["Enums"]["conv_status"]
          tenant_id: string
          wa_number_id: string
        }
        Update: {
          assigned_to?: string | null
          contact_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: Database["public"]["Enums"]["conv_status"]
          tenant_id?: string
          wa_number_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_wa_number_id_fkey"
            columns: ["wa_number_id"]
            isOneToOne: false
            referencedRelation: "wa_numbers"
            referencedColumns: ["id"]
          },
        ]
      }
      job_queue: {
        Row: {
          attempts: number
          created_at: string
          id: number
          job_type: Database["public"]["Enums"]["job_type"]
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          payload: Json
          run_after: string
          tenant_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: number
          job_type: Database["public"]["Enums"]["job_type"]
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          payload?: Json
          run_after?: string
          tenant_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: number
          job_type?: Database["public"]["Enums"]["job_type"]
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          payload?: Json
          run_after?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_queue_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      media_files: {
        Row: {
          created_at: string
          deleted_at: string | null
          folder_id: string | null
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          message_id: string | null
          mime: string | null
          received_at: string
          sha256: string | null
          size_bytes: number | null
          storage_bucket: string
          storage_key: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          folder_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          message_id?: string | null
          mime?: string | null
          received_at?: string
          sha256?: string | null
          size_bytes?: number | null
          storage_bucket?: string
          storage_key?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          folder_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          message_id?: string | null
          mime?: string | null
          received_at?: string
          sha256?: string | null
          size_bytes?: number | null
          storage_bucket?: string
          storage_key?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "media_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_files_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_files_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      media_folders: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_folders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      message_template: {
        Row: {
          category: string
          components: Json
          created_at: string
          id: string
          language: string
          name: string
          previous_category: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          category: string
          components: Json
          created_at?: string
          id: string
          language: string
          name: string
          previous_category?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          components?: Json
          created_at?: string
          id?: string
          language?: string
          name?: string
          previous_category?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          chat_id: string | null
          conversation_id: string
          created_at: string
          delivered_at: string | null
          direction: Database["public"]["Enums"]["msg_direction"]
          failed_at: string | null
          id: string
          is_received: boolean
          meta: Json
          provider_message_id: string | null
          read_at: string | null
          read_by_user_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["msg_status"]
          tenant_id: string
          text: string | null
        }
        Insert: {
          chat_id?: string | null
          conversation_id: string
          created_at?: string
          delivered_at?: string | null
          direction: Database["public"]["Enums"]["msg_direction"]
          failed_at?: string | null
          id?: string
          is_received?: boolean
          meta?: Json
          provider_message_id?: string | null
          read_at?: string | null
          read_by_user_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["msg_status"]
          tenant_id: string
          text?: string | null
        }
        Update: {
          chat_id?: string | null
          conversation_id?: string
          created_at?: string
          delivered_at?: string | null
          direction?: Database["public"]["Enums"]["msg_direction"]
          failed_at?: string | null
          id?: string
          is_received?: boolean
          meta?: Json
          provider_message_id?: string | null
          read_at?: string | null
          read_by_user_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["msg_status"]
          tenant_id?: string
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          last_updated: string | null
          name: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          last_updated?: string | null
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          last_updated?: string | null
          name?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          id: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          id?: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          id?: number
          permission?: Database["public"]["Enums"]["app_permission"]
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      setup: {
        Row: {
          created_at: string | null
          display_text: string
          done_at: string | null
          id: string
          in_progress: boolean
          name: string | null
          sequence: number | null
        }
        Insert: {
          created_at?: string | null
          display_text: string
          done_at?: string | null
          id?: string
          in_progress?: boolean
          name?: string | null
          sequence?: number | null
        }
        Update: {
          created_at?: string | null
          display_text?: string
          done_at?: string | null
          id?: string
          in_progress?: boolean
          name?: string | null
          sequence?: number | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          body: string | null
          category: Database["public"]["Enums"]["tmpl_category"]
          created_at: string
          id: string
          language: string
          meta: Json
          name: string
          status: Database["public"]["Enums"]["tmpl_status"]
          tenant_id: string
          updated_at: string
          variables: Json
          wa_account_id: string
        }
        Insert: {
          body?: string | null
          category?: Database["public"]["Enums"]["tmpl_category"]
          created_at?: string
          id?: string
          language?: string
          meta?: Json
          name: string
          status?: Database["public"]["Enums"]["tmpl_status"]
          tenant_id: string
          updated_at?: string
          variables?: Json
          wa_account_id: string
        }
        Update: {
          body?: string | null
          category?: Database["public"]["Enums"]["tmpl_category"]
          created_at?: string
          id?: string
          language?: string
          meta?: Json
          name?: string
          status?: Database["public"]["Enums"]["tmpl_status"]
          tenant_id?: string
          updated_at?: string
          variables?: Json
          wa_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_wa_account_id_fkey"
            columns: ["wa_account_id"]
            isOneToOne: false
            referencedRelation: "wa_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["member_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["member_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["member_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: number
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wa_accounts: {
        Row: {
          created_at: string
          id: string
          label: string
          tenant_id: string
          waba_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          tenant_id: string
          waba_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          tenant_id?: string
          waba_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_numbers: {
        Row: {
          created_at: string
          id: string
          last_active_at: string | null
          phone_e164: string
          phone_number_id: string
          status: string
          tenant_id: string
          type: Database["public"]["Enums"]["wa_number_type"]
          wa_account_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_active_at?: string | null
          phone_e164: string
          phone_number_id: string
          status?: string
          tenant_id: string
          type?: Database["public"]["Enums"]["wa_number_type"]
          wa_account_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_active_at?: string | null
          phone_e164?: string
          phone_number_id?: string
          status?: string
          tenant_id?: string
          type?: Database["public"]["Enums"]["wa_number_type"]
          wa_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_numbers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_numbers_wa_account_id_fkey"
            columns: ["wa_account_id"]
            isOneToOne: false
            referencedRelation: "wa_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          attempts: number
          created_at: string
          event_type: string
          id: string
          last_error: string | null
          next_retry_at: string | null
          payload: Json
          status_code: number | null
          success: boolean
          tenant_id: string
          webhook_endpoint_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          event_type: string
          id?: string
          last_error?: string | null
          next_retry_at?: string | null
          payload?: Json
          status_code?: number | null
          success?: boolean
          tenant_id: string
          webhook_endpoint_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          event_type?: string
          id?: string
          last_error?: string | null
          next_retry_at?: string | null
          payload?: Json
          status_code?: number | null
          success?: boolean
          tenant_id?: string
          webhook_endpoint_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_deliveries_webhook_endpoint_id_fkey"
            columns: ["webhook_endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          created_at: string
          events: Json
          id: string
          is_enabled: boolean
          secret_hash: string | null
          tenant_id: string
          url: string
        }
        Insert: {
          created_at?: string
          events?: Json
          id?: string
          is_enabled?: boolean
          secret_hash?: string | null
          tenant_id: string
          url: string
        }
        Update: {
          created_at?: string
          events?: Json
          id?: string
          is_enabled?: boolean
          secret_hash?: string | null
          tenant_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_endpoints_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_runs: {
        Row: {
          created_at: string
          id: string
          log: Json
          status: string
          tenant_id: string
          trigger_event: string | null
          workflow_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          log?: Json
          status?: string
          tenant_id: string
          trigger_event?: string | null
          workflow_id: string
        }
        Update: {
          created_at?: string
          id?: string
          log?: Json
          status?: string
          tenant_id?: string
          trigger_event?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          name: string
          rules: Json
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          name: string
          rules?: Json
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          name?: string
          rules?: Json
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_delivered_count_to_broadcast: {
        Args: { b_id: string; delivered_count_to_be_added: number }
        Returns: undefined
      }
      add_failed_count_to_broadcast: {
        Args: { b_id: string; failed_count_to_be_added: number }
        Returns: undefined
      }
      add_processed_count_to_broadcast: {
        Args: { b_id: string; processed_count_to_be_added: number }
        Returns: undefined
      }
      add_read_count_to_broadcast: {
        Args: { b_id: string; read_count_to_be_added: number }
        Returns: undefined
      }
      add_replied_to_broadcast_contact: {
        Args: { b_id: string; replied_count_to_be_added: number }
        Returns: undefined
      }
      add_sent_count_to_broadcast: {
        Args: { b_id: string; sent_count_to_be_added: number }
        Returns: undefined
      }
      authorize: {
        Args: {
          requested_permission: Database["public"]["Enums"]["app_permission"]
        }
        Returns: boolean
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      has_tenant_role: {
        Args: {
          _min_role: Database["public"]["Enums"]["member_role"]
          _tenant_id: string
        }
        Returns: boolean
      }
      is_tenant_member: { Args: { _tenant_id: string }; Returns: boolean }
      pick_next_broadcast_batch: { Args: { b_id: string }; Returns: string }
      update_message_delivered_status: {
        Args: { delivered_at_in: string; wam_id_in: string }
        Returns: boolean
      }
      update_message_failed_status: {
        Args: { failed_at_in: string; wam_id_in: string }
        Returns: boolean
      }
      update_message_read_status: {
        Args: { read_at_in: string; wam_id_in: string }
        Returns: boolean
      }
      update_message_sent_status: {
        Args: { sent_at_in: string; wam_id_in: string }
        Returns: boolean
      }
    }
    Enums: {
      app_permission:
        | "contact.read"
        | "contact.write"
        | "chat.read"
        | "chat.write"
      app_role: "admin" | "agent"
      conv_status: "open" | "pending" | "closed"
      job_type:
        | "WEBHOOK_DELIVERY"
        | "TEMPLATE_SYNC"
        | "MEDIA_PROCESS"
        | "WORKFLOW_RUN"
        | "SEND_MESSAGE"
        | "MEDIA_AI_ANALYZE"
      media_kind: "image" | "video" | "audio" | "document" | "sticker" | "other"
      member_role: "admin" | "operator" | "viewer"
      msg_direction: "inbound" | "outbound"
      msg_status: "queued" | "sent" | "delivered" | "read" | "failed"
      tmpl_category: "UTILITY" | "MARKETING" | "AUTH"
      tmpl_status: "APPROVED" | "PENDING" | "REJECTED" | "PAUSED"
      wa_number_type: "connected" | "digital" | "sandbox"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_permission: [
        "contact.read",
        "contact.write",
        "chat.read",
        "chat.write",
      ],
      app_role: ["admin", "agent"],
      conv_status: ["open", "pending", "closed"],
      job_type: [
        "WEBHOOK_DELIVERY",
        "TEMPLATE_SYNC",
        "MEDIA_PROCESS",
        "WORKFLOW_RUN",
        "SEND_MESSAGE",
        "MEDIA_AI_ANALYZE",
      ],
      media_kind: ["image", "video", "audio", "document", "sticker", "other"],
      member_role: ["admin", "operator", "viewer"],
      msg_direction: ["inbound", "outbound"],
      msg_status: ["queued", "sent", "delivered", "read", "failed"],
      tmpl_category: ["UTILITY", "MARKETING", "AUTH"],
      tmpl_status: ["APPROVED", "PENDING", "REJECTED", "PAUSED"],
      wa_number_type: ["connected", "digital", "sandbox"],
    },
  },
} as const
