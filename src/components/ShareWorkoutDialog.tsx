import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Copy, Check, Import } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { shareCodeSchema } from "@/lib/validationSchemas";

interface ShareWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutId?: string;
  onImport: (workout: any) => void;
}

export const ShareWorkoutDialog = ({ open, onOpenChange, workoutId, onImport }: ShareWorkoutDialogProps) => {
  const [shareCode, setShareCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importCode, setImportCode] = useState("");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (open && workoutId) {
      generateShareCode();
    }
  }, [open, workoutId]);

  const generateShareCode = async () => {
    if (!workoutId) return;

    setLoading(true);
    try {
      // Verificar se já existe código compartilhado
      const { data: existing, error: fetchError } = await supabase
        .from('shared_workouts')
        .select('share_code')
        .eq('workout_id', workoutId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        setShareCode(existing.share_code);
        return;
      }

      // Gerar novo código
      let code = '';
      let isUnique = false;
      
      while (!isUnique) {
        const { data: codeData, error: rpcError } = await supabase.rpc('generate_share_code');
        if (rpcError) throw rpcError;
        code = codeData || '';
        
        const { data: check } = await supabase
          .from('shared_workouts')
          .select('id')
          .eq('share_code', code)
          .maybeSingle();
        
        if (!check) isUnique = true;
      }

      // Criar registro de compartilhamento
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error: insertError } = await supabase
        .from('shared_workouts')
        .insert({
          workout_id: workoutId,
          share_code: code,
          created_by: user.id
        });

      if (insertError) throw insertError;

      setShareCode(code);
      toast.success("Código de compartilhamento gerado!");
    } catch (error) {
      console.error('Error generating share code:', error);
      toast.error("Erro ao gerar código de compartilhamento");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareCode);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = async () => {
    // Validate share code format
    const validation = shareCodeSchema.safeParse(importCode.trim().toUpperCase());
    
    if (!validation.success) {
      toast.error("Invalid code format. Must be 6 alphanumeric characters.");
      return;
    }

    const validCode = validation.data;
    setImporting(true);
    try {
      // Buscar treino compartilhado
      const { data: sharedWorkout, error: sharedError } = await supabase
        .from('shared_workouts')
        .select('workout_id')
        .eq('share_code', validCode)
        .maybeSingle();

      if (sharedError) throw sharedError;
      if (!sharedWorkout) {
        toast.error("Código inválido ou expirado");
        return;
      }

      // Buscar dados do treino
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', sharedWorkout.workout_id)
        .single();

      if (workoutError) throw workoutError;

      // Atualizar contador de acessos
      const { data: currentShared } = await supabase
        .from('shared_workouts')
        .select('access_count')
        .eq('share_code', validCode)
        .single();
      
      if (currentShared) {
        await supabase
          .from('shared_workouts')
          .update({ access_count: currentShared.access_count + 1 })
          .eq('share_code', validCode);
      }

      // Importar treino
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: importedWorkout, error: importError } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          name: `${workout.name} (Importado)`,
          exercises: workout.exercises
        })
        .select()
        .single();

      if (importError) throw importError;

      toast.success("Treino importado com sucesso!");
      onImport(importedWorkout);
      onOpenChange(false);
      setImportCode("");
    } catch (error) {
      console.error('Error importing workout:', error);
      toast.error("Erro ao importar treino");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Compartilhar Treino
          </DialogTitle>
          <DialogDescription>
            Compartilhe seu treino ou importe treinos de outros usuários
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={workoutId ? "share" : "import"} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="share" disabled={!workoutId}>Compartilhar</TabsTrigger>
            <TabsTrigger value="import">Importar</TabsTrigger>
          </TabsList>

          <TabsContent value="share" className="space-y-4">
            <div className="space-y-2">
              <Label>Código de Compartilhamento</Label>
              <div className="flex gap-2">
                <Input
                  value={shareCode}
                  readOnly
                  placeholder={loading ? "Gerando..." : "Código"}
                  className="font-mono text-lg text-center tracking-wider"
                />
                <Button
                  onClick={copyToClipboard}
                  disabled={!shareCode || loading}
                  size="icon"
                  variant="outline"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Compartilhe este código para que outros usuários possam importar seu treino
              </p>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-code">Digite o Código</Label>
              <Input
                id="import-code"
                value={importCode}
                onChange={(e) => setImportCode(e.target.value.toUpperCase())}
                placeholder="Ex: ABC123"
                className="font-mono text-lg text-center tracking-wider"
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Digite o código compartilhado por outro usuário
              </p>
            </div>
            <Button
              onClick={handleImport}
              disabled={importing || !importCode.trim()}
              className="w-full"
            >
              <Import className="h-4 w-4 mr-2" />
              {importing ? "Importando..." : "Importar Treino"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};