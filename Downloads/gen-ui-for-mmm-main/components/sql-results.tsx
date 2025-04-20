// CREATE THIS FILE
import React from 'react';
import DynamicChart from './dynamic-chart';

interface SqlResultsProps {
  results: any[];
  chartConfig: any;
  query?: string;
}

export default function SqlResults({ results, chartConfig, query }: SqlResultsProps) {
  console.log("Rendering SQL Results with:", { 
    resultCount: results.length, 
    chartConfig 
  });
  
  return (
    <div className="mt-4 mb-8 p-4 bg-gray-800 rounded-lg">
      <div className="mb-3">
        <h3 className="text-lg font-semibold mb-1">
          {chartConfig.title || 'Query Results'}
        </h3>
        
        {chartConfig.description && (
          <p className="text-sm text-gray-300 mb-2">{chartConfig.description}</p>
        )}
      </div>
      
      {/* Chart visualization */}
      <div className="h-[400px] w-full">
        <DynamicChart 
          chartData={results} 
          chartConfig={chartConfig} 
        />
      </div>
      
      {/* Bottom information */}
      {chartConfig.takeaway && (
        <div className="mt-3 text-sm text-gray-300 border-t border-gray-700 pt-2">
          <strong>Key insight:</strong> {chartConfig.takeaway}
        </div>
      )}
    </div>
  );
}