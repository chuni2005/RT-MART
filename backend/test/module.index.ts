import { AuditLogsModule } from '../src/audit-logs/audit-logs.module';
import { AuthModule } from '../src/auth/auth.module';
import { CartHistoryModule } from '../src/cart-history/cart-history.module';
import { CartsModule } from '../src/carts/carts.module';
import { DiscountsModule } from '../src/discounts/discounts.module';
import { InventoryModule } from '../src/inventory/inventory.module';
import { OrdersModule } from '../src/orders/orders.module';
import { ProductTypesModule } from '../src/product-types/product-types.module';
import { ProductsModule } from '../src/products/products.module';
import { SellersModule } from '../src/sellers/sellers.module';
import { ShippingAddressesModule } from '../src/shipping-addresses/shipping-addresses.module';
import { StoresModule } from '../src/stores/stores.module';
import { UsersModule } from '../src/users/users.module'

export const AppModules = [
  AuditLogsModule,
  AuthModule,
  CartHistoryModule,
  CartsModule,
  DiscountsModule,
  InventoryModule,
  OrdersModule,
  ProductTypesModule,
  ProductsModule,
  SellersModule,
  ShippingAddressesModule,
  StoresModule,
  UsersModule,
];
