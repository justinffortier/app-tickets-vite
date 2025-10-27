import { edgeFunctionHelpers } from '@src/utils/edgeFunctions';

export const eventsAPI = {
  async getAll(filters = {}) {
    const result = await edgeFunctionHelpers.events.getAll(filters);
    return result.data;
  },

  async getById(id) {
    const result = await edgeFunctionHelpers.events.getById(id);
    return result.data;
  },

  async create(eventData) {
    const result = await edgeFunctionHelpers.events.create(eventData);
    return result.data;
  },

  async update(id, eventData) {
    const result = await edgeFunctionHelpers.events.update(id, eventData);
    return result.data;
  },

  async delete(id) {
    await edgeFunctionHelpers.events.delete(id);
    return true;
  },

  async publish(id) {
    return this.update(id, { status: 'PUBLISHED' });
  },

  async unpublish(id) {
    return this.update(id, { status: 'DRAFT' });
  },
};

export default eventsAPI;
