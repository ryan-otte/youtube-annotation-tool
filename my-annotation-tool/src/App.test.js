import { render, screen } from '@testing-library/react';
import App from './App';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
