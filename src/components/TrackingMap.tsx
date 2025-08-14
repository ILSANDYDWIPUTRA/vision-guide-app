import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Volume2, VolumeX, Loader2 } from "lucide-react";
import { mapsService } from "@/services/maps";
import { firebaseService, TrackingData, NavigationData } from "@/services/firebase";
import { useNavigationService } from "@/services/navigation";
import { useToast } from "@/hooks/use-toast";

export const TrackingMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<TrackingData | null>(null);
  const [destination, setDestination] = useState<NavigationData | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [lastInstruction, setLastInstruction] = useState<string>('');

  const { navigationService, speaking, cancel } = useNavigationService();
  const { toast } = useToast();

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        await mapsService.initializeMap(mapRef.current);
        setIsMapLoaded(true);
        
        toast({
          title: "Map Berhasil Dimuat",
          description: "Peta Google Maps siap digunakan",
        });
      } catch (error) {
        console.error('Error initializing map:', error);
        
        let errorMessage = 'Gagal memuat peta';
        if (error instanceof Error && error.message.includes('API Key')) {
          errorMessage = 'Google Maps API Key belum dikonfigurasi';
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    };

    initMap();
  }, [toast]);

  // Listen to Firebase real-time data
  useEffect(() => {
    // Listen to current position updates
    const unsubscribePosition = firebaseService.listenToCurrentPosition((data) => {
      setCurrentPosition(data);
      if (isMapLoaded) {
        mapsService.updateCurrentPosition(data.current_lat, data.current_lng);
      }
    });

    // Listen to destination updates
    const unsubscribeDestination = firebaseService.listenToDestination((data) => {
      setDestination(data);
      if (isMapLoaded) {
        mapsService.setDestination(data.destination_lat, data.destination_lng);
        
        // Fit bounds if both positions are available
        if (currentPosition) {
          mapsService.fitBounds(
            { lat: currentPosition.current_lat, lng: currentPosition.current_lng },
            { lat: data.destination_lat, lng: data.destination_lng }
          );
        }
      }
    });

    return () => {
      unsubscribePosition();
      unsubscribeDestination();
    };
  }, [isMapLoaded, currentPosition]);

  // Calculate distance and provide navigation instructions
  useEffect(() => {
    if (!currentPosition || !destination) return;

    const dist = mapsService.calculateDistance(
      currentPosition.current_lat,
      currentPosition.current_lng,
      destination.destination_lat,
      destination.destination_lng
    );

    setDistance(dist);

    // Generate navigation instruction
    const instruction = navigationService.calculateNavigationInstruction(
      currentPosition.current_lat,
      currentPosition.current_lng,
      destination.destination_lat,
      destination.destination_lng,
      dist
    );

    // Update last instruction
    if (instruction.message !== lastInstruction) {
      setLastInstruction(instruction.message);
      
      // Speak instruction if enabled
      if (isSpeechEnabled) {
        navigationService.speakInstruction(instruction);
      }
    }
  }, [currentPosition, destination, navigationService, isSpeechEnabled, lastInstruction]);

  const toggleSpeech = () => {
    if (speaking) {
      cancel();
    }
    setIsSpeechEnabled(!isSpeechEnabled);
  };

  const getDistanceText = () => {
    if (distance < 1000) {
      return `${Math.round(distance)} meter`;
    } else {
      return `${(distance / 1000).toFixed(1)} km`;
    }
  };

  const getStatusBadge = () => {
    if (!currentPosition || !destination) {
      return <Badge variant="secondary">Menunggu Data</Badge>;
    }
    
    if (distance <= 10) {
      return <Badge className="bg-accent text-accent-foreground">Tiba di Tujuan</Badge>;
    } else if (distance <= 50) {
      return <Badge className="bg-warning text-warning-foreground">Mendekati Tujuan</Badge>;
    } else {
      return <Badge variant="default">Dalam Perjalanan</Badge>;
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-navigation-marker" />
              Status Tracking
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Jarak ke Tujuan</p>
              <p className="font-medium text-lg">{currentPosition && destination ? getDistanceText() : '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Posisi Saat Ini</p>
              <p className="font-medium">
                {currentPosition 
                  ? `${currentPosition.current_lat.toFixed(6)}, ${currentPosition.current_lng.toFixed(6)}`
                  : 'Menunggu...'
                }
              </p>
            </div>
          </div>
          
          {lastInstruction && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Instruksi Terakhir:</p>
              <p className="font-medium">{lastInstruction}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voice Control */}
      <div className="flex justify-center">
        <Button
          onClick={toggleSpeech}
          variant={isSpeechEnabled ? "default" : "outline"}
          size="lg"
          className="min-w-[200px]"
        >
          {isSpeechEnabled ? (
            <>
              <Volume2 className="mr-2 h-5 w-5" />
              Suara: Aktif
            </>
          ) : (
            <>
              <VolumeX className="mr-2 h-5 w-5" />
              Suara: Nonaktif
            </>
          )}
        </Button>
      </div>

      {/* Map Card */}
      <Card className="overflow-hidden" style={{ boxShadow: 'var(--shadow-map)' }}>
        <CardHeader className="bg-gradient-to-r from-navigation-primary to-navigation-accent text-white">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Peta Real-Time
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative">
            <div 
              ref={mapRef} 
              className="w-full h-[400px] bg-muted flex items-center justify-center"
            >
              {!isMapLoaded && (
                <div className="text-center space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground">Memuat Google Maps...</p>
                </div>
              )}
            </div>
            
            {isMapLoaded && (!currentPosition || !destination) && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-card p-4 rounded-lg text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm font-medium">Menunggu data dari Firebase...</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pastikan tongkat terhubung dan tujuan sudah diatur
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Warning */}
      <Card className="bg-card/50 border-warning/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-warning rounded-full mt-2 flex-shrink-0"></div>
            <div className="text-sm">
              <p className="font-medium text-warning mb-1">Setup Manual Diperlukan:</p>
              <p className="text-muted-foreground leading-relaxed">
                Tambahkan Google Maps API Key di file <code className="bg-muted px-1 rounded text-xs">src/services/maps.ts</code> 
                dan konfigurasi Firebase di <code className="bg-muted px-1 rounded text-xs">src/services/firebase.ts</code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};