import { TeamMember, ScreenView } from '../types';

export const isScreenAllowedForUser = (
  currentUser: TeamMember | null | undefined,
  screen: ScreenView
): boolean => {
  // If no user object, disallow protected screens
  if (!currentUser) return false;

  // Owner has full disallow/allow bypass (full access)
  if (currentUser.position === 'owner') return true;

  // If allowedScreens array is explicitly specified on the member
  if (Array.isArray(currentUser.allowedScreens)) {
    return currentUser.allowedScreens.includes(screen);
  }

  // Fallback to permissions object if allowedScreens array is missing
  const p = currentUser.permissions;
  if (!p) return screen === 'home';

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
    case 'clients':
      return Boolean(p.canManageClients);
    case 'leads':
      return Boolean(p.canConfirmLeads || p.canManageClients);
    case 'add-client':
    case 'home':
    case 'sector':
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
    'leads',
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
