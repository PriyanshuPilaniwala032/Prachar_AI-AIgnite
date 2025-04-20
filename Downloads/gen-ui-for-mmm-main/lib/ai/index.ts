import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { vertex } from '@ai-sdk/google-vertex';

import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';

import { customMiddleware } from './custom-middleware';
import { Model } from './models';

export const customModel = (apiIdentifier: string, provider?: string) => {
  let model;
  
  // Map of OpenAI models to equivalent Google models
  const modelMappings: Record<string, string> = {
    'gpt-4o-mini': 'gemini-1.5-flash',
    'gpt-4o': 'gemini-1.5-pro',
  };
  
  switch (provider) {
    case 'vertex':
      model = vertex(apiIdentifier);
      break;
    case 'openai':
      model = openai(apiIdentifier);
      break;
    case 'google':
      // Use the appropriate Google model ID
      const googleModelId = modelMappings[apiIdentifier] || 'gemini-1.5-flash';
      model = google(googleModelId);
      console.log('Using Google model:', googleModelId);
      break;
    default:
      // If no provider specified but OpenAI model ID detected, use Google equivalent
      if (apiIdentifier.startsWith('gpt-')) {
        const googleModelId = modelMappings[apiIdentifier] || 'gemini-1.5-flash';
        model = google(googleModelId);
        console.log('Using Google model:', googleModelId);
      } else {
        // Assume it's already a valid Google model ID
        model = google(apiIdentifier);
        console.log('Using Google model:', apiIdentifier);
      }
      break;
  }
  
  return wrapLanguageModel({
    model: model as unknown as import('ai').LanguageModelV1,
    middleware: customMiddleware,
  });
};