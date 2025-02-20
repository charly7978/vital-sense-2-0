
import { supabase } from "@/integrations/supabase/client";

export class SignalDataManager {
  async saveSignalData(
    userId: string,
    measurementId: string,
    signalData: {
      raw_signal: number[];
      filtered_signal: number[];
      peak_locations: number[];
      sampling_rate: number;
      signal_quality_metrics: Record<string, any>;
      environmental_conditions?: Record<string, any>;
    }
  ) {
    try {
      const { data, error } = await supabase
        .from('unified_signals')
        .insert({
          user_id: userId,
          measurement_id: measurementId,
          signal_type: 'PPG',
          ...signalData,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error al guardar señal:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en saveSignalData:', error);
      throw error;
    }
  }

  async getLatestSignals(userId: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('unified_signals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error al obtener señales:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en getLatestSignals:', error);
      throw error;
    }
  }
}

export const signalDataManager = new SignalDataManager();
