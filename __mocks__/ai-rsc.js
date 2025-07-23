module.exports = {
  useUIState: jest.fn(() => [[], jest.fn()]),
  useActions: jest.fn(() => ({ submitUserMessage: jest.fn() })),
}
