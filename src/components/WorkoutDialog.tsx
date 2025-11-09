import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Loader2, Filter } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { workoutSchema, exerciseSchema } from "@/lib/validationSchemas";
import { searchExercises } from "@/services/exerciseService";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Cache para resultados de busca
const searchCache = new Map<string, any[]>();

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
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Filtros
  const [bodyPartFilter, setBodyPartFilter] = useState<string>("all");
  const [equipmentFilter, setEquipmentFilter] = useState<string>("all");
  const [bodyPartOptions, setBodyPartOptions] = useState<string[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (workout) {
      setName(workout.name);
      setExercises(workout.exercises);
    } else {
      setName("");
      setExercises([]);
    }
  }, [workout, open]);

  // Carregar opções de filtros
  useEffect(() => {
    if (open) {
      loadFilterOptions();
    }
  }, [open]);

  const loadFilterOptions = async () => {
    try {
      // Carregar bodyParts
      const { data: bodyPartData } = await supabase.functions.invoke('get-exercise-filters', {
        body: { type: 'bodyPart' }
      });
      
      if (bodyPartData?.data) {
        setBodyPartOptions(bodyPartData.data);
      }

      // Carregar equipment
      const { data: equipmentData } = await supabase.functions.invoke('get-exercise-filters', {
        body: { type: 'equipment' }
      });
      
      if (equipmentData?.data) {
        setEquipmentOptions(equipmentData.data);
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };


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
    // Validate numeric inputs
    if (field === "sets" || field === "reps") {
      const numValue = typeof value === "string" ? parseInt(value) : value;
      if (isNaN(numValue) || numValue < 0) return;
      if (field === "sets" && numValue > 20) return;
      if (field === "reps" && numValue > 200) return;
      value = numValue;
    } else if (field === "weight") {
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(numValue) || numValue < 0 || numValue > 1000) return;
      value = numValue;
    } else if (field === "name" && typeof value === "string" && value.length > 100) {
      return;
    }
    
    setExercises(
      exercises.map((ex) =>
        ex.id === id ? { ...ex, [field]: value } : ex
      )
    );
    
    // Se estiver atualizando o nome, fazer busca com debounce
    if (field === "name" && typeof value === "string") {
      setActiveExerciseId(id);
      
      // Limpar timer anterior
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      if (value.length >= 2 || bodyPartFilter !== "all" || equipmentFilter !== "all") {
        setSearching(true);
        // Debounce de 700ms
        debounceTimerRef.current = setTimeout(() => {
          searchExercises(value);
        }, 700);
      } else {
        setSearchResults([]);
        setSearching(false);
      }
    }
  };

  // Atualizar busca quando filtros mudarem
  useEffect(() => {
    if (activeExerciseId) {
      const exercise = exercises.find(ex => ex.id === activeExerciseId);
      if (exercise) {
        searchExercises(exercise.name);
      }
    }
  }, [bodyPartFilter, equipmentFilter]);

  const searchExercises = useCallback(async (term: string) => {
    // Construir chave de cache incluindo filtros
    const cacheKey = `${term.toLowerCase().trim()}_${bodyPartFilter}_${equipmentFilter}`;
    
    // Verificar cache primeiro
    if (searchCache.has(cacheKey)) {
      setSearchResults(searchCache.get(cacheKey) || []);
      setSearching(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('search-exercises', {
        body: { 
          searchTerm: term,
          bodyPart: bodyPartFilter !== "all" ? bodyPartFilter : null,
          equipment: equipmentFilter !== "all" ? equipmentFilter : null
        }
      });

      if (error) throw error;
      
      if (data.error) {
        if (data.error.includes('429')) {
          toast.error("Limite de requisições atingido. Aguarde um momento.");
        } else {
          toast.error("Erro ao buscar exercícios");
        }
        setSearchResults([]);
        setSearching(false);
        return;
      }
      
      const results = data.exercises || [];
      // Armazenar no cache
      searchCache.set(cacheKey, results);
      setSearchResults(results);
    } catch (error) {
      toast.error("Erro ao buscar exercícios");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [bodyPartFilter, equipmentFilter]);

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

  const handleSave = async () => {
  // Montar objeto do treino
  const workoutData = {
    id: workout?.id || Math.random().toString(),
    name: name.trim(),
    exercises: exercises.map(ex => ({
      ...ex,
      name: ex.name.trim()
    })),
  };

  // Validar dados com Zod
  const validation = workoutSchema.safeParse(workoutData);
  
  if (!validation.success) {
    const errors = validation.error.errors;
    toast.error(errors[0]?.message || "Verifique os dados do treino");
    return;
  }

  // ✅ Buscar GIFs automaticamente se estiverem faltando
  for (const ex of validation.data.exercises) {
    if (!ex.gifUrl && ex.name) {
      try {
        const { data } = await supabase.functions.invoke('search-exercises', {
          body: { searchTerm: ex.name }
        });
        if (data?.exercises && data.exercises.length > 0) {
          ex.gifUrl = data.exercises[0].gifUrl;
        }
      } catch (e) {
        console.warn(`Erro ao buscar GIF para ${ex.name}:`, e);
      }
    }
  }

  // Salvar treino
  onSave(validation.data as Workout);
  
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
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor={`exercise-name-${exercise.id}`}>Nome</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveExerciseId(exercise.id);
                          setShowFilters(!showFilters);
                        }}
                        className="h-7 gap-1"
                      >
                        <Filter className="h-3 w-3" />
                        Filtros
                      </Button>
                    </div>
                    
                    {showFilters && activeExerciseId === exercise.id && (
                      <div className="grid grid-cols-2 gap-2 mb-2 p-3 rounded-lg bg-secondary/50">
                        <div>
                          <Label className="text-xs">Grupo Muscular</Label>
                          <Select value={bodyPartFilter} onValueChange={setBodyPartFilter}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              {bodyPartOptions.map((option) => (
                                <SelectItem key={option} value={option} className="capitalize">
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Equipamento</Label>
                          <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              {equipmentOptions.map((option) => (
                                <SelectItem key={option} value={option} className="capitalize">
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                    
                    <div className="relative">
                      <Input
                        id={`exercise-name-${exercise.id}`}
                        placeholder="Digite para buscar exercícios..."
                        value={exercise.name}
                        onChange={(e) =>
                          updateExercise(exercise.id, "name", e.target.value)
                        }
                        onFocus={() => {
                          setActiveExerciseId(exercise.id);
                          if (exercise.name.length >= 2 || bodyPartFilter !== "all" || equipmentFilter !== "all") {
                            searchExercises(exercise.name);
                          }
                        }}
                        onBlur={() => {
                          // Delay para permitir o clique nos resultados
                          setTimeout(() => {
                            setActiveExerciseId(null);
                            setShowFilters(false);
                          }, 200);
                        }}
                        className="pr-10"
                      />
                      {searching && activeExerciseId === exercise.id && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
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
                                       <p className="text-xs text-muted-foreground capitalize">
                                         {result.bodyPart} • {result.equipment}
                                       </p>
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
