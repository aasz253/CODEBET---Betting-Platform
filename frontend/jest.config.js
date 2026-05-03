module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.tsx', '**/?(*.)+(spec|test).tsx'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '^axios$': '<rootDir>/__mocks__/axiosMock.js',
    '^zustand$': '<rootDir>/__mocks__/zustandMock.js',
    '^react-router-dom$': '<rootDir>/__mocks__/reactRouterMock.js',
    '^socket.io-client$': '<rootDir>/__mocks__/socketMock.js',
    '^@tanstack/react-query$': '<rootDir>/__mocks__/reactQueryMock.js',
    '^recharts$': '<rootDir>/__mocks__/rechartsMock.js',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      diagnostics: false,
    }],
  },
};
