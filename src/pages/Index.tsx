import { useState } from 'react';
import { NavigationForm } from '@/components/NavigationForm';
import { TrackingMap } from '@/components/TrackingMap';
import { BottomNavigation } from '@/components/BottomNavigation';
import { useNavigationService } from '@/services/navigation';
import { Eye } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'navigation' | 'tracking'>('navigation');
  const { navigationService } = useNavigationService();

  const handleDestinationSet = (lat: number, lng: number, address: string) => {
    // Switch to tracking tab after setting destination
    setActiveTab('tracking');
    
    // Announce destination set
    navigationService.announceDestinationSet(address);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
              <Eye className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Smart Stick Navigator</h1>
              <p className="text-sm text-muted-foreground">Aplikasi Navigasi Tongkat Tunanetra</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {activeTab === 'navigation' && (
          <NavigationForm onDestinationSet={handleDestinationSet} />
        )}
        
        {activeTab === 'tracking' && (
          <TrackingMap />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </div>
  );
};

export default Index;
