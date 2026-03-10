export interface PaymentInitializeRequest {
  itemId: number;
  amount: number;
  deliveryAddress: string;
}

export interface PaymentInitializeResponse {
  success: boolean;
  message: string;
  data: {
    authorizationUrl: string;
    accessCode: string;
    reference: string;
  };
}

// Order status types — simple direct payment flow (no escrow)
export type OrderStatus =
  | "PAID" // Payment confirmed, awaiting shipment
  | "PAYMENT_HELD" // Legacy — treated same as PAID
  | "PROCESSING" // Legacy — treated same as PAID
  | "SHIPPED" // Seller marked as shipped / in transit
  | "DELIVERED" // Delivered (auto or admin)
  | "COMPLETED" // Order complete, seller paid
  | "DISPUTED" // Issue raised
  | "REFUNDED" // Refund processed
  | "CANCELLED"; // Order cancelled

export interface Order {
  orderId: number;
  itemId: number;
  itemTitle: string;
  itemImage: string;
  itemPrice: number;
  buyerId: number;
  buyerName: string;
  buyerEmail: string;
  sellerId: number;
  sellerName: string;
  sellerEmail: string;
  amount: number;
  deliveryAddress: string;
  status: OrderStatus;
  createdAt: string;
  shippedAt?: string; // When seller marked as shipped
  deliveredAt?: string; // When buyer confirmed delivery
  completedAt?: string; // When payment was released to seller
  disputedAt?: string; // When dispute was raised
  refundedAt?: string; // When refund was processed
  autoCompletedAt?: string;
}

export interface OrdersResponse {
  success: boolean;
  message: string;
  data: {
    content: Order[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

// Dispute types
export type DisputeReason =
  | "ITEM_NOT_RECEIVED"
  | "ITEM_NOT_AS_DESCRIBED"
  | "ITEM_DAMAGED"
  | "WRONG_ITEM_SENT"
  | "INCOMPLETE_ORDER"
  | "OTHER";

export type DisputeStatus =
  | "OPEN"
  | "UNDER_REVIEW"
  | "RESOLVED"
  | "REFUNDED"
  | "REJECTED";

export interface Dispute {
  id: number;
  orderId: number;
  buyerId: number;
  sellerId: number;
  reason: DisputeReason;
  description: string;
  status: DisputeStatus;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  order?: Order;
}

export interface CreateDisputeRequest {
  reason: DisputeReason;
  description: string;
}

export interface DisputesResponse {
  success: boolean;
  message: string;
  data: {
    content: Dispute[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}
