import { IdMapping } from './id-mapping';

/**
 * 資料映射工具
 * 處理 script_* 欄位映射和資料轉換
 */
export class DataMapper {
  /**
   * 從 JSON 資料中移除所有 script_* 前綴的欄位
   * @param data JSON 資料物件
   * @returns 移除 script_* 欄位後的資料
   */
  static removeScriptFields<T extends Record<string, any>>(
    data: T,
  ): Omit<T, string> {
    const result = { ...data };
    Object.keys(result).forEach((key) => {
      if (key.startsWith('script_')) {
        delete result[key];
      }
    });
    return result as Omit<T, string>;
  }

  /**
   * 將 JSON 中的 script_*_id 轉換為實際的資料庫 ID
   * @param data JSON 資料物件
   * @param idMapping IdMapping 實例
   * @param entityType 目標實體類型
   * @param scriptIdField JSON 中的 script_*_id 欄位名稱
   * @param targetField 目標欄位名稱（例如：'userId', 'productId'）
   * @returns 轉換後的 ID，如果不存在則返回 null
   */
  static mapScriptIdToRealId(
    data: Record<string, unknown>,
    idMapping: IdMapping,
    entityType: string,
    scriptIdField: string,
    targetField?: string,
  ): string | null {
    const scriptId = data[scriptIdField];
    if (scriptId === undefined || scriptId === null) {
      return null;
    }

    const scriptIdNumber =
      typeof scriptId === 'number' ? scriptId : Number(scriptId);
    const realId = idMapping.getMapping(entityType, scriptIdNumber);
    if (realId && targetField) {
      data[targetField] = realId;
    }

    return realId;
  }

  /**
   * 轉換日期字串為 Date 物件
   * @param dateString ISO 日期字串或 null
   * @returns Date 物件或 null
   */
  static parseDate(dateString: string | null | undefined): Date | null {
    if (!dateString) {
      return null;
    }
    try {
      return new Date(dateString);
    } catch {
      return null;
    }
  }

  /**
   * 解析 JSON 字串為物件
   * @param jsonString JSON 字串
   * @returns 解析後的物件，如果解析失敗則返回 null
   */
  static parseJson(jsonString: string | null | undefined): unknown {
    if (!jsonString) {
      return null;
    }
    try {
      return JSON.parse(jsonString);
    } catch {
      return null;
    }
  }
}
