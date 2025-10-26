import supabase from '@src/utils/supabase';

export const eventsAPI = {
  async getAll(filters = {}) {
    let query = supabase.from('events').select('*');

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('events')
      .select('*, ticket_types(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(eventData) {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('events')
      .insert({
        ...eventData,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, eventData) {
    const { data, error } = await supabase
      .from('events')
      .update({
        ...eventData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
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
