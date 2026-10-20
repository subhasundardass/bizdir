import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
export const session = createServerFn({ method: 'GET' }).handler(async () => {
  const { isAuthenticated } = await import('@/server/auth');
  return isAuthenticated();
});
export const signIn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ password: z.string().min(1).max(500) }))
  .handler(async ({ data }) => {
    const { login } = await import('@/server/auth');
    return login(data.password);
  });
export const signOut = createServerFn({ method: 'POST' }).handler(async () => {
  const { logout } = await import('@/server/auth');
  logout();
});
export const readData = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      model: z.string(),
      page: z.number().int().min(0).default(0),
      search: z.string().max(200).default(''),
      status: z.string().max(30).default('')
    })
  )
  .handler(async ({ data }) => {
    const { read } = await import('@/server/admin');
    return read(data);
  });
export const overview = createServerFn({ method: 'GET' }).handler(async () => {
  const { dashboard } = await import('@/server/admin');
  return dashboard();
});
export const lookup = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      model: z.string(),
      search: z.string().max(100).default(''),
      id: z.string().optional(),
      field: z.string().optional(),
      parentId: z.string().regex(/^\d+$/).optional(),
      levels: z
        .array(z.enum(['state', 'district', 'city', 'locality', 'landmark']))
        .max(5)
        .optional()
    })
  )
  .handler(async ({ data }) => {
    const { getLookup } = await import('@/server/admin');
    return getLookup(data);
  });
export const saveRecord = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      model: z.string(),
      values: z.record(z.string(), z.unknown()),
      original: z.record(z.string(), z.unknown()).optional()
    })
  )
  .handler(async ({ data }) => {
    const { save } = await import('@/server/admin');
    return save(data);
  });
export const deleteRecord = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ model: z.string(), original: z.record(z.string(), z.unknown()) }))
  .handler(async ({ data }) => {
    const { remove } = await import('@/server/admin');
    return remove(data);
  });
