export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type MasterTables = {
  product_categories: { Row: { id: string; name: string; description: string | null; is_active: boolean; created_at: string; updated_at: string }; Insert: { id?: string; name: string; description?: string | null; is_active?: boolean; created_at?: string; updated_at?: string }; Update: Partial<MasterTables['product_categories']['Insert']>; Relationships: [] }
  suppliers: { Row: { id: string; name: string; contact_name: string | null; phone: string | null; address: string | null; is_active: boolean; created_at: string; updated_at: string }; Insert: { id?: string; name: string; contact_name?: string | null; phone?: string | null; address?: string | null; is_active?: boolean; created_at?: string; updated_at?: string }; Update: Partial<MasterTables['suppliers']['Insert']>; Relationships: [] }
  units: { Row: { id: string; name: string; abbreviation: string; conversion_factor: number; is_active: boolean; created_at: string; updated_at: string }; Insert: { id?: string; name: string; abbreviation: string; conversion_factor?: number; is_active?: boolean; created_at?: string; updated_at?: string }; Update: Partial<MasterTables['units']['Insert']>; Relationships: [] }
  products: { Row: { id: string; name: string; sku: string; category_id: string | null; supplier_id: string | null; unit_id: string | null; purchase_price: number; selling_price: number; minimum_stock: number; stock: number; is_active: boolean; created_at: string; updated_at: string }; Insert: { id?: string; name: string; sku?: string; category_id?: string | null; supplier_id?: string | null; unit_id?: string | null; purchase_price?: number; selling_price?: number; minimum_stock?: number; stock?: number; is_active?: boolean; created_at?: string; updated_at?: string }; Update: Partial<MasterTables['products']['Insert']>; Relationships: [] }
}

export type Database = {
  public: {
    Tables: MasterTables & {
      transactions: { Row: { id: string; transaction_number: string; cashier_id: string; payment_method: string; subtotal: number; discount: number; total: number; status: string; created_at: string }; Insert: { id?: string; transaction_number: string; cashier_id: string; payment_method: string; subtotal: number; discount?: number; total: number; status?: string; created_at?: string }; Update: Partial<Database['public']['Tables']['transactions']['Insert']>; Relationships: [] }
      transaction_items: { Row: { id: string; transaction_id: string; product_id: string; product_name: string; quantity: number; unit_price: number; line_total: number; allocations: Json; created_at: string }; Insert: { id?: string; transaction_id: string; product_id: string; product_name: string; quantity: number; unit_price: number; line_total: number; allocations?: Json; created_at?: string }; Update: Partial<Database['public']['Tables']['transaction_items']['Insert']>; Relationships: [{ foreignKeyName: 'transaction_items_transaction_id_fkey'; columns: ['transaction_id']; isOneToOne: false; referencedRelation: 'transactions'; referencedColumns: ['id'] }] }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type TransactionRow = Database['public']['Tables']['transactions']['Row']
export type TransactionItemRow = Database['public']['Tables']['transaction_items']['Row']
