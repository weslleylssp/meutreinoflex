import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchTerm } = await req.json();
    
    console.log('Searching exercises for:', searchTerm);

    const response = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(searchTerm)}?limit=20`,
      {
        headers: {
          'X-RapidAPI-Key': Deno.env.get('RAPIDAPI_KEY') || '',
          'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
        }
      }
    );

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

    const exercises = await response.json();
    
    console.log(`Found ${exercises.length} exercises`);
    
    // Mapear os resultados para incluir gifUrl corretamente
    const mappedExercises = exercises.map((ex: any) => ({
      id: ex.id,
      name: ex.name,
      target: ex.target,
      bodyPart: ex.bodyPart,
      equipment: ex.equipment,
      gifUrl: ex.gifUrl // A API retorna gifUrl no formato correto
    }));

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
