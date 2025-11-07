import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Edit, Trash2 } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

interface WorkoutCardProps {
  id: string;
  name: string;
  exercises: Exercise[];
  onEdit: () => void;
  onDelete: () => void;
}

export const WorkoutCard = ({ name, exercises, onEdit, onDelete }: WorkoutCardProps) => {
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
            <div key={exercise.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <span className="font-medium text-sm">{exercise.name}</span>
              <span className="text-xs text-muted-foreground">
                {exercise.sets}x{exercise.reps} • {exercise.weight}kg
              </span>
            </div>
          ))}
          {exercises.length > 3 && (
            <p className="text-xs text-muted-foreground text-center">
              +{exercises.length - 3} mais exercícios
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
