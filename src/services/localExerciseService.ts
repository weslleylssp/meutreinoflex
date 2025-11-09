import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";

export interface LocalExercise {
  id: string;
  name: string;
  body_part: string;
  equipment: string;
  gif_url: string;
  target: string;
  secondary_muscles: string[];
  instructions: string[];
}

export const getExerciseById = async (id: string): Promise<LocalExercise | null> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting exercise:', error);
    return null;
  }
};

export const importExercisesFromCSV = async (csvFile: File): Promise<{ success: boolean; count: number }> => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const { data, error } = await supabase.functions.invoke('import-exercises', {
            body: { csvData: results.data }
          });

          if (error) throw error;

          resolve({ success: true, count: data.count });
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};
