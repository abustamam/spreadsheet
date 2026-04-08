import { ChakraProvider, Box, Heading, Text } from '@chakra-ui/react';
import React from 'react';

import Spreadsheet from 'components/Spreadsheet';

const App: React.FC = () => {
  return (
    <ChakraProvider resetCSS>
      <Box minH="100vh" bg="gray.50" p={8}>
        <Box maxW="1000px" mx="auto">
          <Heading size="md" mb={1} color="gray.800">
            Financial Spreadsheet
          </Heading>
          <Text fontSize="sm" color="gray.500" mb={6}>
            Click a cell to edit. Use arrow keys, Tab, and Enter to navigate.
          </Text>
          <Box
            bg="white"
            borderRadius="md"
            boxShadow="sm"
            border="1px solid"
            borderColor="gray.200"
            overflow="hidden"
            display="inline-block"
          >
            <Spreadsheet />
          </Box>
        </Box>
      </Box>
    </ChakraProvider>
  );
};

export default App;
