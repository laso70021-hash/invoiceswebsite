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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "legacy_invoices_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_team_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          owner_id: string
          target_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          owner_id: string
          target_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          owner_id?: string
          target_id?: string | null
        }
        Relationships: []
      }
      business_team_invites: {
        Row: {
          email: string
          expires_at: string
          id: string
          owner_id: string
          role: string
        }
        Insert: {
          email: string
          expires_at?: string
          id?: string
          owner_id: string
          role: string
        }
        Update: {
          email?: string
          expires_at?: string
          id?: string
          owner_id?: string
          role?: string
        }
        Relationships: []
      }
      business_team_members: {
        Row: {
          joined_at: string
          member_id: string
          owner_id: string
          role: string
        }
        Insert: {
          joined_at?: string
          member_id: string
          owner_id: string
          role: string
        }
        Update: {
          joined_at?: string
          member_id?: string
          owner_id?: string
          role?: string
        }
        Relationships: []
      }
      catalog_items: {
        Row: {
          created_at: string
          id: string
          kind: string
          low_stock: number
          name: string
          price: number
          stock: number
          unit: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          low_stock?: number
          name: string
          price?: number
          stock?: number
          unit?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          low_stock?: number
          name?: string
          price?: number
          stock?: number
          unit?: string | null
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          user_id?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      document_items: {
        Row: {
          amount: number
          description: string
          discount_percent: number
          document_id: string
          id: string
          quantity: number
          sort_order: number
          tax_percent: number
          unit_price: number
        }
        Insert: {
          amount?: number
          description: string
          discount_percent?: number
          document_id: string
          id?: string
          quantity?: number
          sort_order?: number
          tax_percent?: number
          unit_price?: number
        }
        Update: {
          amount?: number
          description?: string
          discount_percent?: number
          document_id?: string
          id?: string
          quantity?: number
          sort_order?: number
          tax_percent?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_items_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legacy_invoices_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          name: string
          preview_image_url: string | null
          primary_color: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          is_published?: boolean
          name: string
          preview_image_url?: string | null
          primary_color?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          name?: string
          preview_image_url?: string | null
          primary_color?: string
        }
        Relationships: []
      }
      document_types: {
        Row: {
          category: string
          created_at: string
          description: string
          editor_mode: string
          icon_name: string
          id: string
          is_popular: boolean
          name: string
          slug: string
          status: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          editor_mode: string
          icon_name: string
          id: string
          is_popular?: boolean
          name: string
          slug: string
          status?: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          editor_mode?: string
          icon_name?: string
          id?: string
          is_popular?: boolean
          name?: string
          slug?: string
          status?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          currency: string
          due_date: string | null
          id: string
          invoice_id: string | null
          issue_date: string
          items: Json
          kind: string
          notes: string | null
          number: string | null
          party_details: string | null
          party_name: string
          share_token: string | null
          status: string
          subtotal: number
          tax: number
          tax_rate: number
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_id?: string | null
          issue_date?: string
          items?: Json
          kind: string
          notes?: string | null
          number?: string | null
          party_details?: string | null
          party_name: string
          share_token?: string | null
          status?: string
          subtotal?: number
          tax?: number
          tax_rate?: number
          total?: number
          user_id?: string
        }
        Update: {
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_id?: string | null
          issue_date?: string
          items?: Json
          kind?: string
          notes?: string | null
          number?: string | null
          party_details?: string | null
          party_name?: string
          share_token?: string | null
          status?: string
          subtotal?: number
          tax?: number
          tax_rate?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          id: string
          spent_on: string
          supplier_id: string | null
          tax: number
          user_id: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          spent_on?: string
          supplier_id?: string | null
          tax?: number
          user_id?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          spent_on?: string
          supplier_id?: string | null
          tax?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_supplier_id_fkey1"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_shares: {
        Row: {
          created_at: string
          invoice_id: string
          owner_id: string
          public_enabled: boolean
          recipient_id: string | null
          token: string
        }
        Insert: {
          created_at?: string
          invoice_id: string
          owner_id: string
          public_enabled?: boolean
          recipient_id?: string | null
          token?: string
        }
        Update: {
          created_at?: string
          invoice_id?: string
          owner_id?: string
          public_enabled?: boolean
          recipient_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_shares_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: true
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          created_at: string
          currency: string
          customer_id: string | null
          due_date: string | null
          id: string
          issue_date: string
          items: Json
          notes: string | null
          number: string | null
          status: string
          subtotal: number
          tax: number
          tax_rate: number
          total: number
          user_id: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          currency?: string
          customer_id?: string | null
          due_date?: string | null
          id?: string
          issue_date?: string
          items?: Json
          notes?: string | null
          number?: string | null
          status?: string
          subtotal?: number
          tax?: number
          tax_rate?: number
          total?: number
          user_id?: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          currency?: string
          customer_id?: string | null
          due_date?: string | null
          id?: string
          issue_date?: string
          items?: Json
          notes?: string | null
          number?: string | null
          status?: string
          subtotal?: number
          tax?: number
          tax_rate?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_invoices_customers: {
        Row: {
          address: string
          balance: number
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          tax_number: string | null
          total_collected: number
          total_invoiced: number
          updated_at: string
        }
        Insert: {
          address: string
          balance?: number
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          tax_number?: string | null
          total_collected?: number
          total_invoiced?: number
          updated_at?: string
        }
        Update: {
          address?: string
          balance?: number
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          tax_number?: string | null
          total_collected?: number
          total_invoiced?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_invoices_documents: {
        Row: {
          amount_paid: number
          balance_due: number
          converted_from_id: string | null
          created_at: string
          currency: string
          currency_symbol: string
          customer_address: string | null
          customer_email: string
          customer_id: string | null
          customer_name: string
          customer_tax_number: string | null
          discount_total: number
          document_number: string
          due_date: string | null
          id: string
          issue_date: string
          logo_position: string
          logo_size: string
          logo_url: string | null
          notes: string | null
          organization_id: string
          payment_instructions: string | null
          payment_terms: string
          pdf_storage_path: string | null
          primary_color: string
          rich_text_content: string | null
          status: string
          subtotal: number
          tax_total: number
          template_id: string
          title: string
          total: number
          type: string
          updated_at: string
          version: number
        }
        Insert: {
          amount_paid?: number
          balance_due?: number
          converted_from_id?: string | null
          created_at?: string
          currency?: string
          currency_symbol?: string
          customer_address?: string | null
          customer_email: string
          customer_id?: string | null
          customer_name: string
          customer_tax_number?: string | null
          discount_total?: number
          document_number: string
          due_date?: string | null
          id?: string
          issue_date?: string
          logo_position?: string
          logo_size?: string
          logo_url?: string | null
          notes?: string | null
          organization_id: string
          payment_instructions?: string | null
          payment_terms?: string
          pdf_storage_path?: string | null
          primary_color?: string
          rich_text_content?: string | null
          status: string
          subtotal?: number
          tax_total?: number
          template_id?: string
          title: string
          total?: number
          type: string
          updated_at?: string
          version?: number
        }
        Update: {
          amount_paid?: number
          balance_due?: number
          converted_from_id?: string | null
          created_at?: string
          currency?: string
          currency_symbol?: string
          customer_address?: string | null
          customer_email?: string
          customer_id?: string | null
          customer_name?: string
          customer_tax_number?: string | null
          discount_total?: number
          document_number?: string
          due_date?: string | null
          id?: string
          issue_date?: string
          logo_position?: string
          logo_size?: string
          logo_url?: string | null
          notes?: string | null
          organization_id?: string
          payment_instructions?: string | null
          payment_terms?: string
          pdf_storage_path?: string | null
          primary_color?: string
          rich_text_content?: string | null
          status?: string
          subtotal?: number
          tax_total?: number
          template_id?: string
          title?: string
          total?: number
          type?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_converted_from_id_fkey"
            columns: ["converted_from_id"]
            isOneToOne: false
            referencedRelation: "legacy_invoices_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "legacy_invoices_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_type_fkey"
            columns: ["type"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_invoices_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          expense_number: string
          id: string
          organization_id: string
          payment_method: string
          receipt_url: string | null
          supplier_id: string | null
          title: string
          vendor: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          expense_number: string
          id?: string
          organization_id: string
          payment_method?: string
          receipt_url?: string | null
          supplier_id?: string | null
          title: string
          vendor: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          expense_number?: string
          id?: string
          organization_id?: string
          payment_method?: string
          receipt_url?: string | null
          supplier_id?: string | null
          title?: string
          vendor?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "legacy_invoices_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_invoices_payments: {
        Row: {
          amount: number
          created_at: string
          customer_name: string
          date: string
          document_id: string | null
          id: string
          invoice_number: string
          method: string
          organization_id: string
          payment_number: string
          receipt_document_id: string | null
          reference_number: string | null
          status: string
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_name: string
          date?: string
          document_id?: string | null
          id?: string
          invoice_number: string
          method: string
          organization_id: string
          payment_number: string
          receipt_document_id?: string | null
          reference_number?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_name?: string
          date?: string
          document_id?: string | null
          id?: string
          invoice_number?: string
          method?: string
          organization_id?: string
          payment_number?: string
          receipt_document_id?: string | null
          reference_number?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legacy_invoices_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_receipt_document_id_fkey"
            columns: ["receipt_document_id"]
            isOneToOne: false
            referencedRelation: "legacy_invoices_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_invoices_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_platform_admin: boolean
          phone: string | null
          preferred_currency: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_platform_admin?: boolean
          phone?: string | null
          preferred_currency?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_platform_admin?: boolean
          phone?: string | null
          preferred_currency?: string
          updated_at?: string
        }
        Relationships: []
      }
      legacy_invoices_suppliers: {
        Row: {
          address: string | null
          balance_due: number
          category: string
          contact_person: string | null
          created_at: string
          email: string
          id: string
          name: string
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          balance_due?: number
          category?: string
          contact_person?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          balance_due?: number
          category?: string
          contact_person?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invitation_token: string
          organization_id: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invitation_token?: string
          organization_id: string
          role: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          organization_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "legacy_invoices_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          account_number: string | null
          address: string
          bank_name: string | null
          country: string
          created_at: string
          currency: string
          currency_symbol: string
          default_tax_rate: number
          email: string
          id: string
          invoice_prefix: string
          logo_position: string
          logo_size: string
          logo_url: string | null
          mobile_money_number: string | null
          name: string
          phone: string | null
          primary_color: string
          slug: string
          subscription_status: string
          tax_number: string | null
          terms_and_conditions: string | null
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          address: string
          bank_name?: string | null
          country?: string
          created_at?: string
          currency?: string
          currency_symbol?: string
          default_tax_rate?: number
          email: string
          id?: string
          invoice_prefix?: string
          logo_position?: string
          logo_size?: string
          logo_url?: string | null
          mobile_money_number?: string | null
          name: string
          phone?: string | null
          primary_color?: string
          slug: string
          subscription_status?: string
          tax_number?: string | null
          terms_and_conditions?: string | null
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          address?: string
          bank_name?: string | null
          country?: string
          created_at?: string
          currency?: string
          currency_symbol?: string
          default_tax_rate?: number
          email?: string
          id?: string
          invoice_prefix?: string
          logo_position?: string
          logo_size?: string
          logo_url?: string | null
          mobile_money_number?: string | null
          name?: string
          phone?: string | null
          primary_color?: string
          slug?: string
          subscription_status?: string
          tax_number?: string | null
          terms_and_conditions?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          method: string
          paid_on: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          method?: string
          paid_on?: string
          user_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: string
          paid_on?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          granted_at: string
          granted_by: string | null
          role: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          role: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_admins_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "legacy_invoices_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "legacy_invoices_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "legacy_invoices_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          organization_id: string
          sku: string | null
          status: string
          stock_quantity: number | null
          tax_rate: number
          type: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          name: string
          organization_id: string
          sku?: string | null
          status?: string
          stock_quantity?: number | null
          tax_rate?: number
          type: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          sku?: string | null
          status?: string
          stock_quantity?: number | null
          tax_rate?: number
          type?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          brand_color: string
          business_name: string | null
          created_at: string
          currency: string
          default_tax_rate: number
          document_customization: Json
          email: string | null
          full_name: string | null
          id: string
          logo_url: string | null
          payment_instructions: string | null
          phone: string | null
          suspended: boolean
          tax_id: string | null
          template_style: string
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          brand_color?: string
          business_name?: string | null
          created_at?: string
          currency?: string
          default_tax_rate?: number
          document_customization?: Json
          email?: string | null
          full_name?: string | null
          id: string
          logo_url?: string | null
          payment_instructions?: string | null
          phone?: string | null
          suspended?: boolean
          tax_id?: string | null
          template_style?: string
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          brand_color?: string
          business_name?: string | null
          created_at?: string
          currency?: string
          default_tax_rate?: number
          document_customization?: Json
          email?: string | null
          full_name?: string | null
          id?: string
          logo_url?: string | null
          payment_instructions?: string | null
          phone?: string | null
          suspended?: boolean
          tax_id?: string | null
          template_style?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      recurring_invoices: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          customer_id: string
          every: string
          id: string
          items: Json
          next_date: string
          subtotal: number
          tax: number
          tax_rate: number
          total: number
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          customer_id: string
          every?: string
          id?: string
          items?: Json
          next_date?: string
          subtotal?: number
          tax?: number
          tax_rate?: number
          total?: number
          user_id?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          customer_id?: string
          every?: string
          id?: string
          items?: Json
          next_date?: string
          subtotal?: number
          tax?: number
          tax_rate?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_profiles: {
        Row: {
          amount: number
          created_at: string
          customer_id: string | null
          customer_name: string
          frequency: string
          id: string
          last_generated_at: string | null
          next_billing_date: string
          organization_id: string
          profile_number: string
          service_description: string
          status: string
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          customer_name: string
          frequency: string
          id?: string
          last_generated_at?: string | null
          next_billing_date: string
          organization_id: string
          profile_number: string
          service_description: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          frequency?: string
          id?: string
          last_generated_at?: string | null
          next_billing_date?: string
          organization_id?: string
          profile_number?: string
          service_description?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_profiles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "legacy_invoices_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          amount: number
          converted_invoice_id: string | null
          created_at: string
          customer_id: string | null
          customer_name: string
          date: string
          expected_delivery: string | null
          id: string
          items_count: number
          order_number: string
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          converted_invoice_id?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name: string
          date?: string
          expected_delivery?: string | null
          id?: string
          items_count?: number
          order_number: string
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          converted_invoice_id?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          date?: string
          expected_delivery?: string | null
          id?: string
          items_count?: number
          order_number?: string
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_converted_invoice_id_fkey"
            columns: ["converted_invoice_id"]
            isOneToOne: false
            referencedRelation: "legacy_invoices_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "legacy_invoices_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          currency: string
          document_quota: number
          features: Json
          id: string
          is_active: boolean
          is_popular: boolean
          monthly_price: number
          name: string
          tagline: string | null
          team_quota: number
          yearly_price: number
        }
        Insert: {
          created_at?: string
          currency?: string
          document_quota?: number
          features?: Json
          id: string
          is_active?: boolean
          is_popular?: boolean
          monthly_price?: number
          name: string
          tagline?: string | null
          team_quota?: number
          yearly_price?: number
        }
        Update: {
          created_at?: string
          currency?: string
          document_quota?: number
          features?: Json
          id?: string
          is_active?: boolean
          is_popular?: boolean
          monthly_price?: number
          name?: string
          tagline?: string | null
          team_quota?: number
          yearly_price?: number
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          user_id?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_users: {
        Args: never
        Returns: {
          business_name: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_admin: boolean
          suspended: boolean
        }[]
      }
      admin_set_admin: {
        Args: { _user: string; _value: boolean }
        Returns: undefined
      }
      admin_set_suspended: {
        Args: { _user: string; _value: boolean }
        Returns: undefined
      }
      create_invoice_share: {
        Args: { _invoice: string; _public: boolean; _recipient_email: string }
        Returns: string
      }
      get_shared_document: {
        Args: { _token: string }
        Returns: {
          business_name: string
          currency: string
          due_date: string
          issue_date: string
          items: Json
          kind: string
          notes: string
          number: string
          party_details: string
          party_name: string
          status: string
          subtotal: number
          tax: number
          tax_rate: number
          total: number
        }[]
      }
      get_shared_invoice: { Args: { _token: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active: { Args: { _uid: string }; Returns: boolean }
      is_org_member: { Args: { org_id: string }; Returns: boolean }
      manage_team: {
        Args: {
          _action: string
          _email?: string
          _role?: string
          _target?: string
        }
        Returns: Json
      }
      received_invoices: { Args: never; Returns: Json }
      respond_shared_document: {
        Args: { _accept: boolean; _token: string }
        Returns: string
      }
      revoke_invoice_share: { Args: { _invoice: string }; Returns: undefined }
      run_recurring_invoices: { Args: { _only_me?: boolean }; Returns: number }
      team_financial_records: { Args: { _owner: string }; Returns: Json }
      team_overview: { Args: never; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
