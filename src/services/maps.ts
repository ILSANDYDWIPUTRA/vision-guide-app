// Google Maps Service
import { Loader } from '@googlemaps/js-api-loader';

const GOOGLE_MAPS_API_KEY = 'your-google-maps-api-key-here'; // MANUAL SETUP REQUIRED

export class GoogleMapsService {
  private loader: Loader;
  private map: google.maps.Map | null = null;
  private currentPositionMarker: google.maps.Marker | null = null;
  private destinationMarker: google.maps.Marker | null = null;

  constructor() {
    this.loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['places', 'geometry']
    });
  }

  async initializeMap(mapElement: HTMLElement): Promise<google.maps.Map> {
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'your-google-maps-api-key-here') {
      throw new Error('Google Maps API Key belum dikonfigurasi');
    }

    try {
      await this.loader.load();

      // Default to Jakarta coordinates
      const defaultCenter = { lat: -6.2088, lng: 106.8456 };

      this.map = new google.maps.Map(mapElement, {
        center: defaultCenter,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });

      return this.map;
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      throw error;
    }
  }

  updateCurrentPosition(lat: number, lng: number) {
    if (!this.map) return;

    const position = { lat, lng };

    // Update or create current position marker
    if (this.currentPositionMarker) {
      this.currentPositionMarker.setPosition(position);
    } else {
      this.currentPositionMarker = new google.maps.Marker({
        position,
        map: this.map,
        title: 'Posisi Tongkat Saat Ini',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="#ffffff" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" fill="#ffffff"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12)
        }
      });
    }

    // Center map on current position
    this.map.setCenter(position);
  }

  setDestination(lat: number, lng: number, title: string = 'Tujuan') {
    if (!this.map) return;

    const position = { lat, lng };

    // Update or create destination marker
    if (this.destinationMarker) {
      this.destinationMarker.setPosition(position);
      this.destinationMarker.setTitle(title);
    } else {
      this.destinationMarker = new google.maps.Marker({
        position,
        map: this.map,
        title,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#EF4444"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 32)
        }
      });
    }
  }

  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    if (!window.google) return 0;

    const pos1 = new google.maps.LatLng(lat1, lng1);
    const pos2 = new google.maps.LatLng(lat2, lng2);
    
    return google.maps.geometry.spherical.computeDistanceBetween(pos1, pos2);
  }

  calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    if (!window.google) return 0;

    const pos1 = new google.maps.LatLng(lat1, lng1);
    const pos2 = new google.maps.LatLng(lat2, lng2);
    
    return google.maps.geometry.spherical.computeHeading(pos1, pos2);
  }

  fitBounds(currentPos: {lat: number, lng: number}, destination: {lat: number, lng: number}) {
    if (!this.map) return;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(currentPos);
    bounds.extend(destination);
    
    this.map.fitBounds(bounds);
    
    // Ensure minimum zoom level
    const listener = google.maps.event.addListener(this.map, 'idle', () => {
      if (this.map!.getZoom()! > 16) {
        this.map!.setZoom(16);
      }
      google.maps.event.removeListener(listener);
    });
  }
}

export const mapsService = new GoogleMapsService();