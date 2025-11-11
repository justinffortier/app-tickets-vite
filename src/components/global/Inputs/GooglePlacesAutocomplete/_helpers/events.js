import { $selectedPlace } from './consts';

/**
 * Handle place selection from autocomplete
 * @param {Object} place - The place object from Google Places API
 * @param {Function} onChange - Callback to update parent signal
 */
export const handlePlaceSelect = (place, onChange) => {
  if (!place || !place.geometry) {
    console.warn('No place selected or place has no geometry');
    return;
  }

  const locationData = {
    location: place.formatted_address || '',
    location_lat: place.geometry.location.lat(),
    location_lng: place.geometry.location.lng(),
    location_place_id: place.place_id || '',
  };

  $selectedPlace.value = locationData;

  // Call parent onChange with the location data
  if (onChange) {
    onChange(locationData);
  }
};

/**
 * Handle manual input changes (when user types without selecting)
 * @param {string} value - The input value
 * @param {Function} onChange - Callback to update parent signal
 */
export const handleInputChange = (value, onChange) => {
  if (onChange) {
    onChange({
      location: value,
      location_lat: null,
      location_lng: null,
      location_place_id: null,
    });
  }
};
