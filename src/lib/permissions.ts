import { TeamMember, ScreenView } from '../types';

export const isScreenAllowedForUser = (
  currentUser: TeamMember | null | undefined,
  screen: ScreenView
): boolean => {
  // If no logged in user context or user is owner, allow everything
  if (!currentUser) return true;
  if (currentUser.position === 'owner') return true;

  // If allowedScreens array is explicitly specified on the member
  if (Array.isArray(currentUser.allowedScreens) && currentUser.allowedScreens.length > 0) {
    return currentUser.allowedScreens.includes(screen);
  }

  // Fallback to permissions object if allowedScreens array is missing
  const p = currentUser.permissions;
  if (!p) return true;

  switch (screen) {
    case 'pos':
    case 'sales':
      return Boolean(p.canManageSales);
    case 'expenses':
      return Boolean(p.canViewExpenses);
    case 'reports':
      return Boolean(p.canViewReports);
    case 'packages':
      return Boolean(p.canManagePackages);
    case 'team':
      return Boolean(p.canManageTeam);
    case 'home':
    case 'sector':
    case 'clients':
    case 'add-client':
    default:
      return true;
  }
};

export const getFirstAllowedScreen = (
  currentUser: TeamMember | null | undefined
): ScreenView => {
  const priorityScreens: ScreenView[] = [
    'home',
    'clients',
    'sales',
    'pos',
    'packages',
    'sector',
    'expenses',
    'reports',
    'team',
  ];
  for (const screen of priorityScreens) {
    if (isScreenAllowedForUser(currentUser, screen)) {
      return screen;
    }
  }
  return 'home';
};
