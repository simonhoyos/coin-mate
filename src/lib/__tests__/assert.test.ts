import { describe, expect, it } from 'vitest';
import { assertNotNull } from '../assert';

describe('lib/assert', () => {
  describe('assertNotNull', () => {
    it('Should return the original unmodified value when it is not null', () => {
      const value = { foo: 'bar' };
      const result = assertNotNull(value);
      expect(result).toBe(value);
    });

    it('Should throw a default message when value is null and no message is defined', () => {
      expect(() => assertNotNull(null)).toThrow('Value is null or undefined');
      expect(() => assertNotNull(undefined)).toThrow(
        'Value is null or undefined',
      );
    });

    it('Should throw a custom message when value is null and message is defined', () => {
      const customMessage = 'Custom error message';
      expect(() => assertNotNull(null, customMessage)).toThrow(customMessage);
    });
  });
});
