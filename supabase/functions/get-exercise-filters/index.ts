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
    const { type } = await req.json(); // 'bodyPart' ou 'equipment'
    
    console.log('Fetching filter list:', type);

    const endpoint = type === 'bodyPart' 
      ? 'https://exercisedb.p.rapidapi.com/exercises/bodyPartList'
      : 'https://exercisedb.p.rapidapi.com/exercises/equipmentList';

    const response = await fetch(endpoint, {
      headers: {
        'X-RapidAPI-Key': Deno.env.get('RAPIDAPI_KEY') || '',
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      const errorMsg = `API returned ${response.status}`;
      console.error('API Error:', errorMsg);
      throw new Error(errorMsg);
    }

    const data = await response.json();
    
    console.log(`Found ${data.length} ${type} options`);

    return new Response(
      JSON.stringify({ data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching filters:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
