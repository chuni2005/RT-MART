import React from 'react';
import styles from './Home.module.scss';
import ProductCard from '../../shared/components/ProductCard';
import Button from '../../shared/components/Button';

function Home() {
  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>歡迎來到 RT-MART</h1>
          <p className={styles.heroSubtitle}>
            您的一站式線上購物平台，品質保證、價格實惠
          </p>
          <div className={styles.heroButtons}>
            <Button variant="primary">立即購物</Button>
            <Button variant="outline">瞭解更多</Button>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className={styles.products}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>熱門商品</h2>
          <div className={styles.productGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <ProductCard
                key={item}
                id={item}
                name={`商品名稱 ${item}`}
                currentPrice={999}
                originalPrice={1299}
                rating={5}
                soldCount="1.2k"
                onClick={(id) => console.log(`點擊了商品 ${id}`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2>開始您的購物之旅</h2>
          <p>註冊會員享更多優惠</p>
          <Button variant="primary">立即註冊</Button>
        </div>
      </section>
    </div>
  );
}

export default Home;