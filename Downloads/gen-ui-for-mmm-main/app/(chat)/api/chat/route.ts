import {
  type Message,
  StreamData,
  convertToCoreMessages,
  streamObject,
  streamText,
} from 'ai';
import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';
import { customModel } from '@/lib/ai';
import { models } from '@/lib/ai/models';
import { getSystemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  getDocumentById,
  saveChat,
  saveDocument,
  saveMessages,
  saveSuggestions,
} from '@/lib/db/queries';
import {
  executeSQLQuery,
  explainQuery,
  generateChartConfig,
  detectTimeSeriesData,
} from '@/app/(chat)/sql-db-actions';

// Add new imports for MMM functionality
import { checkPromptForMMM, generateMMMPredictions } from '@/lib/mmm/api-client';
import { parseCSVToResults } from '@/lib/mmm/csv-parser';

import type { Suggestion } from '@/lib/db/schema';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';
import { sql } from '@vercel/postgres';

export const maxDuration = 60; // Set maximum duration for serverless function execution

// ===== TOOL DEFINITIONS =====
// Define the types of tools the LLM can use to perform various actions
type AllowedTools =
  | 'executeSQLQuery'
  | 'visualizeQueryData';

// Only use SQL tools as those are implemented in the tools object
const sqlTools: AllowedTools[] = ['executeSQLQuery'];

// Use only the tools that are defined in the tools object below
const allTools: AllowedTools[] = [...sqlTools];


// ===== POST HANDLER =====
// This handles chat message submissions from the client
export async function POST(request: Request) {
  // Step 1: Extract data from the request body
  const {
    id,            // Chat ID
    messages,      // Array of messages in the conversation
    modelId,       // ID of the LLM model to use
    selectedTable, // Table 
  }: { id: string; messages: Array<Message>; modelId: string; selectedTable: string } =
    await request.json();
    
  console.log("🚀 API Received selectedTable:", selectedTable); // ✅ Log received table

  if (!selectedTable) {
    return new Response("Error: No table selected", { status: 400 });
  }

  // Step 2: Authenticate the user
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Step 3: Validate that the requested model exists
  const model = models.find((model) => model.id === modelId);

  if (!model) {
    return new Response('Model not found', { status: 404 });
  }

  // Force using Google provider for all models to avoid OpenAI quota issues
  const provider = 'google';

  // Step 4: Process messages
  // Convert messages to the format expected by the AI library
  const coreMessages = convertToCoreMessages(messages);
  // Extract the most recent message from the user
  const userMessage = getMostRecentUserMessage(coreMessages);

  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  // Step 5: Create or retrieve the chat record
  const chat = await getChatById({ id });

  // If this is a new chat, create it and generate a title
  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({ id, userId: session.user.id, title });
  }

  // Step 6: Save the user's message to the database
  const userMessageId = generateUUID();

  await saveMessages({
    messages: [
      { ...userMessage, id: userMessageId, createdAt: new Date(), chatId: id },
    ],
  });

  // Step 7: Prepare for streaming response
  // Create a streamable value instead of StreamData (which is deprecated)
  const streamingData = new StreamData();

  // Add the user message ID to the stream for client-side reference
  streamingData.append({
    type: 'user-message-id',
    content: userMessageId,
  });

  // Step 8: Check if we should use MMM model for this prompt
  const userPrompt = typeof userMessage.content === 'string' 
    ? userMessage.content 
    : Array.isArray(userMessage.content) 
      ? userMessage.content.map(part => {
          if (typeof part === 'string') return part;
          if (part && typeof part === 'object' && 'text' in part) return part.text;
          return '';
        }).join(' ')
      : '';
  let useMMM = false;
  let mmmResults = null;
  
  try {
    const mmmCheck = await checkPromptForMMM(userPrompt);
    useMMM = mmmCheck.useMMM;
    
    // Enhanced MMM handling
    if (useMMM) {
      try {
        console.log(`Using MMM model for prompt: ${userPrompt}`);
        
        // Generate MMM predictions
        const csvData = await generateMMMPredictions(userPrompt);
        
        // Parse CSV to results
        mmmResults = parseCSVToResults(csvData);
        
        // The results are already parsed into an array of objects
        if (mmmResults && mmmResults.length > 0) {
          // Create the response message
          const mmmResponseId = generateUUID();
          
          await saveMessages({
            messages: [
              { 
                id: mmmResponseId, 
                chatId: id, 
                role: 'assistant', 
                content: `I've analyzed your request about changes to marketing spend and generated predictions using our Marketing Mix Model. The chart shows the predicted impact on sales based on your specified changes.`, 
                createdAt: new Date() 
              },
            ],
          });
          
          // Get chart config based on MMM results
          const chartConfig = await generateChartConfig(
            mmmResults, 
            userPrompt,
            JSON.stringify(Object.keys(mmmResults[0]))
          );
          
          // Append SQL results to streaming data
          streamingData.append({
            type: 'sql-results',
            content: {
              query: "-- Marketing Mix Model Prediction\nSELECT * FROM mmm_predictions LIMIT 10",
              results: mmmResults,
              chartConfig: JSON.parse(JSON.stringify(chartConfig.config))
            }
          });
          
          // Add message annotation
          // Replace lines 195-221 with:

          streamingData.appendMessageAnnotation({
            messageIdFromServer: mmmResponseId,
          });
          
          // Close the stream
          streamingData.close();
          
          // Return the response with streamText (without toReadableStream)
          return new Response(streamingData.stringify(), {
            headers: {
              'Content-Type': 'text/plain',
            }
          });
        }
      } catch (error) {
        console.error("Error checking/using MMM model:", error);
        // Fall back to SQL query if MMM fails
      }
    }
  } catch (error) {
    console.error('Error checking/using MMM model:', error);
    // Continue with regular flow if MMM check fails
  }

  // Declare tableSchema outside try/catch to have it accessible throughout the function
  // Declare tableSchema outside try/catch to have it accessible throughout the function
  let tableSchema = ''; 

  try {
    const schemaResult = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = ${selectedTable}
      AND table_schema = 'public'
    `;
    
    // Log it to verify it's working
    console.log(`📊 Schema for ${selectedTable}:`, schemaResult.rows);
    
    // Build the schema description for the AI prompt
    if (schemaResult && schemaResult.rows && schemaResult.rows.length > 0) {
      tableSchema = `You're working with the "${selectedTable}" table which has the following columns: ${schemaResult.rows.map(r => 
        `${r.column_name} (${r.data_type})`).join(', ')}. 
        When answering questions, use this schema information to formulate correct SQL queries.`;
    } else {
      console.warn(`⚠️ No schema found for table: ${selectedTable}`);
      tableSchema = `You're working with the "${selectedTable}" table, but I couldn't fetch its schema. Be careful with column names.`;
    }
  } catch (error) {
    console.error(`❌ Error fetching schema for ${selectedTable}:`, error);
    tableSchema = `You're working with the "${selectedTable}" table, but there was an error retrieving its schema. Be careful with column names.`;
  }

  // Step 9: Process with main LLM (model below) with tools and stream the response
  const result = streamText({
    // Use the custom model wrapper with the selected model, explicitly setting provider to Google
    model: customModel(model.apiIdentifier, provider),
    // Use the system prompt to set context for the LLM, including the table schema
    system: `${getSystemPrompt(selectedTable)}\n\n${tableSchema}`,
    // Send all messages in the conversation
    messages: coreMessages,
    // Limit the number of reasoning steps
    maxSteps: 5,
    // Enable tools for the LLM to use
    experimental_activeTools: allTools,
    
    // ===== TOOL DEFINITIONS =====
    // Define all tools the LLM can use to perform actions
    tools: {
      // SQL database query tool
      executeSQLQuery: {
        description: 'Run a SQL query against the selected database',
        parameters: z.object({
          sqlQuery: z.string().describe('A valid SQL query for the selected database'),
          userQuestion: z.string().describe('The user question being answered')
        }),
        execute: async ({sqlQuery, userQuestion}) => {
          const results = await executeSQLQuery(sqlQuery, selectedTable);
          const chartConfig = await generateChartConfig(results, userQuestion, JSON.stringify(Object.keys(results[0] || {})));
          
          streamingData.append({
            type: 'sql-results',
            content: {
              query: sqlQuery,
              results: results,
              chartConfig: JSON.parse(JSON.stringify(chartConfig.config))
            }
          });
          // all of this is returned to the llm for it's context 
          // we instruct it in the prompt not to repeat results or chart config
          return {
            query: sqlQuery,
            results: results,
            chartConfig: chartConfig.config
          };
        },
      },
      
      // Query data visualization tool
      visualizeQueryData: {
        description: 'Create a visualization of SQL query results',
        parameters: z.object({
          userQuestion: z.string().describe('The original question being answered'),
          results: z.array(z.any()).describe('The SQL query results to visualize'),
          resultDataTypes: z.string().describe('The data types of the SQL query results to visualize')
        }),
        execute: async ({ userQuestion, results, resultDataTypes }) => {
          const chartConfig = await generateChartConfig(results, userQuestion, resultDataTypes);
          
          return {
            message: 'Chart visualization created successfully',
            chartData: results,
            chartConfig: chartConfig.config
          };
        },
      },
    },
    
    // ===== COMPLETION HANDLER =====
    // This runs after the LLM has finished generating a response
    onFinish: async ({ response }) => {
      if (session.user?.id) {
        try {
          const cleanMessages = sanitizeResponseMessages(response.messages);
          if (cleanMessages.length > 0) {
            await saveMessages({
              messages: cleanMessages.map((message) => {
                const messageId = generateUUID();

                if (message.role === 'assistant') {
                  streamingData.appendMessageAnnotation({
                    messageIdFromServer: messageId,
                  });
                }

                return {
                  id: messageId,
                  chatId: id,
                  role: message.role,
                  content: message.content,
                  createdAt: new Date(),
                };
              }),
            });
          } else {
            console.warn("No messages returned from LLM to save.");
          }
        } catch (error) {
          console.error('Failed to save chat');
        }
      }

      // Close the stream to signal completion
      streamingData.close();
    },
    
    // Enable telemetry for metrics and debugging
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'stream-text',
    },
  });

  // Step 10: Return the streaming response
  return result.toDataStreamResponse({
    data: streamingData,
  });
}

// ===== DELETE HANDLER =====
// Handles deleting a chat conversation
export async function DELETE(request: Request) {
  // Extract chat ID from query parameters
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  // Authenticate the user
  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Ensure the user owns this chat
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Delete the chat and all related messages
    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}