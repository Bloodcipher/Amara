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

const pages = {
  'dashboard': DashboardOverview,
  'sku-config': SKUConfiguration,
  'products': ProductsCatalog,
  'sku-generator': SKUGenerator,
  'manufacturing': Manufacturing,
  'production': Production,
  'inventory': Inventory,
  'migrations': MigrationViewer,
};

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarWidth, setSidebarWidth] = useState(256);
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
