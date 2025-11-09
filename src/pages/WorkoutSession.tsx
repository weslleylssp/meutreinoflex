import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Timer, Trophy, Maximize2, Play, Pause, RotateCcw, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getExerciseById } from "@/services/localExerciseService";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  gifUrl?: string;
  instructions?: string[];
  target?: string;
  bodyPart?: string;
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
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [exerciseDetailsOpen, setExerciseDetailsOpen] = useState(false);
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [restTimerPaused, setRestTimerPaused] = useState(false);
  const [lastCompletedSet, setLastCompletedSet] = useState<{ exerciseId: string; setIndex: number } | null>(null);

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

  // Rest timer effect
  useEffect(() => {
    if (restTimerActive && !restTimerPaused && restTimeRemaining > 0) {
      const interval = setInterval(() => {
        setRestTimeRemaining((prev) => {
          if (prev <= 1) {
            setRestTimerActive(false);
            playRestCompleteSound();
            toast.success("Descanso completo! Hora da próxima série.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [restTimerActive, restTimerPaused, restTimeRemaining]);

  const playRestCompleteSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const startRestTimer = (seconds: number = 90) => {
    setRestTimeRemaining(seconds);
    setRestTimerActive(true);
    setRestTimerPaused(false);
  };

  const pauseRestTimer = () => {
    setRestTimerPaused(!restTimerPaused);
  };

  const resetRestTimer = () => {
    setRestTimerActive(false);
    setRestTimeRemaining(0);
    setRestTimerPaused(false);
  };

  const openExerciseDetails = async (exercise: Exercise) => {
    // Try to get full exercise details from database
    if (exercise.id.length === 4) { // Exercise from database has 4-digit ID
      const fullExercise = await getExerciseById(exercise.id);
      if (fullExercise) {
        setSelectedExercise({
          ...exercise,
          instructions: fullExercise.instructions,
          target: fullExercise.target,
          bodyPart: fullExercise.body_part,
          gifUrl: fullExercise.gif_url
        });
      } else {
        setSelectedExercise(exercise);
      }
    } else {
      setSelectedExercise(exercise);
    }
    setExerciseDetailsOpen(true);
  };

  if (!workout) return null;

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleSet = (exerciseId: string, setIndex: number) => {
    const isCurrentlyCompleted = completedSets[exerciseId]?.[setIndex] || false;
    
    setCompletedSets((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((completed, i) => 
        i === setIndex ? !completed : completed
      ),
    }));

    // Start rest timer when completing a set (not when unchecking)
    if (!isCurrentlyCompleted) {
      setLastCompletedSet({ exerciseId, setIndex });
      startRestTimer(90); // 90 seconds rest time
      toast.info("Descanso iniciado! 90 segundos.");
    }
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

        {/* Rest Timer Card */}
        {restTimerActive && (
          <Card className="bg-gradient-card border-primary/50 shadow-elevated sticky top-4 z-10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Volume2 className="h-6 w-6 text-primary animate-pulse" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tempo de Descanso</p>
                    <p className="text-3xl font-mono font-bold text-primary">
                      {Math.floor(restTimeRemaining / 60)}:{(restTimeRemaining % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={pauseRestTimer}
                  >
                    {restTimerPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={resetRestTimer}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {workout.exercises.map((exercise) => (
            <Card key={exercise.id} className="shadow-card border-border">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="relative">
                    {exercise.gifUrl ? (
                      <img 
                        src={exercise.gifUrl} 
                        alt={exercise.name}
                        className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openExerciseDetails(exercise)}
                      />
                    ) : (
                      <div className="w-24 h-24 bg-accent rounded-lg flex items-center justify-center">
                        <Trophy className="h-12 w-12 text-accent-foreground" />
                      </div>
                    )}
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute -top-2 -right-2 h-8 w-8 rounded-full shadow-md"
                      onClick={() => openExerciseDetails(exercise)}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
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

        {/* Exercise Details Dialog */}
        <Dialog open={exerciseDetailsOpen} onOpenChange={setExerciseDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl capitalize">{selectedExercise?.name}</DialogTitle>
            </DialogHeader>
            
            {selectedExercise && (
              <div className="space-y-6">
                {/* GIF in fullscreen */}
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-accent/50">
                  {selectedExercise.gifUrl ? (
                    <img
                      src={selectedExercise.gifUrl}
                      alt={selectedExercise.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Trophy className="h-24 w-24 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Exercise Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">Séries</p>
                    <p className="text-2xl font-bold">{selectedExercise.sets}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">Repetições</p>
                    <p className="text-2xl font-bold">{selectedExercise.reps}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">Peso</p>
                    <p className="text-2xl font-bold">{selectedExercise.weight}kg</p>
                  </div>
                  {selectedExercise.target && (
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground mb-1">Músculo Alvo</p>
                      <p className="text-sm font-medium capitalize">{selectedExercise.target}</p>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                {selectedExercise.instructions && selectedExercise.instructions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Instruções Passo a Passo</h3>
                    <div className="space-y-3">
                      {selectedExercise.instructions.map((instruction, index) => (
                        <div key={index} className="flex gap-3 p-4 rounded-lg bg-secondary/30 border border-border">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <p className="flex-1 text-sm leading-relaxed">{instruction}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => setExerciseDetailsOpen(false)}
                  className="w-full"
                  size="lg"
                >
                  Fechar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default WorkoutSession;
