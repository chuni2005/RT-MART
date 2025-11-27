import React from 'react';
import Icon from '@/shared/components/Icon/Icon';
import styles from './Pagination.module.scss';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}: PaginationProps) {
  /**
   * 生成智能頁碼顯示
   * 規則：最多顯示 7 個頁碼按鈕
   * 範例：[1] [2] [3] ... [8] [9] [10]
   * 範例：[1] ... [5] [6] [7] ... [20]
   */
  const renderPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // 總頁數 <= 7，全部顯示
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 總頁數 > 7，智能顯示
      if (currentPage <= 4) {
        // 靠近開頭：[1] [2] [3] [4] [5] ... [20]
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        // 靠近結尾：[1] ... [16] [17] [18] [19] [20]
        pages.push(
          1,
          '...',
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        // 中間：[1] ... [8] [9] [10] ... [20]
        pages.push(
          1,
          '...',
          currentPage - 1,
          currentPage,
          currentPage + 1,
          '...',
          totalPages
        );
      }
    }

    return pages;
  };

  const handlePageClick = (page: number) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  if (totalPages <= 1) {
    return null; // 只有一頁時不顯示分頁控制
  }

  const pageNumbers = renderPageNumbers();

  return (
    <div className={`${styles.pagination} ${className}`}>
      {/* 上一頁按鈕 */}
      <button
        className={styles.pageButton}
        onClick={handlePrevious}
        disabled={currentPage === 1}
        aria-label="上一頁"
      >
        <Icon icon="chevron-left" />
      </button>

      {/* 頁碼按鈕 */}
      {pageNumbers.map((page, index) => {
        if (page === '...') {
          return (
            <span key={`ellipsis-${index}`} className={styles.ellipsis}>
              ...
            </span>
          );
        }

        const pageNum = page as number;
        const isActive = pageNum === currentPage;

        return (
          <button
            key={pageNum}
            className={`${styles.pageButton} ${isActive ? styles.active : ''}`}
            onClick={() => handlePageClick(pageNum)}
            aria-label={`第 ${pageNum} 頁`}
            aria-current={isActive ? 'page' : undefined}
          >
            {pageNum}
          </button>
        );
      })}

      {/* 下一頁按鈕 */}
      <button
        className={styles.pageButton}
        onClick={handleNext}
        disabled={currentPage === totalPages}
        aria-label="下一頁"
      >
        <Icon icon="chevron-right" />
      </button>
    </div>
  );
}

export default Pagination;
