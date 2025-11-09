import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse CSV data from request body
    const { csvData } = await req.json();
    
    if (!csvData || !Array.isArray(csvData)) {
      return new Response(
        JSON.stringify({ error: 'CSV data is required and must be an array' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Starting import of ${csvData.length} exercises...`);

    const exercises = csvData.map((row: any) => {
      // Coletar secondary muscles (até 6 colunas possíveis)
      const secondaryMuscles = [];
      for (let i = 0; i <= 5; i++) {
        const muscle = row[`secondaryMuscles/${i}`];
        if (muscle && muscle.trim()) {
          secondaryMuscles.push(muscle.trim());
        }
      }

      // Coletar instruções (até 11 colunas possíveis)
      const instructions = [];
      for (let i = 0; i <= 10; i++) {
        const instruction = row[`instructions/${i}`];
        if (instruction && instruction.trim()) {
          instructions.push(instruction.trim());
        }
      }

      return {
        id: row.id,
        name: row.name,
        body_part: row.bodyPart,
        equipment: row.equipment,
        gif_url: row.gifUrl,
        target: row.target,
        secondary_muscles: secondaryMuscles,
        instructions: instructions,
      };
    });

    // Insert in batches of 100 to avoid timeouts
    const batchSize = 100;
    let imported = 0;
    
    for (let i = 0; i < exercises.length; i += batchSize) {
      const batch = exercises.slice(i, i + batchSize);
      
      const { error } = await supabaseClient
        .from('exercises')
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        console.error(`Error importing batch ${i / batchSize + 1}:`, error);
        throw error;
      }
      
      imported += batch.length;
      console.log(`Imported ${imported}/${exercises.length} exercises`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully imported ${imported} exercises`,
        count: imported 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error importing exercises:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
