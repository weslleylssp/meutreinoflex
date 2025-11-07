import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Dumbbell } from "lucide-react";
import { WorkoutCard } from "@/components/WorkoutCard";
import { WorkoutDialog } from "@/components/WorkoutDialog";
import { toast } from "sonner";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

interface Workout {
  id: string;
  name: string;
  exercises: Exercise[];
}

const Index = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | undefined>();

  const handleSaveWorkout = (workout: Workout) => {
    if (editingWorkout) {
      setWorkouts(workouts.map((w) => (w.id === workout.id ? workout : w)));
    } else {
      setWorkouts([...workouts, workout]);
    }
    setEditingWorkout(undefined);
  };

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
    setDialogOpen(true);
  };

  const handleDeleteWorkout = (id: string) => {
    setWorkouts(workouts.filter((w) => w.id !== id));
    toast.success("Treino removido!");
  };

  const handleNewWorkout = () => {
    setEditingWorkout(undefined);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-primary">
              <Dumbbell className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              FitPlan
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Organize seus treinos, acompanhe seu progresso e alcance seus objetivos
          </p>
        </header>

        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Meus Treinos</h2>
            <p className="text-muted-foreground">
              {workouts.length} {workouts.length === 1 ? "treino" : "treinos"} cadastrados
            </p>
          </div>
          <Button onClick={handleNewWorkout} className="bg-gradient-primary shadow-elevated">
            <Plus className="h-5 w-5 mr-2" />
            Novo Treino
          </Button>
        </div>

        {workouts.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-6 rounded-full bg-accent inline-block mb-6">
              <Dumbbell className="h-16 w-16 text-accent-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Nenhum treino cadastrado</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Comece criando seu primeiro treino e organize sua rotina de exercícios
            </p>
            <Button onClick={handleNewWorkout} size="lg" className="bg-gradient-primary shadow-elevated">
              <Plus className="h-5 w-5 mr-2" />
              Criar Primeiro Treino
            </Button>
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

        <footer className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            💡 <strong>Dica:</strong> Para adicionar imagens/GIFs dos exercícios, você pode integrar com a{" "}
            <a
              href="https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              ExerciseDB API
            </a>
            {" "}que oferece uma base gratuita de mais de 1300 exercícios com GIFs demonstrativos.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
