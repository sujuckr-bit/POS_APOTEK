export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      transactions: {
        Row: { id: string; transaction_number: string; cashier_id: string; payment_method: string; subtotal: number; discount: number; total: number; status: string; created_at: string }
        Insert: { id?: string; transaction_number: string; cashier_id: string; payment_method: string; subtotal: number; discount?: number; total: number; status?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
        Relationships: []
      }
      transaction_items: {
        Row: { id: string; transaction_id: string; product_id: string; product_name: string; quantity: number; unit_price: number; line_total: number; allocations: Json; created_at: string }
        Insert: { id?: string; transaction_id: string; product_id: string; product_name: string; quantity: number; unit_price: number; line_total: number; allocations?: Json; created_at?: string }
        Update: Partial<Database['public']['Tables']['transaction_items']['Insert']>
        Relationships: [{ foreignKeyName: 'transaction_items_transaction_id_fkey'; columns: ['transaction_id']; isOneToOne: false; referencedRelation: 'transactions'; referencedColumns: ['id'] }]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type TransactionRow = Database['public']['Tables']['transactions']['Row']
export type TransactionItemRow = Database['public']['Tables']['transaction_items']['Row']
