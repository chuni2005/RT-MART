/**
 * Icon Mapping Configuration
 * 此檔案負責將字符串 icon 名稱映射到 FontAwesome icon 對象
 * 供 Icon Component 使用,實現 string 到 IconProp 的類型轉換
 */

import { IconProp, IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faArrowRotateRight,
  faBars,
  faCheckCircle,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faEnvelope,
  faExclamationCircle,
  faExclamationTriangle,
  faEye,
  faEyeSlash,
  faGlobe,
  faInfoCircle,
  faMinus,
  faPlus,
  faSearch,
  faShoppingCart,
  faSignOutAlt,
  faStar,
  faStore,
  faTimes,
  faTrash,
  faTruckFast,
  faUser,
} from '@fortawesome/free-solid-svg-icons';

/**
 * 所有 icon 定義對象
 * 用於 FontAwesome library.add() 批量註冊
 */
const icons: IconDefinition[] = [
  faArrowRotateRight,
  faBars,
  faCheckCircle,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faEnvelope,
  faExclamationCircle,
  faExclamationTriangle,
  faEye,
  faEyeSlash,
  faGlobe,
  faInfoCircle,
  faMinus,
  faPlus,
  faSearch,
  faShoppingCart,
  faSignOutAlt,
  faStar,
  faStore,
  faTimes,
  faTrash,
  faTruckFast,
  faUser,
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
  'arrow-rotate-right': faArrowRotateRight,
  'bars': faBars,
  'check-circle': faCheckCircle,
  'chevron-down': faChevronDown,
  'chevron-left': faChevronLeft,
  'chevron-right': faChevronRight,
  'chevron-up': faChevronUp,
  'envelope': faEnvelope,
  'exclamation-circle': faExclamationCircle,
  'exclamation-triangle': faExclamationTriangle,
  'eye': faEye,
  'eye-slash': faEyeSlash,
  'globe': faGlobe,
  'info-circle': faInfoCircle,
  'minus': faMinus,
  'plus': faPlus,
  'search': faSearch,
  'shopping-cart': faShoppingCart,
  'sign-out-alt': faSignOutAlt,
  'star': faStar,
  'store': faStore,
  'times': faTimes,
  'trash': faTrash,
  'truck-fast': faTruckFast,
  'user': faUser,
};

/**
 * 導出所有 icon 定義對象的數組
 * 可用於 FontAwesome library.add() 批量註冊
 */
export const iconList = icons;
