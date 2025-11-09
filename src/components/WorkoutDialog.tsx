import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
} from "@/components/ui/popover";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  gifUrl?: string;
}

interface Workout {
  id: string;
  name: string;
  exercises: Exercise[];
}

interface WorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout?: Workout;
  onSave: (workout: Workout) => void;
}

export const WorkoutDialog = ({ open, onOpenChange, workout, onSave }: WorkoutDialogProps) => {
  const [name, setName] = useState(workout?.name || "");
  const [exercises, setExercises] = useState<Exercise[]>(workout?.exercises || []);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (workout) {
      setName(workout.name);
      setExercises(workout.exercises);
    } else {
      setName("");
      setExercises([]);
    }
  }, [workout, open]);


  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        id: Math.random().toString(),
        name: "",
        sets: 3,
        reps: 10,
        weight: 0,
        gifUrl: undefined,
      },
    ]);
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id));
  };

  const updateExercise = (id: string, field: keyof Exercise, value: string | number) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === id ? { ...ex, [field]: value } : ex
      )
    );
    
    // Se estiver atualizando o nome, fazer busca automática
    if (field === "name" && typeof value === "string") {
      setActiveExerciseId(id);
      if (value.length >= 2) {
        searchExercises(value);
      } else {
        setSearchResults([]);
      }
    }
  };

  const searchExercises = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-exercises', {
        body: { searchTerm: term }
      });

      if (error) throw error;
      
      if (data.error) {
        if (data.error.includes('429')) {
          toast.error("Limite de requisições atingido. Aguarde um momento.");
        } else {
          toast.error("Erro ao buscar exercícios");
        }
        setSearchResults([]);
        return;
      }
      
      setSearchResults(data.exercises || []);
    } catch (error) {
      console.error('Error searching exercises:', error);
      toast.error("Erro ao buscar exercícios");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const selectExercise = (exerciseId: string, apiExercise: any) => {
    const updatedExercises = exercises.map((ex) =>
      ex.id === exerciseId
        ? { ...ex, name: apiExercise.name, gifUrl: apiExercise.gifUrl }
        : ex
    );
    setExercises(updatedExercises);
    setActiveExerciseId(null);
    setSearchResults([]);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Por favor, insira um nome para o treino");
      return;
    }
    if (exercises.length === 0) {
      toast.error("Adicione pelo menos um exercício");
      return;
    }
    if (exercises.some(ex => !ex.name.trim())) {
      toast.error("Todos os exercícios devem ter um nome");
      return;
    }

    onSave({
      id: workout?.id || Math.random().toString(),
      name,
      exercises,
    });
    
    setName("");
    setExercises([]);
    onOpenChange(false);
    toast.success(workout ? "Treino atualizado!" : "Treino criado!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{workout ? "Editar Treino" : "Novo Treino"}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do seu treino abaixo
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Treino</Label>
            <Input
              id="name"
              placeholder="Ex: Treino A - Peito e Tríceps"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Exercícios</Label>
              <Button onClick={addExercise} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Exercício
              </Button>
            </div>

            {exercises.map((exercise, index) => (
              <div key={exercise.id} className="p-4 rounded-lg border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Exercício {index + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExercise(exercise.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-3">
                  <div className="relative">
                    <Label htmlFor={`exercise-name-${exercise.id}`}>Nome</Label>
                    <Input
                      id={`exercise-name-${exercise.id}`}
                      placeholder="Digite para buscar exercícios..."
                      value={exercise.name}
                      onChange={(e) =>
                        updateExercise(exercise.id, "name", e.target.value)
                      }
                      onFocus={() => {
                        if (exercise.name.length >= 2) {
                          setActiveExerciseId(exercise.id);
                          searchExercises(exercise.name);
                        }
                      }}
                      onBlur={() => {
                        // Delay para permitir o clique nos resultados
                        setTimeout(() => setActiveExerciseId(null), 200);
                      }}
                    />
                    {activeExerciseId === exercise.id && searchResults.length > 0 && (
                      <Popover open={true}>
                        <PopoverContent 
                          className="w-[--radix-popover-trigger-width] p-0 z-50" 
                          align="start"
                          onOpenAutoFocus={(e) => e.preventDefault()}
                        >
                          <Command>
                            <CommandList>
                              <CommandEmpty>
                                {searching ? "Buscando..." : "Nenhum exercício encontrado."}
                              </CommandEmpty>
                              <CommandGroup>
                                {searchResults.map((result) => (
                                  <CommandItem
                                    key={result.id}
                                    value={result.name}
                                    onSelect={() => selectExercise(exercise.id, result)}
                                    className="flex items-center gap-2 cursor-pointer"
                                  >
                                    {result.gifUrl && (
                                      <img 
                                        src={result.gifUrl} 
                                        alt={result.name}
                                        className="w-12 h-12 object-cover rounded"
                                      />
                                    )}
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">{result.name}</p>
                                      <p className="text-xs text-muted-foreground capitalize">{result.target}</p>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                    {exercise.gifUrl && (
                      <div className="mt-2">
                        <img 
                          src={exercise.gifUrl} 
                          alt={exercise.name}
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor={`exercise-sets-${exercise.id}`}>Séries</Label>
                      <Input
                        id={`exercise-sets-${exercise.id}`}
                        type="number"
                        min="1"
                        value={exercise.sets}
                        onChange={(e) =>
                          updateExercise(exercise.id, "sets", parseInt(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor={`exercise-reps-${exercise.id}`}>Repetições</Label>
                      <Input
                        id={`exercise-reps-${exercise.id}`}
                        type="number"
                        min="1"
                        value={exercise.reps}
                        onChange={(e) =>
                          updateExercise(exercise.id, "reps", parseInt(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor={`exercise-weight-${exercise.id}`}>Peso (kg)</Label>
                      <Input
                        id={`exercise-weight-${exercise.id}`}
                        type="number"
                        min="0"
                        step="0.5"
                        value={exercise.weight}
                        onChange={(e) =>
                          updateExercise(exercise.id, "weight", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {exercises.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum exercício adicionado ainda
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-gradient-primary">
            Salvar Treino
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
