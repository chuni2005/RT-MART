import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FormInput from '@/shared/components/FormInput';
import Select from '@/shared/components/Select';
import Button from '@/shared/components/Button';
import Icon from '@/shared/components/Icon';
import ImageUploader from './ImageUploader';
import sellerService from '@/shared/services/sellerService';
import productService from '@/shared/services/productService';
import { ProductFormData, ProductImage } from '@/types/seller';
import { ProductType } from '@/types/product';
import { useForm } from '@/shared/hooks/useForm';
import styles from './ProductEdit.module.scss';

function ProductEdit() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const isEditMode = Boolean(productId);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);

  const { values, errors, handleChange, handleBlur, validate, setValue } = useForm({
    initialValues: {
      productName: '',
      description: '',
      price: '',
      stock: '',
      productTypeId: '',
    },
    validationRules: {
      productName: { required: true, minLength: 2, maxLength: 100 },
      description: { required: true, maxLength: 1000 },
      price: { required: true, min: 1 },
      stock: { required: true, min: 0 },
      productTypeId: { required: true },
    },
  });

  useEffect(() => {
    loadProductTypes();
    if (isEditMode && productId) {
      loadProduct(productId);
    }
  }, [productId]);

  const loadProductTypes = async () => {
    try {
      const types = await productService.getProductTypes();
      setProductTypes(types);
    } catch (error) {
      console.error('載入商品類型失敗:', error);
    }
  };

  const loadProduct = async (id: string) => {
    setLoading(true);
    try {
      const product = await sellerService.getProduct(id);
      setValue('productName', product.productName);
      setValue('description', product.description || '');
      setValue('price', product.price.toString());
      setValue('stock', product.stock.toString());
      setValue('productTypeId', product.productTypeId);
      setImages(product.images);
    } catch (error) {
      console.error('載入商品失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!validate() || images.length === 0) {
      if (images.length === 0) {
        alert('請至少上傳一張商品圖片');
      }
      return;
    }

    setSaving(true);
    try {
      const formData: ProductFormData = {
        productName: values.productName,
        description: values.description,
        price: Number(values.price),
        stock: Number(values.stock),
        productTypeId: values.productTypeId,
        images,
      };

      if (isEditMode && productId) {
        await sellerService.updateProduct(productId, formData);
      } else {
        await sellerService.createProduct(formData);
      }

      navigate('/seller/products');
    } catch (error) {
      console.error('儲存商品失敗:', error);
      alert('儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>載入中...</div>;
  }

  return (
    <div className={styles.productEdit}>
      <div className={styles.header}>
        <Button variant="ghost" onClick={() => navigate('/seller/products')}>
          <Icon icon="arrow-left" />
          返回列表
        </Button>
        <h1 className={styles.pageTitle}>
          {isEditMode ? '編輯商品' : '新增商品'}
        </h1>
      </div>

      <div className={styles.formContainer}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>商品圖片</h2>
          <ImageUploader images={images} onChange={setImages} maxImages={5} />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>商品資訊</h2>

          <FormInput
            label="商品名稱"
            name="productName"
            value={values.productName}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.productName}
            required
            placeholder="請輸入商品名稱"
          />

          <div className={styles.formGroup}>
            <label className={styles.label}>
              商品描述 <span className={styles.required}>*</span>
            </label>
            <textarea
              name="description"
              value={values.description}
              onChange={(e) => handleChange('description', e.target.value)}
              onBlur={() => handleBlur('description')}
              className={styles.textarea}
              rows={6}
              placeholder="請詳細描述商品特色、規格等資訊"
            />
            {errors.description && (
              <span className={styles.errorText}>{errors.description}</span>
            )}
          </div>

          <div className={styles.row}>
            <FormInput
              label="商品價格"
              name="price"
              type="number"
              value={values.price}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.price}
              required
              placeholder="0"
              min={1}
            />

            <FormInput
              label="庫存數量"
              name="stock"
              type="number"
              value={values.stock}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.stock}
              required
              placeholder="0"
              min={0}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              商品類型 <span className={styles.required}>*</span>
            </label>
            <Select
              value={values.productTypeId}
              onChange={(value) => handleChange('productTypeId', value)}
              options={[
                { value: '', label: '請選擇商品類型' },
                ...productTypes.map((type) => ({
                  value: type.productTypeId,
                  label: type.typeName,
                })),
              ]}
            />
            {errors.productTypeId && (
              <span className={styles.errorText}>{errors.productTypeId}</span>
            )}
          </div>
        </section>

        <div className={styles.actions}>
          <Button variant="outline" onClick={() => navigate('/seller/products')}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '儲存中...' : '儲存商品'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ProductEdit;
