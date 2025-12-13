import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/shared/components/Button';
import Icon from '@/shared/components/Icon';
import styles from './UserSidebar.module.scss';

import { UserSidebarProps } from '@/types/userCenter';

interface NavSection {
  label: string;
  icon: string;
  items: NavItem[];
}

interface NavItem {
  path: string;
  label: string;
}

function UserSidebar({ activeRoute }: UserSidebarProps) {
  const navigate = useNavigate();

  const navSections: NavSection[] = [
    {
      label: '我的帳戶',
      icon: 'user',
      items: [
        { path: '/user/account/profile', label: '個人檔案' },
        { path: '/user/account/address', label: '地址' }
      ]
    },
    {
      label: '購買清單',
      icon: 'receipt',
      items: [
        { path: '/user/orders', label: '我的訂單' }
      ]
    }
  ];

  // 檢查某個 section 是否有 active 的項目（用於自動展開）
  const isSectionActive = (section: NavSection): boolean => {
    return section.items.some(item => activeRoute.startsWith(item.path));
  };

  // 手動控制展開/收合的狀態
  const [expandedSections, setExpandedSections] = useState<Set<number>>(() => {
    // 初始化：找到包含當前 active route 的 section 並展開
    const initialExpanded = new Set<number>();
    navSections.forEach((section, index) => {
      if (isSectionActive(section)) {
        initialExpanded.add(index);
      }
    });
    return initialExpanded;
  });

  // 當 activeRoute 變化時，自動展開對應的 section
  useEffect(() => {
    const activeSectionIndex = navSections.findIndex(section =>
      isSectionActive(section)
    );

    if (activeSectionIndex !== -1) {
      setExpandedSections(new Set([activeSectionIndex]));
    }
  }, [activeRoute]);

  // 切換 section 的展開/收合狀態
  const toggleSection = (index: number) => {
    const section = navSections[index];
    
    // 關閉所有其他 section，只展開當前的
    setExpandedSections(new Set([index]));
    
    if (section.items.length > 0) {
      navigate(section.items[0].path);
    }
  };

  return (
    <aside className={styles.sidebar}>
      {navSections.map((section, index) => {
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

            {/* 子項目列表（根據展開狀態顯示） */}
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

export default UserSidebar;
