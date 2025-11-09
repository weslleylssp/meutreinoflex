const BASE_URL = 'https://muscle-group-image-generator.p.rapidapi.com';

const getHeaders = () => ({
  'X-RapidAPI-Key': import.meta.env.VITE_RAPIDAPI_KEY || '',
  'X-RapidAPI-Host': 'muscle-group-image-generator.p.rapidapi.com'
});

export interface MuscleGroup {
  name: string;
  id: string;
}

export async function getMuscleGroups(): Promise<MuscleGroup[]> {
  try {
    const res = await fetch(`${BASE_URL}/getMuscleGroups`, { 
      headers: getHeaders() 
    });
    if (!res.ok) throw new Error('Failed to fetch muscle groups');
    return res.json();
  } catch (error) {
    console.error('Error fetching muscle groups:', error);
    return [];
  }
}

export async function getMuscleImage(
  muscleGroups: string, 
  color: string = 'FF0000'
): Promise<string | null> {
  try {
    const url = `${BASE_URL}/getImage?muscleGroups=${encodeURIComponent(muscleGroups)}&color=${color}&transparentBackground=1`;
    const res = await fetch(url, { headers: getHeaders() });
    
    if (!res.ok) throw new Error('Failed to fetch muscle image');
    
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error fetching muscle image:', error);
    return null;
  }
}

export async function getMulticolorMuscleImage(
  primaryMuscleGroups: string,
  secondaryMuscleGroups: string = '',
  primaryColor: string = 'FF0000',
  secondaryColor: string = 'FFA500'
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      primaryMuscleGroups,
      primaryColor,
      transparentBackground: '1'
    });
    
    if (secondaryMuscleGroups) {
      params.append('secondaryMuscleGroups', secondaryMuscleGroups);
      params.append('secondaryColor', secondaryColor);
    }
    
    const url = `${BASE_URL}/getMulticolorImage?${params.toString()}`;
    const res = await fetch(url, { headers: getHeaders() });
    
    if (!res.ok) throw new Error('Failed to fetch multicolor muscle image');
    
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error fetching multicolor muscle image:', error);
    return null;
  }
}
