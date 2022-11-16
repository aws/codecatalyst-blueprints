import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const urlTextArea = screen.getByPlaceholderText(/enter the url to short/i);
  expect(urlTextArea).toBeEnabled;
});