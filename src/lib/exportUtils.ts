interface WorkoutHistoryItem {
  id: string;
  workout_name: string;
  duration: number;
  completed_at: string;
  total_weight: number;
  total_sets: number;
  completed_sets: number;
  exercises?: any[];
}

export const exportToCSV = (history: WorkoutHistoryItem[]) => {
  const headers = ['Data', 'Treino', 'Duração (min)', 'Peso Total (kg)', 'Séries Completadas', 'Total Séries'];
  
  const rows = history.map(item => [
    new Date(item.completed_at).toLocaleDateString('pt-BR'),
    item.workout_name,
    Math.round(item.duration / 60),
    Number(item.total_weight).toFixed(0),
    item.completed_sets,
    item.total_sets
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `historico-treinos-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (history: WorkoutHistoryItem[]) => {
  // Create a simple HTML table for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Histórico de Treinos</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        h1 {
          color: #333;
          border-bottom: 2px solid #666;
          padding-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .summary {
          margin-top: 30px;
          padding: 15px;
          background-color: #f0f0f0;
          border-radius: 5px;
        }
        .summary h2 {
          margin-top: 0;
        }
        @media print {
          button {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <h1>Histórico de Treinos</h1>
      <p>Gerado em: ${new Date().toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      })}</p>
      
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Treino</th>
            <th>Duração</th>
            <th>Peso Total</th>
            <th>Séries</th>
          </tr>
        </thead>
        <tbody>
          ${history.map(item => `
            <tr>
              <td>${new Date(item.completed_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}</td>
              <td>${item.workout_name}</td>
              <td>${Math.round(item.duration / 60)} min</td>
              <td>${Number(item.total_weight).toFixed(0)} kg</td>
              <td>${item.completed_sets}/${item.total_sets}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="summary">
        <h2>Resumo</h2>
        <p><strong>Total de Treinos:</strong> ${history.length}</p>
        <p><strong>Tempo Total:</strong> ${Math.round(history.reduce((sum, item) => sum + item.duration, 0) / 60)} minutos</p>
        <p><strong>Peso Total Levantado:</strong> ${history.reduce((sum, item) => sum + Number(item.total_weight), 0).toFixed(0)} kg</p>
        <p><strong>Total de Séries:</strong> ${history.reduce((sum, item) => sum + item.completed_sets, 0)}</p>
      </div>

      <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; font-size: 16px; cursor: pointer;">
        Imprimir / Salvar como PDF
      </button>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
