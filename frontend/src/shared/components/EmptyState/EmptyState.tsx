import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/shared/components/Icon/Icon';
import Button from '@/shared/components/Button/Button';
import styles from './EmptyState.module.scss';

export interface EmptyStateProps {
  type?: 'search' | 'cart' | 'order' | 'admin-order';
  icon?: string;
  title?: string;
  message?: string | ReactNode;
  suggestions?: string[];
  buttonText?: string;
  buttonAction?: () => void;

  // Backward compatibility for Search page
  keyword?: string;
  categoryName?: string;
}

function EmptyState({
  type = 'search',
  icon,
  title,
  message,
  suggestions,
  buttonText,
  buttonAction,
  keyword,
  categoryName,
}: EmptyStateProps) {
  const navigate = useNavigate();

  // Get defaults based on type
  const getDefaults = () => {
    switch (type) {
      case 'cart':
        return {
          icon: 'shopping-cart',
          title: '您的購物車是空的',
          suggestions: ['去逛逛熱門商品', '查看最新優惠', '瀏覽商品分類'],
          buttonText: '去逛逛',
          buttonAction: () => navigate('/'),
        };
      case 'order':
        return {
          icon: 'box',
          title: '目前沒有訂單',
          suggestions: ['瀏覽商品', '查看熱門商品', '搜尋想要的商品'],
          buttonText: '開始購物',
          buttonAction: () => navigate('/'),
        };
      case 'admin-order':
        return {
          icon: 'magnifying-glass',
          title: '未找到訂單',
          suggestions: undefined,
          buttonText: undefined,
          buttonAction: undefined,
        };
      case 'search':
      default:
        // Original Search page logic
        const searchTitle = keyword
          ? categoryName
            ? `找不到符合 "${keyword}" 的${categoryName}商品`
            : `找不到符合 "${keyword}" 的商品`
          : categoryName
          ? `${categoryName}分類目前沒有商品`
          : '找不到商品';

        return {
          icon: 'search',
          title: searchTitle,
          suggestions: keyword
            ? ['檢查關鍵字是否正確', '使用不同的關鍵字', '瀏覽熱門商品']
            : categoryName
            ? ['選擇其他分類', '清除所有篩選條件', '瀏覽所有商品']
            : ['調整篩選條件', '清除所有篩選', '瀏覽熱門商品'],
          buttonText: '返回首頁',
          buttonAction: () => navigate('/'),
        };
    }
  };

  const defaults = getDefaults();
  const finalIcon = icon || defaults.icon;
  const finalTitle = title || defaults.title;
  const finalSuggestions = suggestions || defaults.suggestions;
  const finalButtonText = buttonText || defaults.buttonText;
  const finalButtonAction = buttonAction || defaults.buttonAction;

  return (
    <div className={styles.emptyState}>
      <Icon icon={finalIcon} className={styles.emptyIcon} />
      <h3 className={styles.emptyTitle}>{finalTitle}</h3>
      {message && <div className={styles.emptyMessage}>{message}</div>}
      {finalSuggestions && (
        <div className={styles.emptyMessage}>
          <p>請嘗試：</p>
          <ul>
            {finalSuggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
      {finalButtonText && finalButtonAction && (
        <Button
          variant="primary"
          onClick={finalButtonAction}
          className={styles.backButton}
        >
          {finalButtonText}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
