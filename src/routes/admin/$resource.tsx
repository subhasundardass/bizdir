import { createFileRoute } from '@tanstack/react-router';
import { ResourcePage } from '@/features/admin/resource';
export const Route = createFileRoute('/admin/$resource')({ component: Page });
function Page() {
  const { resource } = Route.useParams();
  return <ResourcePage key={resource} resource={resource} />;
}
