beforeAll(() => {
  jest.spyOn(Date, 'now').mockReturnValue(0);
});