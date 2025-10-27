import { edgeFunctionHelpers } from '@src/utils/edgeFunctions';

export const organizationsAPI = {
  async getAll(filters = {}) {
    const result = await edgeFunctionHelpers.organizations.getAll(filters);
    return result.data;
  },

  async getById(id) {
    const result = await edgeFunctionHelpers.organizations.getById(id);
    return result.data;
  },

  async create(orgData) {
    const result = await edgeFunctionHelpers.organizations.create(orgData);
    return result.data;
  },

  async update(id, orgData) {
    const result = await edgeFunctionHelpers.organizations.update(id, orgData);
    return result.data;
  },

  async delete(id) {
    await edgeFunctionHelpers.organizations.delete(id);
    return true;
  },

  async getUsers(orgId) {
    const result = await edgeFunctionHelpers.organizations.getUsers(orgId);
    return result.data;
  },

  async addUser(orgId, userId, role = 'member') {
    const result = await edgeFunctionHelpers.organizations.addUser(orgId, userId, role);
    return result.data;
  },

  async removeUser(orgId, userId) {
    await edgeFunctionHelpers.organizations.removeUser(orgId, userId);
    return true;
  },
};

export default organizationsAPI;
