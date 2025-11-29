import api from "./api";

export interface ChatMessage {
  user: string;
  assistant: string;
  timestamp: string;
}

export interface ChatbotResponse {
  message: string;
  timestamp: string;
}

/**
 * Send a message to IEM Assist chatbot
 */
export const sendChatbotMessage = async (
  message: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatbotResponse> => {
  const response = await api.post("/chatbot/message", {
    message,
    conversationHistory,
  });
  return response.data;
};

