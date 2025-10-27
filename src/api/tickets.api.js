import { edgeFunctionHelpers } from '@src/utils/edgeFunctions';

export const ticketsAPI = {
  async getByEventId(eventId) {
    const result = await edgeFunctionHelpers.tickets.getByEventId(eventId);
    return result.data;
  },

  async getById(id) {
    const result = await edgeFunctionHelpers.tickets.getById(id);
    return result.data;
  },

  async create(ticketData) {
    const result = await edgeFunctionHelpers.tickets.create(ticketData);
    return result.data;
  },

  async update(id, ticketData) {
    const result = await edgeFunctionHelpers.tickets.update(id, ticketData);
    return result.data;
  },

  async delete(id) {
    await edgeFunctionHelpers.tickets.delete(id);
    return true;
  },

  async checkAvailability(ticketTypeId, quantity) {
    const result = await edgeFunctionHelpers.tickets.checkAvailability(ticketTypeId, quantity);
    return result;
  },
};

export default ticketsAPI;
