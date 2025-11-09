import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import WorkoutSession from "./pages/WorkoutSession";
import WorkoutHistory from "./pages/WorkoutHistory";
import ExerciseBrowser from "./pages/ExerciseBrowser";
import Auth from "./pages/Auth";
import ImportExercises from "./pages/ImportExercises";
import ExercisesTable from "./pages/ExercisesTable";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Index />} />
          <Route path="/workout/:id" element={<WorkoutSession />} />
          <Route path="/history" element={<WorkoutHistory />} />
          <Route path="/exercises" element={<ExerciseBrowser />} />
          <Route path="/exercises-table" element={<ExercisesTable />} />
          <Route path="/import-exercises" element={<ImportExercises />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
