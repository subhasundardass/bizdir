import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  Building2,
  MapPin,
  Shapes,
  Inbox,
  ArrowUpRight,
  Plus,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Star,
  Search,
  MousePointer2
} from 'lucide-react';
import { overview } from './api';
export function Overview() {
  const q = useQuery({ queryKey: ['admin-overview'], queryFn: () => overview(), retry: 1 });
  const d = q.data;
  return (
    <div className='bd-content'>
      <div className='bd-page-heading'>
        <div>
          <span className='bd-eyebrow'>YOUR DIRECTORY, AT A GLANCE</span>
          <h1>
            Workspace overview<span className='bd-title-dot'>.</span>
          </h1>
          <p>Welcome back. Here’s what’s happening across JustDial.</p>
        </div>
        <Link
          className='bd-btn bd-primary'
          to='/admin/$resource'
          params={{ resource: 'business' }}
          search={{} as never}
        >
          <Plus size={17} />
          Manage places
        </Link>
      </div>
      {q.error && (
        <div className='bd-error' role='alert'>
          Unable to load your directory. Check the database connection and try again.{' '}
          <button onClick={() => q.refetch()}>Retry</button>
        </div>
      )}
      <div className='bd-stats'>
        {[
          {
            label: 'Total places',
            value: d?.places,
            icon: Building2,
            sub: `${d?.active ?? '—'} active listings`,
            color: 'green',
            resource: 'business'
          },
          {
            label: 'Locations',
            value: d?.locations,
            icon: MapPin,
            sub: 'Your directory’s local reach',
            color: 'blue',
            resource: 'location'
          },
          {
            label: 'Categories & services',
            value: d?.categories,
            icon: Shapes,
            sub: 'Helping people find the right fit',
            color: 'purple',
            resource: 'concept'
          },
          {
            label: 'Customer leads',
            value: d?.leads,
            icon: Inbox,
            sub: 'Connections that matter',
            color: 'orange',
            resource: 'lead'
          }
        ].map((s) => (
          <Link
            key={s.label}
            className='bd-stat'
            to='/admin/$resource'
            params={{ resource: s.resource }}
          >
            <div>
              <span className={`bd-stat-icon ${s.color}`}>
                <s.icon size={20} />
              </span>
              <ArrowUpRight size={17} />
            </div>
            <p>{s.label}</p>
            <strong>{s.value?.toLocaleString() ?? '—'}</strong>
            <small>{s.sub}</small>
          </Link>
        ))}
      </div>
      <div className='bd-overview-grid'>
        <section className='bd-card bd-recent'>
          <div className='bd-card-heading'>
            <div>
              <h2>Recently added places</h2>
              <p>The newest additions to your directory.</p>
            </div>
            <Link to='/admin/$resource' params={{ resource: 'business' }}>
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className='bd-table-wrap'>
            <table>
              <thead>
                <tr>
                  <th>PLACE</th>
                  <th>STATUS</th>
                  <th>ADDED</th>
                </tr>
              </thead>
              <tbody>
                {d?.recent.map((r: any) => (
                  <tr key={r.id}>
                    <td>
                      <div className='bd-place-cell'>
                        <span className='bd-place-avatar'>{r.name.slice(0, 2).toUpperCase()}</span>
                        <div>
                          <strong>{r.name}</strong>
                          <small>{r.phone}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`bd-pill ${r.status}`}>{r.status}</span>
                    </td>
                    <td>
                      {new Date(r.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!q.isPending && !d?.recent.length && (
              <div className='bd-empty'>
                <Building2 />
                <h3>Your directory starts here</h3>
                <p>Add your first place to bring your directory to life.</p>
              </div>
            )}
            {q.isPending && <div className='bd-empty'>Loading your places…</div>}
          </div>
        </section>
        <section className='bd-card'>
          <div className='bd-card-heading'>
            <div>
              <h2>Needs your attention</h2>
              <p>A little care goes a long way.</p>
            </div>
            <span className='bd-soft-icon'>
              <Clock3 size={18} />
            </span>
          </div>
          <div className='bd-attention'>
            {[
              {
                icon: Building2,
                title: 'Places to review',
                count: d?.pendingPlaces,
                resource: 'business',
                desc: 'Approve new business listings'
              },
              {
                icon: Star,
                title: 'Reviews to moderate',
                count: d?.pendingReviews,
                resource: 'review',
                desc: 'Keep your community trusted'
              }
            ].map((a) => (
              <Link to='/admin/$resource' params={{ resource: a.resource }} key={a.title}>
                <span className='bd-attention-icon'>
                  <a.icon size={19} />
                </span>
                <div>
                  <strong>{a.title}</strong>
                  <small>{a.desc}</small>
                </div>
                <b>{a.count ?? '—'}</b>
                <ChevronRight size={15} />
              </Link>
            ))}
            <div className='bd-note'>
              <CheckCircle2 size={17} />
              <p>Every verified detail helps someone discover their next favorite place.</p>
            </div>
          </div>
        </section>
        <section className='bd-card'>
          <div className='bd-card-heading'>
            <div>
              <h2>Directory health</h2>
              <p>Where your listings stand today.</p>
            </div>
          </div>
          <div className='bd-health'>
            <div className='bd-health-score'>
              <strong>
                {d?.places ? Math.round((d.active / d.places) * 100) : 0}
                <span>%</span>
              </strong>
              <p>of places are active</p>
            </div>
            <div className='bd-progress'>
              <i style={{ width: `${d?.places ? (d.active / d.places) * 100 : 0}%` }} />
            </div>
            <div className='bd-health-legend'>
              {d?.statuses.map((s: any) => (
                <div key={s.status}>
                  <span className={`bd-pill ${s.status}`}>{s.status}</span>
                  <b>{s._count.id}</b>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className='bd-card'>
          <div className='bd-card-heading'>
            <div>
              <h2>Explore your reach</h2>
              <p>Places by city and discovery activity.</p>
            </div>
            <MapPin size={19} />
          </div>
          <div className='bd-reach'>
            {d?.topCities.map((c: any) => (
              <div className='bd-city' key={c.name}>
                <span>{c.name}</span>
                <div>
                  <i style={{ width: `${(c.count / (d.topCities[0]?.count || 1)) * 100}%` }} />
                </div>
                <b>{c.count}</b>
              </div>
            ))}
            {d && !d.topCities.length && (
              <p className='bd-muted'>Your city breakdown appears as places are added.</p>
            )}
            <div className='bd-discovery'>
              <div>
                <Search size={16} />
                <b>{d?.searches ?? '—'}</b>
                <small>Searches</small>
              </div>
              <div>
                <MousePointer2 size={16} />
                <b>{d?.clicks ?? '—'}</b>
                <small>Interactions</small>
              </div>
            </div>
          </div>
        </section>
      </div>
      <div className='bd-bottom-banner'>
        <span className='bd-banner-icon'>
          <MapPin />
        </span>
        <div>
          <h3>Make your directory feel a little more local.</h3>
          <p>
            Add neighborhoods, categories, and all the details that help great places get
            discovered.
          </p>
        </div>
        <Link className='bd-btn' to='/admin/$resource' params={{ resource: 'location' }}>
          Explore locations
          <ArrowUpRight size={16} />
        </Link>
      </div>
    </div>
  );
}
