import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/shared/components/Button';
import Icon from '@/shared/components/Icon';
import styles from './NavigationSidebar.module.scss';

export interface NavSection {
  label: string;
  icon: string;
  items: NavItem[];
}

export interface NavItem {
  path: string;
  label: string;
}

interface NavigationSidebarProps {
  activeRoute: string;
  sections: NavSection[];
}

/**
 * 通用導航側邊欄組件
 * 可用於 UserCenter, SellerCenter, AdminCenter 等
 */
function NavigationSidebar({ activeRoute, sections }: NavigationSidebarProps) {
  const navigate = useNavigate();

  // 檢查某個 section 是否有 active 的項目
  const isSectionActive = (section: NavSection): boolean => {
    return section.items.some(item => {
      // 處理動態路由：移除末尾的 's' 來匹配單數形式
      // 例如：/seller/products 應該匹配 /seller/product/edit/123
      const basePath = item.path.replace(/s$/, '');
      return activeRoute.startsWith(item.path) || activeRoute.startsWith(basePath);
    });
  };

  // 手動控制展開/收合的狀態
  const [expandedSections, setExpandedSections] = useState<Set<number>>(() => {
    // 初始化：找到包含當前 active route 的 section 並展開
    const initialExpanded = new Set<number>();
    sections.forEach((section, index) => {
      if (isSectionActive(section)) {
        initialExpanded.add(index);
      }
    });
    return initialExpanded;
  });

  // 當 activeRoute 變化時，自動展開對應的 section
  useEffect(() => {
    const activeSectionIndex = sections.findIndex(section =>
      isSectionActive(section)
    );

    if (activeSectionIndex !== -1) {
      setExpandedSections(new Set([activeSectionIndex]));
    }
  }, [activeRoute, sections]);

  // 切換 section 的展開/收合狀態
  const toggleSection = (index: number) => {
    const section = sections[index];

    // 關閉所有其他 section，只展開當前的
    setExpandedSections(new Set([index]));

    if (section.items.length > 0) {
      navigate(section.items[0].path);
    }
  };

  return (
    <aside className={styles.sidebar}>
      {sections.map((section, index) => {
        const isExpanded = expandedSections.has(index);
        const isActive = isSectionActive(section);

        return (
          <div key={index} className={styles.navSection}>
            {/* Section 標題 */}
            <Button
              variant="ghost"
              className={`${styles.sectionTitle} ${isExpanded || isActive ? styles.active : ''}`}
              onClick={() => toggleSection(index)}
            >
              <Icon icon={section.icon} className={styles.sectionIcon} />
              <span>{section.label}</span>
            </Button>

            {/* 子項目列表 */}
            {isExpanded && (
              <ul className={styles.navList}>
                {section.items.map((item) => (
                  <li key={item.path}>
                    <Button
                      variant="ghost"
                      className={`${styles.navItem} ${
                        activeRoute === item.path ? styles.active : ''
                      }`}
                      onClick={() => navigate(item.path)}
                    >
                      {item.label}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </aside>
  );
}

export default NavigationSidebar;
