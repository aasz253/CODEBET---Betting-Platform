module.exports = {
  Routes: ({ children }) => children,
  Route: () => null,
  Link: ({ children }) => children,
  useNavigate: jest.fn(),
  useLocation: jest.fn(() => ({ pathname: '/' })),
  BrowserRouter: ({ children }) => children,
};
