/** Minimal information of a user in eHealth: ID and name */
export type Citizen = {
  /** Social security identification number */
  ssin: string;

  /** User's first name */
  firstName: string;

  /** User's last name */
  lastName: string;
};
