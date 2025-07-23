'use client'

// Export all inline UI components that appear inside the chat message stream
export { EmailForm } from './email-form'
export { OtpForm } from './otp-form'
export { CommandButtons } from './command-buttons'
export { EntityCards } from './entity-cards'
export { EntityForm } from './entity-form'
export { Modal } from './modal'

// Export compact inline versions optimized for message stream
export {
  InlineEmailForm,
  InlineOtpForm,
  InlineCommandButtons,
  InlineEntityCards,
  InlineEntityForm,
} from './inline-components'

// These components are designed to be rendered inline within chat messages
// Each component fires callbacks that call server actions and then trigger FSM transitions
