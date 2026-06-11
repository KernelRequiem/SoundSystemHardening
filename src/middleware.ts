import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true';
  const path = context.url.pathname;

  // Laisser passer la page maintenance elle-même + assets statiques
  if (isMaintenance && path !== '/maintenance' && !path.startsWith('/_astro')) {
    return context.redirect('/maintenance', 302);
  }

  return next();
});
