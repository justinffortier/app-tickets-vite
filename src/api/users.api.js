import firebase from 'firebase/compat/app';
import { edgeFunctionHelpers } from '@src/utils/edgeFunctions';

export const usersAPI = {
  async getAll(filters = {}) {
    const result = await edgeFunctionHelpers.users.getAll(filters);
    return result.data;
  },

  async getById(id) {
    const result = await edgeFunctionHelpers.users.getById(id);
    return result.data;
  },

  async getByFirebaseUid(firebaseUid) {
    const result = await edgeFunctionHelpers.users.getByFirebaseUid(firebaseUid);
    return result.data;
  },

  async create(userData) {
    const result = await edgeFunctionHelpers.users.create(userData);
    return result.data;
  },

  async update(id, userData) {
    const result = await edgeFunctionHelpers.users.update(id, userData);
    return result.data;
  },

  async delete(id) {
    await edgeFunctionHelpers.users.delete(id);
    return true;
  },

  async getOrganizations(userId) {
    const result = await edgeFunctionHelpers.users.getOrganizations(userId);
    return result.data;
  },

  async addToOrganization(userId, orgId, role = 'member') {
    const result = await edgeFunctionHelpers.users.addToOrganization(userId, orgId, role);
    return result.data;
  },

  async removeFromOrganization(userId, orgId) {
    await edgeFunctionHelpers.users.removeFromOrganization(userId, orgId);
    return true;
  },

  // Legacy method for backward compatibility
  async getFullUserWithToken() {
    const firebaseUser = firebase.auth().currentUser;
    if (!firebaseUser) return null;

    const user = await this.getByFirebaseUid(firebaseUser.uid);
    return user ? [user] : [];
  },
};

export default usersAPI;
