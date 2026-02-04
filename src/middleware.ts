import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;

  if (pathname === "/blog" || pathname.startsWith("/blog/")) {
    const rest = pathname.replace(/^\/blog/, "");
    return context.redirect(`/archive${rest}`, 301);
  }

  return next();
});
