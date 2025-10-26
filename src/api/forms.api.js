import supabase from '@src/utils/supabase';

export const formsAPI = {
  async getAll(filters = {}) {
    let query = supabase.from('forms').select('*, events(title)');

    if (filters.event_id) {
      query = query.eq('event_id', filters.event_id);
    }

    if (filters.is_published !== undefined) {
      query = query.eq('is_published', filters.is_published);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('forms')
      .select('*, events(title, id)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(formData) {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('forms')
      .insert({
        ...formData,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, formData) {
    const { data, error } = await supabase
      .from('forms')
      .update({
        ...formData,
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
      .from('forms')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async publish(id) {
    return this.update(id, { is_published: true });
  },

  async unpublish(id) {
    return this.update(id, { is_published: false });
  },

  async submitForm(formId, responses, email = null) {
    const { data, error } = await supabase
      .from('form_submissions')
      .insert({
        form_id: formId,
        responses,
        email,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSubmissions(formId) {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*, orders(*)')
      .eq('form_id', formId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};

export default formsAPI;
