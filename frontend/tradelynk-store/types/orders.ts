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
  status: "PENDING_DELIVERY" | "DELIVERED" | "CANCELLED";
  createdAt: string;
  deliveredAt?: string;
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
