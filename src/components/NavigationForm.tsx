import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { geocodingService } from "@/services/geocoding";
import { firebaseService } from "@/services/firebase";

interface NavigationFormProps {
  onDestinationSet: (lat: number, lng: number, address: string) => void;
}

export const NavigationForm = ({ onDestinationSet }: NavigationFormProps) => {
  const [destination, setDestination] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSetDestination = async () => {
    if (!destination.trim()) {
      toast({
        title: "Error",
        description: "Mohon masukkan alamat atau koordinat tujuan",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      let lat: number, lng: number, address: string;

      // Check if input is coordinates (lat,lng format)
      const coords = geocodingService.validateCoordinates(destination);
      
      if (coords) {
        // Input is coordinates
        lat = coords.lat;
        lng = coords.lng;
        
        try {
          address = await geocodingService.coordinatesToAddress(lat, lng);
        } catch (error) {
          address = `${lat}, ${lng}`;
          console.warn('Reverse geocoding failed, using coordinates as address');
        }
      } else {
        // Input is address, convert to coordinates
        const result = await geocodingService.addressToCoordinates(destination);
        lat = result.lat;
        lng = result.lng;
        address = result.address;
      }

      // Save to Firebase
      await firebaseService.setDestination(lat, lng);

      // Notify parent component
      onDestinationSet(lat, lng, address);

      toast({
        title: "Tujuan Berhasil Diatur",
        description: `Tujuan: ${address}`,
        variant: "default"
      });

      // Clear input
      setDestination('');

    } catch (error) {
      console.error('Error setting destination:', error);
      
      let errorMessage = 'Gagal mengatur tujuan';
      if (error instanceof Error) {
        if (error.message.includes('API Key')) {
          errorMessage = 'Google Maps API Key belum dikonfigurasi';
        } else if (error.message.includes('Geocoding failed')) {
          errorMessage = 'Alamat tidak ditemukan, periksa ejaan alamat';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSetDestination();
    }
  };

  return (
    <div className="p-4 space-y-6">
      <Card className="shadow-lg border-0" style={{ boxShadow: 'var(--shadow-navigation)' }}>
        <CardHeader className="text-center bg-gradient-to-r from-primary to-primary-glow text-primary-foreground rounded-t-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Navigation className="h-6 w-6" />
            <CardTitle className="text-xl">Set Tujuan Navigasi</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="destination" className="text-sm font-medium">
              Alamat atau Koordinat Tujuan
            </Label>
            <Textarea
              id="destination"
              placeholder="Masukkan alamat (contoh: Jl. Sudirman No.1, Jakarta) atau koordinat (contoh: -6.2088, 106.8456)"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleSetDestination}
              disabled={isLoading || !destination.trim()}
              className="w-full h-12 text-base font-medium"
              variant="default"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Mengatur Tujuan...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-5 w-5" />
                  Set Tujuan
                </>
              )}
            </Button>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-sm">Format Input:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Alamat:</strong> Jl. Thamrin No.1, Jakarta</li>
              <li>• <strong>Koordinat:</strong> -6.2088, 106.8456</li>
              <li>• <strong>Tempat:</strong> Monas Jakarta</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-warning/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-warning rounded-full mt-2 flex-shrink-0"></div>
            <div className="text-sm">
              <p className="font-medium text-warning mb-1">Setup Manual Diperlukan:</p>
              <p className="text-muted-foreground leading-relaxed">
                Untuk menggunakan fitur geocoding, silakan tambahkan Google Maps API Key Anda 
                di file <code className="bg-muted px-1 rounded text-xs">src/services/geocoding.ts</code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};