import { Signal } from '@fyclabs/tools-fyc-react/signals';

// Signals for table filtering and pagination
export const $formsFilter = Signal({
  page: 1,
  sortKey: undefined,
  sortDirection: undefined,
});

// Signals for table UI state
export const $formsView = Signal({
  isTableLoading: false,
  selectedItems: [],
  isSelectAllChecked: false,
});
