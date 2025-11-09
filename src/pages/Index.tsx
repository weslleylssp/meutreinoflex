import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Dumbbell, TrendingUp, LogOut, BookTemplate, Share2, Search } from "lucide-react";
import { WorkoutCard } from "@/components/WorkoutCard";
import { WorkoutDialog } from "@/components/WorkoutDialog";
import { TemplatesDialog } from "@/components/TemplatesDialog";
import { ShareWorkoutDialog } from "@/components/ShareWorkoutDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const Index = () => {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharingWorkoutId, setSharingWorkoutId] = useState<string | undefined>();
  const [editingWorkout, setEditingWorkout] = useState<Workout | undefined>();
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar autenticação e carregar treinos
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUserEmail(session.user.email || "");
      await loadWorkouts();
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUserEmail(session.user.email || "");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadWorkouts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setWorkouts((data || []).map(w => ({
        ...w,
        exercises: w.exercises as unknown as Exercise[]
      })));
    } catch (error) {
      toast.error("Erro ao carregar treinos");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkout = async (workout: Workout) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingWorkout) {
        // Update existing workout
        const { error } = await supabase
          .from('workouts')
          .update({
            name: workout.name,
            exercises: workout.exercises as any
          })
          .eq('id', workout.id)
          .eq('user_id', user.id);

        if (error) throw error;
        toast.success("Treino atualizado!");
      } else {
        // Create new workout
        const { error } = await supabase
          .from('workouts')
          .insert({
            name: workout.name,
            exercises: workout.exercises as any,
            user_id: user.id
          });

        if (error) throw error;
        toast.success("Treino criado!");
      }

      await loadWorkouts();
      setEditingWorkout(undefined);
    } catch (error) {
      toast.error("Erro ao salvar treino");
    }
  };

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
    setDialogOpen(true);
  };

  const handleDeleteWorkout = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadWorkouts();
      toast.success("Treino removido!");
    } catch (error) {
      toast.error("Erro ao remover treino");
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logout realizado com sucesso");
      navigate("/auth");
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
  };

  const handleSelectTemplate = (template: any) => {
    setEditingWorkout({
      id: Math.random().toString(),
      name: template.name,
      exercises: template.exercises
    });
    setDialogOpen(true);
    setTemplatesOpen(false);
  };

  const handleNewWorkout = () => {
    setEditingWorkout(undefined);
    setDialogOpen(true);
  };

  const handleShareWorkout = (workoutId: string) => {
    setSharingWorkoutId(workoutId);
    setShareDialogOpen(true);
  };

  const handleImportWorkout = async () => {
    await loadWorkouts();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-primary">
                <Dumbbell className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  FitPlan
                </h1>
                <p className="text-muted-foreground">
                  Organize seus treinos e acompanhe seu progresso
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate("/exercises")}
                variant="outline"
                className="gap-2"
              >
                <Search className="h-5 w-5" />
                Exercícios
              </Button>
              <Button
                onClick={() => navigate("/history")}
                variant="outline"
                className="gap-2"
              >
                <TrendingUp className="h-5 w-5" />
                Histórico
              </Button>
              <div className="flex items-center gap-2">
                <div className="text-right hidden md:block">
                  <p className="text-sm text-muted-foreground">{userEmail}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Sair"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Meus Treinos</h2>
            <p className="text-muted-foreground">
              {workouts.length} {workouts.length === 1 ? "treino" : "treinos"} cadastrados
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setTemplatesOpen(true)} variant="outline">
              <BookTemplate className="h-5 w-5 mr-2" />
              Templates
            </Button>
            <Button onClick={() => {
              setSharingWorkoutId(undefined);
              setShareDialogOpen(true);
            }} variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button onClick={handleNewWorkout} className="bg-gradient-primary shadow-elevated">
              <Plus className="h-5 w-5 mr-2" />
              Novo Treino
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando treinos...</p>
          </div>
        ) : workouts.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-6 rounded-full bg-accent inline-block mb-6">
              <Dumbbell className="h-16 w-16 text-accent-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Nenhum treino cadastrado</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Comece criando seu primeiro treino ou escolha um dos nossos templates
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setTemplatesOpen(true)} size="lg" variant="outline">
                <BookTemplate className="h-5 w-5 mr-2" />
                Ver Templates
              </Button>
              <Button onClick={handleNewWorkout} size="lg" className="bg-gradient-primary shadow-elevated">
                <Plus className="h-5 w-5 mr-2" />
                Criar Primeiro Treino
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                id={workout.id}
                name={workout.name}
                exercises={workout.exercises}
                onEdit={() => handleEditWorkout(workout)}
                onDelete={() => handleDeleteWorkout(workout.id)}
                onShare={() => handleShareWorkout(workout.id)}
              />
            ))}
          </div>
        )}

        <WorkoutDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          workout={editingWorkout}
          onSave={handleSaveWorkout}
        />

      <TemplatesDialog
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
        onSelectTemplate={handleSelectTemplate}
      />
      <ShareWorkoutDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        workoutId={sharingWorkoutId}
        onImport={handleImportWorkout}
      />
      </div>
    </div>
  );
};

export default Index;
