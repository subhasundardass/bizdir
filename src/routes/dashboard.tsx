import { createFileRoute, redirect } from '@tanstack/react-router';
export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ location }) => {
    const resource = location.pathname.split('/')[2];
    throw redirect(
      resource && resource !== 'overview'
        ? { to: '/admin/$resource', params: { resource } }
        : { to: '/admin' }
    );
  }
});
