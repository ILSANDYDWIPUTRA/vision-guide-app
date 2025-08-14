// Navigation & Speech Service
import { useSpeechSynthesis } from 'react-speech-kit';

export interface NavigationInstruction {
  type: 'straight' | 'left' | 'right' | 'arrived' | 'warning';
  message: string;
  distance?: number;
}

export class NavigationService {
  private previousBearing: number = 0;
  private hasSpokenDestinationReached: boolean = false;

  constructor(private speak: (text: string) => void) {}

  calculateNavigationInstruction(
    currentLat: number,
    currentLng: number,
    destLat: number,
    destLng: number,
    distance: number
  ): NavigationInstruction {
    // Reset arrival flag if distance is significant
    if (distance > 20) {
      this.hasSpokenDestinationReached = false;
    }

    // Check if arrived (within 10 meters)
    if (distance <= 10) {
      if (!this.hasSpokenDestinationReached) {
        this.hasSpokenDestinationReached = true;
        return {
          type: 'arrived',
          message: 'Tujuan tercapai! Anda telah sampai di lokasi tujuan.',
          distance
        };
      }
      return {
        type: 'arrived',
        message: 'Anda sudah di tujuan',
        distance
      };
    }

    // Calculate bearing to destination
    const bearing = this.calculateBearing(currentLat, currentLng, destLat, destLng);
    const bearingDiff = this.normalizeBearing(bearing - this.previousBearing);

    let instruction: NavigationInstruction;

    // Determine direction based on bearing difference
    if (Math.abs(bearingDiff) < 30) {
      instruction = {
        type: 'straight',
        message: `Lurus terus. Jarak ${Math.round(distance)} meter ke tujuan.`,
        distance
      };
    } else if (bearingDiff > 30) {
      instruction = {
        type: 'right',
        message: `Belok kanan. Jarak ${Math.round(distance)} meter ke tujuan.`,
        distance
      };
    } else {
      instruction = {
        type: 'left',
        message: `Belok kiri. Jarak ${Math.round(distance)} meter ke tujuan.`,
        distance
      };
    }

    this.previousBearing = bearing;
    return instruction;
  }

  private calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;

    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  }

  private normalizeBearing(bearing: number): number {
    while (bearing > 180) bearing -= 360;
    while (bearing < -180) bearing += 360;
    return bearing;
  }

  speakInstruction(instruction: NavigationInstruction) {
    this.speak(instruction.message);
  }

  // Voice announcement for destination setting
  announceDestinationSet(address: string) {
    this.speak(`Tujuan telah diatur ke ${address}. Silakan mulai perjalanan.`);
  }

  // Warning announcements
  announceWarning(message: string) {
    this.speak(`Peringatan: ${message}`);
  }
}

// React hook for navigation
export const useNavigationService = () => {
  const { speak, cancel, speaking } = useSpeechSynthesis();

  const navigationService = new NavigationService((text: string) => {
    cancel(); // Cancel any ongoing speech
    speak({ text, rate: 0.8, pitch: 1, volume: 1 });
  });

  return {
    navigationService,
    speaking,
    cancel
  };
};