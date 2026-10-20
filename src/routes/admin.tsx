import { createFileRoute, Outlet } from '@tanstack/react-router';
import { AdminShell } from '@/features/admin/shell';
export const Route = createFileRoute('/admin')({
  head: () => ({
    meta: [{ title: 'JustDial Admin' }, { name: 'robots', content: 'noindex, nofollow' }]
  }),
  component: () => (
    <AdminShell>
      <Outlet />
    </AdminShell>
  )
});
