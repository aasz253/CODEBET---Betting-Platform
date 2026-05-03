module.exports = {
  useQuery: jest.fn(() => ({ data: null, isLoading: false, error: null })),
  useMutation: jest.fn(() => ({ mutate: jest.fn(), isLoading: false })),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }) => children,
};
