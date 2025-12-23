const { validationResult } = require('express-validator');
const { fieldValidator } = require('../../../src/middlewares/field-validator');

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

describe('fieldValidator middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('when validation passes', () => {
    it('should call next', () => {
      validationResult.mockReturnValue({
        isEmpty: () => true,
      });

      fieldValidator(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('when validation fails', () => {
    it('should return 400 with validation errors', () => {
      const mappedErrors = {
        email: { msg: 'Invalid email' },
        password: { msg: 'Password too short' },
      };
      validationResult.mockReturnValue({
        isEmpty: () => false,
        mapped: () => mappedErrors,
      });

      fieldValidator(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        ok: false,
        errors: mappedErrors,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
