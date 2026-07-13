'use client';

import { useRef, useState } from 'react';
import IvyShell from '../components/IvyShell';
import InventoryHeaderStats from '../components/inventory/InventoryHeaderStats';
import InventoryAlerts from '../components/inventory/InventoryAlerts';
import ProductTable, { InventoryFilter } from '../components/inventory/ProductTable';

// TASK 2 — product-level inventory. Zone A header stats (cost-based value +
// coverage nudge), Zone B alerts strip, Zone C the full product table with
// inline cost editing and bulk-fill. The coverage CTA scrolls to the table
// pre-filtered to missing-cost products.

export default function IvyInventory() {
  const [filter, setFilter] = useState<InventoryFilter>('all');
  const tableRef = useRef<HTMLDivElement>(null);

  const goToMissing = () => {
    setFilter('missing');
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <IvyShell title="inventory" subtitle="every product, its real cost, and what's moving">
      <InventoryHeaderStats onAddMissingCosts={goToMissing} />
      <InventoryAlerts />
      <div ref={tableRef}>
        <ProductTable filter={filter} onFilter={setFilter} />
      </div>
    </IvyShell>
  );
}
