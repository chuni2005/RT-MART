import React, { useState, useEffect } from "react";
import styles from "./Hero.module.scss";

/**
 * Hero Component
 * 輪播圖橫幅組件，支援自動播放和手動切換
 *
 * @param {Array} banners - 輪播圖資料陣列，格式: [{ id, imageUrl, alt, link? }]
 * @param {number} autoPlayInterval - 自動播放間隔（毫秒），預設 4000ms
 * @param {number} height - 輪播圖高度（桌面版），預設 400px
 */
const Hero = ({ banners = [], autoPlayInterval = 4000, height = 400 }) => {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // 自動輪播
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) =>
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [banners.length, autoPlayInterval]);

  // 手動切換輪播圖
  const handleDotClick = (index) => {
    setCurrentBannerIndex(index);
  };

  // 處理輪播圖點擊（如果有連結）
  const handleBannerClick = (banner) => {
    if (banner.link) {
      window.location.href = banner.link;
    }
  };

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <section className={styles.hero}>
      <div className={styles.carouselWrapper}>
        <div className={styles.carouselContainer}>
          <div
            className={styles.carouselTrack}
            style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
          >
            {banners.map((banner) => (
              <div
                key={banner.id}
                className={styles.carouselSlide}
                style={{ height: `${height}px` }}
                onClick={() => handleBannerClick(banner)}
                role={banner.link ? "button" : undefined}
                tabIndex={banner.link ? 0 : undefined}
              >
                <img src={banner.imageUrl} alt={banner.alt} />
              </div>
            ))}
          </div>

          {/* Dot Indicators - 只在有多個輪播圖時顯示 */}
          {banners.length > 1 && (
            <div className={styles.carouselDots}>
              {banners.map((_, index) => (
                <button
                  key={index}
                  className={`${styles.dot} ${
                    index === currentBannerIndex ? styles.dotActive : ""
                  }`}
                  onClick={() => handleDotClick(index)}
                  aria-label={`切換到第 ${index + 1} 張輪播圖`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
