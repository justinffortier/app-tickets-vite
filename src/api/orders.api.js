import { edgeFunctionHelpers } from '@src/utils/edgeFunctions';

export const ordersAPI = {
  async getAll(filters = {}) {
    const result = await edgeFunctionHelpers.orders.getAll(filters);
    return result.data;
  },

  async getById(id) {
    const result = await edgeFunctionHelpers.orders.getById(id);
    return result.data;
  },

  async create(orderData) {
    const result = await edgeFunctionHelpers.orders.create(orderData);
    return result.data;
  },

  async updateStatus(id, status, paymentIntentId = null) {
    const result = await edgeFunctionHelpers.orders.updateStatus(id, status, paymentIntentId);
    return result.data;
  },

  async updateTicketInventory(orderId) {
    // This is handled server-side in the edge function
    // Keeping the method for backward compatibility
    return true;
  },

  async calculateTotal(items, discountCodeId = null) {
    const result = await edgeFunctionHelpers.orders.calculateTotal(items, discountCodeId);
    return result;
  },
};

export default ordersAPI;
