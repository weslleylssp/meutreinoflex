import { supabase } from "@/integrations/supabase/client";

export interface Exercise {
  id: string;
  name: string;
  target: string;
  bodyPart: string;
  equipment: string;
  gifUrl: string;
  secondaryMuscles?: string[];
  instructions?: string[];
}

export interface ExerciseFilters {
  bodyParts: string[];
  equipment: string[];
}

export const searchExercises = async (
  searchTerm?: string,
  bodyPart?: string,
  equipment?: string,
  limit: number = 50
): Promise<Exercise[]> => {
  try {
    // First try local database
    let query = supabase.from('exercises').select('*');

    if (searchTerm && searchTerm.trim().length >= 2) {
      query = query.ilike('name', `%${searchTerm.trim()}%`);
    }
    
    if (bodyPart && bodyPart !== 'all') {
      query = query.eq('body_part', bodyPart);
    }
    
    if (equipment && equipment !== 'all') {
      query = query.eq('equipment', equipment);
    }

    query = query.limit(limit);

    const { data: localData, error: localError } = await query;

    // If local database has exercises, use them
    if (!localError && localData && localData.length > 0) {
      return localData.map(ex => ({
        id: ex.id,
        name: ex.name,
        target: ex.target,
        bodyPart: ex.body_part,
        equipment: ex.equipment,
        gifUrl: ex.gif_url,
        secondaryMuscles: ex.secondary_muscles || [],
        instructions: ex.instructions || []
      }));
    }

    // Fallback to API if local database is empty
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

// Get exercise suggestions for autocomplete (returns just names)
export const getExerciseSuggestions = async (searchTerm: string): Promise<string[]> => {
  if (!searchTerm || searchTerm.trim().length < 2) return [];
  
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('name')
      .ilike('name', `%${searchTerm.trim()}%`)
      .limit(10);

    if (error) throw error;
    
    return data?.map(ex => ex.name) || [];
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return [];
  }
};

export const getExerciseFilters = async (type: 'bodyPart' | 'equipment'): Promise<string[]> => {
  try {
    // Try local database first
    const columnName = type === 'bodyPart' ? 'body_part' : 'equipment';
    const { data: localData, error: localError } = await supabase
      .from('exercises')
      .select(columnName);

    if (!localError && localData && localData.length > 0) {
      const uniqueValues = [...new Set(localData.map(item => item[columnName]))];
      return uniqueValues.filter(Boolean).sort();
    }

    // Fallback to API
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
