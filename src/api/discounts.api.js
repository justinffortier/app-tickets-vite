import supabase from '@src/utils/supabase';

export const discountsAPI = {
  async getByEventId(eventId) {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(discountData) {
    const { data, error } = await supabase
      .from('discount_codes')
      .insert(discountData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, discountData) {
    const { data, error } = await supabase
      .from('discount_codes')
      .update(discountData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('discount_codes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async validateCode(code, eventId) {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('event_id', eventId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return { valid: false, error: 'Invalid discount code' };
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { valid: false, error: 'Discount code has expired' };
    }

    if (data.max_uses && data.used_count >= data.max_uses) {
      return { valid: false, error: 'Discount code has reached maximum uses' };
    }

    return { valid: true, discount: data };
  },

  async incrementUsage(id) {
    const { data, error } = await supabase.rpc('increment_discount_usage', {
      discount_id: id,
    });

    if (error) throw error;
    return data;
  },
};

export default discountsAPI;
