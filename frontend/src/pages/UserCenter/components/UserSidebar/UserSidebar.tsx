import NavigationSidebar, {
  NavSection,
} from "@/shared/components/NavigationSidebar";
import { UserSidebarProps } from "@/types/userCenter";

function UserSidebar({ activeRoute }: UserSidebarProps) {
  const navSections: NavSection[] = [
    {
      label: "我的帳戶",
      icon: "user",
      items: [
        { path: "/user/account/profile", label: "個人檔案" },
        { path: "/user/account/address", label: "地址" },
      ],
    },
    {
      label: "購買清單",
      icon: "receipt",
      items: [{ path: "/user/orders", label: "我的訂單" }],
    },
  ];

  return <NavigationSidebar activeRoute={activeRoute} sections={navSections} />;
}

export default UserSidebar;
