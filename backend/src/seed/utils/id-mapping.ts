/**
 * ID 映射工具類別
 * 用於追蹤 JSON 中的 script_* ID 與實際資料庫 ID 的對應關係
 */
export class IdMapping {
  private mappings: Map<string, Map<number, string>> = new Map();

  /**
   * 設定 ID 映射
   * @param entityType 實體類型（例如：'User', 'Product', 'Order'）
   * @param scriptId JSON 中的 script_* ID
   * @param realId 資料庫中的實際 ID
   */
  setMapping(entityType: string, scriptId: number, realId: string): void {
    if (!this.mappings.has(entityType)) {
      this.mappings.set(entityType, new Map());
    }
    this.mappings.get(entityType)!.set(scriptId, realId);
  }

  /**
   * 取得 ID 映射
   * @param entityType 實體類型
   * @param scriptId JSON 中的 script_* ID
   * @returns 資料庫中的實際 ID，如果不存在則返回 null
   */
  getMapping(entityType: string, scriptId: number): string | null {
    const entityMap = this.mappings.get(entityType);
    if (!entityMap) {
      return null;
    }
    return entityMap.get(scriptId) || null;
  }

  /**
   * 檢查是否存在映射
   * @param entityType 實體類型
   * @param scriptId JSON 中的 script_* ID
   * @returns 是否存在映射
   */
  hasMapping(entityType: string, scriptId: number): boolean {
    return this.getMapping(entityType, scriptId) !== null;
  }

  /**
   * 清空所有映射（用於 --force 模式）
   */
  clear(): void {
    this.mappings.clear();
  }

  /**
   * 取得所有映射（用於除錯）
   */
  getAllMappings(): Map<string, Map<number, string>> {
    return this.mappings;
  }
}

