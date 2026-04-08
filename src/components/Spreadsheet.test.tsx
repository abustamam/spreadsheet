import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChakraProvider } from '@chakra-ui/react';
import Spreadsheet from './Spreadsheet';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChakraProvider>{children}</ChakraProvider>
);

describe('Spreadsheet', () => {
  it('renders without throwing', () => {
    expect(() => render(<Spreadsheet />, { wrapper })).not.toThrow();
  });
});
