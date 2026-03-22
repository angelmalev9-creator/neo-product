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
      api_keys: {
        Row: {
          api_key: string
          created_at: string
          id: string
          is_active: boolean
          key_hash: string | null
          last_used_at: string | null
          name: string
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash?: string | null
          last_used_at?: string | null
          name?: string
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash?: string | null
          last_used_at?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          canonical_url: string | null
          category: string | null
          content_html: string | null
          content_md: string | null
          created_at: string
          created_by: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          meta_description: string | null
          publish_at: string | null
          seo_title: string | null
          slug: string
          source_refs: Json | null
          status: string
          tags: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          canonical_url?: string | null
          category?: string | null
          content_html?: string | null
          content_md?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          publish_at?: string | null
          seo_title?: string | null
          slug: string
          source_refs?: Json | null
          status?: string
          tags?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          canonical_url?: string | null
          category?: string | null
          content_html?: string | null
          content_md?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          publish_at?: string | null
          seo_title?: string | null
          slug?: string
          source_refs?: Json | null
          status?: string
          tags?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_bookings: {
        Row: {
          attendee_email: string | null
          attendee_name: string | null
          attendee_phone: string | null
          conversation_id: string | null
          created_at: string
          event_end: string
          event_start: string
          event_title: string
          google_event_id: string | null
          id: string
          lead_id: string | null
          service: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          attendee_email?: string | null
          attendee_name?: string | null
          attendee_phone?: string | null
          conversation_id?: string | null
          created_at?: string
          event_end: string
          event_start: string
          event_title: string
          google_event_id?: string | null
          id?: string
          lead_id?: string | null
          service?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          attendee_email?: string | null
          attendee_name?: string | null
          attendee_phone?: string | null
          conversation_id?: string | null
          created_at?: string
          event_end?: string
          event_start?: string
          event_title?: string
          google_event_id?: string | null
          id?: string
          lead_id?: string | null
          service?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_bookings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_bookings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "captured_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_settings: {
        Row: {
          auto_book_after_conversation: boolean | null
          booking_buffer_minutes: number | null
          booking_type: string | null
          calendar_access_token: string | null
          calendar_connected: boolean | null
          calendar_email: string | null
          calendar_enabled: boolean | null
          calendar_refresh_token: string | null
          calendar_token_expires_at: string | null
          created_at: string
          default_meeting_duration: number | null
          id: string
          meeting_description_template: string | null
          meeting_title_template: string | null
          required_booking_fields: string[] | null
          updated_at: string
          user_id: string
          working_days: number[] | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          auto_book_after_conversation?: boolean | null
          booking_buffer_minutes?: number | null
          booking_type?: string | null
          calendar_access_token?: string | null
          calendar_connected?: boolean | null
          calendar_email?: string | null
          calendar_enabled?: boolean | null
          calendar_refresh_token?: string | null
          calendar_token_expires_at?: string | null
          created_at?: string
          default_meeting_duration?: number | null
          id?: string
          meeting_description_template?: string | null
          meeting_title_template?: string | null
          required_booking_fields?: string[] | null
          updated_at?: string
          user_id: string
          working_days?: number[] | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          auto_book_after_conversation?: boolean | null
          booking_buffer_minutes?: number | null
          booking_type?: string | null
          calendar_access_token?: string | null
          calendar_connected?: boolean | null
          calendar_email?: string | null
          calendar_enabled?: boolean | null
          calendar_refresh_token?: string | null
          calendar_token_expires_at?: string | null
          created_at?: string
          default_meeting_duration?: number | null
          id?: string
          meeting_description_template?: string | null
          meeting_title_template?: string | null
          required_booking_fields?: string[] | null
          updated_at?: string
          user_id?: string
          working_days?: number[] | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      calendar_time_slots: {
        Row: {
          booking_id: string | null
          created_at: string | null
          id: string
          is_available: boolean | null
          slot_date: string
          slot_end: string
          slot_start: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          slot_date: string
          slot_end: string
          slot_start: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          slot_date?: string
          slot_end?: string
          slot_start?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_time_slots_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "calendar_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      captured_leads: {
        Row: {
          company: string | null
          conversation_id: string | null
          created_at: string
          created_from_ip: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          name: string | null
          notes: string | null
          phone: string | null
          service: string | null
          source: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          conversation_id?: string | null
          created_at?: string
          created_from_ip?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          service?: string | null
          source?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          conversation_id?: string | null
          created_at?: string
          created_from_ip?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          service?: string | null
          source?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "captured_leads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_ideas: {
        Row: {
          angle: string | null
          audience: string | null
          created_at: string
          id: string
          keywords: string[] | null
          score: number | null
          source_refs: Json | null
          status: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          angle?: string | null
          audience?: string | null
          created_at?: string
          id?: string
          keywords?: string[] | null
          score?: number | null
          source_refs?: Json | null
          status?: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          angle?: string | null
          audience?: string | null
          created_at?: string
          id?: string
          keywords?: string[] | null
          score?: number | null
          source_refs?: Json | null
          status?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_sources: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          source_name: string
          source_type: string
          source_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          source_name: string
          source_type?: string
          source_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          source_name?: string
          source_type?: string
          source_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          lead_captured: boolean | null
          messages_count: number | null
          sentiment: string | null
          session_type: string
          started_at: string
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          lead_captured?: boolean | null
          messages_count?: number | null
          sentiment?: string | null
          session_type?: string
          started_at?: string
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          lead_captured?: boolean | null
          messages_count?: number | null
          sentiment?: string | null
          session_type?: string
          started_at?: string
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      demo_sessions: {
        Row: {
          business_detection: Json | null
          company_name: string | null
          created_at: string
          error_message: string | null
          id: string
          language: string | null
          scraped_content: Json | null
          session_token: string | null
          status: string | null
          structured_data: Json | null
          summary: string | null
          updated_at: string
          url: string
          user_id: string | null
        }
        Insert: {
          business_detection?: Json | null
          company_name?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          language?: string | null
          scraped_content?: Json | null
          session_token?: string | null
          status?: string | null
          structured_data?: Json | null
          summary?: string | null
          updated_at?: string
          url: string
          user_id?: string | null
        }
        Update: {
          business_detection?: Json | null
          company_name?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          language?: string | null
          scraped_content?: Json | null
          session_token?: string | null
          status?: string | null
          structured_data?: Json | null
          summary?: string | null
          updated_at?: string
          url?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          body: string
          conversation_id: string | null
          created_at: string
          demo_session_id: string | null
          error_message: string | null
          id: string
          intent: string | null
          is_demo: boolean | null
          lead_id: string | null
          metadata: Json | null
          provider: string | null
          provider_payload: Json | null
          recipient_email: string
          recipient_name: string | null
          resend_email_id: string | null
          sender_email: string | null
          sent_at: string | null
          session_id: string | null
          status: string | null
          subject: string
          user_id: string | null
        }
        Insert: {
          body: string
          conversation_id?: string | null
          created_at?: string
          demo_session_id?: string | null
          error_message?: string | null
          id?: string
          intent?: string | null
          is_demo?: boolean | null
          lead_id?: string | null
          metadata?: Json | null
          provider?: string | null
          provider_payload?: Json | null
          recipient_email: string
          recipient_name?: string | null
          resend_email_id?: string | null
          sender_email?: string | null
          sent_at?: string | null
          session_id?: string | null
          status?: string | null
          subject: string
          user_id?: string | null
        }
        Update: {
          body?: string
          conversation_id?: string | null
          created_at?: string
          demo_session_id?: string | null
          error_message?: string | null
          id?: string
          intent?: string | null
          is_demo?: boolean | null
          lead_id?: string | null
          metadata?: Json | null
          provider?: string | null
          provider_payload?: Json | null
          recipient_email?: string
          recipient_name?: string | null
          resend_email_id?: string | null
          sender_email?: string | null
          sent_at?: string | null
          session_id?: string | null
          status?: string | null
          subject?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_settings: {
        Row: {
          created_at: string
          email_body_template: string | null
          email_enabled: boolean | null
          email_subject_template: string | null
          gmail_access_token: string | null
          gmail_connected: boolean | null
          gmail_email: string | null
          gmail_refresh_token: string | null
          gmail_token_expires_at: string | null
          id: string
          schedule_delay_minutes: number | null
          send_after_conversation: boolean | null
          send_on_schedule: boolean | null
          send_to_qualified_leads: boolean | null
          updated_at: string
          use_ai_personalization: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email_body_template?: string | null
          email_enabled?: boolean | null
          email_subject_template?: string | null
          gmail_access_token?: string | null
          gmail_connected?: boolean | null
          gmail_email?: string | null
          gmail_refresh_token?: string | null
          gmail_token_expires_at?: string | null
          id?: string
          schedule_delay_minutes?: number | null
          send_after_conversation?: boolean | null
          send_on_schedule?: boolean | null
          send_to_qualified_leads?: boolean | null
          updated_at?: string
          use_ai_personalization?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          email_body_template?: string | null
          email_enabled?: boolean | null
          email_subject_template?: string | null
          gmail_access_token?: string | null
          gmail_connected?: boolean | null
          gmail_email?: string | null
          gmail_refresh_token?: string | null
          gmail_token_expires_at?: string | null
          id?: string
          schedule_delay_minutes?: number | null
          send_after_conversation?: boolean | null
          send_on_schedule?: boolean | null
          send_to_qualified_leads?: boolean | null
          updated_at?: string
          use_ai_personalization?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      form_schemas: {
        Row: {
          created_at: string
          dom_snapshot: string | null
          domain: string
          fingerprint: string
          id: string
          kind: string
          schema: Json
          session_id: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          dom_snapshot?: string | null
          domain: string
          fingerprint: string
          id?: string
          kind: string
          schema: Json
          session_id: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          dom_snapshot?: string | null
          domain?: string
          fingerprint?: string
          id?: string
          kind?: string
          schema?: Json
          session_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_schemas_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "demo_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          created_at: string
          description: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          is_featured: boolean | null
          logo_url: string | null
          name: string
          updated_at: string
          website_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          logo_url?: string | null
          name: string
          updated_at?: string
          website_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          logo_url?: string | null
          name?: string
          updated_at?: string
          website_url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          custom_system_prompt: string | null
          email: string
          full_name: string | null
          hide_neo_branding: boolean | null
          id: string
          last_usage_reset: string | null
          logo_url: string | null
          prompt_template: string | null
          selected_voice: string | null
          show_as_partner: boolean | null
          stripe_customer_id: string | null
          subscription_end: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string
          used_minutes: number | null
          user_id: string
          voice: string | null
          voice_speed: number | null
          website_url: string | null
          widget_config: Json | null
          widget_installed_at: string | null
          widget_installed_domain: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          custom_system_prompt?: string | null
          email: string
          full_name?: string | null
          hide_neo_branding?: boolean | null
          id?: string
          last_usage_reset?: string | null
          logo_url?: string | null
          prompt_template?: string | null
          selected_voice?: string | null
          show_as_partner?: boolean | null
          stripe_customer_id?: string | null
          subscription_end?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          used_minutes?: number | null
          user_id: string
          voice?: string | null
          voice_speed?: number | null
          website_url?: string | null
          widget_config?: Json | null
          widget_installed_at?: string | null
          widget_installed_domain?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          custom_system_prompt?: string | null
          email?: string
          full_name?: string | null
          hide_neo_branding?: boolean | null
          id?: string
          last_usage_reset?: string | null
          logo_url?: string | null
          prompt_template?: string | null
          selected_voice?: string | null
          show_as_partner?: boolean | null
          stripe_customer_id?: string | null
          subscription_end?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          used_minutes?: number | null
          user_id?: string
          voice?: string | null
          voice_speed?: number | null
          website_url?: string | null
          widget_config?: Json | null
          widget_installed_at?: string | null
          widget_installed_domain?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      voice_sessions: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          messages_count: number | null
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          messages_count?: number | null
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          messages_count?: number | null
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workflow_runs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          raw_payload: Json | null
          result: string | null
          run_date: string
          user_id: string
          workflow_name: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          raw_payload?: Json | null
          result?: string | null
          run_date?: string
          user_id: string
          workflow_name: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          raw_payload?: Json | null
          result?: string | null
          run_date?: string
          user_id?: string
          workflow_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_demo_session: {
        Args: { session_id: string; token: string }
        Returns: boolean
      }
      get_demo_session_safe: {
        Args: { session_id: string; token: string }
        Returns: {
          company_name: string
          created_at: string
          id: string
          language: string
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hash_api_key: { Args: { key: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
