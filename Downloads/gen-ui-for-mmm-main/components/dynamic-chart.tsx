"use client";

import { useState, useEffect } from "react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Rectangle,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Config, Result } from "@/lib/types";
import { Label } from "recharts";
import { transformDataForMultiLineChart } from "@/lib/rechart-format";

function toTitleCase(str: string): string {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function DynamicChart({
  chartData,
  chartConfig,
}: {
  chartData: Result[];
  chartConfig: Config;
}) {
  // Add state to track which series are visible
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>({});
  
  // Get all series keys that should be tracked for visibility
  const getSeriesKeys = () => {
    if (chartConfig.type === "line" || chartConfig.type === "bar" || chartConfig.type === "area") {
      const { lineFields } = transformDataForMultiLineChart(chartData, chartConfig);
      return lineFields.length > 0 ? lineFields : chartConfig.yKeys;
    } else if (chartConfig.type === "pie") {
      return [chartConfig.yKeys[0]];
    }
    return chartConfig.yKeys;
  };
  
  // Initialize all series as visible when component mounts or data/config changes
  useEffect(() => {
    const keys = getSeriesKeys();
    console.log("Series keys:", keys);
    if (keys.length > 0) {
      const initialState: Record<string, boolean> = {};
      keys.forEach(key => {
        initialState[key] = true;
      });
      setVisibleSeries(initialState);
    }
  }, [chartData, chartConfig]);
  
  // Toggle visibility when legend is clicked
  const handleLegendClick = (dataKey: string) => {
    setVisibleSeries(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
  };

  // Define fallback colors in case chartConfig.colors is missing
  const fallbackColors = [
    "#4285F4", // Blue
    "#34A853", // Green
    "#FBBC05", // Yellow
    "#EA4335", // Red
    "#9C27B0", // Purple
    "#FF9800", // Orange
    "#00BCD4", // Cyan
    "#3F51B5", // Indigo
  ];

  // Function to get color for a key, using custom colors if available
  const getColorForKey = (key: string, index: number) => {
    // If chartConfig has colors defined for this key, use it
    if (chartConfig.colors && chartConfig.colors[key]) {
      return chartConfig.colors[key];
    }
    
    // For multi-line charts, try to match with loan purpose keywords
    const loanPurposeColors = {
      "debt consolidation": "#4285F4",
      "home improvement": "#34A853",
      "education": "#FBBC05",
      "medical": "#EA4335",
      "major purchase": "#9C27B0",
      "other": "#FF9800",
    };
    
    // Check if the key contains any of our loan purpose keywords
    for (const [purpose, color] of Object.entries(loanPurposeColors)) {
      if (key.toLowerCase().includes(purpose)) {
        return color;
      }
    }
    
    // Otherwise fall back to the vibrant colors
    return fallbackColors[index % fallbackColors.length];
  };

  // Custom legend component with click handler
  const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap justify-center gap-4 mt-2">
        {payload.map((entry: any, index: number) => (
          <li 
            key={`item-${index}`}
            className="flex items-center cursor-pointer"
            onClick={() => handleLegendClick(entry.dataKey)}
          >
            <div 
              className="w-3 h-3 mr-2 rounded-sm" 
              style={{ 
                backgroundColor: entry.color,
                opacity: visibleSeries[entry.dataKey] ? 1 : 0.3 
              }}
            />
            <span style={{ opacity: visibleSeries[entry.dataKey] ? 1 : 0.5 }}>
              {entry.value}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  const renderChart = () => {
    if (!chartData || !chartConfig) return <div>No chart data</div>;
    
    console.log("Chart data:", chartData);
    console.log("Chart config:", chartConfig);
    
    // Parse numeric values in the data
    const parsedChartData = chartData.map((item) => {
      const parsedItem: { [key: string]: any } = {};
      for (const [key, value] of Object.entries(item)) {
        parsedItem[key] = isNaN(Number(value)) ? value : Number(value);
      }
      return parsedItem;
    });

    const processedData = processChartData(parsedChartData, chartConfig.type);
    
    // Common props for all chart types
    const commonProps = {
      data: processedData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };
    
    // Common cartesian chart elements (for bar, line, area)
    const cartesianElements = (
      <>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={chartConfig.xKey}>
          <Label
            value={toTitleCase(chartConfig.xKey)}
            offset={0}
            position="insideBottom"
          />
        </XAxis>
        <YAxis>
          <Label
            value={toTitleCase(chartConfig.yKeys[0])}
            angle={-90}
            position="insideLeft"
          />
        </YAxis>
        <ChartTooltip content={<ChartTooltipContent />} />
        {chartConfig.legend && <Legend content={<CustomLegend />} />}
      </>
    );
    
    // Render series elements (Bar, Line, Area) with visibility control
    const renderSeriesElements = (Component: typeof Bar | typeof Line | typeof Area, extraProps = {}) => {
      return chartConfig.yKeys.map((key, index) => (
        <Component
          key={key}
          dataKey={key}
          fill={getColorForKey(key, index)}
          stroke={getColorForKey(key, index)}
          hide={visibleSeries[key] === false}
          {...extraProps}
        />
      ));
    };
    
    // Handle multi-line chart transformation
    const handleMultiLineData = () => {
      const { data, xAxisField, lineFields } = transformDataForMultiLineChart(
        processedData,
        chartConfig,
      );
      console.log("Multi-line transformation:", { data, xAxisField, lineFields, chartConfig });
      
      const useTransformedData =
        lineFields.length > 0 &&
        chartConfig.measurementColumn &&
        data.length > 0;
      
      if (useTransformedData) {
        return {
          data,
          xAxisField,
          lineFields,
          useTransformed: true
        };
      }
      
      return {
        data: processedData,
        xAxisField: chartConfig.xKey,
        lineFields: chartConfig.yKeys,
        useTransformed: false
      };
    };
    
    // Render the appropriate chart based on type
    switch (chartConfig.type) {
      case "bar":
        return (
          <BarChart 
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={chartConfig.xKey}
              tick={{ fill: '#ffffff' }}
              height={60}
              tickMargin={15}
              angle={-45}
              textAnchor="end"
              interval={0}
            >
              <Label
                value={toTitleCase(chartConfig.xKey)}
                offset={-10}
                position="insideBottom"
                fill="#ffffff"
              />
            </XAxis>
            <YAxis tick={{ fill: '#ffffff' }}>
              <Label
                value={toTitleCase(chartConfig.yKeys[0])}
                angle={-90}
                position="insideLeft"
                fill="#ffffff"
              />
            </YAxis>
            <ChartTooltip content={<ChartTooltipContent />} />
            {chartConfig.legend && <Legend 
              formatter={(value) => <span style={{ color: '#ffffff' }}>{value}</span>}
              verticalAlign="top"
              height={36}
            />}
            {chartConfig.yKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={getColorForKey(key, index)}
                label={{
                  position: 'top',
                  fill: '#ffffff',
                  fontSize: 12
                }}
                hide={visibleSeries[key] === false}
              />
            ))}
          </BarChart>
        );
        
      case "line": {
        const { data, xAxisField, lineFields, useTransformed } = handleMultiLineData();
        console.log("Line chart rendering with:", { 
          data: data.slice(0, 2), // Show just a sample to avoid console clutter
          xAxisField, 
          lineFields, 
          useTransformed 
        });

        // Add console logging for debugging
        console.log("Rendering line chart with:", { 
          data, 
          xAxisField, 
          lineFields, 
          useTransformed,
          measurementColumn: chartConfig.measurementColumn,
          categoryField: chartConfig.categoryField
        });
        
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisField}>
              <Label
                value={toTitleCase(xAxisField)}
                offset={0}
                position="insideBottom"
              />
            </XAxis>
            <YAxis>
              <Label
                value={toTitleCase(useTransformed ? chartConfig.measurementColumn || '' : chartConfig.yKeys[0])}
                angle={-90}
                position="insideLeft"
              />
            </YAxis>
            <ChartTooltip content={<ChartTooltipContent />} />
            {chartConfig.legend && <Legend content={<CustomLegend />} />}
            {lineFields.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={getColorForKey(key, index)}
                hide={visibleSeries[key] === false}
              />
            ))}
          </LineChart>
        );
      }
        
      case "area":
        return (
          <AreaChart {...commonProps}>
            {cartesianElements}
            {renderSeriesElements(Area, { type: "monotone" })}
          </AreaChart>
        );
        
      case "pie": {
        // For pie charts, we need to transform the data
        const pieData = [];
        const pieCategories = new Set();
        
        // First, identify all unique categories
        if (chartConfig.xKey && chartConfig.yKeys.length > 0) {
          processedData.forEach(item => {
            const category = item[chartConfig.xKey];
            if (category) {
              pieCategories.add(category);
            }
          });
        } else {
          chartConfig.yKeys.forEach(key => {
            pieCategories.add(key);
          });
        }
        
        // Initialize visibility state for categories if needed
        pieCategories.forEach(category => {
          if (visibleSeries[category] === undefined) {
            setVisibleSeries(prev => ({
              ...prev,
              [category]: true
            }));
          }
        });
        
        // Now aggregate the data
        if (chartConfig.xKey && chartConfig.yKeys.length > 0) {
          const aggregatedData = new Map();
          
          processedData.forEach(item => {
            const category = item[chartConfig.xKey];
            const value = item[chartConfig.yKeys[0]];
            
            if (category && value !== undefined) {
              if (aggregatedData.has(category)) {
                aggregatedData.set(category, aggregatedData.get(category) + value);
              } else {
                aggregatedData.set(category, value);
              }
            }
          });
          
          // Only include visible categories
          aggregatedData.forEach((value, name) => {
            if (visibleSeries[name] !== false) {
              pieData.push({ name, value });
            }
          });
        } else {
          const item = processedData[0] || {};
          chartConfig.yKeys.forEach(key => {
            if (item[key] !== undefined && visibleSeries[key] !== false) {
              pieData.push({ name: toTitleCase(key), value: item[key] });
            }
          });
        }
        
        // Calculate total for percentage
        const total = pieData.reduce((sum, entry) => sum + entry.value, 0);
        
        // Create legend payload with all categories (even hidden ones)
        const legendPayload = Array.from(pieCategories).map((category, index) => {
          const name = typeof category === 'string' ? category : String(category);
          return {
            value: toTitleCase(name),
            type: 'square',
            color: getColorForKey(name, index),
            dataKey: name,
            payload: { name }
          };
        });
        
        // Custom legend component specifically for pie charts
        const PieChartLegend = () => (
          <ul className="flex flex-wrap justify-center gap-4 mt-2">
            {legendPayload.map((entry, index) => {
              const isVisible = visibleSeries[entry.dataKey] !== false;
              return (
                <li 
                  key={`item-${index}`}
                  className="flex items-center cursor-pointer"
                  onClick={() => {
                    console.log(`Toggling visibility for ${entry.dataKey}`);
                    handleLegendClick(entry.dataKey);
                  }}
                >
                  <div 
                    className="w-3 h-3 mr-2 rounded-sm" 
                    style={{ 
                      backgroundColor: entry.color,
                      opacity: isVisible ? 1 : 0.3 
                    }}
                  />
                  <span style={{ opacity: isVisible ? 1 : 0.5 }}>
                    {entry.value}
                  </span>
                </li>
              );
            })}
          </ul>
        );
        
        return (
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label={({ name, value }) => {
                const percent = ((value / total) * 100).toFixed(0);
                return `${name}: ${percent}%`;
              }}
              labelLine={true}
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getColorForKey(entry.name, index)}
                />
              ))}
            </Pie>
            <ChartTooltip 
              content={<ChartTooltipContent />} 
              formatter={(value) => [`${value} (${((value / total) * 100).toFixed(1)}%)`, 'Value']}
            />
            {chartConfig.legend && <Legend content={<PieChartLegend />} />}
          </PieChart>
        );
      }
        
      case "heatmap": {
        // Extract unique categories for both axes
        const xCategories = [...new Set(processedData.map(item => item[chartConfig.xKey]))];
        const yCategories = [...new Set(processedData.map(item => item[chartConfig.yKeys[0]]))];
        
        // Create a color scale for the heatmap
        const minValue = Math.min(...processedData.map(item => item[chartConfig.valueKey]));
        const maxValue = Math.max(...processedData.map(item => item[chartConfig.valueKey]));
        
        return (
          <ChartContainer className="w-full aspect-[4/3]">
            <BarChart
              data={processedData}
              margin={{ top: 20, right: 30, left: 100, bottom: 70 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                domain={[0, 1]} 
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                tick={{ fill: '#ffffff' }}
              />
              <YAxis 
                dataKey={chartConfig.yKeys[0]} 
                type="category" 
                tick={{ fill: '#ffffff' }}
                width={90}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value) => `${(Number(value) * 100).toFixed(1)}%`}
              />
              <Bar dataKey={chartConfig.valueKey || "approval_rate"}>
                {processedData.map((entry, index) => {
                  // Calculate color based on value
                  const value = entry[chartConfig.valueKey || "approval_rate"];
                  const ratio = (value - minValue) / (maxValue - minValue);
                  // Use a color gradient from cool to warm
                  const r = Math.floor(255 * ratio);
                  const g = Math.floor(100 + (155 * (1 - Math.abs(ratio - 0.5) * 2)));
                  const b = Math.floor(255 * (1 - ratio));
                  
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`rgb(${r}, ${g}, ${b})`} 
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ChartContainer>
        );
      }
        
      default:
        return <div>Unsupported chart type: {chartConfig.type}</div>;
    }
  };

  // Helper function to process chart data
  const processChartData = (data: Result[], chartType: string) => {
    if (chartType === "bar" || chartType === "pie") {
      if (data.length <= 8) {
        return data;
      }
      return data.slice(0, 20);
    }
    return data;
  };

  return (
    <div className="w-full flex flex-col justify-center items-center">
      <h2 className="text-lg font-bold mb-2">{chartConfig.title}</h2>
      {chartConfig && chartData.length > 0 && (
        <ChartContainer
          config={chartConfig.yKeys.reduce(
            (acc, key, index) => {
              acc[key] = {
                label: key,
                color: getColorForKey(key, index),
              };
              return acc;
            },
            {} as Record<string, { label: string; color: string }>,
          )}
          className="h-[320px] w-full"
        >
          {renderChart()}
        </ChartContainer>
      )}
    </div>
  );
}
