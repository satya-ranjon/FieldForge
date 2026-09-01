import {
  MoneyError,
  decimalStringToMinor,
  fromMinor,
  minorToDecimalString,
  toMinor
} from '../src/money';

describe('money', () => {
  describe('DECIMAL round trip', () => {
    // These are the values the seed data and the SRS worked example use, plus
    // the classic float traps: 0.07 * 100 and 4.35 * 100 are not integers in
    // IEEE 754, which is the whole reason wire amounts are minor units.
    const cases: Array<[string, number]> = [
      ['0.00', 0],
      ['0.07', 7],
      ['4.35', 435],
      ['85.00', 8500],
      ['450.00', 45000],
      ['99999999.99', 9999999999]
    ];

    it.each(cases)('%s <-> %i minor units', (decimal, minor) => {
      expect(decimalStringToMinor(decimal)).toBe(minor);
      expect(minorToDecimalString(minor)).toBe(decimal);
    });
  });

  describe('decimalStringToMinor', () => {
    it('accepts a DECIMAL with a single fractional digit', () => {
      expect(decimalStringToMinor('12.5')).toBe(1250);
    });

    it('never routes through a float', () => {
      // 0.1 + 0.2 !== 0.3 in IEEE 754. If this function multiplied a parsed
      // float by 100 it would return 3000.0000000000005 or similar.
      expect(decimalStringToMinor('1234567.89')).toBe(123456789);
      expect(Number.isSafeInteger(decimalStringToMinor('1234567.89'))).toBe(true);
    });

    it.each(['', '450', 'abc', '4.5.6', '4.567', '$4.50', ' '])('rejects %p', (input) => {
      // '450' is the one legitimate-looking rejection: a whole-dollar string
      // is accepted, so only genuinely malformed input should throw here.
      if (input === '450') {
        expect(decimalStringToMinor(input)).toBe(45000);
        return;
      }
      expect(() => decimalStringToMinor(input)).toThrow(MoneyError);
    });
  });

  describe('minor unit guards', () => {
    it.each([-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 2])(
      'rejects %p as a minor-unit amount',
      (value) => {
        expect(() => fromMinor(value)).toThrow(MoneyError);
        expect(() => minorToDecimalString(value)).toThrow(MoneyError);
      }
    );
  });

  describe('toMinor', () => {
    it('rounds a major-unit value the currency cannot represent', () => {
      // A buyer typing 12.345 is asking for a precision USD does not have; the
      // contract is that this rounds rather than silently truncating.
      expect(toMinor(12.345)).toBe(1235);
      expect(toMinor(12.344)).toBe(1234);
    });

    it.each([NaN, Infinity, -Infinity])('rejects %p', (value) => {
      expect(() => toMinor(value)).toThrow(MoneyError);
    });

    it('survives a display round trip', () => {
      expect(toMinor(fromMinor(45000))).toBe(45000);
    });
  });
});
