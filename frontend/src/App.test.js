import { render, screen } from '@testing-library/react';
import App from './App';

test('SiteKontrol başlığı görünüyor', () => {
  render(<App />);
  const heading = screen.getByText(/SiteKontrol/i);
  expect(heading).toBeInTheDocument();
});
