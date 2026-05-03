module.exports = {
  create: jest.fn((fn) => ({
    getState: jest.fn(),
    setState: jest.fn(),
    subscribe: jest.fn(),
  })),
};
