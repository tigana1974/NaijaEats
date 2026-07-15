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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          country: Database["public"]["Enums"]["country_code"]
          created_at: string
          id: string
          is_default: boolean
          label: string | null
          latitude: number | null
          line1: string
          line2: string | null
          longitude: number | null
          postcode: string | null
          user_id: string
        }
        Insert: {
          city: string
          country: Database["public"]["Enums"]["country_code"]
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          latitude?: number | null
          line1: string
          line2?: string | null
          longitude?: number | null
          postcode?: string | null
          user_id: string
        }
        Update: {
          city?: string
          country?: Database["public"]["Enums"]["country_code"]
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          latitude?: number | null
          line1?: string
          line2?: string | null
          longitude?: number | null
          postcode?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_access_codes: {
        Row: {
          active: boolean
          code: string
          country: Database["public"]["Enums"]["country_code"]
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          label: string | null
          last_used_at: string | null
          use_count: number
        }
        Insert: {
          active?: boolean
          code: string
          country: Database["public"]["Enums"]["country_code"]
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          label?: string | null
          last_used_at?: string | null
          use_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          country?: Database["public"]["Enums"]["country_code"]
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          label?: string | null
          last_used_at?: string | null
          use_count?: number
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          country: Database["public"]["Enums"]["country_code"] | null
          created_at: string
          details: Json | null
          id: string
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          country?: Database["public"]["Enums"]["country_code"] | null
          created_at?: string
          details?: Json | null
          id?: string
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          country?: Database["public"]["Enums"]["country_code"] | null
          created_at?: string
          details?: Json | null
          id?: string
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_members: {
        Row: {
          created_at: string
          created_by: string | null
          is_parent: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          is_parent?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          is_parent?: boolean
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          customer_id: string
          customer_unread: number
          id: string
          last_message: string | null
          last_message_at: string | null
          last_sender_id: string | null
          updated_at: string
          vendor_id: string
          vendor_unread: number
        }
        Insert: {
          created_at?: string
          customer_id: string
          customer_unread?: number
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          last_sender_id?: string | null
          updated_at?: string
          vendor_id: string
          vendor_unread?: number
        }
        Update: {
          created_at?: string
          customer_id?: string
          customer_unread?: number
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          last_sender_id?: string | null
          updated_at?: string
          vendor_id?: string
          vendor_unread?: number
        }
        Relationships: [
          {
            foreignKeyName: "conversations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_settings: {
        Row: {
          base_fee: number
          country: Database["public"]["Enums"]["country_code"]
          free_delivery_threshold: number
          max_radius_km: number
          per_km_fee: number
          rider_cut_percentage: number
          surge_multiplier: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          base_fee: number
          country: Database["public"]["Enums"]["country_code"]
          free_delivery_threshold: number
          max_radius_km?: number
          per_km_fee: number
          rider_cut_percentage?: number
          surge_multiplier?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          base_fee?: number
          country?: Database["public"]["Enums"]["country_code"]
          free_delivery_threshold?: number
          max_radius_km?: number
          per_km_fee?: number
          rider_cut_percentage?: number
          surge_multiplier?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      chef_bookings: {
        Row: {
          chef_id: string
          created_at: string
          currency: string
          customer_id: string
          event_date: string
          guests: number | null
          hourly_rate: number
          hours: number
          id: string
          note: string | null
          start_time: string | null
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          chef_id: string
          created_at?: string
          currency: string
          customer_id: string
          event_date: string
          guests?: number | null
          hourly_rate: number
          hours: number
          id?: string
          note?: string | null
          start_time?: string | null
          status?: string
          total: number
          updated_at?: string
        }
        Update: {
          chef_id?: string
          created_at?: string
          currency?: string
          customer_id?: string
          event_date?: string
          guests?: number | null
          hourly_rate?: number
          hours?: number
          id?: string
          note?: string | null
          start_time?: string | null
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          created_at: string
          currency: string
          delivered_at: string | null
          dropoff_address: string | null
          fee: number
          id: string
          order_id: string
          picked_up_at: string | null
          pickup_address: string | null
          rider_id: string | null
          rider_lat: number | null
          rider_lng: number | null
          rider_location_at: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency: string
          delivered_at?: string | null
          dropoff_address?: string | null
          fee?: number
          id?: string
          order_id: string
          picked_up_at?: string | null
          pickup_address?: string | null
          rider_id?: string | null
          rider_lat?: number | null
          rider_lng?: number | null
          rider_location_at?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          delivered_at?: string | null
          dropoff_address?: string | null
          fee?: number
          id?: string
          order_id?: string
          picked_up_at?: string | null
          pickup_address?: string | null
          rider_id?: string | null
          rider_lat?: number | null
          rider_lng?: number | null
          rider_location_at?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category_id: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          is_featured: boolean
          meal_times: string[]
          name: string
          prep_time_minutes: number | null
          price: number
          spice_level: number | null
          stock: number | null
          tags: string[] | null
          unit: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          currency: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          meal_times?: string[]
          name: string
          prep_time_minutes?: number | null
          price: number
          spice_level?: number | null
          stock?: number | null
          tags?: string[] | null
          unit?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          meal_times?: string[]
          name?: string
          prep_time_minutes?: number | null
          price?: number
          spice_level?: number | null
          stock?: number | null
          tags?: string[] | null
          unit?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          image_url: string | null
          read_at: string | null
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          read_at?: string | null
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          read_at?: string | null
          reply_to_id?: string | null
          sender_id?: string
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
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_unread: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_unread?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_unread?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string | null
          name: string
          order_id: string
          price: number
          quantity: number
          subtotal: number
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          name: string
          order_id: string
          price: number
          quantity?: number
          subtotal: number
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          name?: string
          order_id?: string
          price?: number
          quantity?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          accepted_at: string | null
          cancelled_at: string | null
          created_at: string
          currency: string
          customer_id: string
          customer_note: string | null
          delivered_at: string | null
          delivery_address: string | null
          delivery_fee: number
          id: string
          payment_status: Database["public"]["Enums"]["order_payment_status"]
          ready_at: string | null
          scheduled_for: string | null
          status: Database["public"]["Enums"]["order_status"]
          subsidized_delivery_fee: number
          subtotal: number
          total: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          accepted_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          currency: string
          customer_id: string
          customer_note?: string | null
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_fee?: number
          id?: string
          payment_status?: Database["public"]["Enums"]["order_payment_status"]
          ready_at?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subsidized_delivery_fee?: number
          subtotal?: number
          total?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          accepted_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          customer_id?: string
          customer_note?: string | null
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_fee?: number
          id?: string
          payment_status?: Database["public"]["Enums"]["order_payment_status"]
          ready_at?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subsidized_delivery_fee?: number
          subtotal?: number
          total?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          order_id: string
          paid_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_reference: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          id?: string
          order_id: string
          paid_at?: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_reference: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          paid_at?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_reference?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          currency: string
          id: string
          payout_method: string | null
          processed_at: string | null
          processed_by: string | null
          requested_at: string
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          currency: string
          id?: string
          payout_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          payout_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          cash_on_delivery_enabled: boolean
          created_at: string
          default_commission_pct: number
          default_currency: string
          default_service_charge_pct: number
          id: number
          platform_name: string
          referral_program_enabled: boolean
          updated_at: string
          wallet_payments_enabled: boolean
        }
        Insert: {
          cash_on_delivery_enabled?: boolean
          created_at?: string
          default_commission_pct?: number
          default_currency?: string
          default_service_charge_pct?: number
          id?: number
          platform_name?: string
          referral_program_enabled?: boolean
          updated_at?: string
          wallet_payments_enabled?: boolean
        }
        Update: {
          cash_on_delivery_enabled?: boolean
          created_at?: string
          default_commission_pct?: number
          default_currency?: string
          default_service_charge_pct?: number
          id?: number
          platform_name?: string
          referral_program_enabled?: boolean
          updated_at?: string
          wallet_payments_enabled?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: Database["public"]["Enums"]["country_code"]
          created_at: string
          currency: string
          default_city: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          username: string | null
          vendor_plan: string
        }
        Insert: {
          avatar_url?: string | null
          country?: Database["public"]["Enums"]["country_code"]
          created_at?: string
          currency?: string
          default_city?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
          username?: string | null
          vendor_plan?: string
        }
        Update: {
          avatar_url?: string | null
          country?: Database["public"]["Enums"]["country_code"]
          created_at?: string
          currency?: string
          default_city?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          username?: string | null
          vendor_plan?: string
        }
        Relationships: []
      }
      rider_documents: {
        Row: {
          created_at: string
          doc_type: Database["public"]["Enums"]["rider_document_type"]
          file_name: string
          file_path: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          rider_id: string
          status: Database["public"]["Enums"]["vendor_document_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          doc_type: Database["public"]["Enums"]["rider_document_type"]
          file_name: string
          file_path: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rider_id: string
          status?: Database["public"]["Enums"]["vendor_document_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          doc_type?: Database["public"]["Enums"]["rider_document_type"]
          file_name?: string
          file_path?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rider_id?: string
          status?: Database["public"]["Enums"]["vendor_document_status"]
          updated_at?: string
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
      vendor_availability: {
        Row: {
          created_at: string
          date: string
          end_time: string
          id: string
          is_available: boolean
          start_time: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time?: string
          id?: string
          is_available?: boolean
          start_time?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          is_available?: boolean
          start_time?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_availability_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_documents: {
        Row: {
          created_at: string
          doc_type: Database["public"]["Enums"]["vendor_document_type"]
          file_name: string
          file_path: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["vendor_document_status"]
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          doc_type: Database["public"]["Enums"]["vendor_document_type"]
          file_name: string
          file_path: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["vendor_document_status"]
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          doc_type?: Database["public"]["Enums"]["vendor_document_type"]
          file_name?: string
          file_path?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["vendor_document_status"]
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_documents_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address_line: string | null
          city: string
          country: Database["public"]["Enums"]["country_code"]
          cover_image_url: string | null
          created_at: string
          cuisine: string[] | null
          currency: string
          delivery_fee: number | null
          description: string | null
          event_services: string | null
          hourly_rate: number | null
          id: string
          is_featured: boolean
          logo_url: string | null
          min_order: number | null
          name: string
          offers_free_delivery: boolean
          owner_id: string | null
          prep_time_minutes: number | null
          rating: number | null
          rating_count: number | null
          slug: string
          status: Database["public"]["Enums"]["vendor_status"]
          tagline: string | null
          type: Database["public"]["Enums"]["vendor_type"]
          updated_at: string
        }
        Insert: {
          address_line?: string | null
          city: string
          country: Database["public"]["Enums"]["country_code"]
          cover_image_url?: string | null
          created_at?: string
          cuisine?: string[] | null
          currency: string
          delivery_fee?: number | null
          description?: string | null
          event_services?: string | null
          hourly_rate?: number | null
          id?: string
          is_featured?: boolean
          logo_url?: string | null
          min_order?: number | null
          name: string
          offers_free_delivery?: boolean
          owner_id?: string | null
          prep_time_minutes?: number | null
          rating?: number | null
          rating_count?: number | null
          slug: string
          status?: Database["public"]["Enums"]["vendor_status"]
          tagline?: string | null
          type: Database["public"]["Enums"]["vendor_type"]
          updated_at?: string
        }
        Update: {
          address_line?: string | null
          city?: string
          country?: Database["public"]["Enums"]["country_code"]
          cover_image_url?: string | null
          created_at?: string
          cuisine?: string[] | null
          currency?: string
          delivery_fee?: number | null
          description?: string | null
          event_services?: string | null
          hourly_rate?: number | null
          id?: string
          is_featured?: boolean
          logo_url?: string | null
          min_order?: number | null
          name?: string
          offers_free_delivery?: boolean
          owner_id?: string | null
          prep_time_minutes?: number | null
          rating?: number | null
          rating_count?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["vendor_status"]
          tagline?: string | null
          type?: Database["public"]["Enums"]["vendor_type"]
          updated_at?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          city: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          role: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          email: string
          id?: string
          name?: string | null
          role: string
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          role?: string
        }
        Relationships: []
      }
      wallet_transfers: {
        Row: {
          amount: number
          claimed_at: string | null
          created_at: string
          id: string
          note: string | null
          recipient_id: string
          sender_id: string
          sender_name: string | null
          sender_username: string | null
        }
        Insert: {
          amount: number
          claimed_at?: string | null
          created_at?: string
          id?: string
          note?: string | null
          recipient_id: string
          sender_id: string
          sender_name?: string | null
          sender_username?: string | null
        }
        Update: {
          amount?: number
          claimed_at?: string | null
          created_at?: string
          id?: string
          note?: string | null
          recipient_id?: string
          sender_id?: string
          sender_name?: string | null
          sender_username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_admin_access_code: {
        Args: {
          p_country: Database["public"]["Enums"]["country_code"]
          p_label?: string
        }
        Returns: Json
      }
      create_order: {
        Args: {
          p_calculated_delivery_fee?: number
          p_customer_note?: string
          p_delivery_address?: string
          p_items: Json
          p_scheduled_for?: string
          p_vendor_id: string
        }
        Returns: string
      }
      get_my_admin_scope: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_customer_or_vendor_for_order: {
        Args: { _order_id: string }
        Returns: boolean
      }
      is_parent_admin: { Args: { _user_id: string }; Returns: boolean }
      is_rider_for_order: { Args: { _order_id: string }; Returns: boolean }
      mark_order_paid: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      log_admin_event: {
        Args: {
          p_action: string
          p_country?: Database["public"]["Enums"]["country_code"]
          p_details?: Json
        }
        Returns: undefined
      }
      redeem_admin_code: {
        Args: {
          p_code: string
          p_country: Database["public"]["Enums"]["country_code"]
        }
        Returns: Json
      }
      set_admin_code_active: {
        Args: { p_active: boolean; p_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "customer" | "vendor" | "rider" | "admin"
      country_code: "NG" | "UK"
      delivery_status:
        | "unassigned"
        | "assigned"
        | "picked_up"
        | "delivered"
        | "cancelled"
      order_payment_status: "unpaid" | "paid" | "refunded" | "failed"
      order_status:
        | "pending"
        | "accepted"
        | "preparing"
        | "ready"
        | "picked_up"
        | "delivered"
        | "cancelled"
      payment_provider: "paystack" | "stripe"
      payment_status: "pending" | "success" | "failed" | "refunded"
      payout_status: "requested" | "processing" | "paid" | "rejected"
      rider_document_type:
        | "drivers_license"
        | "vehicle_registration"
        | "insurance"
        | "id_document"
        | "background_check"
        | "other"
      vendor_document_status: "pending" | "verified" | "rejected"
      vendor_document_type:
        | "business_registration"
        | "id_document"
        | "health_permit"
        | "food_safety_certificate"
        | "other"
      vendor_status: "pending" | "approved" | "suspended"
      vendor_type: "restaurant" | "chef" | "grocery"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["customer", "vendor", "rider", "admin"],
      country_code: ["NG", "UK"],
      delivery_status: [
        "unassigned",
        "assigned",
        "picked_up",
        "delivered",
        "cancelled",
      ],
      order_payment_status: ["unpaid", "paid", "refunded", "failed"],
      order_status: [
        "pending",
        "accepted",
        "preparing",
        "ready",
        "picked_up",
        "delivered",
        "cancelled",
      ],
      payment_provider: ["paystack", "stripe"],
      payment_status: ["pending", "success", "failed", "refunded"],
      payout_status: ["requested", "processing", "paid", "rejected"],
      rider_document_type: [
        "drivers_license",
        "vehicle_registration",
        "insurance",
        "id_document",
        "background_check",
        "other",
      ],
      vendor_document_status: ["pending", "verified", "rejected"],
      vendor_document_type: [
        "business_registration",
        "id_document",
        "health_permit",
        "food_safety_certificate",
        "other",
      ],
      vendor_status: ["pending", "approved", "suspended"],
      vendor_type: ["restaurant", "chef", "grocery"],
    },
  },
} as const
