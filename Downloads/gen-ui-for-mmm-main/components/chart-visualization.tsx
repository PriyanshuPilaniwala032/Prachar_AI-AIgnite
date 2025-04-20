'use client';

import { DynamicChart } from "./dynamic-chart";

export function ChartVisualization({ result }: { result: any }) {
  // The chart config should be in the result from the visualizeQueryData tool
  // We need to access the SQL results from a previous tool call
  
  // This is a simplified version - in practice, you might need to 
  // access the SQL results from a previous message or tool call
  const chartData = result.chartData || [];
  const chartConfig = result.chartConfig || {};
  
  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Data Visualization</h3>
      <DynamicChart 
        chartData={chartData} 
        chartConfig={chartConfig} 
      />
    </div>
  );
} 