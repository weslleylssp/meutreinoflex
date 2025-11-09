import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Edit, Trash2, Play, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  gifUrl?: string;
}

interface WorkoutCardProps {
  id: string;
  name: string;
  exercises: Exercise[];
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
}

export const WorkoutCard = ({ id, name, exercises, onEdit, onDelete, onShare }: WorkoutCardProps) => {
  const navigate = useNavigate();

  const handleStartWorkout = () => {
    navigate(`/workout/${id}`, { state: { workout: { id, name, exercises } } });
  };
  return (
    <Card className="shadow-card hover:shadow-elevated transition-all duration-300 bg-gradient-card border-border">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent">
              <Dumbbell className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">{name}</CardTitle>
              <CardDescription>{exercises.length} exercícios</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={onShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {exercises.slice(0, 3).map((exercise) => (
            <div key={exercise.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
              {exercise.gifUrl ? (
                <img 
                  src={exercise.gifUrl} 
                  alt={exercise.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              ) : (
                <div className="p-2 rounded-lg bg-accent w-16 h-16 flex items-center justify-center">
                  <Dumbbell className="h-6 w-6 text-accent-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{exercise.name}</p>
                <p className="text-xs text-muted-foreground">
                  {exercise.sets}x{exercise.reps} • {exercise.weight}kg
                </p>
              </div>
            </div>
          ))}
          {exercises.length > 3 && (
            <p className="text-xs text-muted-foreground text-center">
              +{exercises.length - 3} mais exercícios
            </p>
          )}
        </div>
        <Button 
          onClick={handleStartWorkout}
          className="w-full mt-4 bg-gradient-primary shadow-elevated"
        >
          <Play className="h-4 w-4 mr-2" />
          Iniciar Treino
        </Button>
      </CardContent>
    </Card>
  );
};
