import { signal } from '@angular/core';

export const mockTestAlertService = {
  showGeneralError: jest.fn(),
  getGeneralError: jest.fn(),
  setTarget: jest.fn().mockReturnValue(
    signal({
      message: 'Some error',
    })
  ),
  setActive: jest.fn(),
  resetActive: jest.fn(),
  clear: jest.fn(),
  remove: jest.fn(),
  show: jest.fn(),
  showCurrentActiveAlert: jest.fn(),
};
