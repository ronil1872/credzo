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
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string;
          full_name: string;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id: string;
          full_name: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          full_name?: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
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
          organization_id: string;
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
export type LeadNote = Database['public']['Tables']['lead_notes']['Row'];
export type FollowUp = Database['public']['Tables']['follow_ups']['Row'];
export type Campaign = Database['public']['Tables']['campaigns']['Row'];
export type LeadEvent = Database['public']['Tables']['lead_events']['Row'];
export type CalculatorSession = Database['public']['Tables']['calculator_sessions']['Row'];

// Convenience Insert Types
export type LeadInsert = Database['public']['Tables']['leads']['Insert'];
export type LeadNoteInsert = Database['public']['Tables']['lead_notes']['Insert'];
export type FollowUpInsert = Database['public']['Tables']['follow_ups']['Insert'];
export type LeadEventInsert = Database['public']['Tables']['lead_events']['Insert'];
export type CalculatorSessionInsert = Database['public']['Tables']['calculator_sessions']['Insert'];
