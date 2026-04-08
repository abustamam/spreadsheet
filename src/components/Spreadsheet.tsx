import { Box, Flex } from '@chakra-ui/react';
import _ from 'lodash';
import React from 'react';
import { useImmer } from 'use-immer';

import Cell from 'components/Cell';
import { CellValue, CellPosition, EMPTY_CELL, NUM_ROWS, NUM_COLUMNS, COLUMN_LABELS, ROW_LABELS } from 'types/spreadsheet';
import { formatValue } from 'utils/format';

const Spreadsheet: React.FC = () => {
  const [grid, setGrid] = useImmer<CellValue[][]>(
    _.times(NUM_ROWS, () => _.times(NUM_COLUMNS, () => ({ ...EMPTY_CELL }))),
  );
  const [activeCell, setActiveCell] = useImmer<CellPosition | null>(null);
  const [editingCell, setEditingCell] = useImmer<CellPosition | null>(null);

  const isActive = (row: number, col: number) =>
    activeCell?.row === row && activeCell?.col === col;

  const isEditing = (row: number, col: number) =>
    editingCell?.row === row && editingCell?.col === col;

  const commitCell = (row: number, col: number, raw: string) => {
    setGrid(draft => {
      draft[row][col] = { raw, display: formatValue(raw) };
    });
    setEditingCell(null);
  };

  const activateCell = (row: number, col: number) => {
    setActiveCell({ row, col });
    setEditingCell({ row, col });
  };

  return (
    <Box
      width="full"
      outline="none"
      tabIndex={0}
    >
      {/* Column headers */}
      <Flex>
        <Box width="40px" flexShrink={0} /> {/* corner spacer */}
        {COLUMN_LABELS.map(label => (
          <Box
            key={label}
            flex={1}
            textAlign="center"
            fontSize="xs"
            fontWeight="semibold"
            color="gray.600"
            bg="gray.100"
            borderWidth="1px"
            borderColor="gray.200"
            py={1}
          >
            {label}
          </Box>
        ))}
      </Flex>

      {/* Grid rows */}
      {grid.map((row, rowIdx) => (
        <Flex key={rowIdx}>
          {/* Row header */}
          <Box
            width="40px"
            flexShrink={0}
            textAlign="center"
            fontSize="xs"
            fontWeight="semibold"
            color="gray.600"
            bg="gray.100"
            borderWidth="1px"
            borderColor="gray.200"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {ROW_LABELS[rowIdx]}
          </Box>

          {/* Cells */}
          {row.map((cellValue, colIdx) => (
            <Cell
              key={`${rowIdx}/${colIdx}`}
              value={cellValue}
              isActive={isActive(rowIdx, colIdx)}
              isEditing={isEditing(rowIdx, colIdx)}
              isEvenRow={rowIdx % 2 === 0}
              onActivate={() => activateCell(rowIdx, colIdx)}
              onChange={(raw: string) => {
                setGrid(draft => {
                  draft[rowIdx][colIdx].raw = raw;
                });
              }}
              onCommit={(raw: string) => commitCell(rowIdx, colIdx, raw)}
              onCancel={() => setEditingCell(null)}
            />
          ))}
        </Flex>
      ))}
    </Box>
  );
};

export default Spreadsheet;
