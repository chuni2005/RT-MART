/**
 * 日期範圍處理工具
 */

export class DateRangeUtil {
  /**
   * 將 YYYY-MM-DD 格式的字串轉換為該日的開始時間 (00:00:00.000)
   */
  static getStartOfDay(dateStr: string | Date): Date {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  /**
   * 將 YYYY-MM-DD 格式的字串轉換為該日的結束時間 (23:59:59.999)
   */
  static getEndOfDay(dateStr: string | Date): Date {
    const date = new Date(dateStr);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  /**
   * 根據查詢參數解析日期範圍
   * 如果沒有提供日期，則使用預設範圍（例如最近 12 個月）
   */
  static parseRange(
    startDateStr?: string,
    endDateStr?: string,
    defaultDays = 365,
  ) {
    let endDate: Date;
    let startDate: Date;

    if (endDateStr) {
      endDate = this.getEndOfDay(endDateStr);
    } else {
      endDate = new Date();
    }

    if (startDateStr) {
      startDate = this.getStartOfDay(startDateStr);
    } else {
      startDate = new Date(
        endDate.getTime() - defaultDays * 24 * 60 * 60 * 1000,
      );
      startDate.setHours(0, 0, 0, 0);
    }

    return { startDate, endDate };
  }
}
