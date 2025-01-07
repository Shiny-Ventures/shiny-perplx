'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';

export function LayoutWithSidebar({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  return (
    <div className="flex">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`flex-1 ${isCollapsed ? 'ml-[60px]' : 'ml-[240px]'} transition-all duration-300`}>
        {children}
      </main>
    </div>
  );
} 