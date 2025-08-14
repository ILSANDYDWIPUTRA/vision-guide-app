import { Navigation, Map } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  activeTab: 'navigation' | 'tracking';
  onTabChange: (tab: 'navigation' | 'tracking') => void;
}

export const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
      <div className="flex">
        <button
          onClick={() => onTabChange('navigation')}
          className={cn(
            "flex-1 flex flex-col items-center py-3 px-4 transition-colors",
            activeTab === 'navigation'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Navigation className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">Navigation</span>
        </button>
        
        <button
          onClick={() => onTabChange('tracking')}
          className={cn(
            "flex-1 flex flex-col items-center py-3 px-4 transition-colors",
            activeTab === 'tracking'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Map className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">Tracking</span>
        </button>
      </div>
    </div>
  );
};