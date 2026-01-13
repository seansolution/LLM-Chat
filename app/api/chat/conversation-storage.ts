/**
 * Conversation Storage
 * 
 * Level 3 capability: Stores conversation history for multi-turn conversations
 * Uses in-memory storage for development, ready for database integration
 */

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  intent?: string
  persona?: string
  metadata?: {
    variant?: 'A' | 'B'
    role?: 'SALES' | 'SUPPORT' | 'OPS'
    [key: string]: unknown
  }
}

export interface Conversation {
  sessionId: string
  userId?: string
  messages: ConversationMessage[]
  createdAt: string
  updatedAt: string
  metadata?: {
    persona?: string
    intent?: string
    [key: string]: unknown
  }
}

// In-memory storage (in production, replace with database/Redis)
const conversationStorage = new Map<string, Conversation>()

/**
 * Get or create conversation for a session
 */
export function getConversation(sessionId: string): Conversation | null {
  return conversationStorage.get(sessionId) || null
}

/**
 * Create a new conversation
 */
export function createConversation(
  sessionId: string,
  userId?: string,
  metadata?: Conversation['metadata']
): Conversation {
  const conversation: Conversation = {
    sessionId,
    userId,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata,
  }
  
  conversationStorage.set(sessionId, conversation)
  
  // In production: Store in database
  // await db.conversations.insert(conversation)
  
  return conversation
}

/**
 * Add message to conversation
 */
export function addMessage(
  sessionId: string,
  message: ConversationMessage
): Conversation {
  let conversation = getConversation(sessionId)
  
  if (!conversation) {
    conversation = createConversation(sessionId)
  }
  
  conversation.messages.push(message)
  conversation.updatedAt = new Date().toISOString()
  
  // In production: Update in database
  // await db.conversations.update({ sessionId }, { $push: { messages: message }, updatedAt: new Date() })
  
  conversationStorage.set(sessionId, conversation)
  
  return conversation
}

/**
 * Get conversation history (last N messages)
 */
export function getConversationHistory(
  sessionId: string,
  maxMessages: number = 10
): ConversationMessage[] {
  const conversation = getConversation(sessionId)
  
  if (!conversation) {
    return []
  }
  
  // Return last N messages
  return conversation.messages.slice(-maxMessages)
}

/**
 * Get conversation context for system prompt
 * Returns formatted conversation history
 */
export function getConversationContext(
  sessionId: string,
  maxMessages: number = 10
): string {
  const history = getConversationHistory(sessionId, maxMessages)
  
  if (history.length === 0) {
    return ''
  }
  
  // Format conversation history for system prompt
  const formatted = history.map((msg, index) => {
    const role = msg.role === 'user' ? 'ผู้ใช้' : 'AI'
    return `${index + 1}. ${role}: ${msg.content}`
  }).join('\n')
  
  return `\n\n=== บทสนทนาก่อนหน้า ===\n${formatted}\n=== จบบทสนทนาก่อนหน้า ===\n`
}

/**
 * Clear conversation (for testing or reset)
 */
export function clearConversation(sessionId: string): void {
  conversationStorage.delete(sessionId)
  
  // In production: Delete from database
  // await db.conversations.deleteOne({ sessionId })
}

/**
 * Get all conversations (for monitoring)
 */
export function getAllConversations(): Conversation[] {
  return Array.from(conversationStorage.values())
}

/**
 * Get conversation count
 */
export function getConversationCount(): number {
  return conversationStorage.size
}

/**
 * Summarize conversation for long conversations
 * Returns a summary if conversation is too long
 */
export function summarizeConversation(
  sessionId: string,
  maxMessages: number = 20
): { summary: string; recentMessages: ConversationMessage[] } | null {
  const conversation = getConversation(sessionId)
  
  if (!conversation || conversation.messages.length <= maxMessages) {
    return null
  }
  
  // If conversation is too long, summarize old messages and keep recent ones
  const oldMessages = conversation.messages.slice(0, -maxMessages)
  const recentMessages = conversation.messages.slice(-maxMessages)
  
  // Simple summary (in production, use LLM to generate summary)
  const summary = `บทสนทนาก่อนหน้านี้มี ${oldMessages.length} ข้อความ เกี่ยวกับ: ${oldMessages[0]?.content.substring(0, 100)}...`
  
  return {
    summary,
    recentMessages,
  }
}
