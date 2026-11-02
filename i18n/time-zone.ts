/**
 * The house's clock. Named rather than left to the runtime: a date formatted
 * on the server and again in the browser has to come out the same, or React
 * hydrates over a time already on screen. It is also what the dinner form
 * writes its wall clock against, so what is typed and what is listed agree.
 *
 * Its own module so a client component can import it — i18n/request.ts pulls
 * in next-intl/server, which one cannot.
 */
export const timeZone = 'America/Bogota'
