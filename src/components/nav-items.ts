import {
  type Icon,
  IconCategory,
  IconDashboard,
  IconHistory,
  IconSpaces,
} from '@tabler/icons-react';

export type NavItem = { title: string; url: string; icon: Icon };

export const navItems: NavItem[] = [
  { title: 'Dashboard', url: '/dashboard', icon: IconDashboard },
  { title: 'History', url: '/dashboard/history', icon: IconHistory },
  { title: 'Categories', url: '/dashboard/categories', icon: IconCategory },
  { title: 'Spaces', url: '/dashboard/spaces', icon: IconSpaces },
];
