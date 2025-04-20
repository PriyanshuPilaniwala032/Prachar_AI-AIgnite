"use server";

import { Config, configSchema, explanationsSchema, Result } from "@/lib/types";
import { openai } from "@ai-sdk/openai";
import { google } from '@ai-sdk/google';
import { sql } from "@vercel/postgres";
import { generateObject } from "ai";
import { z } from "zod";
import { customModel } from '@/lib/ai';
import { useTableStore } from "@/lib/store"; // ✅ Import Zustand store
import { getRegularPrompt } from "@/lib/ai/prompts";

// Keep the rest of your functions but remove conversation history references

export const executeSQLQuery = async (
  query: string, 
  selectedTable: string,
  options?: { mmmResults?: any[] }
) => {
  "use server";

  // If MMM results are provided, return them directly
  if (options?.mmmResults && options.mmmResults.length > 0) {
    console.log("Using MMM results instead of SQL query");
    return options.mmmResults;
  }

  if (!selectedTable) {
    console.error("❌ No table selected! Cannot execute query.");
    throw new Error("Please select a table before querying.");
  }
  getRegularPrompt(selectedTable);

  // IMPORTANT CHANGE: Remove SQL comments before processing
  const cleanQuery = query.replace(/--.*$/gm, '').trim();
  
  // Log the query for debugging
  console.log("Selected Table:", selectedTable);
  console.log("Original SQL Query:", query);
  
  // Fix the case sensitivity issue by ensuring the table name is properly quoted
  let cleanedQuery = cleanQuery;
  // If the table name appears in the query without double quotes, replace it with properly quoted version
  if (cleanedQuery.toLowerCase().includes(selectedTable.toLowerCase()) && 
      !cleanedQuery.includes(`"${selectedTable}"`)) {
    
    // Use regex to find the table name with any case and replace with exact case in double quotes
    const tableRegex = new RegExp(`\\b${selectedTable.replace(/[-_]/g, '\\$&')}\\b`, 'i');
    cleanedQuery = cleanedQuery.replace(tableRegex, `"${selectedTable}"`);
  }
  
  console.log("Cleaned SQL Query:", cleanedQuery);
  
  // Use the cleaned query for all operations
  const lowerQuery = cleanedQuery.toLowerCase();

  // Check for SELECT * queries
  const selectAllPattern = /select\s+\*\s+from/i;
  if (selectAllPattern.test(cleanedQuery)) {
    console.error("Query rejected: SELECT * is not allowed:", cleanedQuery);
    throw new Error("SELECT * queries are not allowed. Please specify the columns you need.");
  }
  
  // Only block queries that could modify the database
  const disallowedOperations = [
    "insert into", 
    "update ", 
    "delete from", 
    "drop ", 
    "alter ", 
    "create ", 
    "truncate ", 
    "grant ", 
    "revoke "
  ];
  
  // Check if the query contains any disallowed operations
  const containsDisallowedOperation = disallowedOperations.some(op => 
    lowerQuery.includes(op)
  );
  
  // Make sure it's a SELECT query or similar read-only operation
  const isReadOnlyQuery = 
    lowerQuery.startsWith("select ") || 
    lowerQuery.startsWith("with ") ||
    lowerQuery.startsWith("explain ") || 
    lowerQuery.startsWith("show ");
  
  if (containsDisallowedOperation || !isReadOnlyQuery) {
    console.error("Query rejected:", cleanedQuery);
    throw new Error("Only read-only queries are allowed");
  }

  let data: any;
  try {
    // Execute the cleaned query with proper table name quoting
    data = await sql.query(cleanedQuery);
    console.log("executeSQLQuery : returned data:", data.rows);
    return data.rows as Result[];
  } catch (e: any) {
    if (e.message.includes('relation') && e.message.includes('does not exist')) {
      console.error(`Table "${selectedTable}" not found with exact case. Make sure table exists and case is correct.`);
      throw new Error(`Table "${selectedTable}" not found. Please verify the table name exists in your database.`);
    } else {
      console.error("SQL Error:", e.message);
      throw new Error(`SQL Error: ${e.message}`);
    }
  }
};

export const explainQuery = async (input: string, sqlQuery: string) => {
  "use server";
  try {
    const result = await generateObject({
      model: google('gemini-2.0-flash'),
      schema: z.object({
        explanations: explanationsSchema,
      }),
      system: `You are a SQL (postgres) expert. Your job is to explain to the user a SQL query you wrote to retrieve the data they asked for. 
      The table schema is as follows:
    
      - id (Primary Key) – Unique identifier for each unicorn startup.
      - company – Name of the unicorn company.
      - valuation – Valuation of the company in billions of dollars.
      - date_joined – Date the company reached unicorn status.
      - country – Country where the company is based.
      - city – City where the company is headquartered.
      - industry – Industry sector the company operates in.
      - select_investors – List of key investors in the company.

     When you explain you must take a section of the query, and then explain it. Each "section" should be unique. 
     
     If a section doesn't have any explanation, include it, but leave the explanation empty.
     
     Use plain language that a non-technical person could understand. Explain financial and lending concepts when relevant.
     `,
      prompt: `Explain the SQL query you generated to retrieve the data the user wanted. Assume the user is not an expert in SQL. Break down the query into steps. Be concise.

      User Query:
      ${input}

      Generated SQL Query:
      ${sqlQuery}`,
    });
    
    // Return the formatted explanation in the structure expected by the tools
    return {
      explanations: result.object.explanations,
      summary: result.object.explanations[0]?.explanation || "SQL query explanation",
      originalQuery: sqlQuery,
      userQuestion: input,
      success: true
    };
  } catch (e) {
    console.error("Error explaining query:", e);
    return { 
      explanations: [{ section: "Error", explanation: "Failed to generate query explanation" }],
      summary: "Failed to explain the SQL query.",
      originalQuery: sqlQuery,
      userQuestion: input,
      success: false,
      error: e instanceof Error ? e.message : "Unknown error"
    };
  }
};

export const generateChartConfig = async (
  results: Result[],
  userQuery: string,
  resultDataTypes: string
) => {
  "use server";

  console.log("generateChartConfig : running");
  console.log("generateChartConfig : userQuery", userQuery);
  console.log("generateChartConfig : resultDataTypes", resultDataTypes);
  
  // Check if this looks like MMM data
  const isMMMData = results.length > 0 && results[0]?.Scenario !== undefined;
  
  if (isMMMData) {
    // Special chart config for MMM data
    return {
      config: {
        description: 'Compares the predicted sales outcomes based on marketing spend changes.',
        takeaway: 'This chart shows how changes in marketing spend affect sales outcomes.',
        type: 'bar',
        title: 'Impact of Marketing Spend Changes on Sales',
        xKey: 'Scenario',
        yKeys: ['Sales'],
        multipleLines: false,
        measurementColumn: 'Sales',
        lineCategories: [],
        legend: true,
        colors: { Sales: '#4285F4' }
      },
      chartType: 'Bar chart showing Marketing Mix Model predictions'
    };
  }

  const system = `You are a data visualization expert. Your task is to create the most appropriate chart configuration to visualize the data. 
  Choose chart types that best represent the relationships in the data:
  
  - Always use line charts for time series data
  - Always use bar charts for comparing categories
  - Always use scatter plots for showing relationships between two numeric variables
  - Always use pie charts for showing proportions of a whole (but only when there are few categories)
  - Always use stacked bar charts for comparing parts of a whole across categories
  
  - ALWAYS use distinct, high-contrast colors for different categories
  - Ensure colors have sufficient contrast against both light and dark backgrounds`;

  try {
    const { object: config } = await generateObject({
      model: google('gemini-2.0-flash'),
      system,
      prompt: `Given the following data from a SQL query result, generate the chart config that best visualises the data and answers the users query.
      For multiple groups use multi-lines or grouped bars as appropriate (remembering to use line charts for anything involving time series data).

      Here is an example complete config:
        type: "line",
        xKey: "month",
        yKeys: ["category1", "category2", "category3"],
        colors: {
          "category1": "#4285F4",
          "category2": "#34A853",
          "category3": "#FBBC05"
        },
        legend: true
      }

      User Query:
      ${userQuery}

      Data:
      ${JSON.stringify(results, null, 2)}`,
      schema: configSchema,
    });

    // Define a set of default high-contrast colors
    const defaultColors = [
      "#4285F4", // Blue
      "#34A853", // Green
      "#FBBC05", // Yellow
      "#EA4335", // Red
      "#9C27B0", // Purple
      "#FF9800", // Orange
      "#00BCD4", // Cyan
      "#795548", // Brown
      "#607D8B", // Blue Grey
      "#E91E63"  // Pink
    ];
    
    // Generate colors for each yKey
    const colors: Record<string, string> = {};
    config.yKeys.forEach((key, index) => {
      colors[key] = defaultColors[index % defaultColors.length];
    });

    // Create the final config
    const updatedConfig: Config = { 
      ...config, 
      colors,
      legend: true // Always enable legend for categorical data
    };
    
    // For line charts, check if we need to set up for multi-line display
    if (updatedConfig.type === "line" && results.length > 0) {
      const fields = Object.keys(results[0]);
      
      // Skip if we already have multiple yKeys
      if (updatedConfig.yKeys.length === 1) {
        const xKey = updatedConfig.xKey;
        const yKey = updatedConfig.yKeys[0];
        
        // Find potential category fields (not xKey or yKey)
        const potentialCategoryFields = fields.filter(
          field => field !== xKey && field !== yKey
        );
        
        let categoryField = '';
        let categories: string[] = [];
        
        // Find the field with a small number of unique values (likely a category)
        for (const field of potentialCategoryFields) {
          const uniqueValues = new Set(results.map(item => String(item[field])));
          if (uniqueValues.size >= 2 && uniqueValues.size <= 10) {
            categoryField = field;
            categories = Array.from(uniqueValues);
            break;
          }
        }
        
        if (categoryField) {
          // Set up the config for a multi-line chart
          updatedConfig.measurementColumn = yKey;
          updatedConfig.categoryField = categoryField;
          updatedConfig.yKeys = categories;
          
          // Update colors for each category
          categories.forEach((category, index) => {
            colors[category] = defaultColors[index % defaultColors.length];
          });
          
          updatedConfig.colors = colors;
        }
      }
    }
    
    const chartTypeForHistory = `${config.type} chart with x-axis: ${config.xKey}, y-axis: ${config.yKeys.join(', ')}`;
    
    // Ensure bar charts have proper configuration
    if (config.type === "bar") {
      updatedConfig.legend = true;
    }

    console.log("Generated chart config:", updatedConfig);
    
    return { 
      config: updatedConfig,
      chartType: chartTypeForHistory
    };
  } catch (e) {
    console.error(e);
    return { 
      config: {
        type: "bar",
        xKey: "category",
        yKeys: ["value"],
        colors: { "value": "#4285F4" },
        legend: true,
        title: "Error generating chart"
      },
      error: "Failed to generate chart suggestion"
    };
  }
};

// Helper function to detect if this is time series data
export async function detectTimeSeriesData(results: Result[], query: string): Promise<boolean> {
    if (results.length === 0) return false;
    
    // Check if query mentions time periods
    const timeTerms = ['month', 'year', 'date', 'time', 'period', 'quarter', 'day', 'week', 'annual', 'seasonal', 'fluctuate', 'trend', 'over time'];
    const queryHasTimeTerms = timeTerms.some(term => query.toLowerCase().includes(term));
    
    // Check data structure for time columns
    const firstRow = results[0];
    const keys = Object.keys(firstRow);
    
    const hasTimeColumn = keys.some(key => 
      key.toLowerCase().includes('month') || 
      key.toLowerCase().includes('year') || 
      key.toLowerCase().includes('date') ||
      key.toLowerCase().includes('time') ||
      key.toLowerCase().includes('period') ||
      key.toLowerCase().includes('quarter') ||
      key.toLowerCase().includes('day') ||
      key.toLowerCase().includes('week')
    );
    
    // Check if data has sequential numeric values that could represent time periods
    const potentialTimeColumns = keys.filter(key => {
      const values = results.map(row => row[key]);
      // Check if values are all numbers between 1-12 (months) or 1-4 (quarters)
      const allNumbers = values.every(val => !isNaN(Number(val)));
      const inRange = values.every(val => {
        const num = Number(val);
        return (num >= 1 && num <= 12) || (num >= 1 && num <= 4);
      });
      return allNumbers && inRange;
    });
    
    return queryHasTimeTerms || hasTimeColumn || potentialTimeColumns.length > 0;
  }