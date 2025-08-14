// Google Geocoding Service
// NOTE: Untuk setup manual - tambahkan Google Maps API Key Anda

const GOOGLE_GEOCODING_API_KEY = 'your-google-maps-api-key-here'; // MANUAL SETUP REQUIRED

export interface GeocodeResult {
  lat: number;
  lng: number;
  address: string;
}

export const geocodingService = {
  // Convert address to coordinates
  addressToCoordinates: async (address: string): Promise<GeocodeResult> => {
    if (!GOOGLE_GEOCODING_API_KEY || GOOGLE_GEOCODING_API_KEY === 'your-google-maps-api-key-here') {
      throw new Error('Google Maps API Key belum dikonfigurasi');
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_GEOCODING_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const location = result.geometry.location;
        
        return {
          lat: location.lat,
          lng: location.lng,
          address: result.formatted_address
        };
      } else {
        throw new Error(`Geocoding failed: ${data.status}`);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  },

  // Convert coordinates to address (reverse geocoding)
  coordinatesToAddress: async (lat: number, lng: number): Promise<string> => {
    if (!GOOGLE_GEOCODING_API_KEY || GOOGLE_GEOCODING_API_KEY === 'your-google-maps-api-key-here') {
      throw new Error('Google Maps API Key belum dikonfigurasi');
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_GEOCODING_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      } else {
        throw new Error(`Reverse geocoding failed: ${data.status}`);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw error;
    }
  },

  // Validate coordinates format
  validateCoordinates: (input: string): { lat: number; lng: number } | null => {
    const coords = input.split(',').map(coord => parseFloat(coord.trim()));
    
    if (coords.length === 2 && 
        !isNaN(coords[0]) && !isNaN(coords[1]) &&
        coords[0] >= -90 && coords[0] <= 90 &&
        coords[1] >= -180 && coords[1] <= 180) {
      return { lat: coords[0], lng: coords[1] };
    }
    
    return null;
  }
};