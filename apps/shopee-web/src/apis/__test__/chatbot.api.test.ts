import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('src/utils/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

import http from 'src/utils/http';
import chatbotApi from '../chatbot.api';

describe('Chatbot API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConversations', () => {
    it('should call http.get on success', async () => {
      const mockResponse = {
        data: { message: 'ok', data: { conversations: [], pagination: {} } },
      };
      vi.mocked(http.get).mockResolvedValue(mockResponse as any);
      const result = await chatbotApi.getConversations();
      expect(http.get).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'));
      const result = await chatbotApi.getConversations();
      expect(result.data.message).toEqual(expect.any(String));
    });
  });

  describe('getConversation', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1', messages: [] } } };
      vi.mocked(http.get).mockResolvedValue(mockResponse as any);
      const result = await chatbotApi.getConversation('1');
      expect(http.get).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'));
      const result = await chatbotApi.getConversation('1');
      expect(result.data.message).toEqual(expect.any(String));
    });
  });

  describe('createConversation', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { conversationId: '1' } } };
      vi.mocked(http.post).mockResolvedValue(mockResponse as any);
      const result = await chatbotApi.createConversation({ message: 'Hello' });
      expect(http.post).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'));
      const result = await chatbotApi.createConversation({ message: 'Hello' });
      expect(result.data.message).toEqual(expect.any(String));
    });
  });

  describe('sendMessage', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { conversationId: '1' } } };
      vi.mocked(http.post).mockResolvedValue(mockResponse as any);
      const result = await chatbotApi.sendMessage('1', { message: 'Hi' });
      expect(http.post).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'));
      const result = await chatbotApi.sendMessage('1', { message: 'Hi' });
      expect(result.data.message).toEqual(expect.any(String));
    });
  });

  describe('updateConversation', () => {
    it('should call http.put on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1' } } };
      vi.mocked(http.put).mockResolvedValue(mockResponse as any);
      const result = await chatbotApi.updateConversation('1', { title: 'New Title' });
      expect(http.put).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.put).mockRejectedValue(new Error('Network error'));
      const result = await chatbotApi.updateConversation('1', { title: 'New Title' });
      expect(result.data.message).toEqual(expect.any(String));
    });
  });

  describe('deleteConversation', () => {
    it('should call http.delete on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { message: 'deleted' } } };
      vi.mocked(http.delete).mockResolvedValue(mockResponse as any);
      const result = await chatbotApi.deleteConversation('1');
      expect(http.delete).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.delete).mockRejectedValue(new Error('Network error'));
      const result = await chatbotApi.deleteConversation('1');
      expect(result.data.message).toEqual(expect.any(String));
    });
  });

  describe('testChatbot', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { userMessage: 'test' } } };
      vi.mocked(http.post).mockResolvedValue(mockResponse as any);
      const result = await chatbotApi.testChatbot({ message: 'test' });
      expect(http.post).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'));
      const result = await chatbotApi.testChatbot({ message: 'test' });
      expect(result.data.message).toEqual(expect.any(String));
    });
  });
});
