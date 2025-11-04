import React, { useRef, useState, useEffect } from 'react';
import { Form } from 'react-bootstrap';
import { getConfig } from '@src/config/config';

/**
 * GooglePlacesAutocomplete Component
 * Uses the NEW Google Places API with Place Autocomplete widget
 * This is the modern, recommended approach by Google
 *
 * @param {Object} signal - The parent signal to update with location data
 * @param {string} name - The field name (used for signal updates)
 * @param {string} value - The current location value
 * @param {boolean} required - Whether the field is required
 * @param {string} placeholder - Placeholder text
 */
function GooglePlacesAutocomplete({
  signal,
  name = 'location',
  value = '',
  required = false,
  placeholder = 'Enter a location',
}) {
  const autocompleteWidgetRef = useRef(null);
  const [inputValue, setInputValue] = useState(value);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const apiKey = getConfig('GOOGLE_MAPS_API_KEY');

  // Load Google Maps Script
  useEffect(() => {
    if (!apiKey) {
      console.warn('Google Maps API key not configured. Set VITE_GOOGLE_MAPS_API_KEY in your environment.');
      setLoadError(true);
      return;
    }

    console.log('Loading Google Maps with API key:', apiKey ? 'API key present' : 'No API key');

    // Function to check if Places API with extended library is ready
    const checkPlacesReady = () => {
      if (window.google && window.google.maps && window.google.maps.places &&
        (window.google.maps.places.Autocomplete || window.google.maps.places.PlaceAutocompleteElement)) {
        console.log('Google Maps Places API is ready');
        setIsLoaded(true);
        return true;
      }
      return false;
    };

    // Check if Google Maps is already loaded
    if (checkPlacesReady()) {
      console.log('Google Maps already loaded');
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('Google Maps script already exists, waiting for load...');
      // Poll for Places API to be ready
      const pollInterval = setInterval(() => {
        if (checkPlacesReady()) {
          clearInterval(pollInterval);
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(pollInterval);
        if (!checkPlacesReady()) {
          console.error('Timeout waiting for Google Maps Places API');
          setLoadError(true);
        }
      }, 10000);
      return;
    }

    // Create a unique callback name
    const callbackName = `initGoogleMaps_${Date.now()}`;

    // Define the callback
    window[callbackName] = () => {
      console.log('Google Maps callback triggered');
      // Wait a bit for places library to fully initialize
      setTimeout(() => {
        if (checkPlacesReady()) {
          console.log('Google Maps script loaded successfully');
        } else {
          console.error('Places API not available after callback');
          setLoadError(true);
        }
      }, 100);
    };

    // Load the Google Maps script with callback and extended library
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = (error) => {
      console.error('Error loading Google Maps script:', error);
      setLoadError(true);
      delete window[callbackName];
    };

    document.head.appendChild(script);

    // eslint-disable-next-line consistent-return
    return () => {
      // Cleanup callback
      delete window[callbackName];
    };
  }, [apiKey]);

  // Initialize autocomplete widget when loaded
  useEffect(() => {
    if (!isLoaded || !autocompleteWidgetRef.current || !window.google) {
      console.log('Autocomplete initialization skipped:', {
        isLoaded,
        hasWidgetRef: !!autocompleteWidgetRef.current,
        hasGoogle: !!window.google,
      });
      return;
    }

    console.log('Initializing Google Places Autocomplete...');

    try {
      const input = autocompleteWidgetRef.current.querySelector('input');

      if (!input) {
        console.error('Input element not found in widget');
        return;
      }

      // Initialize the Autocomplete using standard API (which works with both old and new)
      const autocomplete = new window.google.maps.places.Autocomplete(input, {
        fields: ['formatted_address', 'geometry', 'place_id', 'name'],
        types: ['establishment', 'geocode'],
      });

      console.log('Autocomplete initialized successfully');

      // Add place_changed listener
      autocomplete.addListener('place_changed', () => {
        console.log('Place changed event triggered');
        const place = autocomplete.getPlace();
        console.log('Selected place:', place);

        if (place && place.formatted_address && place.geometry) {
          setInputValue(place.formatted_address);

          // Update the parent signal with all location fields
          if (signal) {
            signal.update({
              location: place.formatted_address,
              location_lat: place.geometry.location.lat(),
              location_lng: place.geometry.location.lng(),
              location_place_id: place.place_id || '',
            });
          }
        }
      });
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
      setLoadError(true);
    }
  }, [isLoaded, signal]);

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Update signal with just the text value
    // (lat/lng/place_id will be set when a place is selected)
    if (signal) {
      signal.update({
        location: newValue,
        location_lat: null,
        location_lng: null,
        location_place_id: null,
      });
    }
  };

  // Fallback to regular input if Google Maps fails to load or no API key
  if (loadError || !apiKey) {
    return (
      <Form.Control
        type="text"
        name={name}
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
      />
    );
  }

  // Show loading state
  if (!isLoaded) {
    return (
      <Form.Control
        type="text"
        placeholder="Loading..."
        disabled
      />
    );
  }

  return (
    <div ref={autocompleteWidgetRef}>
      <Form.Control
        type="text"
        name={name}
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

export default GooglePlacesAutocomplete;
