/**
 * Hand-written Supabase database types matching db/schema.sql.
 * Regenerate with `supabase gen types typescript` once the project is linked.
 */

export type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      clubs: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: "driver" | "wood" | "hybrid" | "iron" | "wedge" | "putter";
          loft: number | null;
          position: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: "driver" | "wood" | "hybrid" | "iron" | "wedge" | "putter";
          loft?: number | null;
          position?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clubs"]["Insert"]>;
        Relationships: [];
      };
      club_yardages: {
        Row: {
          id: string;
          club_id: string;
          swing_pct: 100 | 75 | 50 | 25;
          yardage: number;
          notes: string | null;
        };
        Insert: {
          id?: string;
          club_id: string;
          swing_pct: 100 | 75 | 50 | 25;
          yardage: number;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["club_yardages"]["Insert"]>;
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          city: string | null;
          country: string | null;
          par_total: number;
          tees_label: string;
          slope_rating: number;
          course_rating: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["courses"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["courses"]["Insert"]>;
        Relationships: [];
      };
      holes: {
        Row: {
          id: string;
          course_id: string;
          hole_number: number;
          par: number;
          yardage: number;
          handicap_index: number;
        };
        Insert: Omit<Database["public"]["Tables"]["holes"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["holes"]["Insert"]>;
        Relationships: [];
      };
      rounds: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          played_at: string;
          tees_played: string | null;
          weather_summary: string | null;
          notes: string | null;
          total_strokes: number;
          score_differential: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["rounds"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["rounds"]["Insert"]>;
        Relationships: [];
      };
      scorecard_entries: {
        Row: {
          id: string;
          round_id: string;
          hole_number: number;
          strokes: number;
          putts: number;
          fairway_hit: boolean | null;
          green_in_regulation: boolean;
          sand_save: boolean;
          penalties: number;
          notes: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["scorecard_entries"]["Row"], "id"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["scorecard_entries"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      club_type: "driver" | "wood" | "hybrid" | "iron" | "wedge" | "putter";
    };
    CompositeTypes: Record<string, never>;
  };
};
