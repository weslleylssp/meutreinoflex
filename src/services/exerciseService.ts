import { supabase } from "@/integrations/supabase/client";

export interface Exercise {
  id: string;
  name: string;
  target: string;
  bodyPart: string;
  equipment: string;
  gifUrl: string;
}

export interface ExerciseFilters {
  bodyParts: string[];
  equipment: string[];
}

export const searchExercises = async (
  searchTerm?: string,
  bodyPart?: string,
  equipment?: string
): Promise<Exercise[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('search-exercises', {
      body: {
        searchTerm: searchTerm?.trim() || '',
        bodyPart: bodyPart || null,
        equipment: equipment || null
      }
    });

    if (error) throw error;

    return data?.exercises || [];
  } catch (error) {
    console.error('Error searching exercises:', error);
    throw error;
  }
};

export const getExerciseFilters = async (type: 'bodyPart' | 'equipment'): Promise<string[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('get-exercise-filters', {
      body: { type }
    });

    if (error) throw error;

    return data?.filters || [];
  } catch (error) {
    console.error('Error fetching filters:', error);
    throw error;
  }
};
