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

// Order status types for the escrow payment system
export type OrderStatus =
  | "PAYMENT_HELD" // Buyer paid, money held in escrow
  | "SHIPPED" // Seller marked as shipped
  | "DELIVERED" // Buyer confirmed delivery
  | "COMPLETED" // Money released to seller
  | "DISPUTED" // Buyer raised a dispute
  | "REFUNDED" // Dispute resolved with refund
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
