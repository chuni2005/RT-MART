import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/shared/components/Button";
import Icon from "@/shared/components/Icon";
import Select from "@/shared/components/Select";
import Dialog from "@/shared/components/Dialog";
import EmptyState from "@/shared/components/EmptyState";
import sellerService from "@/shared/services/sellerService";
import { SellerProduct } from "@/types/seller";
import styles from "./ProductList.module.scss";

function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    productId: string;
    productName: string;
    isSubmitting: boolean;
  }>({ isOpen: false, productId: "", productName: "", isSubmitting: false });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, statusFilter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await sellerService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error("載入商品失敗:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // 搜尋篩選
    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.productName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 狀態篩選
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) =>
        statusFilter === "active" ? p.isActive : !p.isActive
      );
    }

    setFilteredProducts(filtered);
  };

  const handleToggleStatus = async (productId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await sellerService.deactivateProduct(productId);
      } else {
        await sellerService.activateProduct(productId);
      }
      loadProducts();
    } catch (error) {
      console.error("更新商品狀態失敗:", error);
    }
  };

  const handleDelete = async () => {
    if (deleteDialog.isSubmitting) return;

    setDeleteDialog((prev) => ({ ...prev, isSubmitting: true }));
    try {
      await sellerService.deleteProduct(deleteDialog.productId);
      setProducts(
        products.filter((p) => p.productId !== deleteDialog.productId)
      );
      setDeleteDialog({
        isOpen: false,
        productId: "",
        productName: "",
        isSubmitting: false,
      });
    } catch (error) {
      console.error("刪除商品失敗:", error);
      setDeleteDialog((prev) => ({ ...prev, isSubmitting: false }));
      alert("刪除商品失敗，請稍後再試");
    }
  };

  if (loading) {
    return <div className={styles.loading}>載入中...</div>;
  }

  const isActive = (product: SellerProduct) => product.isActive;

  return (
    <div className={styles.productList}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>商品管理</h1>
        <Button onClick={() => navigate("/seller/product/new")}>
          <Icon icon="plus" />
          新增商品
        </Button>
      </div>

      {/* 搜尋與篩選 */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Icon icon="search" className={styles.searchIcon} />
          <input
            type="text"
            placeholder="搜尋商品名稱..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <Select
          value={statusFilter}
          onChange={(value) =>
            setStatusFilter(value as "all" | "active" | "inactive")
          }
          options={[
            { value: "all", label: "全部" },
            { value: "active", label: "上架中" },
            { value: "inactive", label: "已下架" },
          ]}
        />
      </div>

      {/* 商品列表 */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon="box"
          title="尚無商品"
          message="點擊「新增商品」開始建立您的第一個商品"
        />
      ) : (
        <div className={styles.productsGrid}>
          {filteredProducts.map((product) => (
            <div key={product.productId} className={styles.productCard}>
              <div className={styles.productImage}>
                <img
                  src={
                    product.images[0]?.imageUrl || "/placeholder-product.png"
                  }
                  alt={product.productName}
                />
                <div
                  className={styles.statusBadge}
                  data-status={isActive(product) ? "active" : "inactive"}
                >
                  {isActive(product) ? "上架中" : "已下架"}
                </div>
              </div>

              <div className={styles.productInfo}>
                <h3 className={styles.productName}>{product.productName}</h3>
                <div className={styles.productMeta}>
                  <span className={styles.price}>
                    NT$ {product.price.toLocaleString()}
                  </span>
                  <span className={styles.stock}>庫存: {product.stock}</span>
                </div>
              </div>

              <div className={styles.productActions}>
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(`/seller/product/edit/${product.productId}`)
                  }
                >
                  <Icon icon="edit" />
                  編輯
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    handleToggleStatus(product.productId, isActive(product))
                  }
                >
                  <Icon icon={isActive(product) ? "eye-slash" : "eye"} />
                  {isActive(product) ? "下架" : "上架"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    setDeleteDialog({
                      isOpen: true,
                      productId: product.productId,
                      productName: product.productName,
                      isSubmitting: false,
                    })
                  }
                >
                  <Icon icon="trash" />
                  刪除
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 刪除確認對話框 */}
      <Dialog
        isOpen={deleteDialog.isOpen}
        onClose={() =>
          !deleteDialog.isSubmitting &&
          setDeleteDialog({
            isOpen: false,
            productId: "",
            productName: "",
            isSubmitting: false,
          })
        }
        onConfirm={handleDelete}
        variant="warning"
        message={`確定要刪除商品「${deleteDialog.productName}」嗎？`}
        title="確認刪除"
      >
        <div className={styles.deleteDialog}>
          <div className={styles.dialogActions}>
            <Button
              variant="outline"
              disabled={deleteDialog.isSubmitting}
              onClick={() =>
                setDeleteDialog({
                  isOpen: false,
                  productId: "",
                  productName: "",
                  isSubmitting: false,
                })
              }
            >
              取消
            </Button>
            <Button
              variant="primary"
              disabled={deleteDialog.isSubmitting}
              onClick={handleDelete}
            >
              {deleteDialog.isSubmitting ? "刪除中..." : "確認刪除"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default ProductList;
