export type UserRole = 'employee' | 'manager';
export interface AuthUser { id: string; name: string; role: UserRole; }
export interface UserListItem { id: string; name: string; role: UserRole; }
export interface PendingUser { id: string; name: string; createdAt: string; }

export type LocationType = 'fridge' | 'freezer' | 'warehouse';
export interface Location { id: string; name: string; type: LocationType; sortOrder: number; isActive: boolean; hasBarcode?: boolean; }

export interface Supplier {
  id: string; name: string; orderDay: number; alertEnabled: boolean; isActive: boolean; createdAt: string;
}

export interface Product {
  id: string; name: string; locationId: string; unit: string;
  sku: string; price: number; minQty: number; hasBarcode: boolean;
  supplierId?: string;
  isActive: boolean; quantity: number; locationName?: string;
}

export type MovementType = 'in' | 'out' | 'delivery';
export interface Movement {
  id: string; type: MovementType; productId: string; locationId: string;
  quantity: number; quantityAfter: number; price: number; totalValue: number;
  shift: string; shiftHe?: string; userId: string; userName: string;
  createdAt: string; notes?: string; deliveryId?: string;
  productName?: string; productUnit?: string; locationName?: string;
}

export interface DeliveryLineItem {
  productName: string; sku?: string; quantity: number; unit: string;
  matched: boolean; productId?: string;
}
