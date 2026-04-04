import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChakraProvider } from '@chakra-ui/react';
import Spreadsheet from './Spreadsheet';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChakraProvider>{children}</ChakraProvider>
);

describe('Spreadsheet', () => {
  it('renders a 10x10 grid', () => {
    render(<Spreadsheet />, { wrapper });
    const cells = screen.getAllByRole('textbox');
    expect(cells).toHaveLength(100);
  });
});
