import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

interface Template {
  id: string;
  name: string;
  description: string;
  level: string;
  exercises: Exercise[];
}

interface TemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: Template) => void;
}

export const TemplatesDialog = ({ open, onOpenChange, onSelectTemplate }: TemplatesDialogProps) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_templates')
        .select('*')
        .order('name');

      if (error) throw error;

      setTemplates((data || []).map(t => ({
        ...t,
        exercises: t.exercises as unknown as Exercise[]
      })));
    } catch (error) {
      toast.error("Erro ao carregar templates");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: Template) => {
    onSelectTemplate(template);
    onOpenChange(false);
    toast.success(`Template "${template.name}" selecionado!`);
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      beginner: "Iniciante",
      intermediate: "Intermediário",
      advanced: "Avançado"
    };
    return labels[level] || level;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Templates de Treino</DialogTitle>
          <DialogDescription>
            Escolha um treino pré-configurado para começar rapidamente
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando templates...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {getLevelLabel(template.level)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      {template.exercises.length} exercícios:
                    </p>
                    {template.exercises.slice(0, 3).map((exercise, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>{exercise.name}</span>
                        <span className="text-muted-foreground">
                          ({exercise.sets}x{exercise.reps})
                        </span>
                      </div>
                    ))}
                    {template.exercises.length > 3 && (
                      <p className="text-xs text-muted-foreground pl-6">
                        + {template.exercises.length - 3} mais...
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleSelectTemplate(template)}
                    className="w-full"
                    variant="outline"
                  >
                    <Dumbbell className="h-4 w-4 mr-2" />
                    Usar este treino
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
