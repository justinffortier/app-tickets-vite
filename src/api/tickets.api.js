import supabase from '@src/utils/supabase';

export const ticketsAPI = {
  async getByEventId(eventId) {
    const { data, error } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(ticketData) {
    const { data, error } = await supabase
      .from('ticket_types')
      .insert(ticketData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, ticketData) {
    const { data, error } = await supabase
      .from('ticket_types')
      .update({
        ...ticketData,
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
      .from('ticket_types')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async checkAvailability(ticketTypeId, quantity) {
    const { data, error } = await supabase
      .from('ticket_types')
      .select('quantity, sold')
      .eq('id', ticketTypeId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Ticket type not found');

    const available = data.quantity - data.sold;
    return {
      available,
      canPurchase: available >= quantity,
    };
  },
};

export default ticketsAPI;
