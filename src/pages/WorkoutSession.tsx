import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Timer, Trophy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

interface SetCompletion {
  [exerciseId: string]: boolean[];
}

const WorkoutSession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const workout = location.state?.workout as Workout;

  const [elapsedTime, setElapsedTime] = useState(0);
  const [completedSets, setCompletedSets] = useState<SetCompletion>({});

  useEffect(() => {
    if (!workout) {
      navigate("/");
      return;
    }

    // Initialize completed sets
    const initialSets: SetCompletion = {};
    workout.exercises.forEach((exercise) => {
      initialSets[exercise.id] = Array(exercise.sets).fill(false);
    });
    setCompletedSets(initialSets);

    // Start timer
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [workout, navigate]);

  if (!workout) return null;

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleSet = (exerciseId: string, setIndex: number) => {
    setCompletedSets((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((completed, i) => 
        i === setIndex ? !completed : completed
      ),
    }));
  };

  const getTotalSets = () => {
    return workout.exercises.reduce((total, ex) => total + ex.sets, 0);
  };

  const getCompletedSetsCount = () => {
    return Object.values(completedSets).flat().filter(Boolean).length;
  };

  const handleFinishWorkout = async () => {
    const total = getTotalSets();
    const completed = getCompletedSetsCount();
    
    // Calculate total weight lifted
    const totalWeight = workout.exercises.reduce((sum, exercise) => {
      const completedExerciseSets = completedSets[exercise.id]?.filter(Boolean).length || 0;
      return sum + (exercise.weight * exercise.reps * completedExerciseSets);
    }, 0);

    // Prepare exercise details
    const exerciseDetails = workout.exercises.map((exercise) => ({
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      weight: exercise.weight,
      completedSets: completedSets[exercise.id]?.filter(Boolean).length || 0,
    }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Você precisa estar logado para salvar treinos");
        return;
      }

      const { error } = await supabase
        .from('workout_history')
        .insert({
          workout_name: workout.name,
          duration: elapsedTime,
          total_weight: totalWeight,
          muscle_groups: ['Geral'],
          total_sets: total,
          completed_sets: completed,
          exercises: exerciseDetails,
          user_id: user.id,
        });

      if (error) throw error;

      toast.success(`Treino finalizado! ${completed}/${total} séries completadas em ${formatTime(elapsedTime)}`);
      navigate("/history");
    } catch (error) {
      console.error('Error saving workout:', error);
      toast.error("Erro ao salvar treino");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center justify-between">
                <span>{workout.name}</span>
                <div className="flex items-center gap-2 text-primary">
                  <Timer className="h-6 w-6" />
                  <span className="text-3xl font-mono">{formatTime(elapsedTime)}</span>
                </div>
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {getCompletedSetsCount()} / {getTotalSets()} séries completadas
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="space-y-4">
          {workout.exercises.map((exercise) => (
            <Card key={exercise.id} className="shadow-card border-border">
              <CardHeader>
                <div className="flex items-start gap-4">
                  {exercise.gifUrl ? (
                    <img 
                      src={exercise.gifUrl} 
                      alt={exercise.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-accent rounded-lg flex items-center justify-center">
                      <Trophy className="h-12 w-12 text-accent-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{exercise.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {exercise.sets} séries • {exercise.reps} repetições • {exercise.weight}kg
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: exercise.sets }).map((_, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
                    >
                      <Checkbox
                        id={`${exercise.id}-set-${index}`}
                        checked={completedSets[exercise.id]?.[index] || false}
                        onCheckedChange={() => toggleSet(exercise.id, index)}
                      />
                      <label
                        htmlFor={`${exercise.id}-set-${index}`}
                        className="flex-1 cursor-pointer"
                      >
                        <span className="font-medium">Série {index + 1}</span>
                        <span className="text-muted-foreground ml-2">
                          • {exercise.reps} reps • {exercise.weight}kg
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex gap-4">
          <Button 
            onClick={handleFinishWorkout}
            className="flex-1 bg-gradient-primary shadow-elevated"
            size="lg"
          >
            <Trophy className="h-5 w-5 mr-2" />
            Finalizar Treino
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutSession;
