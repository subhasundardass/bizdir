import { Brand } from '@/components/brand';
import { useState, type ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  LayoutDashboard,
  MapPin,
  Shapes,
  Users,
  Star,
  Inbox,
  ChevronRight,
  LogOut,
  Menu,
  ShieldCheck,
  LoaderCircle
} from 'lucide-react';
import { session, signIn, signOut } from './api';
import { models } from './models';
import './admin.css';
const groups = [
  { title: 'WORKSPACE', names: ['business', 'location', 'concept', 'attribute'] },
  { title: 'COMMUNITY', names: ['app_user', 'review', 'lead', 'creator', 'business_claim'] },
  { title: 'COMMERCE', names: ['business_subscription', 'payout'] },
  {
    title: 'PLACE DETAILS',
    names: [
      'business_media',
      'business_hours',
      'business_concept',
      'business_attribute',
      'concept_alias',
      'location_alias',
      'business_alias',
      'business_closure',
      'attribute_option',
      'attribute_alias',
      'concept_attribute'
    ]
  },
  {
    title: 'INSIGHTS',
    names: ['search_log', 'click_log', 'search_impression', 'lead_status_history']
  }
];
const icons: Record<string, typeof Building2> = {
  business: Building2,
  location: MapPin,
  concept: Shapes,
  app_user: Users,
  review: Star,
  lead: Inbox
};
export function AdminShell({ children }: { children: ReactNode }) {
  const cache = useQueryClient();
  const auth = useQuery({ queryKey: ['admin-session'], queryFn: () => session(), retry: false });
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (auth.isPending)
    return (
      <div className='bd-app bd-loading'>
        <LoaderCircle className='bd-spin' /> Opening your workspace…
      </div>
    );
  if (!auth.data)
    return (
      <div className='bd-app bd-login'>
        <div className='bd-login-art'>
          <div className='bd-brand'>
            <Brand admin />
          </div>
          <div>
            <span className='bd-eyebrow'>THE LOCAL BUSINESS WORKSPACE</span>
            <h1>
              Great places.
              <br />
              Better connections.
            </h1>
            <p>
              One workspace to manage your directory,
              <br />
              support your community, and keep things moving.
            </p>
          </div>
          <small>Built for the people behind every great local discovery.</small>
        </div>
        <form
          className='bd-login-form'
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError('');
            try {
              await signIn({ data: { password } });
              await cache.invalidateQueries({ queryKey: ['admin-session'] });
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <span className='bd-login-icon'>
            <ShieldCheck />
          </span>
          <span className='bd-eyebrow'>JUSTDIAL ADMIN</span>
          <h2>Welcome to your workspace</h2>
          <p>Sign in to manage your business directory.</p>
          <label>
            Admin password
            <input
              type='password'
              autoComplete='current-password'
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && (
            <div role='alert' className='bd-error'>
              {error}
            </div>
          )}
          <button className='bd-btn bd-primary' disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in to dashboard'}
            <ChevronRight size={16} />
          </button>
          <small>Your session is private and expires after 8 hours.</small>
        </form>
      </div>
    );
  return (
    <div className='bd-app bd-workspace'>
      <button
        className='bd-mobile-menu bd-icon'
        aria-label='Open navigation'
        onClick={() => setOpen(!open)}
      >
        <Menu />
      </button>
      {open && (
        <button
          aria-label='Close navigation'
          className='bd-overlay'
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`bd-sidebar ${open ? 'is-open' : ''}`}>
        <Link to='/admin' className='bd-brand'>
          <Brand admin />
        </Link>
        <div className='bd-workspace-label'>
          <span className='bd-avatar'>JD</span>
          <div>
            JustDial workspace<small>Directory management</small>
          </div>
          <ShieldCheck size={17} />
        </div>
        <nav>
          <Link
            to='/admin'
            onClick={() => setOpen(false)}
            className={`bd-nav-link ${pathname.replace(/\/$/, '') === '/admin' ? 'active' : ''}`}
          >
            <LayoutDashboard size={17} />
            Overview
          </Link>
          {groups.map((g) => (
            <div key={g.title} className='bd-nav-group'>
              <p>{g.title}</p>
              {g.names.map((name) => {
                const m = models.find((x) => x.name === name)!;
                const Icon = icons[name] || Shapes;
                return (
                  <Link
                    key={name}
                    to='/admin/$resource'
                    params={{ resource: name }}
                    onClick={() => setOpen(false)}
                    className={`bd-nav-link ${pathname.endsWith('/' + name) ? 'active' : ''}`}
                  >
                    <Icon size={17} />
                    {m.label}
                    {pathname.endsWith('/' + name) && <span className='bd-nav-dot' />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className='bd-sidebar-footer'>
          <span className='bd-avatar'>AD</span>
          <div>
            Administrator<small>Workspace access</small>
          </div>
          <button
            title='Sign out'
            className='bd-icon'
            onClick={async () => {
              await signOut();
              cache.clear();
              await auth.refetch();
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <main className='bd-main'>
        <header className='bd-topbar'>
          <div>
            Workspace <ChevronRight size={13} />
            <strong>
              {pathname.replace(/\/$/, '') === '/admin'
                ? 'Overview'
                : models.find((m) => pathname.endsWith('/' + m.name))?.label || 'Dashboard'}
            </strong>
          </div>
          <div className='bd-topbar-actions'>
            <a href='/' className='bd-view-directory'>
              View directory
            </a>
            <span className='bd-private'>
              <ShieldCheck size={14} />
              Admin workspace
            </span>
          </div>
        </header>
        {children}
        <footer className='bd-footer'>
          © {new Date().getFullYear()} JustDial{' '}
          <span>A little more local. A lot more connected.</span>
        </footer>
      </main>
    </div>
  );
}
