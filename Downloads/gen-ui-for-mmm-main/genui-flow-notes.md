# Chatbot Flow: From User Input to UI Display

## Overview

This document explains the complete flow of the chatbot application, focusing on how user input is processed, how the LLM uses tools to generate responses, and how those responses are displayed in the UI.

## 1. User Input Flow

When a user types a message in the chat interface:

1. The `Chat` component (`components/chat.tsx`) captures the user input
2. The `useChat` hook from the `ai/react` library manages the chat state
3. When the user submits a message, the `handleSubmit` function sends a POST request to `/api/chat`
4. This request includes the chat ID, message history, and selected model ID

## 2. Server-Side Processing

The server processes the request in `app/(chat)/api/chat/route.ts`:

1. The POST handler extracts the chat ID, messages, and model ID
2. It authenticates the user and validates the model
3. It saves the user message to the database
4. It prepares a streaming response using `StreamData`
5. It calls the LLM with the messages and available tools

## 3. LLM Tool Usage

The LLM can use various tools defined in `route.ts`:

### SQL Query Tools
```typescript
executeSQLQuery: {
  description: 'Run a SQL query against the loan_applications database',
  parameters: z.object({
    sqlQuery: z.string().describe('A valid SQL query for the loan_applications database')
  }),
  execute: async ({sqlQuery}) => {
    const results = await executeSQLQuery(sqlQuery);
    
    streamingData.append({
      type: 'sql-results',
      content: {
        query: sqlQuery,
        results: results
      }
    });
    
    return {
      query: sqlQuery,
      results: results
    };
  },
}
```

### Weather Tool
```typescript
getWeather: {
  description: 'Get the current weather at a location',
  parameters: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  execute: async ({ latitude, longitude }) => {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
    );

    const weatherData = await response.json();
    return weatherData;
  },
}
```

### Document Creation Tool
```typescript
createDocument: {
  description: 'Create a document for a writing activity',
  parameters: z.object({
    title: z.string(),
  }),
  execute: async ({ title }) => {
    // Implementation details...
    streamingData.append({
      type: 'id',
      content: id,
    });
    // More implementation...
  }
}
```

## 4. Streaming Response

When a tool is executed:

1. The tool's `execute` function runs on the server
2. Results are appended to `streamingData` with a specific `type` identifier
3. The data is streamed back to the client in real-time
4. The `useChat` hook processes this streamed data

## 5. UI Rendering in message.tsx

The `message.tsx` component renders different UI elements based on the tool type:

```typescript
{message.toolInvocations && message.toolInvocations.length > 0 && (
  <div className="flex flex-col gap-4">
    {message.toolInvocations.map((toolInvocation) => {
      const { toolName, toolCallId, state, args } = toolInvocation;

      if (state === 'result') {
        const { result } = toolInvocation;

        return (
          <div key={toolCallId}>
            {toolName === 'getWeather' ? (
              <Weather weatherAtLocation={result} />
            ) : toolName === 'executeSQLQuery' ? (
              <SQLQueryResult result={result} />
            ) : toolName === 'visualizeQueryData' ? (
              <ChartVisualization result={result} />
            ) : toolName === 'createDocument' ? (
              <DocumentToolResult
                type="create"
                result={result}
                block={block}
                setBlock={setBlock}
                isReadonly={isReadonly}
              />
            ) : (
              <pre>{JSON.stringify(result, null, 2)}</pre>
            )}
          </div>
        );
      }
      // Loading state handling...
    })}
  </div>
)}
```

## 6. Specialized UI Components

Each tool type has a corresponding UI component:

1. **SQL Query Results**: The `SQLQueryResult` component displays query results in a table format
2. **Weather Data**: The `Weather` component shows weather information in a visually appealing card
3. **Document Creation**: The `DocumentToolResult` component renders an editable document
4. **Chart Visualization**: The `ChartVisualization` component displays data visualizations

## 7. QueryViewer Integration

For SQL queries, the `QueryViewer` component provides an interactive way to view and understand queries:

```typescript
// In SQLQueryResult component
<div className="flex flex-col gap-4">
  <QueryViewer 
    activeQuery={result.query} 
    inputValue={userQuestion} 
  />
  <div className="results-table">
    {/* Table rendering */}
  </div>
</div>
```

The `QueryViewer` component:
- Displays the SQL query in a code block
- Allows expanding/collapsing the query
- Provides an "Explain" button that generates explanations for different parts of the query
- Shows tooltips with explanations when hovering over query parts

## 8. Complete Flow Example: SQL Query

1. User asks: "How many loan applications were approved last month?"
2. Request is sent to the server
3. LLM decides to use the `executeSQLQuery` tool
4. Tool executes the SQL query against the database
5. Results are streamed back with `type: 'sql-results'`
6. `message.tsx` detects the SQL results type
7. `SQLQueryResult` component renders the results
8. `QueryViewer` displays the SQL query with interactive features

## 9. Model Providers

The application supports multiple LLM providers:
- OpenAI models (GPT-4o, GPT-4o-mini)
- Google models (Gemini 2.0 Flash)

The `customModel` function in `lib/ai/index.ts` handles provider selection based on the model configuration.

## 10. Error Handling

The flow includes error handling at various stages:
- Authentication errors return 401 responses
- Model validation errors return 404 responses
- Tool execution errors are caught and returned in the response
- UI components handle loading states and error states gracefully

This architecture creates a flexible, interactive chatbot that can process user queries, execute various tools, and display rich, interactive responses beyond simple text.
