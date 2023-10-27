export interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
}

export interface OrderInfo {
  order_id: string;
  price_total: number;
  customer_email: string;
  customer_loyalty_card_id: string;
  customer_loyalty_card_creation_date: number;
  offline_store_id: string;
  items: OrderItem[];
}
