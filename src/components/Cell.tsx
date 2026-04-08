import { Box, Input } from '@chakra-ui/react';
import React, { useEffect, useRef } from 'react';

import { CellValue } from 'types/spreadsheet';
import { isNumericValue } from 'utils/format';

interface Props {
  value: CellValue;
  isActive: boolean;
  isEditing: boolean;
  isEvenRow: boolean;
  onActivate: () => void;
  onChange: (raw: string) => void;
  onCommit: (raw: string) => void;
  onCancel: () => void;
}

const CELL_WIDTH = '90px';
const CELL_HEIGHT = '32px';

const Cell: React.FC<Props> = ({
  value,
  isActive,
  isEditing,
  isEvenRow,
  onActivate,
  onChange,
  onCommit,
  onCancel,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const numeric = isNumericValue(value.raw);

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const bg = isActive
    ? 'blue.50'
    : isEvenRow
    ? 'gray.50'
    : 'white';

  const borderColor = isActive ? 'blue.400' : 'gray.200';
  const borderWidth = isActive ? '2px' : '1px';

  if (isEditing) {
    return (
      <Box
        width={CELL_WIDTH}
        height={CELL_HEIGHT}
        flexShrink={0}
        position="relative"
        overflow="hidden"
      >
        <Input
          ref={inputRef}
          value={value.raw}
          onChange={e => onChange(e.target.value)}
          onBlur={() => onCommit(value.raw)}
          onKeyDown={e => {
            // Escape is handled locally; all other nav keys bubble to Spreadsheet
            if (e.key === 'Escape') {
              e.stopPropagation();
              onCancel();
            }
          }}
          size="sm"
          borderRadius={0}
          borderColor={borderColor}
          borderWidth={borderWidth}
          bg={bg}
          height={CELL_HEIGHT}
          width={CELL_WIDTH}
          px={2}
          textAlign={numeric ? 'right' : 'left'}
          fontFamily="mono"
          fontSize="sm"
          _focus={{ boxShadow: 'none', borderColor: 'blue.400', borderWidth: '2px' }}
        />
      </Box>
    );
  }

  return (
    <Box
      width={CELL_WIDTH}
      height={CELL_HEIGHT}
      flexShrink={0}
      bg={bg}
      borderWidth={borderWidth}
      borderColor={borderColor}
      px={2}
      display="flex"
      alignItems="center"
      justifyContent={numeric ? 'flex-end' : 'flex-start'}
      cursor="default"
      userSelect="none"
      onClick={onActivate}
      fontFamily="mono"
      fontSize="sm"
      color={value.display === '' ? 'transparent' : 'gray.800'}
      overflow="hidden"
      whiteSpace="nowrap"
    >
      {value.display || '\u00A0' /* non-breaking space to maintain row height */}
    </Box>
  );
};

export default Cell;
