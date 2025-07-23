import crypto from 'crypto'

export const generateChatId = (entityId: string): string => {
  return crypto.createHash('sha256').update(entityId).digest('hex')
}

export const generateChatUrl = (chatId: string, userName: string, entityId: string): string => {
  const baseChatUrl = process.env.NEXT_PUBLIC_BASE_CHAT_URL || "https://x.stafa.me"
  return `${baseChatUrl}/request?chatId=${chatId}&name=${userName}&entity=${entityId}`
}

export const generateOwnerChatUrl = (chatId: string, ownerName: string, entityId: string): string => {
  const baseChatUrl = process.env.NEXT_PUBLIC_BASE_CHAT_URL || "https://x.stafa.me"
  return `${baseChatUrl}/request?chatId=${chatId}&name=${ownerName}&entity=${entityId}&role=owner`
}
