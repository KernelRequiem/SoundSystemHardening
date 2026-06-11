import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true';
  const { pathname } = context.url;

  // Laisser passer : la page maintenance, les assets Astro, les favicons, les images
  const isAllowed =
    pathname === '/maintenance' ||
    pathname.startsWith('/_astro') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff2?)$/);

  if (isMaintenance && !isAllowed) {
    return Response.redirect(new URL('/maintenance', context.url), 302);
  }

  return next();
});
