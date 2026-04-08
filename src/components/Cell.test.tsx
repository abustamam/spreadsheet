import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Cell from './Cell';
import { CellValue } from 'types/spreadsheet';

const makeCell = (raw: string, display: string = raw): CellValue => ({ raw, display });

const defaultProps = {
  isActive: false,
  isEditing: false,
  isEvenRow: false,
  onActivate: vi.fn(),
  onChange: vi.fn(),
  onCommit: vi.fn(),
  onCancel: vi.fn(),
};

describe('Cell', () => {
  it('renders the display value in display mode', () => {
    render(<Cell {...defaultProps} value={makeCell('hello')} />);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('renders an input in edit mode', () => {
    render(<Cell {...defaultProps} value={makeCell('hello')} isEditing={true} isActive={true} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('calls onChange when the user types in edit mode', async () => {
    const onChange = vi.fn();
    render(
      <Cell
        {...defaultProps}
        value={makeCell('')}
        isEditing={true}
        isActive={true}
        onChange={onChange}
      />,
    );
    await userEvent.type(screen.getByRole('textbox'), 'a');
    expect(onChange).toHaveBeenCalled();
  });
});
