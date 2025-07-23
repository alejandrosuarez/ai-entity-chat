export type FSMState =
  | 'unauth'
  | 'emailForm'
  | 'otpForm'
  | 'authenticated'
  | 'listing'
  | 'creating'

export class ChatFSM {
  private currentState: FSMState

  constructor(initialState: FSMState = 'unauth') {
    this.currentState = initialState
  }

  public transition(state: FSMState) {
    this.currentState = state
  }

  public getCurrentState(): FSMState {
    return this.currentState
  }
}
