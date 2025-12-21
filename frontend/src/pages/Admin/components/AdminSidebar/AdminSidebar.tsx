import NavigationSidebar, { NavSection } from '@/shared/components/NavigationSidebar';

interface AdminSidebarProps {
  activeRoute: string;
}

const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    label: 'Dashboard',
    icon: 'magnifying-glass-chart',
    items: [{ path: '/admin/dashboard', label: '管理員首頁' }],
  },
  {
    label: '用戶管理',
    icon: 'address-book',
    items: [{ path: '/admin/users', label: '使用者管理' }],
  },
  {
    label: '賣家管理',
    icon: 'house-circle-check',
    items: [{ path: '/admin/sellers', label: '賣家審核' }],
  },
  {
    label: '訂單管理',
    icon: 'bolt',
    items: [{ path: '/admin/disputes', label: '訂單爭議處理' }],
  },
  {
    label: '系統設定',
    icon: 'ticket',
    items: [{ path: '/admin/discounts', label: '系統折扣設定' }],
  },
];

function AdminSidebar({ activeRoute }: AdminSidebarProps) {
  return <NavigationSidebar activeRoute={activeRoute} sections={ADMIN_NAV_SECTIONS} />;
}

export default AdminSidebar;
