/**
 * 聊天 API 客户端工具函数
 * 处理与 /api/chat/completion 的通信，支持流式和非流式响应
 */

/**
 * 调用聊天 API，支持流式响应
 * @param message - 用户消息
 * @param model - AI 模型 ID
 * @param onChunk - 可选的流式数据回调函数
 * @returns Promise<string> - 完整的 AI 响应
 */
export async function callChatAPI(
  message: string,
  model: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const response = await fetch('/api/chat/completion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, model, stream: !!onChunk }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`API error: ${response.status} - ${error.error || 'Unknown error'}`);
  }

  if (onChunk) {
    // Handle streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                fullResponse += content;
                onChunk(content);
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    }

    return fullResponse;
  } else {
    // Non-streaming response
    const data = await response.json();
    return data.response;
  }
}
