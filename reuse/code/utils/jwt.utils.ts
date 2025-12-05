import { jwtDecode as decoder } from 'jwt-decode';

export function jwtDecode(jwt: string) {
  return decoder(jwt);
}
