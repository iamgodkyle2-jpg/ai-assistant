import { GoogleGenAI, Modality } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export interface ChatOptions {
  model: string;
  systemInstruction?: string;
  useSearch?: boolean;
  useThinking?: boolean;
}

export const generateChatResponse = async (
  prompt: string,
  history: { role: string; parts: [{ text: string }] }[],
  options: ChatOptions
) => {
  const modelName = options.model;
  
  // Configure tools
  const tools: any[] = [];
  if (options.useSearch) {
    tools.push({ googleSearch: {} });
  }

  // Configure thinking
  let thinkingConfig = undefined;
  if (options.useThinking && modelName.includes('gemini-3')) {
    thinkingConfig = { thinkingBudget: 32768 };
  }

  // Create chat session (stateless for this simple wrapper, or maintain externally)
  // For simplicity in this app structure, we will use generateContent with history as context 
  // or a fresh chat instance if we wanted true multi-turn. 
  // Let's use ai.chats.create to handle history properly.

  const chat = ai.chats.create({
    model: modelName,
    config: {
      systemInstruction: options.systemInstruction,
      tools: tools.length > 0 ? tools : undefined,
      thinkingConfig,
    },
    history: history.map(h => ({
      role: h.role,
      parts: h.parts
    }))
  });

  const result = await chat.sendMessage({ message: prompt });
  return result;
};

export const generateSpeech = async (text: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Deep, authoritative voice
        },
      },
    },
  });
  
  return response;
};

export const generateFastResponse = async (prompt: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-flash-lite-latest',
    contents: prompt,
    config: {
        systemInstruction: "You are JARVIS. Be extremely concise, robotic, and efficient.",
    }
  });
  return response.text;
}
