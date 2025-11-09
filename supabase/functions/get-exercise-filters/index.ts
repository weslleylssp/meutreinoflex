import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const inputSchema = z.object({
  type: z.enum(['bodyPart', 'equipment'], {
    errorMap: () => ({ message: "Type must be 'bodyPart' or 'equipment'" })
  })
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
    
    const { type } = validation.data;
    
    console.log('Fetching filter list:', type);

    const endpoint = type === 'bodyPart' 
      ? 'https://exercisedb-api1.p.rapidapi.com/api/v1/bodyparts'
      : 'https://exercisedb-api1.p.rapidapi.com/api/v1/equipments';

    const response = await fetch(endpoint, {
      headers: {
        'x-rapidapi-key': Deno.env.get('RAPIDAPI_KEY') || '',
        'x-rapidapi-host': 'exercisedb-api1.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      const errorMsg = `API returned ${response.status}`;
      console.error('API Error:', errorMsg);
      throw new Error(errorMsg);
    }

    const result = await response.json();
    const rawData = result.data || result;
    
    // Ensure all values are strings
    const data = Array.isArray(rawData) ? rawData.map(String) : [];
    
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
