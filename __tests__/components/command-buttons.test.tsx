import { render, screen, fireEvent } from '@testing-library/react'
import { CommandButtons } from '../../src/components/command-buttons'

// Mock the actions
jest.mock('../../src/lib/actions', () => ({
  logoutAction: jest.fn().mockResolvedValue({}),
}))

// Mock the auth cookie
jest.mock('../../src/lib/auth-cookie', () => ({
  clearToken: jest.fn(),
}))

// Mock useToast
jest.mock('../../src/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}))

describe('CommandButtons', () => {
  const mockListEntities = jest.fn()
  const mockCreateEntity = jest.fn()
  const mockLogout = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render all buttons', () => {
    render(
      <CommandButtons
        onListEntities={mockListEntities}
        onCreateEntity={mockCreateEntity}
        onLogout={mockLogout}
      />
    )

    expect(screen.getByText('📋 List My Entities')).toBeInTheDocument()
    expect(screen.getByText('➕ Create New Entity')).toBeInTheDocument()
    expect(screen.getByText(/Logout/)).toBeInTheDocument()
  })

  it('should call onListEntities when List My Entities button is clicked', () => {
    render(
      <CommandButtons
        onListEntities={mockListEntities}
        onCreateEntity={mockCreateEntity}
        onLogout={mockLogout}
      />
    )

    const button = screen.getByText('📋 List My Entities')
    fireEvent.click(button)

    expect(mockListEntities).toHaveBeenCalled()
  })

  it('should call onCreateEntity when Create New Entity button is clicked', () => {
    render(
      <CommandButtons
        onListEntities={mockListEntities}
        onCreateEntity={mockCreateEntity}
        onLogout={mockLogout}
      />
    )

    const button = screen.getByText('➕ Create New Entity')
    fireEvent.click(button)

    expect(mockCreateEntity).toHaveBeenCalled()
  })

  it('should call onLogout when Logout button is clicked', () => {
    render(
      <CommandButtons
        onListEntities={mockListEntities}
        onCreateEntity={mockCreateEntity}
        onLogout={mockLogout}
      />
    )

    const button = screen.getByText(/Logout/)
    fireEvent.click(button)

    expect(mockLogout).toHaveBeenCalled()
  })
})
