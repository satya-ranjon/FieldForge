/* global jest */
module.exports = {
  documentDirectory: 'file:///data/user/0/app/documents/',
  cacheDirectory: 'file:///data/user/0/app/cache/',
  copyAsync: jest.fn(async () => undefined),
  deleteAsync: jest.fn(async () => undefined),
  getInfoAsync: jest.fn(async (uri) => ({
    exists: true,
    isDirectory: false,
    size: 1024 * 100,
    uri
  })),
  makeDirectoryAsync: jest.fn(async () => undefined)
};
