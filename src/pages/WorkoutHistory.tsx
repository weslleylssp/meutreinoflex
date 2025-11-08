import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, Dumbbell, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type WorkoutHistoryRow = Database['public']['Tables']['workout_history']['Row'];

interface WorkoutHistoryEntry extends Omit<WorkoutHistoryRow, 'exercises'> {
  exercises: any[];
}

const WorkoutHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_history')
        .select('*')
        .order('completed_at', { ascending: false });

      if (error) throw error;
      
      const mappedData: WorkoutHistoryEntry[] = (data || []).map(row => ({
        ...row,
        exercises: Array.isArray(row.exercises) ? row.exercises : []
      }));
      
      setHistory(mappedData);
    } catch (error) {
      console.error('Error fetching history:', error);
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
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTotalStats = () => {
    return {
      totalWorkouts: history.length,
      totalTime: history.reduce((sum, h) => sum + h.duration, 0),
      totalWeight: history.reduce((sum, h) => sum + Number(h.total_weight), 0),
      totalSets: history.reduce((sum, h) => sum + h.completed_sets, 0),
    };
  };

  const stats = getTotalStats();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-primary">
              <TrendingUp className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Histórico de Treinos</h1>
              <p className="text-muted-foreground">Acompanhe seu progresso</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Treinos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalWorkouts}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tempo Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatTime(stats.totalTime)}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Peso Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalWeight.toFixed(0)} kg</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Séries Completadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalSets}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* History List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando histórico...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-6 rounded-full bg-accent inline-block mb-6">
              <Dumbbell className="h-16 w-16 text-accent-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Nenhum treino realizado</h3>
            <p className="text-muted-foreground mb-6">
              Comece um treino para ver seu histórico aqui
            </p>
            <Button onClick={() => navigate("/")} className="bg-gradient-primary shadow-elevated">
              Ver Treinos
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <Card key={entry.id} className="shadow-card border-border hover:shadow-elevated transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-2">{entry.workout_name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(entry.completed_at)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {entry.muscle_groups.map((group) => (
                        <Badge key={group} variant="secondary">
                          {group}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Duração</p>
                        <p className="font-semibold">{formatTime(entry.duration)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Peso Total</p>
                        <p className="font-semibold">{Number(entry.total_weight).toFixed(0)} kg</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Séries</p>
                        <p className="font-semibold">
                          {entry.completed_sets}/{entry.total_sets}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Exercícios</p>
                        <p className="font-semibold">{entry.exercises.length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Exercise Details */}
                  <div className="space-y-2 mt-4 pt-4 border-t">
                    {entry.exercises.map((exercise: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded bg-secondary/30"
                      >
                        <span className="text-sm">{exercise.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {exercise.completedSets}/{exercise.sets} séries • {exercise.reps} reps • {exercise.weight}kg
                        </span>
                      </div>
                    ))}
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
