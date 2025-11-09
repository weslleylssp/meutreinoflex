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

export const searchLocalExercises = async (
  searchTerm?: string,
  bodyPart?: string,
  equipment?: string
): Promise<LocalExercise[]> => {
  try {
    let query = supabase.from('exercises').select('*');

    // Apply filters
    if (searchTerm && searchTerm.trim().length >= 2) {
      query = query.ilike('name', `%${searchTerm.trim()}%`);
    }
    
    if (bodyPart && bodyPart !== 'all') {
      query = query.eq('body_part', bodyPart);
    }
    
    if (equipment && equipment !== 'all') {
      query = query.eq('equipment', equipment);
    }

    // Limit results
    query = query.limit(50);

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error searching local exercises:', error);
    throw error;
  }
};

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

export const getLocalExerciseFilters = async (type: 'body_part' | 'equipment'): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select(type)
      .order(type);

    if (error) throw error;

    // Get unique values
    const uniqueValues = [...new Set(data?.map(item => item[type]) || [])];
    return uniqueValues.filter(Boolean);
  } catch (error) {
    console.error('Error fetching filters:', error);
    throw error;
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
