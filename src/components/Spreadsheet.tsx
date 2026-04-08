import { Box, Flex } from '@chakra-ui/react';
import _ from 'lodash';
import React, { useState, useRef } from 'react';
import { useImmer } from 'use-immer';

import Cell from 'components/Cell';
import { CellValue, CellPosition, EMPTY_CELL, NUM_ROWS, NUM_COLUMNS, COLUMN_LABELS, ROW_LABELS } from 'types/spreadsheet';
import { formatValue } from 'utils/format';

const Spreadsheet: React.FC = () => {
  const [grid, setGrid] = useImmer<CellValue[][]>(
    _.times(NUM_ROWS, () => _.times(NUM_COLUMNS, () => ({ ...EMPTY_CELL }))),
  );
  const [activeCell, setActiveCell] = useState<CellPosition | null>(null);
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const previousRawRef = useRef<string>('');

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

  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

  const move = (rowDelta: number, colDelta: number, commitRaw?: string) => {
    if (!activeCell) return;
    const { row, col } = activeCell;

    if (editingCell && commitRaw !== undefined) {
      commitCell(editingCell.row, editingCell.col, commitRaw);
    } else {
      setEditingCell(null);
    }

    let nextRow = clamp(row + rowDelta, 0, NUM_ROWS - 1);
    let nextCol = clamp(col + colDelta, 0, NUM_COLUMNS - 1);

    // Tab wraps: last col → first col of next row
    if (colDelta === 1 && col === NUM_COLUMNS - 1 && row < NUM_ROWS - 1) {
      nextRow = row + 1;
      nextCol = 0;
    }
    // Shift+Tab wraps: first col → last col of prev row
    if (colDelta === -1 && col === 0 && row > 0) {
      nextRow = row - 1;
      nextCol = NUM_COLUMNS - 1;
    }

    setActiveCell({ row: nextRow, col: nextCol });
  };

  const enterEditMode = (row: number, col: number, initialChar?: string) => {
    previousRawRef.current = grid[row][col].raw;
    setActiveCell({ row, col });
    setEditingCell({ row, col });
    if (initialChar !== undefined) {
      setGrid(draft => {
        draft[row][col].raw = initialChar;
      });
    }
  };

  const currentRaw = editingCell
    ? grid[editingCell.row][editingCell.col].raw
    : '';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!activeCell) return;
    const { row, col } = activeCell;

    if (isEditing(row, col)) {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          if (e.shiftKey) {
            move(-1, 0, currentRaw);
          } else {
            move(1, 0, currentRaw);
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            move(0, -1, currentRaw);
          } else {
            move(0, 1, currentRaw);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          move(-1, 0, currentRaw);
          break;
        case 'ArrowDown':
          e.preventDefault();
          move(1, 0, currentRaw);
          break;
        case 'Escape':
          // Handled by Cell's onKeyDown — don't intercept here
          break;
        default:
          break;
      }
    } else {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          move(-1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          move(1, 0);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          move(0, -1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          move(0, 1);
          break;
        case 'Enter':
          e.preventDefault();
          if (e.shiftKey) {
            move(-1, 0);
          } else {
            enterEditMode(row, col);
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            move(0, -1);
          } else {
            move(0, 1);
          }
          break;
        case 'Backspace':
        case 'Delete':
          e.preventDefault();
          setGrid(draft => {
            draft[row][col] = { raw: '', display: '' };
          });
          break;
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            enterEditMode(row, col, e.key);
          }
          break;
      }
    }
  };

  return (
    <Box
      width="full"
      outline="none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Column headers */}
      <Flex>
        <Box width="40px" flexShrink={0} /> {/* corner spacer */}
        {COLUMN_LABELS.map(label => (
          <Box
            key={label}
            width="90px"
            flexShrink={0}
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
              onActivate={() => enterEditMode(rowIdx, colIdx)}
              onChange={(raw: string) => {
                setGrid(draft => {
                  draft[rowIdx][colIdx].raw = raw;
                });
              }}
              onCommit={(raw: string) => commitCell(rowIdx, colIdx, raw)}
              onCancel={() => {
                setGrid(draft => {
                  draft[rowIdx][colIdx].raw = previousRawRef.current;
                });
                setEditingCell(null);
              }}
            />
          ))}
        </Flex>
      ))}
    </Box>
  );
};

export default Spreadsheet;
