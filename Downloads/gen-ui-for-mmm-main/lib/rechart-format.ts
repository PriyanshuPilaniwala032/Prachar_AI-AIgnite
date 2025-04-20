import { Config } from "./types";

type InputDataPoint = Record<string, string | number>;

interface TransformedDataPoint {
  [key: string]: string | number | null;
}

interface TransformationResult {
  data: TransformedDataPoint[];
  xAxisField: string;
  lineFields: string[];
}

export function transformDataForMultiLineChart(
  data: InputDataPoint[],
  chartConfig: Config
): TransformationResult {
  if (!data || data.length === 0) {
    return { data: [], xAxisField: '', lineFields: [] };
  }

  const {xKey, measurementColumn} = chartConfig;
  const fields = Object.keys(data[0]);
  const xAxisField = xKey ?? 'year';
  
  // Auto-detect the category field
  let categoryField = '';
  let detectedCategories: (string | number)[] = [];
  
  // Exclude the xKey and measurementColumn from potential category fields
  const potentialCategoryFields = fields.filter(
    field => field !== xKey && field !== measurementColumn
  );
  
  // Find the field with the fewest unique values (likely the category field)
  let minUniqueValues = Infinity;
  
  for (const field of potentialCategoryFields) {
    const uniqueValues = new Set(data.map(item => String(item[field])));
    if (uniqueValues.size < minUniqueValues && uniqueValues.size > 1 && uniqueValues.size <= 10) {
      minUniqueValues = uniqueValues.size;
      categoryField = field;
      detectedCategories = Array.from(uniqueValues);
    }
  }
  
  // If we couldn't detect a category field, return the original data
  if (!categoryField || !measurementColumn) {
    return {
      data,
      xAxisField,
      lineFields: chartConfig.yKeys || []
    };
  }
  
  const xAxisValues = Array.from(new Set(data.map(item => String(item[xAxisField]))));
  
  // Sort chronologically if they look like dates, otherwise numerically if possible
  xAxisValues.sort((a, b) => {
    // Check if values are in YYYY-MM format
    if (/^\d{4}-\d{2}$/.test(a) && /^\d{4}-\d{2}$/.test(b)) {
      return a.localeCompare(b);
    }
    // Otherwise try numeric sort
    const numA = Number(a);
    const numB = Number(b);
    return isNaN(numA) || isNaN(numB) ? a.localeCompare(b) : numA - numB;
  });
  
  const transformedData: TransformedDataPoint[] = xAxisValues.map(xValue => {
    const dataPoint: TransformedDataPoint = { [xAxisField]: xValue };
    
    detectedCategories.forEach(category => {
      // Convert both to strings for comparison
      const matchingItem = data.find(item =>
        String(item[xAxisField]) === xValue && 
        String(item[categoryField]) === String(category)
      );
      
      dataPoint[String(category)] = matchingItem ? 
        Number(matchingItem[measurementColumn]) : null;
    });
    
    return dataPoint;
  });
  
  return {
    data: transformedData,
    xAxisField,
    lineFields: detectedCategories.map(c => String(c))
  };
}
