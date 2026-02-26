import { useState } from 'react';
import '@/App.css';
import Sidebar from '@/components/layout/Sidebar';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import SKUConfiguration from '@/components/sku/SKUConfiguration';
import SKUGenerator from '@/components/sku/SKUGenerator';
import ProductsCatalog from '@/components/products/ProductsCatalog';
import Manufacturing from '@/components/manufacturing/Manufacturing';
import Production from '@/components/production/Production';
import Inventory from '@/components/inventory/Inventory';
import MigrationViewer from '@/components/migrations/MigrationViewer';
import ERDiagram from '@/components/schema/ERDiagram';
import ProductionTracker from '@/components/tracker/ProductionTracker';
import ArtisanView from '@/components/tracker/ArtisanView';

const pages = {
  'dashboard': DashboardOverview,
  'control-tower': ProductionTracker,
  'sku-config': SKUConfiguration,
  'products': ProductsCatalog,
  'sku-generator': SKUGenerator,
  'manufacturing': Manufacturing,
  'production': Production,
  'inventory': Inventory,
  'er-diagram': ERDiagram,
  'migrations': MigrationViewer,
};

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarWidth, setSidebarWidth] = useState(256);

  // Artisan portal gets special treatment - wraps with back button
  if (activePage === 'artisan-portal') {
    return (
      <div className="min-h-screen bg-[#050505]">
        <Sidebar activePage={activePage} onNavigate={setActivePage} onWidthChange={setSidebarWidth} />
        <main style={{ marginLeft: sidebarWidth }} className="min-h-screen transition-all duration-300">
          <div className="p-6 md:p-10 max-w-[1600px]">
            <ArtisanView onBack={() => setActivePage('control-tower')} />
          </div>
        </main>
      </div>
    );
  }

  const PageComponent = pages[activePage] || DashboardOverview;

  return (
    <div className="min-h-screen bg-[#050505]">
      <Sidebar activePage={activePage} onNavigate={setActivePage} onWidthChange={setSidebarWidth} />
      <main style={{ marginLeft: sidebarWidth }} className="min-h-screen transition-all duration-300">
        <div className="p-6 md:p-10 max-w-[1600px]">
          <PageComponent />
        </div>
      </main>
    </div>
  );
}

export default App;
