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
    const { searchTerm, bodyPart, equipment } = await req.json();
    
    console.log('Searching exercises:', { searchTerm, bodyPart, equipment });

    let url = 'https://exercisedb.p.rapidapi.com/exercises';
    
    // Priorizar filtros específicos sobre busca por nome
    if (bodyPart && bodyPart !== 'all') {
      url = `https://exercisedb.p.rapidapi.com/exercises/bodyPart/${encodeURIComponent(bodyPart)}?limit=50`;
    } else if (equipment && equipment !== 'all') {
      url = `https://exercisedb.p.rapidapi.com/exercises/equipment/${encodeURIComponent(equipment)}?limit=50`;
    } else if (searchTerm && searchTerm.length >= 2) {
      url = `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(searchTerm)}?limit=20`;
    } else {
      url = 'https://exercisedb.p.rapidapi.com/exercises?limit=20';
    }

    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': Deno.env.get('RAPIDAPI_KEY') || '',
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
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

    const exercises = await response.json();
    
    console.log(`Found ${exercises.length} exercises`);
    
    // Mapear os resultados para incluir gifUrl corretamente
    let mappedExercises = exercises.map((ex: any) => ({
      id: ex.id,
      name: ex.name,
      target: ex.target,
      bodyPart: ex.bodyPart,
      equipment: ex.equipment,
      gifUrl: ex.gifUrl // A API retorna gifUrl no formato correto
    }));

    // Aplicar filtros adicionais se necessário (quando bodyPart + equipment são usados juntos)
    if (bodyPart && bodyPart !== 'all' && equipment && equipment !== 'all') {
      mappedExercises = mappedExercises.filter((ex: any) => 
        ex.equipment.toLowerCase() === equipment.toLowerCase()
      );
    }

    // Aplicar filtro de nome se houver termo de busca e filtros
    if (searchTerm && searchTerm.length >= 2 && (bodyPart || equipment)) {
      mappedExercises = mappedExercises.filter((ex: any) => 
        ex.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

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
