import { Signal } from '@fyclabs/tools-fyc-react/signals';
import formsAPI from '@src/api/forms.api';
import { showToast } from '@src/components/global/Alert/_helpers/alert.events';
import { $forms } from '@src/signals';
import { $formsView } from './formsManager.consts';

export const $formManagerForm = Signal({
  name: '',
  description: '',
  available_ticket_ids: [],
  schema: [],
  is_published: false,
  show_title: true,
  show_description: true,
  theme: 'light',
});

export const $formManagerUI = Signal({
  showModal: false,
  showEmbedModal: false,
  editingForm: null,
  embedCode: '',
});

export const $currentFormField = Signal({
  type: 'text',
  label: '',
  placeholder: '',
  required: false,
  options: [],
});

export const loadForms = async (eventId) => {
  try {
    $forms.loadingStart();
    $formsView.update({ isTableLoading: true });
    const data = await formsAPI.getAll({ event_id: eventId });
    $forms.update({ list: data || [] });
  } catch (error) {
    console.error('Error loading forms:', error);
    showToast('Error loading forms', 'error');
  } finally {
    $forms.loadingEnd();
    $formsView.update({ isTableLoading: false });
  }
};

export const handleOpenModal = (form = null) => {
  if (form) {
    $formManagerForm.update({
      name: form.name,
      description: form.description || '',
      available_ticket_ids: form.available_ticket_ids || [],
      schema: form.schema || [],
      is_published: form.is_published || false,
      show_title: form.show_title !== undefined ? form.show_title : true,
      show_description: form.show_description !== undefined ? form.show_description : true,
      theme: form.theme || 'light',
    });
    $formManagerUI.update({
      showModal: true,
      editingForm: form,
    });
  } else {
    $formManagerForm.reset();
    $formManagerUI.update({
      showModal: true,
      editingForm: null,
    });
  }
};

export const handleCloseModal = () => {
  $formManagerUI.update({
    showModal: false,
    editingForm: null,
  });
  $formManagerForm.reset();
  $currentFormField.reset();
};

export const handleChange = (e) => {
  const { name, value, type, checked } = e.target;
  const newValue = type === 'checkbox' ? checked : value;
  console.log('handleChange called:', { name, value, type, checked, newValue });
  console.log('Before update:', $formManagerForm.value);

  // Try setting the entire object to force reactivity
  $formManagerForm.value = {
    ...$formManagerForm.value,
    [name]: newValue,
  };
  console.log('After update:', $formManagerForm.value);
};

export const handleTicketSelection = (ticketId) => {
  const currentIds = $formManagerForm.value.available_ticket_ids;
  const isSelected = currentIds.includes(ticketId);
  console.log('handleTicketSelection called:', { ticketId, currentIds, isSelected });

  const newIds = isSelected
    ? currentIds.filter(id => id !== ticketId)
    : [...currentIds, ticketId];

  // Try setting the entire object to force reactivity
  $formManagerForm.value = {
    ...$formManagerForm.value,
    available_ticket_ids: newIds,
  };
  console.log('After ticket update:', $formManagerForm.value.available_ticket_ids);
};

export const handleFieldChange = (e) => {
  const { name, value, type: inputType, checked } = e.target;
  const newValue = inputType === 'checkbox' ? checked : value;

  // Try setting the entire object to force reactivity
  $currentFormField.value = {
    ...$currentFormField.value,
    [name]: newValue,
  };
};

export const handleOptionsChange = (value) => {
  const options = value.split('\n').filter((opt) => opt.trim());
  $currentFormField.value = {
    ...$currentFormField.value,
    options,
  };
};

export const handleAddField = () => {
  const currentField = $currentFormField.value;

  if (!currentField.label) {
    showToast('Please enter a field label', 'error');
    return;
  }

  const currentSchema = $formManagerForm.value.schema;
  $formManagerForm.value = {
    ...$formManagerForm.value,
    schema: [...currentSchema, currentField],
  };

  $currentFormField.reset();
};

export const handleEditField = (index) => {
  const fields = $formManagerForm.value.schema;
  $currentFormField.value = fields[index];

  // Remove the field temporarily - will be re-added on "Add Field"
  const newSchema = fields.filter((_, i) => i !== index);
  $formManagerForm.value = {
    ...$formManagerForm.value,
    schema: newSchema,
  };
};

export const handleDeleteField = (index) => {
  const fields = $formManagerForm.value.schema.filter((_, i) => i !== index);
  $formManagerForm.value = {
    ...$formManagerForm.value,
    schema: fields,
  };
};

export const moveField = (fromIndex, toIndex) => {
  const newFields = [...$formManagerForm.value.schema];
  const [removed] = newFields.splice(fromIndex, 1);
  newFields.splice(toIndex, 0, removed);
  $formManagerForm.value = {
    ...$formManagerForm.value,
    schema: newFields,
  };
};

export const handleSubmit = async (e, eventId, onUpdate) => {
  e.preventDefault();

  const formData = $formManagerForm.value;

  if (!formData.name) {
    showToast('Please enter a form name', 'error');
    return;
  }

  try {
    $formManagerForm.loadingStart();

    const submitData = {
      name: formData.name,
      description: formData.description,
      event_id: eventId,
      available_ticket_ids: formData.available_ticket_ids,
      schema: formData.schema,
      is_published: formData.is_published,
      show_title: formData.show_title,
      show_description: formData.show_description,
      theme: formData.theme,
    };

    const { editingForm } = $formManagerUI.value;

    if (editingForm) {
      await formsAPI.update(editingForm.id, submitData);
      showToast('Form updated successfully', 'success');
    } else {
      // Add created_by field when creating a new form
      const { $user } = await import('@src/signals');
      const userData = $user.value;
      if (userData?.id) {
        submitData.created_by = userData.id;
      } else {
        throw new Error('User not authenticated. Please log in and try again.');
      }

      await formsAPI.create(submitData);
      showToast('Form created successfully', 'success');
    }

    handleCloseModal();
    if (onUpdate) await onUpdate();
  } catch (error) {
    showToast(error.message || 'Error saving form', 'error');
  } finally {
    $formManagerForm.loadingEnd();
  }
};

export const handleDelete = async (formId, eventId) => {
  if (!confirm('Are you sure you want to delete this form?')) {
    return;
  }

  try {
    await formsAPI.delete(formId);
    showToast('Form deleted successfully', 'success');
    await loadForms(eventId);
  } catch (error) {
    showToast('Error deleting form', 'error');
  }
};

export const handlePublish = async (formId, isPublished, eventId) => {
  try {
    if (isPublished) {
      await formsAPI.unpublish(formId);
      showToast('Form unpublished', 'success');
    } else {
      await formsAPI.publish(formId);
      showToast('Form published', 'success');
    }
    await loadForms(eventId);
  } catch (error) {
    showToast('Error updating form status', 'error');
  }
};

export const handleShowEmbed = (formId) => {
  const embedCode = `<iframe 
  src="${window.location.origin}/embed/form/${formId}" 
  width="100%" 
  height="800"
  frameborder="0"
  style="border: none; border-radius: 8px;">
</iframe>`;

  $formManagerUI.update({
    showEmbedModal: true,
    embedCode,
  });
};

export const handleCloseEmbedModal = () => {
  $formManagerUI.update({
    showEmbedModal: false,
    embedCode: '',
  });
};

export const handleCopyEmbed = () => {
  const { embedCode } = $formManagerUI.value;
  navigator.clipboard.writeText(embedCode);
  showToast('Embed code copied to clipboard', 'success');
};
