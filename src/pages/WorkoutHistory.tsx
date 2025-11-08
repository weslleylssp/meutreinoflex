import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Timer, Weight, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WorkoutHistoryItem {
  id: string;
  workout_name: string;
  duration: number;
  completed_at: string;
  total_weight: number;
  muscle_groups: string[];
  total_sets: number;
  completed_sets: number;
}

const WorkoutHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<WorkoutHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_history')
        .select('*')
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error("Erro ao carregar histórico");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}min`;
    }
    return `${mins}min ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalStats = () => {
    return {
      totalWorkouts: history.length,
      totalTime: history.reduce((sum, item) => sum + item.duration, 0),
      totalWeight: history.reduce((sum, item) => sum + Number(item.total_weight), 0),
      totalSets: history.reduce((sum, item) => sum + item.completed_sets, 0)
    };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Histórico de Treinos</h1>
          <p className="text-muted-foreground">
            Acompanhe seu progresso e veja todos os treinos realizados
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-card border-border">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Trophy className="h-8 w-8 text-primary mb-2" />
                <p className="text-2xl font-bold">{stats.totalWorkouts}</p>
                <p className="text-xs text-muted-foreground">Treinos</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Timer className="h-8 w-8 text-primary mb-2" />
                <p className="text-2xl font-bold">{formatTime(stats.totalTime)}</p>
                <p className="text-xs text-muted-foreground">Tempo Total</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Weight className="h-8 w-8 text-primary mb-2" />
                <p className="text-2xl font-bold">{stats.totalWeight.toFixed(0)}kg</p>
                <p className="text-xs text-muted-foreground">Peso Total</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Trophy className="h-8 w-8 text-primary mb-2" />
                <p className="text-2xl font-bold">{stats.totalSets}</p>
                <p className="text-xs text-muted-foreground">Séries Totais</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workout History List */}
        {history.length === 0 ? (
          <Card className="bg-gradient-card border-border">
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Nenhum treino realizado ainda</h3>
                <p className="text-muted-foreground mb-6">
                  Complete seu primeiro treino para ver o histórico aqui
                </p>
                <Button onClick={() => navigate("/")} className="bg-gradient-primary">
                  Ir para Treinos
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <Card key={item.id} className="shadow-card border-border hover:shadow-elevated transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{item.workout_name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(item.completed_at)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-primary">
                        {item.completed_sets}/{item.total_sets}
                      </div>
                      <div className="text-xs text-muted-foreground">séries</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{formatTime(item.duration)}</p>
                        <p className="text-xs text-muted-foreground">Duração</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Weight className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{Number(item.total_weight).toFixed(0)}kg</p>
                        <p className="text-xs text-muted-foreground">Peso Total</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {item.muscle_groups.length > 0 
                            ? item.muscle_groups.slice(0, 2).join(', ')
                            : 'Vários'
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">Grupos</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutHistory;
