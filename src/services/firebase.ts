// Firebase Configuration & Services
// NOTE: Untuk setup manual - ganti dengan config Firebase Anda
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push } from 'firebase/database';

// MANUAL SETUP REQUIRED - Ganti dengan config Firebase Anda
const firebaseConfig = {
  // Isi dengan config Firebase Anda
  apiKey: "your-api-key-here",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Firebase Database Paths
export const DB_PATHS = {
  tracking: {
    current_lat: 'tracking/current_lat',
    current_lng: 'tracking/current_lng'
  },
  navigation: {
    destination_lat: 'navigation/destination_lat',
    destination_lng: 'navigation/destination_lng'
  }
};

// Type definitions
export interface TrackingData {
  current_lat: number;
  current_lng: number;
}

export interface NavigationData {
  destination_lat: number;
  destination_lng: number;
}

// Firebase Database Services
export const firebaseService = {
  // Set destination coordinates
  setDestination: async (lat: number, lng: number) => {
    try {
      await set(ref(database, DB_PATHS.navigation.destination_lat), lat);
      await set(ref(database, DB_PATHS.navigation.destination_lng), lng);
      console.log('Destination set:', { lat, lng });
    } catch (error) {
      console.error('Error setting destination:', error);
      throw error;
    }
  },

  // Listen to current position updates
  listenToCurrentPosition: (callback: (data: TrackingData) => void) => {
    const latRef = ref(database, DB_PATHS.tracking.current_lat);
    const lngRef = ref(database, DB_PATHS.tracking.current_lng);

    let currentData: Partial<TrackingData> = {};

    const updateData = () => {
      if (currentData.current_lat !== undefined && currentData.current_lng !== undefined) {
        callback(currentData as TrackingData);
      }
    };

    const unsubscribeLat = onValue(latRef, (snapshot) => {
      currentData.current_lat = snapshot.val() || 0;
      updateData();
    });

    const unsubscribeLng = onValue(lngRef, (snapshot) => {
      currentData.current_lng = snapshot.val() || 0;
      updateData();
    });

    // Return unsubscribe function
    return () => {
      unsubscribeLat();
      unsubscribeLng();
    };
  },

  // Listen to destination updates
  listenToDestination: (callback: (data: NavigationData) => void) => {
    const latRef = ref(database, DB_PATHS.navigation.destination_lat);
    const lngRef = ref(database, DB_PATHS.navigation.destination_lng);

    let destinationData: Partial<NavigationData> = {};

    const updateData = () => {
      if (destinationData.destination_lat !== undefined && destinationData.destination_lng !== undefined) {
        callback(destinationData as NavigationData);
      }
    };

    const unsubscribeLat = onValue(latRef, (snapshot) => {
      destinationData.destination_lat = snapshot.val() || 0;
      updateData();
    });

    const unsubscribeLng = onValue(lngRef, (snapshot) => {
      destinationData.destination_lng = snapshot.val() || 0;
      updateData();
    });

    return () => {
      unsubscribeLat();
      unsubscribeLng();
    };
  },

  // Test connection
  testConnection: async () => {
    try {
      await set(ref(database, 'test'), new Date().toISOString());
      return true;
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      return false;
    }
  }
};