// Define your models here.
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { vertex } from '@ai-sdk/google-vertex';

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  provider: 'openai' | 'google' | 'vertex';
  description: string;
}

export const models: Array<Model> = [
  {
    id: 'gpt-4o-mini',
    label: 'GPT 4o mini',
    apiIdentifier: 'gpt-4o-mini',
    provider: 'openai',
    description: 'Small model for fast, lightweight tasks',
  },
  {
    id: 'gpt-4o',
    label: 'GPT 4o',
    apiIdentifier: 'gpt-4o',
    provider: 'openai',
    description: 'For complex, multi-step tasks',
  },
  {
    id: 'gemini-2.0-flash',
    label: 'Gemini 2.0 Flash',
    apiIdentifier: 'gemini-2.0-flash',
    provider: 'google',
    description: 'Fast and efficient model from Google for general-purpose tasks',
  },
  {
    id: 'vertex-gemini-2.0-flash',
    label: 'Vertex Gemini 2.0 Flash',
    apiIdentifier: 'gemini-2.0-flash',
    provider: 'vertex',
    description: 'Google Vertex AI version of Gemini 2.0 Flash for enterprise-grade tasks',
  },
] as const;

export const DEFAULT_MODEL_NAME: string = 'gpt-4o-mini';
