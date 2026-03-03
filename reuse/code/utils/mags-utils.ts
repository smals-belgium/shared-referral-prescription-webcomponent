import { JwtPayload } from 'jwt-decode';
import { IdToken } from '@reuse/code/interfaces';

export function hasUserProfile(token: JwtPayload | IdToken): token is IdToken {
  return (
    typeof token === 'object' &&
    token !== null &&
    'userProfile' in token &&
    typeof (token as any).userProfile?.ssin === 'string'
  );
}
