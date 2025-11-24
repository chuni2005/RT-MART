/**
 * Icon Library Configuration
 * 此檔案負責註冊所有需要使用的 FontAwesome 圖標
 * 只有在此處註冊的圖標才能在 Icon Component 中使用
 */

import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faSearch,
  faShoppingCart,
  faUser,
  faSignOutAlt,
  faTimes,
  faBars,
} from '@fortawesome/free-solid-svg-icons';

// 註冊所有圖標到 FontAwesome 庫
library.add(
  faSearch,
  faShoppingCart,
  faUser,
  faSignOutAlt,
  faTimes,
  faBars,
);
