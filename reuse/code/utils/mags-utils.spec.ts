import { JwtPayload } from 'jwt-decode';
import { IdToken, UserProfile } from '@reuse/code/interfaces';
import { hasUserProfile } from './mags-utils';
import { Discipline, Role } from '@reuse/code/openapi';

describe('hasUserProfile', () => {

  const validUserProfile = {
    discipline: Discipline.Nurse,
    nihii11: '',
    professional: true,
    role: Role.Caregiver,
    ssin: '12345678901',
    firstName: 'John',
    lastName: 'Doe',
  };

  const validIdToken: IdToken = {
    userProfile: validUserProfile,
  };

  it('should return true for a valid IdToken', () => {
    expect(hasUserProfile(validIdToken)).toBe(true);
  });

  it('should narrow the type to IdToken when true', () => {
    if (hasUserProfile(validIdToken)) {
      // Type guard verification
      expect(validIdToken.userProfile.ssin).toBe('12345678901');
    } else {
      fail('Type guard failed for valid IdToken');
    }
  });

  describe('should return false for invalid tokens', () => {

    it.each([
      ['null', null],
      ['undefined', undefined],
      ['number', 123],
      ['string', 'token'],
      ['boolean', true],
      ['empty object', {}],
      ['object without userProfile', {foo: 'bar'}],
      ['userProfile without ssin', {userProfile: {firstName: 'John'}}],
      ['userProfile with non-string ssin', {userProfile: {ssin: 123}}],
      ['userProfile with undefined ssin', {userProfile: {ssin: undefined}}],
    ])('should return false for %s', (_, value) => {
      expect(hasUserProfile(value as JwtPayload)).toBe(false);
    });

  });

});
