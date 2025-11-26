/**
 * Icon Library Configuration
 * 此檔案負責註冊所有需要使用的 FontAwesome 圖標到全局 library
 *
 * 注意:
 * - 如果只使用自定義的 Icon 組件,此檔案為可選
 * - 如果直接使用 <FontAwesomeIcon> 組件,則需要在此註冊
 * - 現在統一從 iconMap.ts 導入,避免重複維護
 */

import { library } from '@fortawesome/fontawesome-svg-core';
import { iconList } from './iconMap';

// 註冊所有圖標到 FontAwesome 全局庫
library.add(...iconList);
