import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const inputSchema = z.object({
  searchTerm: z.string().trim().max(100).optional(),
  bodyPart: z.string().trim().max(50).optional().nullable(),
  equipment: z.string().trim().max(50).optional().nullable()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validation = inputSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input parameters', details: validation.error.errors }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const { searchTerm, bodyPart, equipment } = validation.data;
    
    console.log('Searching exercises:', { searchTerm, bodyPart, equipment });

    // Build URL for new API v1
    let url = 'https://exercisedb-api1.p.rapidapi.com/api/v1/exercises?limit=50';
    
    // Build query parameters
    const params = new URLSearchParams();
    if (searchTerm && searchTerm.length >= 2) {
      params.append('name', searchTerm);
    }
    if (bodyPart && bodyPart !== 'all') {
      params.append('bodypart', bodyPart);
    }
    if (equipment && equipment !== 'all') {
      params.append('equipment', equipment);
    }
    params.append('limit', '50');
    
    url = `https://exercisedb-api1.p.rapidapi.com/api/v1/exercises?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'x-rapidapi-key': Deno.env.get('RAPIDAPI_KEY') || '',
        'x-rapidapi-host': 'exercisedb-api1.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      const errorMsg = `API returned ${response.status}`;
      console.error('API Error:', errorMsg);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Please try again in a moment.',
            exercises: []
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const exercises = data.data || [];
    
    console.log(`Found ${exercises.length} exercises`);
    
    // Map results to match expected format
    const mappedExercises = exercises.map((ex: any) => ({
      id: String(ex.id || ''),
      name: String(ex.name || ''),
      target: String(ex.primaryMuscles?.[0] || ex.target || 'unknown'),
      bodyPart: String(ex.bodyPart || ''),
      equipment: String(ex.equipment || ''),
      gifUrl: String(ex.gifUrl || ex.imageUrl || ''),
      secondaryMuscles: Array.isArray(ex.secondaryMuscles) ? ex.secondaryMuscles.map(String) : [],
      instructions: Array.isArray(ex.instructions) ? ex.instructions.map(String) : []
    })).slice(0, 50);

    return new Response(
      JSON.stringify({ exercises: mappedExercises }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error searching exercises:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
