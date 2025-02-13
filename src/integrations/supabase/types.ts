export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      arrhythmia_analysis: {
        Row: {
          analysis_version: string | null
          arrhythmia_type: string | null
          confidence_score: number | null
          created_at: string | null
          hrv_frequency_domain: Json | null
          hrv_time_domain: Json | null
          id: string
          measurement_id: string | null
        }
        Insert: {
          analysis_version?: string | null
          arrhythmia_type?: string | null
          confidence_score?: number | null
          created_at?: string | null
          hrv_frequency_domain?: Json | null
          hrv_time_domain?: Json | null
          id?: string
          measurement_id?: string | null
        }
        Update: {
          analysis_version?: string | null
          arrhythmia_type?: string | null
          confidence_score?: number | null
          created_at?: string | null
          hrv_frequency_domain?: Json | null
          hrv_time_domain?: Json | null
          id?: string
          measurement_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arrhythmia_analysis_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "measurement_history"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_pressure_calibration: {
        Row: {
          age: number | null
          calibration_date: string | null
          calibration_quality: number | null
          created_at: string | null
          diastolic_reference: number
          environmental_conditions: Json | null
          height: number | null
          id: string
          is_active: boolean | null
          notes: string | null
          systolic_reference: number
          user_id: string | null
          weight: number | null
        }
        Insert: {
          age?: number | null
          calibration_date?: string | null
          calibration_quality?: number | null
          created_at?: string | null
          diastolic_reference: number
          environmental_conditions?: Json | null
          height?: number | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          systolic_reference: number
          user_id?: string | null
          weight?: number | null
        }
        Update: {
          age?: number | null
          calibration_date?: string | null
          calibration_quality?: number | null
          created_at?: string | null
          diastolic_reference?: number
          environmental_conditions?: Json | null
          height?: number | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          systolic_reference?: number
          user_id?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      calibration_history: {
        Row: {
          calibration_id: string | null
          calibration_type: string
          created_at: string | null
          environmental_conditions: Json | null
          id: string
          reference_data: Json | null
          success: boolean | null
          user_id: string | null
          validation_metrics: Json | null
        }
        Insert: {
          calibration_id?: string | null
          calibration_type: string
          created_at?: string | null
          environmental_conditions?: Json | null
          id?: string
          reference_data?: Json | null
          success?: boolean | null
          user_id?: string | null
          validation_metrics?: Json | null
        }
        Update: {
          calibration_id?: string | null
          calibration_type?: string
          created_at?: string | null
          environmental_conditions?: Json | null
          id?: string
          reference_data?: Json | null
          success?: boolean | null
          user_id?: string | null
          validation_metrics?: Json | null
        }
        Relationships: []
      }
      calibration_profiles: {
        Row: {
          created_at: string
          description: string | null
          device_info: Json | null
          environment_conditions: Json | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          settings: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          device_info?: Json | null
          environment_conditions?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          settings: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          device_info?: Json | null
          environment_conditions?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          settings?: Json
          updated_at?: string
        }
        Relationships: []
      }
      calibration_reference_data: {
        Row: {
          calibration_accuracy: number | null
          calibration_constants: Json | null
          created_at: string | null
          device_specs: Json | null
          device_type: string
          id: string
          is_active: boolean | null
          light_conditions: Json | null
          ppg_calibration_data: Json | null
          reference_measurements: Json | null
          user_id: string
        }
        Insert: {
          calibration_accuracy?: number | null
          calibration_constants?: Json | null
          created_at?: string | null
          device_specs?: Json | null
          device_type: string
          id?: string
          is_active?: boolean | null
          light_conditions?: Json | null
          ppg_calibration_data?: Json | null
          reference_measurements?: Json | null
          user_id: string
        }
        Update: {
          calibration_accuracy?: number | null
          calibration_constants?: Json | null
          created_at?: string | null
          device_specs?: Json | null
          device_type?: string
          id?: string
          is_active?: boolean | null
          light_conditions?: Json | null
          ppg_calibration_data?: Json | null
          reference_measurements?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      calibration_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          max_value: number
          min_value: number
          profile_id: string | null
          step: number
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          max_value: number
          min_value: number
          profile_id?: string | null
          step: number
          updated_at?: string
          value: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          max_value?: number
          min_value?: number
          profile_id?: string | null
          step?: number
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "calibration_settings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "calibration_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      measurement_history: {
        Row: {
          arrhythmia_analysis: Json | null
          blood_pressure_estimation: Json | null
          confidence_metrics: Json | null
          created_at: string | null
          device_calibration_id: string | null
          diastolic_pressure: number | null
          environmental_factors: Json | null
          failed_attempts: number | null
          finger_detection_quality: number | null
          heart_rate: number | null
          id: string
          measurement_duration: number | null
          measurement_quality_metrics: Json | null
          ppg_metrics: Json | null
          processing_stats: Json | null
          signal_quality: number | null
          spo2: number | null
          systolic_pressure: number | null
          user_id: string | null
          validation_results: Json | null
        }
        Insert: {
          arrhythmia_analysis?: Json | null
          blood_pressure_estimation?: Json | null
          confidence_metrics?: Json | null
          created_at?: string | null
          device_calibration_id?: string | null
          diastolic_pressure?: number | null
          environmental_factors?: Json | null
          failed_attempts?: number | null
          finger_detection_quality?: number | null
          heart_rate?: number | null
          id?: string
          measurement_duration?: number | null
          measurement_quality_metrics?: Json | null
          ppg_metrics?: Json | null
          processing_stats?: Json | null
          signal_quality?: number | null
          spo2?: number | null
          systolic_pressure?: number | null
          user_id?: string | null
          validation_results?: Json | null
        }
        Update: {
          arrhythmia_analysis?: Json | null
          blood_pressure_estimation?: Json | null
          confidence_metrics?: Json | null
          created_at?: string | null
          device_calibration_id?: string | null
          diastolic_pressure?: number | null
          environmental_factors?: Json | null
          failed_attempts?: number | null
          finger_detection_quality?: number | null
          heart_rate?: number | null
          id?: string
          measurement_duration?: number | null
          measurement_quality_metrics?: Json | null
          ppg_metrics?: Json | null
          processing_stats?: Json | null
          signal_quality?: number | null
          spo2?: number | null
          systolic_pressure?: number | null
          user_id?: string | null
          validation_results?: Json | null
        }
        Relationships: []
      }
      measurement_signals: {
        Row: {
          id: string
          measurement_id: string | null
          noise_levels: number[] | null
          processed_at: string | null
          processing_metadata: Json | null
          sampling_frequency: number | null
          signal_data: number[] | null
          signal_quality_metrics: Json | null
          signal_type: string | null
        }
        Insert: {
          id?: string
          measurement_id?: string | null
          noise_levels?: number[] | null
          processed_at?: string | null
          processing_metadata?: Json | null
          sampling_frequency?: number | null
          signal_data?: number[] | null
          signal_quality_metrics?: Json | null
          signal_type?: string | null
        }
        Update: {
          id?: string
          measurement_id?: string | null
          noise_levels?: number[] | null
          processed_at?: string | null
          processing_metadata?: Json | null
          sampling_frequency?: number | null
          signal_data?: number[] | null
          signal_quality_metrics?: Json | null
          signal_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "measurement_signals_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "measurement_history"
            referencedColumns: ["id"]
          },
        ]
      }
      measurement_trends: {
        Row: {
          analysis_metrics: Json | null
          created_at: string | null
          end_date: string | null
          id: string
          start_date: string | null
          trend_data: Json | null
          trend_type: string
          user_id: string | null
        }
        Insert: {
          analysis_metrics?: Json | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          trend_data?: Json | null
          trend_type: string
          user_id?: string | null
        }
        Update: {
          analysis_metrics?: Json | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          trend_data?: Json | null
          trend_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      peak_detection_settings: {
        Row: {
          buffer_size: number
          created_at: string
          id: string
          max_bpm: number
          min_amplitude: number
          min_bpm: number
          min_distance: number
          peak_memory: number
          profile_id: string | null
          threshold: number
          updated_at: string
        }
        Insert: {
          buffer_size?: number
          created_at?: string
          id?: string
          max_bpm?: number
          min_amplitude?: number
          min_bpm?: number
          min_distance?: number
          peak_memory?: number
          profile_id?: string | null
          threshold?: number
          updated_at?: string
        }
        Update: {
          buffer_size?: number
          created_at?: string
          id?: string
          max_bpm?: number
          min_amplitude?: number
          min_bpm?: number
          min_distance?: number
          peak_memory?: number
          profile_id?: string | null
          threshold?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "peak_detection_settings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "calibration_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          cpu_usage_percent: number | null
          created_at: string | null
          frame_processing_stats: Json | null
          id: string
          measurement_id: string | null
          memory_usage_kb: number | null
          optimization_suggestions: Json | null
          processing_time_ms: number | null
        }
        Insert: {
          cpu_usage_percent?: number | null
          created_at?: string | null
          frame_processing_stats?: Json | null
          id?: string
          measurement_id?: string | null
          memory_usage_kb?: number | null
          optimization_suggestions?: Json | null
          processing_time_ms?: number | null
        }
        Update: {
          cpu_usage_percent?: number | null
          created_at?: string | null
          frame_processing_stats?: Json | null
          id?: string
          measurement_id?: string | null
          memory_usage_kb?: number | null
          optimization_suggestions?: Json | null
          processing_time_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "measurement_history"
            referencedColumns: ["id"]
          },
        ]
      }
      ppg_calibration: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          max_red_intensity: number
          min_red_intensity: number
          min_valid_pixels: number
          name: string
          pixel_step: number
          red_dominance_threshold: number
          roi_scale: number
          updated_at: string
          validated_by: string | null
          validation_date: string | null
          validation_score: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_red_intensity: number
          min_red_intensity: number
          min_valid_pixels: number
          name: string
          pixel_step: number
          red_dominance_threshold: number
          roi_scale: number
          updated_at?: string
          validated_by?: string | null
          validation_date?: string | null
          validation_score?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_red_intensity?: number
          min_red_intensity?: number
          min_valid_pixels?: number
          name?: string
          pixel_step?: number
          red_dominance_threshold?: number
          roi_scale?: number
          updated_at?: string
          validated_by?: string | null
          validation_date?: string | null
          validation_score?: number | null
        }
        Relationships: []
      }
      ppg_signals: {
        Row: {
          created_at: string | null
          environmental_conditions: Json | null
          filtered_signal: number[] | null
          id: string
          measurement_id: string | null
          peak_locations: number[] | null
          raw_signal: number[] | null
          sampling_rate: number | null
          signal_quality_metrics: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          environmental_conditions?: Json | null
          filtered_signal?: number[] | null
          id?: string
          measurement_id?: string | null
          peak_locations?: number[] | null
          raw_signal?: number[] | null
          sampling_rate?: number | null
          signal_quality_metrics?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          environmental_conditions?: Json | null
          filtered_signal?: number[] | null
          id?: string
          measurement_id?: string | null
          peak_locations?: number[] | null
          raw_signal?: number[] | null
          sampling_rate?: number | null
          signal_quality_metrics?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ppg_signals_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "measurement_history"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_calibration: {
        Row: {
          age: number | null
          calibration_constants: Json | null
          calibration_date: string | null
          calibration_history: Json | null
          height: number | null
          id: string
          ir_wavelength_calibration: number | null
          is_active: boolean | null
          last_calibration_quality: number | null
          red_wavelength_calibration: number | null
          reference_bp_diastolic: number | null
          reference_bp_systolic: number | null
          reference_device_type: string | null
          spo2_calibration_data: Json | null
          user_id: string | null
          weight: number | null
        }
        Insert: {
          age?: number | null
          calibration_constants?: Json | null
          calibration_date?: string | null
          calibration_history?: Json | null
          height?: number | null
          id?: string
          ir_wavelength_calibration?: number | null
          is_active?: boolean | null
          last_calibration_quality?: number | null
          red_wavelength_calibration?: number | null
          reference_bp_diastolic?: number | null
          reference_bp_systolic?: number | null
          reference_device_type?: string | null
          spo2_calibration_data?: Json | null
          user_id?: string | null
          weight?: number | null
        }
        Update: {
          age?: number | null
          calibration_constants?: Json | null
          calibration_date?: string | null
          calibration_history?: Json | null
          height?: number | null
          id?: string
          ir_wavelength_calibration?: number | null
          is_active?: boolean | null
          last_calibration_quality?: number | null
          red_wavelength_calibration?: number | null
          reference_bp_diastolic?: number | null
          reference_bp_systolic?: number | null
          reference_device_type?: string | null
          spo2_calibration_data?: Json | null
          user_id?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      vital_signs: {
        Row: {
          arrhythmia_details: Json | null
          arrhythmia_detected: boolean | null
          calibration_data: Json | null
          calibration_status: string | null
          created_at: string | null
          device_info: Json | null
          diastolic: number | null
          diastolic_pressure: number | null
          has_arrhythmia: boolean | null
          heart_rate: number | null
          hrv_frequency_domain: Json | null
          hrv_metrics: Json | null
          hrv_time_domain: Json | null
          id: string
          ir_intensity: number[] | null
          light_conditions: Json | null
          measurement_quality: number | null
          perfusion_index: number | null
          ppg_data: Json | null
          ppg_filtered_data: number[] | null
          ppg_raw_data: number[] | null
          ppg_signal_data: Json | null
          red_intensity: number[] | null
          spo2: number | null
          spo2_confidence_score: number | null
          systolic: number | null
          systolic_pressure: number | null
          user_id: string | null
        }
        Insert: {
          arrhythmia_details?: Json | null
          arrhythmia_detected?: boolean | null
          calibration_data?: Json | null
          calibration_status?: string | null
          created_at?: string | null
          device_info?: Json | null
          diastolic?: number | null
          diastolic_pressure?: number | null
          has_arrhythmia?: boolean | null
          heart_rate?: number | null
          hrv_frequency_domain?: Json | null
          hrv_metrics?: Json | null
          hrv_time_domain?: Json | null
          id?: string
          ir_intensity?: number[] | null
          light_conditions?: Json | null
          measurement_quality?: number | null
          perfusion_index?: number | null
          ppg_data?: Json | null
          ppg_filtered_data?: number[] | null
          ppg_raw_data?: number[] | null
          ppg_signal_data?: Json | null
          red_intensity?: number[] | null
          spo2?: number | null
          spo2_confidence_score?: number | null
          systolic?: number | null
          systolic_pressure?: number | null
          user_id?: string | null
        }
        Update: {
          arrhythmia_details?: Json | null
          arrhythmia_detected?: boolean | null
          calibration_data?: Json | null
          calibration_status?: string | null
          created_at?: string | null
          device_info?: Json | null
          diastolic?: number | null
          diastolic_pressure?: number | null
          has_arrhythmia?: boolean | null
          heart_rate?: number | null
          hrv_frequency_domain?: Json | null
          hrv_metrics?: Json | null
          hrv_time_domain?: Json | null
          id?: string
          ir_intensity?: number[] | null
          light_conditions?: Json | null
          measurement_quality?: number | null
          perfusion_index?: number | null
          ppg_data?: Json | null
          ppg_filtered_data?: number[] | null
          ppg_raw_data?: number[] | null
          ppg_signal_data?: Json | null
          red_intensity?: number[] | null
          spo2?: number | null
          spo2_confidence_score?: number | null
          systolic?: number | null
          systolic_pressure?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
