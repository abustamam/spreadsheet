import { Box, Flex } from '@chakra-ui/react';
import _ from 'lodash';
import React from 'react';
import { useImmer } from 'use-immer';

import Cell from 'components/Cell';

const NUM_ROWS = 10;
const NUM_COLUMNS = 10;

const Spreadsheet: React.FC = () => {
  const [spreadsheetState, setSpreadsheetState] = useImmer(
    _.times(NUM_ROWS, () => _.times(NUM_COLUMNS, _.constant(''))),
  );

  return (
    <Box width="full">
      {spreadsheetState.map((row, rowIdx) => {
        return (
          <Flex key={String(rowIdx)}>
            {row.map((cellValue, columnIdx) => (
              <Cell
                key={`${rowIdx}/${columnIdx}`}
                value={cellValue}
                onChange={(newValue: string) => {
                  setSpreadsheetState(draft => {
                    draft[rowIdx][columnIdx] = newValue;
                  });
                }}
              />
            ))}
          </Flex>
        );
      })}
    </Box>
  );
};

export default Spreadsheet;
