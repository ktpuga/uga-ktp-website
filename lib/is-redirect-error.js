// Server Actions that call redirect() (e.g. requireAccessToken() in
// portal-api.js) throw a special error tagged with a digest starting
// "NEXT_REDIRECT" — Next.js's own routing machinery is supposed to catch
// this and perform the actual navigation. Any catch block in a client
// component that awaits one of these actions must re-throw this specific
// error instead of treating it like a normal failure, otherwise the redirect
// never happens and the literal string "NEXT_REDIRECT" ends up rendered as
// if it were a real error message.
export function isRedirectError(error) {
  return typeof error?.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT');
}
