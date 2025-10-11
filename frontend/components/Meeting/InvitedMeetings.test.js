// Simple test to verify InvitedMeetings component structure
// This is a basic test to ensure the component can be imported and rendered

import React from 'react';
import { render } from '@testing-library/react-native';
import InvitedMeetings from './InvitedMeetings';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve('mock-token')),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
);

describe('InvitedMeetings Component', () => {
  const mockOnJoinMeeting = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { getByText } = render(
      <InvitedMeetings 
        onJoinMeeting={mockOnJoinMeeting}
        refreshTrigger={0}
      />
    );
    
    // Check if the component renders the header
    expect(getByText('Direct Invitations')).toBeTruthy();
  });

  it('shows loading state initially', () => {
    const { getByText } = render(
      <InvitedMeetings 
        onJoinMeeting={mockOnJoinMeeting}
        refreshTrigger={0}
      />
    );
    
    // Should show loading text initially
    expect(getByText('Loading invited meetings...')).toBeTruthy();
  });

  it('displays empty state when no meetings', async () => {
    // Mock empty response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const { findByText } = render(
      <InvitedMeetings 
        onJoinMeeting={mockOnJoinMeeting}
        refreshTrigger={0}
      />
    );
    
    // Wait for loading to finish and check for empty state
    const emptyText = await findByText('No direct invitations');
    expect(emptyText).toBeTruthy();
  });

  it('displays meetings when data is available', async () => {
    const mockMeetings = [
      {
        _id: '1',
        title: 'Test Meeting',
        description: 'Test Description',
        scheduledTime: new Date().toISOString(),
        duration: 60,
        createdBy: {
          firstName: 'John',
          lastName: 'Doe'
        }
      }
    ];

    // Mock successful response with meetings
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMeetings),
    });

    const { findByText } = render(
      <InvitedMeetings 
        onJoinMeeting={mockOnJoinMeeting}
        refreshTrigger={0}
      />
    );
    
    // Wait for meetings to load
    const meetingTitle = await findByText('Test Meeting');
    expect(meetingTitle).toBeTruthy();
  });
});

export default InvitedMeetings;
