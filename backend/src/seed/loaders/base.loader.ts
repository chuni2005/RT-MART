import { EntityManager } from 'typeorm';
import { Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { IdMapping } from '../utils/id-mapping';

/**
 * 基礎載入器抽象類別
 * 提供通用的 JSON 讀取、資料轉換、批次插入功能
 */
export abstract class BaseLoader<T> {
  protected abstract entityName: string;
  protected abstract jsonFileName: string;
  protected abstract entityClass: new () => T;

  constructor(
    protected entityManager: EntityManager,
    protected idMapping: IdMapping,
    protected logger: Logger,
  ) {}

  /**
   * 讀取 JSON 檔案
   * @returns 解析後的 JSON 物件陣列
   */
  protected loadJson(): Record<string, unknown>[] {
    const jsonPath = join(__dirname, '../../init-data', this.jsonFileName);
    try {
      const fileContent = readFileSync(jsonPath, 'utf-8');
      const parsed = JSON.parse(fileContent) as unknown;

      // 驗證解析結果是陣列
      if (!Array.isArray(parsed)) {
        throw new Error(
          `JSON file ${this.jsonFileName} does not contain an array`,
        );
      }

      // 驗證陣列中的每個元素都是物件
      if (
        !parsed.every(
          (item) =>
            typeof item === 'object' && item !== null && !Array.isArray(item),
        )
      ) {
        throw new Error(
          `JSON file ${this.jsonFileName} contains invalid data structure`,
        );
      }

      return parsed as Record<string, unknown>[];
    } catch (error) {
      this.logger.error(
        `Failed to load JSON file: ${jsonPath}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * 驗證和轉換單筆資料（子類別實作）
   * @param data JSON 資料
   * @returns 轉換後的實體物件，如果無效則返回 null
   */
  protected abstract validateAndTransform(
    data: Record<string, unknown>,
  ): Promise<T | null>;

  /**
   * 檢查資料是否已存在（子類別實作）
   * @param entity 實體物件
   * @returns 是否存在
   */
  protected abstract checkExists(entity: T): Promise<boolean>;

  /**
   * 清空資料（用於 --force 模式）
   * 預設實作：刪除所有資料
   */
  async clear(): Promise<void> {
    await this.entityManager.delete(this.entityClass, {});
    this.logger.log(`Cleared all ${this.entityName} data`);
  }

  /**
   * 批次插入資料
   * @param force 是否強制插入（跳過存在檢查）
   * @returns 插入結果統計
   */
  async load(force: boolean = false): Promise<{
    success: number;
    skipped: number;
    errors: Array<{
      data: Record<string, unknown>;
      error: string;
      stack?: string;
    }>;
  }> {
    const startTime = Date.now();
    this.logger.log(`Starting to load ${this.entityName}...`);

    const jsonData = this.loadJson();
    const entities: T[] = [];
    const errors: Array<{
      data: Record<string, unknown>;
      error: string;
      stack?: string;
    }> = [];
    let skipped = 0;

    // 轉換和驗證資料
    for (const data of jsonData) {
      try {
        const entity = await this.validateAndTransform(data);
        if (!entity) {
          errors.push({
            data,
            error: 'Validation failed: entity is null',
          });
          continue;
        }

        // 檢查是否已存在（除非是 force 模式）
        if (!force) {
          const exists = await this.checkExists(entity);
          if (exists) {
            skipped++;
            this.logger.warn(
              `Skipping ${this.entityName} (already exists): ${JSON.stringify(data)}`,
            );
            continue;
          }
        }

        entities.push(entity);
      } catch (error) {
        errors.push({
          data,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        this.logger.error(
          `Error transforming ${this.entityName} data: ${JSON.stringify(data)}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    // 批次插入
    let success = 0;
    if (entities.length > 0) {
      try {
        const saved = await this.entityManager.save(this.entityClass, entities);
        success = saved.length;
        this.logger.log(
          `Successfully inserted ${success} ${this.entityName} records`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to insert ${this.entityName} records`,
          error instanceof Error ? error.stack : String(error),
        );
        throw error;
      }
    }

    const duration = Date.now() - startTime;
    this.logger.log(
      `Completed loading ${this.entityName}: ${success} inserted, ${skipped} skipped, ${errors.length} errors (${duration}ms)`,
    );

    return { success, skipped, errors };
  }
}
