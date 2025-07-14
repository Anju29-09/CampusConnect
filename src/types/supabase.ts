export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'admin' | 'student' | null;
          email: string | null;
          name: string | null;
        };
        Insert: {
          id: string;
          role?: 'admin' | 'student' | null;
          email?: string | null;
          name?: string | null;
        };
        Update: {
          role?: 'admin' | 'student' | null;
          email?: string | null;
          name?: string | null;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
