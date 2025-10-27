/**
 * Utility functions for calling Supabase Edge Functions
 */
import supabase from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Makes a request to a Supabase Edge Function
 * @param {string} functionName - Name of the edge function
 * @param {object} options - Request options
 * @param {string} options.method - HTTP method
 * @param {object} options.body - Request body
 * @param {object} options.headers - Additional headers
 * @returns {Promise<Response>} The response from the edge function
 */
export async function callEdgeFunction(functionName, options = {}) {
  const { method = 'GET', body, headers = {} } = options;

  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;

  const requestHeaders = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    ...headers,
  };

  // Add auth token if available
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      requestHeaders['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      // If no session, use the anon key as Authorization for edge functions
      requestHeaders['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
    }
  } catch (error) {
    // If there's no session, use anon key
    requestHeaders['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
  }

  const config = {
    method,
    headers: requestHeaders,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'An error occurred');
    }

    return data;
  } catch (error) {
    console.error(`Error calling edge function ${functionName}:`, error);
    throw error;
  }
}

/**
 * Edge function helpers for each resource
 */
export const edgeFunctionHelpers = {
  events: {
    getAll: (filters = {}) => callEdgeFunction('events', {
      method: 'POST',
      body: { action: 'getAll', filters },
    }),
    getById: (id) => callEdgeFunction('events', {
      method: 'POST',
      body: { action: 'getById', id },
    }),
    create: (data) => callEdgeFunction('events', {
      method: 'POST',
      body: { action: 'create', data },
    }),
    update: (id, data) => callEdgeFunction('events', {
      method: 'POST',
      body: { action: 'update', id, data },
    }),
    delete: (id) => callEdgeFunction('events', {
      method: 'POST',
      body: { action: 'delete', id },
    }),
  },

  users: {
    getAll: (filters = {}) => callEdgeFunction('users', {
      method: 'POST',
      body: { action: 'getAll', filters },
    }),
    getById: (id) => callEdgeFunction('users', {
      method: 'POST',
      body: { action: 'getById', id },
    }),
    getByFirebaseUid: (firebaseUid) => callEdgeFunction('users', {
      method: 'POST',
      body: { action: 'getByFirebaseUid', firebaseUid },
    }),
    create: (data) => callEdgeFunction('users', {
      method: 'POST',
      body: { action: 'create', data },
    }),
    update: (id, data) => callEdgeFunction('users', {
      method: 'POST',
      body: { action: 'update', id, data },
    }),
    delete: (id) => callEdgeFunction('users', {
      method: 'POST',
      body: { action: 'delete', id },
    }),
    getOrganizations: (userId) => callEdgeFunction('users', {
      method: 'POST',
      body: { action: 'getOrganizations', userId },
    }),
    addToOrganization: (userId, orgId, role) => callEdgeFunction('users', {
      method: 'POST',
      body: { action: 'addToOrganization', userId, orgId, role },
    }),
    removeFromOrganization: (userId, orgId) => callEdgeFunction('users', {
      method: 'POST',
      body: { action: 'removeFromOrganization', userId, orgId },
    }),
  },

  organizations: {
    getAll: (filters = {}) => callEdgeFunction('organizations', {
      method: 'POST',
      body: { action: 'getAll', filters },
    }),
    getById: (id) => callEdgeFunction('organizations', {
      method: 'POST',
      body: { action: 'getById', id },
    }),
    create: (data) => callEdgeFunction('organizations', {
      method: 'POST',
      body: { action: 'create', data },
    }),
    update: (id, data) => callEdgeFunction('organizations', {
      method: 'POST',
      body: { action: 'update', id, data },
    }),
    delete: (id) => callEdgeFunction('organizations', {
      method: 'POST',
      body: { action: 'delete', id },
    }),
    getUsers: (orgId) => callEdgeFunction('organizations', {
      method: 'POST',
      body: { action: 'getUsers', orgId },
    }),
    addUser: (orgId, userId, role) => callEdgeFunction('organizations', {
      method: 'POST',
      body: { action: 'addUser', orgId, userId, role },
    }),
    removeUser: (orgId, userId) => callEdgeFunction('organizations', {
      method: 'POST',
      body: { action: 'removeUser', orgId, userId },
    }),
  },

  tickets: {
    getByEventId: (eventId) => callEdgeFunction('tickets', {
      method: 'POST',
      body: { action: 'getByEventId', eventId },
    }),
    getById: (id) => callEdgeFunction('tickets', {
      method: 'POST',
      body: { action: 'getById', id },
    }),
    create: (data) => callEdgeFunction('tickets', {
      method: 'POST',
      body: { action: 'create', data },
    }),
    update: (id, data) => callEdgeFunction('tickets', {
      method: 'POST',
      body: { action: 'update', id, data },
    }),
    delete: (id) => callEdgeFunction('tickets', {
      method: 'POST',
      body: { action: 'delete', id },
    }),
    checkAvailability: (ticketTypeId, quantity) => callEdgeFunction('tickets', {
      method: 'POST',
      body: { action: 'checkAvailability', ticketTypeId, quantity },
    }),
  },

  orders: {
    getAll: (filters = {}) => callEdgeFunction('orders', {
      method: 'POST',
      body: { action: 'getAll', filters },
    }),
    getById: (id) => callEdgeFunction('orders', {
      method: 'POST',
      body: { action: 'getById', id },
    }),
    create: (data) => callEdgeFunction('orders', {
      method: 'POST',
      body: { action: 'create', data },
    }),
    updateStatus: (id, status, paymentIntentId) => callEdgeFunction('orders', {
      method: 'POST',
      body: { action: 'updateStatus', id, status, paymentIntentId },
    }),
    calculateTotal: (items, discountCodeId) => callEdgeFunction('orders', {
      method: 'POST',
      body: { action: 'calculateTotal', items, discountCodeId },
    }),
  },

  forms: {
    getAll: (filters = {}) => callEdgeFunction('forms', {
      method: 'POST',
      body: { action: 'getAll', filters },
    }),
    getById: (id) => callEdgeFunction('forms', {
      method: 'POST',
      body: { action: 'getById', id },
    }),
    create: (data) => callEdgeFunction('forms', {
      method: 'POST',
      body: { action: 'create', data },
    }),
    update: (id, data) => callEdgeFunction('forms', {
      method: 'POST',
      body: { action: 'update', id, data },
    }),
    delete: (id) => callEdgeFunction('forms', {
      method: 'POST',
      body: { action: 'delete', id },
    }),
    publish: (id) => callEdgeFunction('forms', {
      method: 'POST',
      body: { action: 'update', id, data: { is_published: true } },
    }),
    unpublish: (id) => callEdgeFunction('forms', {
      method: 'POST',
      body: { action: 'update', id, data: { is_published: false } },
    }),
    submitForm: (formId, responses, email) => callEdgeFunction('forms', {
      method: 'POST',
      body: { action: 'submitForm', formId, responses, email },
    }),
    getSubmissions: (formId) => callEdgeFunction('forms', {
      method: 'POST',
      body: { action: 'getSubmissions', formId },
    }),
  },

  discounts: {
    getByEventId: (eventId) => callEdgeFunction('discounts', {
      method: 'POST',
      body: { action: 'getByEventId', eventId },
    }),
    getById: (id) => callEdgeFunction('discounts', {
      method: 'POST',
      body: { action: 'getById', id },
    }),
    create: (data) => callEdgeFunction('discounts', {
      method: 'POST',
      body: { action: 'create', data },
    }),
    update: (id, data) => callEdgeFunction('discounts', {
      method: 'POST',
      body: { action: 'update', id, data },
    }),
    delete: (id) => callEdgeFunction('discounts', {
      method: 'POST',
      body: { action: 'delete', id },
    }),
    validateCode: (code, eventId) => callEdgeFunction('discounts', {
      method: 'POST',
      body: { action: 'validateCode', code, eventId },
    }),
    incrementUsage: (id) => callEdgeFunction('discounts', {
      method: 'POST',
      body: { action: 'incrementUsage', id },
    }),
  },
};

export default callEdgeFunction;

