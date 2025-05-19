
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
          state: string | null
          created_at: string
          has_emergency_room: boolean | null
          verified_at: string | null
          comments: string | null
          google_maps_link: string | null
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
          state?: string | null
          created_at?: string
          has_emergency_room?: boolean | null
          verified_at?: string | null
          comments?: string | null
          google_maps_link?: string | null
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
          state?: string | null
          created_at?: string
          has_emergency_room?: boolean | null
          verified_at?: string | null
          comments?: string | null
          google_maps_link?: string | null
        }
      }
    }
  }
}
