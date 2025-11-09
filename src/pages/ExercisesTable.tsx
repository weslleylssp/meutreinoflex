import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { importExercisesFromCSV } from "@/services/localExerciseService";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Exercise {
  id: string;
  name: string;
  body_part: string;
  equipment: string;
  target: string;
  gif_url: string;
  secondary_muscles: string[];
  instructions: string[];
}

const ExercisesTable = () => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredExercises(exercises);
    } else {
      const filtered = exercises.filter(
        (ex) =>
          ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ex.body_part.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ex.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ex.equipment.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredExercises(filtered);
    }
  }, [searchTerm, exercises]);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .order("name");

      if (error) throw error;

      setExercises(data || []);
      setFilteredExercises(data || []);
    } catch (error) {
      console.error("Error loading exercises:", error);
      toast.error("Erro ao carregar exercícios");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      
      const response = await fetch('/exercises.csv');
      const csvText = await response.text();
      
      const blob = new Blob([csvText], { type: 'text/csv' });
      const file = new File([blob], 'exercises.csv', { type: 'text/csv' });

      const result = await importExercisesFromCSV(file);
      
      if (result.success) {
        toast.success(`${result.count} exercícios importados com sucesso!`);
        await loadExercises();
      }
    } catch (error) {
      console.error('Error importing exercises:', error);
      toast.error('Erro ao importar exercícios');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando exercícios...</p>
        </div>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Banco de Exercícios</CardTitle>
              <CardDescription>
                Nenhum exercício encontrado. Importe a base de dados primeiro.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Base de Dados Vazia</h3>
                  <p className="text-muted-foreground mb-4">
                    Importe o arquivo CSV com ~1324 exercícios para começar.
                  </p>
                </div>
                <Button
                  onClick={handleImport}
                  disabled={importing}
                  size="lg"
                  className="w-full"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      Importar Exercícios
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              size="icon"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Banco de Exercícios</h1>
              <p className="text-sm text-muted-foreground">
                {exercises.length} exercícios disponíveis
              </p>
            </div>
          </div>
          {exercises.length > 0 && (
            <Badge variant="outline" className="gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Importado
            </Badge>
          )}
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pesquisar Exercícios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome, músculo, equipamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">
              Lista de Exercícios ({filteredExercises.length})
            </CardTitle>
            <CardDescription>
              Clique em um exercício para ver detalhes completos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="hidden md:block">
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Parte do Corpo</TableHead>
                      <TableHead>Músculo Alvo</TableHead>
                      <TableHead>Equipamento</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExercises.map((exercise) => (
                      <TableRow key={exercise.id}>
                        <TableCell className="font-medium">
                          {exercise.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{exercise.body_part}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{exercise.target}</Badge>
                        </TableCell>
                        <TableCell>{exercise.equipment}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedExercise(exercise)}
                          >
                            Ver Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
            
            <div className="md:hidden space-y-3">
              <ScrollArea className="h-[600px]">
                {filteredExercises.map((exercise) => (
                  <Card key={exercise.id} className="mb-3">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{exercise.name}</CardTitle>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="secondary" className="text-xs">{exercise.body_part}</Badge>
                        <Badge variant="outline" className="text-xs">{exercise.target}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground mb-2">
                        {exercise.equipment}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedExercise(exercise)}
                        className="w-full"
                      >
                        Ver Detalhes
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {selectedExercise && (
          <Card className="mt-6 border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{selectedExercise.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedExercise(null)}
                >
                  Fechar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Informações</h3>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">Parte do Corpo:</span>
                      <Badge>{selectedExercise.body_part}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">Músculo Alvo:</span>
                      <Badge variant="outline">{selectedExercise.target}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">Equipamento:</span>
                      <span>{selectedExercise.equipment}</span>
                    </div>
                    {selectedExercise.secondary_muscles?.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Músculos Secundários:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedExercise.secondary_muscles.map((muscle, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {muscle}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">GIF do Exercício</h3>
                  {selectedExercise.gif_url ? (
                    <img
                      src={selectedExercise.gif_url}
                      alt={selectedExercise.name}
                      className="w-full rounded-lg border"
                      onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/300x300?text=GIF+Indisponível";
                      }}
                    />
                  ) : (
                    <div className="w-full h-[300px] bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">GIF não disponível</p>
                    </div>
                  )}
                </div>
              </div>
              {selectedExercise.instructions?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Instruções</h3>
                  <ol className="list-decimal list-inside space-y-1">
                    {selectedExercise.instructions.map((instruction, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">
                        {instruction}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ExercisesTable;
