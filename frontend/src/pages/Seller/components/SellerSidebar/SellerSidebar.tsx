import NavigationSidebar, { NavSection } from '@/shared/components/NavigationSidebar';

interface SellerSidebarProps {
  activeRoute: string;
}

const SELLER_NAV_SECTIONS: NavSection[] = [
  {
    label: "Dashboard",
    icon: "magnifying-glass-chart",
    items: [{ path: "/seller/center", label: "營業概況" }],
  },
  {
    label: "商店管理",
    icon: "store",
    items: [{ path: "/seller/store-settings", label: "商店設定" }],
  },
  {
    label: "商品管理",
    icon: "box-open",
    items: [
      { path: "/seller/products", label: "商品列表" },
      { path: "/seller/product/new", label: "新增商品" },
    ],
  },
  {
    label: "訂單管理",
    icon: "receipt",
    items: [{ path: "/seller/orders", label: "訂單列表" }],
  },
  {
    label: "折扣管理",
    icon: "ticket",
    items: [{ path: "/seller/discounts", label: "折扣活動" }],
  },
];

function SellerSidebar({ activeRoute }: SellerSidebarProps) {
  return <NavigationSidebar activeRoute={activeRoute} sections={SELLER_NAV_SECTIONS} />;
}

export default SellerSidebar;
