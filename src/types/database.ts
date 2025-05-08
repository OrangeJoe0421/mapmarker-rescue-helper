
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
      hospital_verifications: {
        Row: {
          id: string
          service_id: string
          has_emergency_room: boolean
          verified_at: string
          verified_by: string | null
        }
        Insert: {
          id?: string
          service_id: string
          has_emergency_room: boolean
          verified_at?: string
          verified_by?: string | null
        }
        Update: {
          id?: string
          service_id?: string
          has_emergency_room?: boolean
          verified_at?: string
          verified_by?: string | null
        }
      }
    }
  }
}
