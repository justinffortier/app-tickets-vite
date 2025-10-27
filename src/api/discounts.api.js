import { edgeFunctionHelpers } from '@src/utils/edgeFunctions';

export const discountsAPI = {
  async getByEventId(eventId) {
    const result = await edgeFunctionHelpers.discounts.getByEventId(eventId);
    return result.data;
  },

  async getById(id) {
    const result = await edgeFunctionHelpers.discounts.getById(id);
    return result.data;
  },

  async create(discountData) {
    const result = await edgeFunctionHelpers.discounts.create(discountData);
    return result.data;
  },

  async update(id, discountData) {
    const result = await edgeFunctionHelpers.discounts.update(id, discountData);
    return result.data;
  },

  async delete(id) {
    await edgeFunctionHelpers.discounts.delete(id);
    return true;
  },

  async validateCode(code, eventId) {
    const result = await edgeFunctionHelpers.discounts.validateCode(code, eventId);
    return result;
  },

  async incrementUsage(id) {
    const result = await edgeFunctionHelpers.discounts.incrementUsage(id);
    return result.data;
  },
};

export default discountsAPI;
