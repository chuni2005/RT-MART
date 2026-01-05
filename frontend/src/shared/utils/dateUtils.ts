/**
 * 日期工具函數
 * 統一處理本地時區日期格式與範圍計算
 */

/**
 * 將 Date 對象格式化為本地日期的 YYYY-MM-DD 字串
 */
export const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * 計算常用日期範圍（本地時間）
 * @param period 'day' | 'week' | 'month' | 'year'
 * @returns { startDate: string, endDate: string }
 */
export const calculateDateRangeLocal = (period: "day" | "week" | "month" | "year") => {
  const now = new Date();
  const endDate = formatDateLocal(now);
  const start = new Date();
  
  switch (period) {
    case "day":
      start.setDate(start.getDate() - 1);
      break;
    case "week":
      start.setDate(start.getDate() - 7);
      break;
    case "month":
      start.setDate(start.getDate() - 30);
      break;
    case "year":
      start.setDate(start.getDate() - 365);
      break;
  }
  
  return { startDate: formatDateLocal(start), endDate };
};

/**
 * 獲取預設的開始日期（30天前）
 */
export const getDefaultStartDate = (days = 30): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDateLocal(date);
};

/**
 * 獲取預設的結束日期（今天）
 */
export const getDefaultEndDate = (): string => {
  return formatDateLocal(new Date());
};

