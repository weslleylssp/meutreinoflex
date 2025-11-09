import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WorkoutHistoryItem {
  id: string;
  workout_name: string;
  duration: number;
  completed_at: string;
  total_weight: number;
  total_sets: number;
  completed_sets: number;
}

interface ProgressChartsProps {
  history: WorkoutHistoryItem[];
}

export const ProgressCharts = ({ history }: ProgressChartsProps) => {
  // Prepare data for charts - last 30 days
  const prepareChartData = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = startOfDay(subDays(new Date(), 29 - i));
      return {
        date: format(date, 'dd/MM', { locale: ptBR }),
        fullDate: date,
        weight: 0,
        duration: 0,
        workouts: 0,
        sets: 0
      };
    });

    history.forEach((workout) => {
      const workoutDate = startOfDay(new Date(workout.completed_at));
      const dayData = last30Days.find(d => 
        d.fullDate.getTime() === workoutDate.getTime()
      );

      if (dayData) {
        dayData.weight += Number(workout.total_weight);
        dayData.duration += workout.duration;
        dayData.workouts += 1;
        dayData.sets += workout.completed_sets;
      }
    });

    return last30Days.map(({ date, weight, duration, workouts, sets }) => ({
      date,
      weight: Math.round(weight),
      duration: Math.round(duration / 60), // Convert to minutes
      workouts,
      sets
    }));
  };

  const chartData = prepareChartData();

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.dataKey === 'weight' && 'kg'}
              {entry.dataKey === 'duration' && 'min'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Peso</CardTitle>
            <CardDescription>Peso total levantado nos últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Peso (kg)"
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Duration Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tempo de Treino</CardTitle>
            <CardDescription>Duração total dos treinos (minutos)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="duration" 
                  fill="hsl(var(--primary))" 
                  name="Duração (min)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Workout Frequency Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Frequência de Treinos</CardTitle>
            <CardDescription>Número de treinos realizados por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="workouts" 
                  fill="hsl(var(--chart-2))" 
                  name="Treinos"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sets Completed Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Séries Completadas</CardTitle>
            <CardDescription>Total de séries realizadas por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="sets" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  name="Séries"
                  dot={{ fill: 'hsl(var(--chart-3))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
