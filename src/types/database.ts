export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'OWNER' | 'ADMIN' | 'STAFF';

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'INTERESTED'
  | 'DOCUMENTS'
  | 'APPLICATION'
  | 'APPROVED'
  | 'DISBURSED'
  | 'LOST';

export type LeadScore = 'HOT' | 'WARM' | 'COLD';

export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string;
          full_name: string;
          role: UserRole;
          mobile: string | null;
          is_active: boolean;
          must_change_password?: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id: string;
          full_name: string;
          role?: UserRole;
          mobile?: string | null;
          is_active?: boolean;
          must_change_password?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          full_name?: string;
          role?: UserRole;
          mobile?: string | null;
          is_active?: boolean;
          must_change_password?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          }
        ];
      };
      leads: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          mobile: string;
          city: string | null;
          loan_type: string;
          requested_amount: number;
          approved_amount: number;
          disbursed_amount: number;
          monthly_income: number | null;
          existing_emi: number | null;
          employment_type: string | null;
          preferred_callback_date: string | null;
          preferred_callback_time: string | null;
          lead_score: LeadScore;
          lead_score_reason: string | null;
          status: LeadStatus;
          assigned_to: string | null;
          lead_source: string;
          campaign: string | null;
          ad: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_term: string | null;
          consent_given: boolean;
          consent_timestamp: string | null;
          calculated_emi: number | null;
          estimated_interest: number | null;
          estimated_total_repayment: number | null;
          illustrative_interest_rate: number | null;
          loan_tenure_months: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string;
          name: string;
          mobile: string;
          city?: string | null;
          loan_type: string;
          requested_amount: number;
          approved_amount?: number;
          disbursed_amount?: number;
          monthly_income?: number | null;
          existing_emi?: number | null;
          employment_type?: string | null;
          preferred_callback_date?: string | null;
          preferred_callback_time?: string | null;
          lead_score?: LeadScore;
          lead_score_reason?: string | null;
          status?: LeadStatus;
          assigned_to?: string | null;
          lead_source?: string;
          campaign?: string | null;
          ad?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_term?: string | null;
          consent_given?: boolean;
          consent_timestamp?: string | null;
          calculated_emi?: number | null;
          estimated_interest?: number | null;
          estimated_total_repayment?: number | null;
          illustrative_interest_rate?: number | null;
          loan_tenure_months?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          mobile?: string;
          city?: string | null;
          loan_type?: string;
          requested_amount?: number;
          approved_amount?: number;
          disbursed_amount?: number;
          monthly_income?: number | null;
          existing_emi?: number | null;
          employment_type?: string | null;
          preferred_callback_date?: string | null;
          preferred_callback_time?: string | null;
          lead_score?: LeadScore;
          lead_score_reason?: string | null;
          status?: LeadStatus;
          assigned_to?: string | null;
          lead_source?: string;
          campaign?: string | null;
          ad?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_term?: string | null;
          consent_given?: boolean;
          consent_timestamp?: string | null;
          calculated_emi?: number | null;
          estimated_interest?: number | null;
          estimated_total_repayment?: number | null;
          illustrative_interest_rate?: number | null;
          loan_tenure_months?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'leads_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          }
        ];
      };
      lead_notes: {
        Row: {
          id: string;
          lead_id: string;
          organization_id: string;
          author_id: string | null;
          note: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          organization_id: string;
          author_id?: string | null;
          note: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          organization_id?: string;
          author_id?: string | null;
          note?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lead_notes_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: false;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lead_notes_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          }
        ];
      };
      follow_ups: {
        Row: {
          id: string;
          lead_id: string;
          organization_id: string;
          assigned_to: string | null;
          scheduled_at: string;
          completed_at: string | null;
          note: string | null;
          status: FollowUpStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          organization_id: string;
          assigned_to?: string | null;
          scheduled_at: string;
          completed_at?: string | null;
          note?: string | null;
          status?: FollowUpStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          organization_id?: string;
          assigned_to?: string | null;
          scheduled_at?: string;
          completed_at?: string | null;
          note?: string | null;
          status?: FollowUpStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'follow_ups_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: false;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'follow_ups_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          }
        ];
      };
      campaigns: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          source: string | null;
          medium: string | null;
          utm_campaign: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          source?: string | null;
          medium?: string | null;
          utm_campaign?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          source?: string | null;
          medium?: string | null;
          utm_campaign?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'campaigns_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          }
        ];
      };
      lead_events: {
        Row: {
          id: string;
          organization_id: string;
          lead_id: string;
          actor_id: string | null;
          event_type: string;
          old_status: string | null;
          new_status: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          lead_id: string;
          actor_id?: string | null;
          event_type: string;
          old_status?: string | null;
          new_status?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          lead_id?: string;
          actor_id?: string | null;
          event_type?: string;
          old_status?: string | null;
          new_status?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lead_events_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: false;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lead_events_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          }
        ];
      };
      calculator_sessions: {
        Row: {
          id: string;
          session_id: string | null;
          loan_type: string | null;
          loan_amount: number | null;
          interest_rate: number | null;
          tenure_months: number | null;
          calculated_emi: number | null;
          calculated_interest: number | null;
          calculated_repayment: number | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_term: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          loan_type?: string | null;
          loan_amount?: number | null;
          interest_rate?: number | null;
          tenure_months?: number | null;
          calculated_emi?: number | null;
          calculated_interest?: number | null;
          calculated_repayment?: number | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_term?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string | null;
          loan_type?: string | null;
          loan_amount?: number | null;
          interest_rate?: number | null;
          tenure_months?: number | null;
          calculated_emi?: number | null;
          calculated_interest?: number | null;
          calculated_repayment?: number | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_term?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      insurance_leads: {
        Row: {
          id: string;
          organization_id: string;
          full_name: string;
          mobile: string;
          email: string | null;
          insurance_type: string;
          city: string | null;
          preferred_callback_date: string | null;
          preferred_callback_time: string | null;
          message: string | null;
          status: LeadStatus;
          assigned_to: string | null;
          lead_source: string;
          campaign: string | null;
          ad: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_term: string | null;
          consent: boolean;
          consent_timestamp: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string;
          full_name: string;
          mobile: string;
          email?: string | null;
          insurance_type: string;
          city?: string | null;
          preferred_callback_date?: string | null;
          preferred_callback_time?: string | null;
          message?: string | null;
          status?: LeadStatus;
          assigned_to?: string | null;
          lead_source?: string;
          campaign?: string | null;
          ad?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_term?: string | null;
          consent?: boolean;
          consent_timestamp?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          full_name?: string;
          mobile?: string;
          email?: string | null;
          insurance_type?: string;
          city?: string | null;
          preferred_callback_date?: string | null;
          preferred_callback_time?: string | null;
          message?: string | null;
          status?: LeadStatus;
          assigned_to?: string | null;
          lead_source?: string;
          campaign?: string | null;
          ad?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_term?: string | null;
          consent?: boolean;
          consent_timestamp?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'insurance_leads_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          }
        ];
      };
      loan_interest_rates: {
        Row: {
          id: string;
          organization_id: string;
          loan_type: string;
          label: string;
          rate: number;
          min_amount: number;
          max_amount: number;
          default_amount: number;
          min_tenure_months: number;
          max_tenure_months: number;
          default_tenure_months: number;
          is_active: boolean;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          loan_type: string;
          label: string;
          rate: number;
          min_amount?: number;
          max_amount?: number;
          default_amount?: number;
          min_tenure_months?: number;
          max_tenure_months?: number;
          default_tenure_months?: number;
          is_active?: boolean;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          loan_type?: string;
          label?: string;
          rate?: number;
          min_amount?: number;
          max_amount?: number;
          default_amount?: number;
          min_tenure_months?: number;
          max_tenure_months?: number;
          default_tenure_months?: number;
          is_active?: boolean;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'loan_interest_rates_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          }
        ];
      };
      insurance_lead_notes: {
        Row: {
          id: string;
          insurance_lead_id: string;
          organization_id: string;
          author_id: string | null;
          note: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          insurance_lead_id: string;
          organization_id: string;
          author_id?: string | null;
          note: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          insurance_lead_id?: string;
          organization_id?: string;
          author_id?: string | null;
          note?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'insurance_lead_notes_insurance_lead_id_fkey';
            columns: ['insurance_lead_id'];
            isOneToOne: false;
            referencedRelation: 'insurance_leads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'insurance_lead_notes_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          }
        ];
      };
      insurance_follow_ups: {
        Row: {
          id: string;
          insurance_lead_id: string;
          organization_id: string;
          assigned_to: string | null;
          scheduled_at: string;
          completed_at: string | null;
          note: string | null;
          status: FollowUpStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          insurance_lead_id: string;
          organization_id: string;
          assigned_to?: string | null;
          scheduled_at: string;
          completed_at?: string | null;
          note?: string | null;
          status?: FollowUpStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          insurance_lead_id?: string;
          organization_id?: string;
          assigned_to?: string | null;
          scheduled_at?: string;
          completed_at?: string | null;
          note?: string | null;
          status?: FollowUpStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'insurance_follow_ups_insurance_lead_id_fkey';
            columns: ['insurance_lead_id'];
            isOneToOne: false;
            referencedRelation: 'insurance_leads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'insurance_follow_ups_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          }
        ];
      };
      staff_login_attempts: {
        Row: {
          id: string;
          email_hash: string;
          failed_attempts: number;
          locked_until: string | null;
          last_failed_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email_hash: string;
          failed_attempts?: number;
          locked_until?: string | null;
          last_failed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email_hash?: string;
          failed_attempts?: number;
          locked_until?: string | null;
          last_failed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          device_name: string | null;
          is_active: boolean;
          last_used_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
          device_name?: string | null;
          is_active?: boolean;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          user_agent?: string | null;
          device_name?: string | null;
          is_active?: boolean;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'push_subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'push_subscriptions_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          }
        ];
      };
      notification_logs: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          notification_type: string;
          title: string;
          body: string;
          url: string | null;
          data: Json | null;
          status: 'SENT' | 'FAILED' | 'PARTIAL';
          devices_targeted: number;
          devices_succeeded: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          notification_type: string;
          title: string;
          body: string;
          url?: string | null;
          data?: Json | null;
          status?: 'SENT' | 'FAILED' | 'PARTIAL';
          devices_targeted?: number;
          devices_succeeded?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string | null;
          notification_type?: string;
          title?: string;
          body?: string;
          url?: string | null;
          data?: Json | null;
          status?: 'SENT' | 'FAILED' | 'PARTIAL';
          devices_targeted?: number;
          devices_succeeded?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_logs_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_auth_organization_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_auth_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      internal_record_staff_login_failure: {
        Args: {
          p_email_hash: string;
        };
        Returns: {
          is_locked: boolean;
          failed_attempts: number;
          remaining_seconds?: number;
          locked_until?: string | null;
        };
      };
      upsert_push_subscription: {
        Args: {
          p_endpoint: string;
          p_p256dh: string;
          p_auth: string;
          p_user_agent?: string;
          p_device_name?: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      user_role: UserRole;
      lead_status: LeadStatus;
      lead_score: LeadScore;
      follow_up_status: FollowUpStatus;
    };
  };
}

// Convenience Row Types
export type Organization = Database['public']['Tables']['organizations']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Lead = Database['public']['Tables']['leads']['Row'];
export type InsuranceLead = Database['public']['Tables']['insurance_leads']['Row'];
export type LeadNote = Database['public']['Tables']['lead_notes']['Row'];
export type InsuranceLeadNote = Database['public']['Tables']['insurance_lead_notes']['Row'];
export type FollowUp = Database['public']['Tables']['follow_ups']['Row'];
export type InsuranceFollowUp = Database['public']['Tables']['insurance_follow_ups']['Row'];
export type Campaign = Database['public']['Tables']['campaigns']['Row'];
export type LeadEvent = Database['public']['Tables']['lead_events']['Row'];
export type CalculatorSession = Database['public']['Tables']['calculator_sessions']['Row'];
export type LoanInterestRate = Database['public']['Tables']['loan_interest_rates']['Row'];
export type PushSubscriptionRow = Database['public']['Tables']['push_subscriptions']['Row'];
export type NotificationLogRow = Database['public']['Tables']['notification_logs']['Row'];

// Convenience Insert Types
export type LeadInsert = Database['public']['Tables']['leads']['Insert'];
export type InsuranceLeadInsert = Database['public']['Tables']['insurance_leads']['Insert'];
export type LeadNoteInsert = Database['public']['Tables']['lead_notes']['Insert'];
export type InsuranceLeadNoteInsert = Database['public']['Tables']['insurance_lead_notes']['Insert'];
export type FollowUpInsert = Database['public']['Tables']['follow_ups']['Insert'];
export type InsuranceFollowUpInsert = Database['public']['Tables']['insurance_follow_ups']['Insert'];
export type LeadEventInsert = Database['public']['Tables']['lead_events']['Insert'];
export type CalculatorSessionInsert = Database['public']['Tables']['calculator_sessions']['Insert'];
export type LoanInterestRateInsert = Database['public']['Tables']['loan_interest_rates']['Insert'];
export type PushSubscriptionInsert = Database['public']['Tables']['push_subscriptions']['Insert'];
export type NotificationLogInsert = Database['public']['Tables']['notification_logs']['Insert'];



