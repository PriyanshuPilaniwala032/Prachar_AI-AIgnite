'use client';

import { useState } from 'react';
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "./ui/table";
import { ChevronUp, ChevronDown, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DynamicChart } from './dynamic-chart'; // Import the DynamicChart component

export function SQLQueryResult({ result }: { result: any }) {
  const [isTableVisible, setIsTableVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table');
  
  // Extract data from the result
  const { query, results, chartConfig } = result;
  const columns = results.length > 0 ? Object.keys(results[0]) : [];
  
  // Check if we have chart data to display
  const hasChartData = chartConfig && Object.keys(chartConfig).length > 0;
  
  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg sql-query-result">
      {/* Tab navigation - only show if chart data exists */}
      {hasChartData && (
        <div className="flex mb-4 border-b border-gray-300 dark:border-gray-700">
          <button 
            onClick={() => setActiveTab('table')}
            className={`px-4 py-2 ${activeTab === 'table' 
              ? 'border-b-2 border-blue-500 font-medium' 
              : 'text-gray-500 dark:text-gray-400'}`}
          >
            Data Table
          </button>
          <button 
            onClick={() => setActiveTab('chart')}
            className={`px-4 py-2 flex items-center gap-1 ${activeTab === 'chart' 
              ? 'border-b-2 border-blue-500 font-medium' 
              : 'text-gray-500 dark:text-gray-400'}`}
          >
            <BarChart3 size={16} />
            Visualization
          </button>
        </div>
      )}
      
      {/* Table View */}
      {activeTab === 'table' && (
        <>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Data Table</h3>
            <button 
              onClick={() => setIsTableVisible(!isTableVisible)}
              className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400"
            >
              {isTableVisible ? (
                <>
                  <ChevronUp size={16} />
                  Hide Table
                </>
              ) : (
                <>
                  <ChevronDown size={16} />
                  Show Table
                </>
              )}
            </button>
          </div>
          
          <AnimatePresence>
            {isTableVisible && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                {/* Display SQL Query */}
                {query && (
                  <div className="mb-4 p-3 bg-gray-200 dark:bg-gray-700 rounded-md font-mono text-sm overflow-x-auto">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">SQL Query:</div>
                    <code>{query}</code>
                  </div>
                )}
                
                {/* Add a fixed height container with scrolling */}
                <div className="max-h-[400px] overflow-auto">
                  <Table className="min-w-full divide-y divide-border">
                    <TableHeader className="bg-secondary sticky top-0 shadow-sm">
                      <TableRow>
                        {columns.map((column: string, colIndex: number) => (
                          <TableHead key={colIndex} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {column}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-card divide-y divide-border">
                      {results.map((row: any, rowIndex: number) => (
                        <TableRow key={rowIndex} className="hover:bg-muted">
                          {columns.map((column: string, cellIndex: number) => (
                            <TableCell key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                              {row[column] instanceof Date ? row[column].toLocaleDateString() : String(row[column])}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
      
      {/* Chart View */}
      {activeTab === 'chart' && hasChartData && (
        <div className="py-4">
          <DynamicChart 
            chartData={results} 
            chartConfig={chartConfig} 
          />
        </div>
      )}
    </div>
  );
} 