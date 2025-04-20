import { Result } from "@/lib/types";

/**
 * Parse CSV data into a structured array of objects
 */
export function parseCSVToResults(csvData: string): Result[] {
  try {
    // Split the CSV into lines
    const lines = csvData.trim().split('\n');
    
    if (lines.length < 2) {
      throw new Error('CSV data has insufficient rows');
    }
    
    // Get headers from the first line
    const headers = lines[0].split(',').map(header => header.trim());
    
    // Convert remaining lines to objects
    const results = lines.slice(1).map(line => {
      const values = line.split(',');
      const obj: any = {};
      
      headers.forEach((header, index) => {
        // Try to convert to number if possible
        const cleanHeader = header.replace(/^"|"$/g, '').trim();
        const value = values[index]?.trim();
        
        if (value === undefined || value === '') {
          obj[cleanHeader] = null;
        } else if (!isNaN(Number(value))) {
          obj[cleanHeader] = Number(value);
        } else {
          obj[cleanHeader] = value;
        }
      });
      
      return obj;
    });
    
    return results;
  } catch (error) {
    console.error('Error parsing CSV to results:', error);
    throw new Error(`Failed to parse CSV data: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parse CSV string to JSON objects
 */


/**
 * Clean column names to be SQL-friendly
 */
export function cleanColumnName(name: string): string {
  // Remove quotes, trim whitespace, replace spaces with underscores
  return name.replace(/^"|"$/g, '').trim().replace(/\s+/g, '_');
}