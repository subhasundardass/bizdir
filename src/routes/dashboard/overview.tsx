import { createFileRoute } from '@tanstack/react-router';
import { Overview } from '@/features/admin/overview';
export const Route = createFileRoute('/dashboard/overview')({ component: Overview });
