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

    // Traduções
    const bodyPartTranslations: Record<string, string> = {
      'back': 'Costas', 'cardio': 'Cardio', 'chest': 'Peito',
      'lower arms': 'Antebraços', 'lower legs': 'Panturrilhas',
      'neck': 'Pescoço', 'shoulders': 'Ombros', 'upper arms': 'Braços',
      'upper legs': 'Pernas', 'waist': 'Abdômen',
    };
    
    const equipmentTranslations: Record<string, string> = {
      'assisted': 'Assistido', 'band': 'Elástico', 'barbell': 'Barra',
      'body weight': 'Peso Corporal', 'bosu ball': 'Bola Bosu',
      'cable': 'Cabo', 'dumbbell': 'Haltere', 'elliptical machine': 'Elíptico',
      'ez barbell': 'Barra EZ', 'hammer': 'Martelo', 'kettlebell': 'Kettlebell',
      'leverage machine': 'Máquina de Alavanca', 'medicine ball': 'Bola Medicinal',
      'olympic barbell': 'Barra Olímpica', 'resistance band': 'Faixa de Resistência',
      'roller': 'Rolo', 'rope': 'Corda', 'skierg machine': 'Máquina SkiErg',
      'sled machine': 'Máquina de Trenó', 'smith machine': 'Smith Machine',
      'stability ball': 'Bola de Estabilidade', 'stationary bike': 'Bicicleta Ergométrica',
      'stepmill machine': 'Máquina Step', 'tire': 'Pneu', 'trap bar': 'Barra Trap',
      'upper body ergometer': 'Ergômetro Superior', 'weighted': 'Com Peso',
      'wheel roller': 'Roda',
    };
    
    const targetTranslations: Record<string, string> = {
      'abs': 'Abdominais', 'adductors': 'Adutores', 'abductors': 'Abdutores',
      'biceps': 'Bíceps', 'calves': 'Panturrilhas',
      'cardiovascular system': 'Sistema Cardiovascular', 'delts': 'Deltoides',
      'forearms': 'Antebraços', 'glutes': 'Glúteos', 'hamstrings': 'Posteriores',
      'lats': 'Dorsais', 'levator scapulae': 'Elevador da Escápula',
      'pectorals': 'Peitorais', 'quads': 'Quadríceps',
      'serratus anterior': 'Serrátil Anterior', 'spine': 'Coluna',
      'traps': 'Trapézio', 'triceps': 'Tríceps', 'upper back': 'Costas Superior',
    };

    const exercises = csvData.map((row: any) => {
      // Coletar secondary muscles (até 6 colunas possíveis)
      const secondaryMuscles = [];
      for (let i = 0; i <= 5; i++) {
        const muscle = row[`secondaryMuscles/${i}`];
        if (muscle && muscle.trim()) {
          const translated = targetTranslations[muscle.trim().toLowerCase()] || muscle.trim();
          secondaryMuscles.push(translated);
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

      const bodyPart = row.bodyPart || '';
      const equipment = row.equipment || '';
      const target = row.target || '';

      return {
        id: row.id,
        name: row.name,
        body_part: bodyPartTranslations[bodyPart.toLowerCase()] || bodyPart,
        equipment: equipmentTranslations[equipment.toLowerCase()] || equipment,
        gif_url: row.gifUrl,
        target: targetTranslations[target.toLowerCase()] || target,
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
