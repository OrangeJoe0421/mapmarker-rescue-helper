
export type Database = {
  public: {
    Tables: {
      emergency_services: {
        Row: {
          id: string
          name: string
          type: string
          latitude: number
          longitude: number
          address: string | null
          phone: string | null
          hours: string | null
          created_at: string
        }
        Insert: {
          id: string
          name: string
          type: string
          latitude: number
          longitude: number
          address?: string | null
          phone?: string | null
          hours?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          latitude?: number
          longitude?: number
          address?: string | null
          phone?: string | null
          hours?: string | null
          created_at?: string
        }
      }
    }
  }
}
