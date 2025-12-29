/**
 * Icon Mapping Configuration
 * 此檔案負責將字符串 icon 名稱映射到 FontAwesome icon 對象
 * 供 Icon Component 使用,實現 string 到 IconProp 的類型轉換
 */

import { IconProp, IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faAddressBook,
  faArrowRotateRight,
  faBars,
  faBolt,
  faBoxOpen,
  faCalendar,
  faChartLine,
  faChartSimple,
  faCheck,
  faCheckCircle,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faCircleExclamation,
  faClipboardList,
  faCopy,
  faDollarSign,
  faEnvelope,
  faEye,
  faEyeSlash,
  faGlobe,
  faHouseCircleCheck,
  faInfoCircle,
  faMagnifyingGlassChart,
  faMapMarkerAlt,
  faMinus,
  faPenToSquare,
  faPhone,
  faPlus,
  faReceipt,
  faSearch,
  faShoppingCart,
  faSignOutAlt,
  faStar,
  faStore,
  faTicket,
  faToggleOff,
  faToggleOn,
  faTimes,
  faTrash,
  faTriangleExclamation,
  faTruckFast,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

/**
 * 所有 icon 定義對象
 * 用於 FontAwesome library.add() 批量註冊
 */
const icons: IconDefinition[] = [
  faAddressBook,
  faArrowRotateRight,
  faBars,
  faBolt,
  faBoxOpen,
  faCalendar,
  faChartLine,
  faChartSimple,
  faCheck,
  faCheckCircle,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faCircleExclamation,
  faClipboardList,
  faCopy,
  faDollarSign,
  faEnvelope,
  faEye,
  faEyeSlash,
  faGlobe,
  faHouseCircleCheck,
  faInfoCircle,
  faMagnifyingGlassChart,
  faMapMarkerAlt,
  faMinus,
  faPenToSquare,
  faPhone,
  faPlus,
  faReceipt,
  faSearch,
  faShoppingCart,
  faSignOutAlt,
  faStar,
  faStore,
  faTimes,
  faTicket,
  faToggleOff,
  faToggleOn,
  faTrash,
  faTriangleExclamation,
  faTruckFast,
  faUser,
  faUsers,
];

/**
 * Icon name to IconProp mapping
 * 將字符串名稱映射到對應的 FontAwesome icon 對象
 *
 * 使用方式:
 * - Icon 組件內部使用: iconMap[stringName]
 * - 外部組件可以傳遞字符串: <Icon icon="search" />
 */
export const iconMap: Record<string, IconProp> = {
  "address-book": faAddressBook,
  "arrow-rotate-right": faArrowRotateRight,
  "bars": faBars,
  "bolt": faBolt,
  "box-open": faBoxOpen,
  "calendar": faCalendar,
  "chart-line": faChartLine,
  "chart-simple": faChartSimple,
  "check": faCheck,
  "check-circle": faCheckCircle,
  "chevron-down": faChevronDown,
  "chevron-left": faChevronLeft,
  "chevron-right": faChevronRight,
  "chevron-up": faChevronUp,
  "circle-exclamation": faCircleExclamation,
  "clipboard-list": faClipboardList,
  "copy": faCopy,
  "dollar-sign": faDollarSign,
  "envelope": faEnvelope,
  "eye": faEye,
  "eye-slash": faEyeSlash,
  "globe": faGlobe,
  "house-circle-check": faHouseCircleCheck,
  "info-circle": faInfoCircle,
  "magnifying-glass-chart": faMagnifyingGlassChart,
  "map-marker-alt": faMapMarkerAlt,
  "minus": faMinus,
  "pen-to-square": faPenToSquare,
  "phone": faPhone,
  "plus": faPlus,
  "receipt": faReceipt,
  "search": faSearch,
  "shopping-cart": faShoppingCart,
  "sign-out-alt": faSignOutAlt,
  "star": faStar,
  "store": faStore,
  "ticket": faTicket,
  "times": faTimes,
  "toggle-off": faToggleOff,
  "toggle-on": faToggleOn,
  "trash": faTrash,
  "triangle-exclamation": faTriangleExclamation,
  "truck-fast": faTruckFast,
  "user": faUser,
  "users": faUsers,
};

/**
 * 導出所有 icon 定義對象的數組
 * 可用於 FontAwesome library.add() 批量註冊
 */
export const iconList = icons;
