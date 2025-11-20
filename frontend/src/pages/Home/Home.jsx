import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.scss';
import ProductCard from '../../shared/components/ProductCard/ProductCard';
import Hero from '../../shared/components/Hero/Hero';

// Mock banner data (TODO: Replace with API data)
const banners = [
  {
    id: 1,
    imageUrl:
      "https://i.pinimg.com/736x/ba/92/7f/ba927ff34cd961ce2c184d47e8ead9f6.jpg",
    alt: "促銷活動 1",
  },
  {
    id: 2,
    imageUrl:
      "https://unchainedcrypto.com/wp-content/uploads/2024/08/Untitled-design.png",
    alt: "促銷活動 2",
  },
  {
    id: 3,
    imageUrl:
      "https://uploads.dailydot.com/2018/10/olli-the-polite-cat.jpg?q=65&auto=format&w=1200&ar=2:1&fit=crop",
    alt: "促銷活動 3",
  },
];

// Mock product data (TODO: Replace with API data)
const mockProducts = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `熱門商品 ${i + 1}`,
  currentPrice: 299 + i * 50,
  originalPrice: i % 3 === 0 ? 399 + i * 50 : null,
  rating: 4 + Math.random(),
  soldCount: `${(Math.random() * 10).toFixed(1)}k`,
}));

function Home() {
  const navigate = useNavigate();

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <Hero banners={banners} autoPlayInterval={4000} height={400} />

      {/* Hot Products Section */}
      <section className={styles.productsSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>熱門商品</h2>
          <div className={styles.productGrid}>
            {mockProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                currentPrice={product.currentPrice}
                originalPrice={product.originalPrice}
                rating={product.rating}
                soldCount={product.soldCount}
                onClick={handleProductClick}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;