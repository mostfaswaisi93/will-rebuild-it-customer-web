import { UserRole } from '@core/models';

/** Post-sign-in landing route per role, shared by `EmailCheck` and `AuthCallback`. */
const ROLE_HOME_ROUTES: Record<UserRole, string> = {
  beneficiary: '/app/dashboard',
  donor: '/app/donations',
  team: '/app/team-dashboard',
};

export function roleHomeRoute(role: UserRole): string {
  return ROLE_HOME_ROUTES[role];
}
