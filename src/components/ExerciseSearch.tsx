import { useState, useEffect } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Exercise, searchExercises, getExerciseFilters } from "@/services/exerciseService";
import { toast } from "sonner";

interface ExerciseSearchProps {
  onSelectExercise: (exercise: Exercise) => void;
}

export const ExerciseSearch = ({ onSelectExercise }: ExerciseSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [bodyPart, setBodyPart] = useState<string>("all");
  const [equipment, setEquipment] = useState<string>("all");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [equipmentList, setEquipmentList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      const [bodyPartsData, equipmentData] = await Promise.all([
        getExerciseFilters('bodyPart'),
        getExerciseFilters('equipment')
      ]);
      setBodyParts(bodyPartsData);
      setEquipmentList(equipmentData);
    } catch (error) {
      toast.error("Erro ao carregar filtros");
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await searchExercises(
        searchTerm,
        bodyPart === 'all' ? undefined : bodyPart,
        equipment === 'all' ? undefined : equipment
      );
      setExercises(results.slice(0, 20));
      if (results.length === 0) {
        toast.info("Nenhum exercício encontrado");
      }
    } catch (error) {
      toast.error("Erro ao buscar exercícios");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Digite o nome do exercício..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setShowFilters(!showFilters)} variant="outline" size="icon">
            <Filter className="h-5 w-5" />
          </Button>
          <Button onClick={handleSearch} disabled={loading} className="bg-gradient-primary">
            {loading ? "Buscando..." : "Buscar"}
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border bg-card">
            <div>
              <label className="text-sm font-medium mb-2 block">Grupo Muscular</label>
              <Select value={bodyPart} onValueChange={setBodyPart}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {bodyParts.map((part) => (
                    <SelectItem key={part} value={part}>
                      {part}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Equipamento</label>
              <Select value={equipment} onValueChange={setEquipment}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {equipmentList.map((eq) => (
                    <SelectItem key={eq} value={eq}>
                      {eq}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {exercises.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              onClick={() => onSelectExercise(exercise)}
              className="group cursor-pointer rounded-lg border bg-card p-3 transition-all hover:scale-105 hover:shadow-elevated"
            >
              <div className="aspect-square rounded-md overflow-hidden mb-3 bg-accent">
                <img
                  src={exercise.gifUrl}
                  alt={exercise.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <h3 className="font-medium text-sm line-clamp-2 capitalize">
                {exercise.name}
              </h3>
              <p className="text-xs text-muted-foreground capitalize mt-1">
                {exercise.bodyPart}
              </p>
            </div>
          ))}
        </div>
      ) : !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Digite o nome de um exercício e clique em "Buscar" para começar</p>
        </div>
      )}
    </div>
  );
};
