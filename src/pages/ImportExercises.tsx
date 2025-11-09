import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle2 } from "lucide-react";
import { importExercisesFromCSV } from "@/services/localExerciseService";

const ImportExercises = () => {
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  const handleImport = async () => {
    try {
      setImporting(true);
      
      // Fetch the CSV file from public folder
      const response = await fetch('/exercises.csv');
      const csvText = await response.text();
      
      // Convert to File object
      const blob = new Blob([csvText], { type: 'text/csv' });
      const file = new File([blob], 'exercises.csv', { type: 'text/csv' });

      const result = await importExercisesFromCSV(file);
      
      if (result.success) {
        toast.success(`${result.count} exercícios importados com sucesso!`);
        setImported(true);
      }
    } catch (error) {
      console.error('Error importing exercises:', error);
      toast.error('Erro ao importar exercícios');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Importar Exercícios</CardTitle>
            <CardDescription>
              Importar base de dados de exercícios para uso local
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!imported ? (
              <>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Este processo irá importar todos os exercícios do arquivo CSV para o banco de dados local.
                    Isso precisa ser feito apenas uma vez.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total de exercícios: <strong>~1324 exercícios</strong>
                  </p>
                </div>

                <Button
                  onClick={handleImport}
                  disabled={importing}
                  size="lg"
                  className="w-full"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      Iniciar Importação
                    </>
                  )}
                </Button>

                {importing && (
                  <div className="text-sm text-muted-foreground text-center">
                    Este processo pode levar alguns minutos...
                  </div>
                )}
              </>
            ) : (
              <div className="text-center space-y-4">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Importação Concluída!</h3>
                  <p className="text-muted-foreground">
                    Os exercícios foram importados com sucesso e estão prontos para uso.
                  </p>
                </div>
                <Button
                  onClick={() => window.location.href = '/exercises'}
                  variant="outline"
                >
                  Ver Exercícios
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImportExercises;
