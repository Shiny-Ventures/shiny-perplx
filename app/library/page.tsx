'use client';

import { Library } from '@/components/library';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function LibraryPage() {
  return (
    <ProtectedRoute>
      <Library />
    </ProtectedRoute>
  );
}