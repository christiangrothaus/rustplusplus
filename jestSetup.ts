beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(Date, 'now').mockReturnValue(0);
});