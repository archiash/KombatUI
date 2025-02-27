import { ChatMessage } from "./chat_message";

export interface Room {
  id: string
  config: Record<string, number>
  leader1: string
  leader2: string
  users: string[]
/*   messages: ChatMessage[];
  users: number */
}
