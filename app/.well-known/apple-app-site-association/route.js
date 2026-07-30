// Apple App Site Association — lets iOS open attendance check-in QR codes in
// the KTP Life app instead of Safari (Universal Links).
//
// Served from a route handler rather than public/ on purpose: Apple requires
// this be delivered as `application/json`, and the file has no extension, so a
// static handler would guess `application/octet-stream` and iOS would silently
// ignore it. Apple also requires HTTPS with no redirects on the way here.
//
// Deliberately scoped to /checkin/* ONLY. Claiming "/*" would make every
// ugaktp.com link — every portal page shared in a group chat — try to open the
// app, which is not what anyone wants.

// App ID is <TeamID>.<BundleID>, from the Xcode project:
//   DEVELOPMENT_TEAM = ZAL9S5GDHG
//   PRODUCT_BUNDLE_IDENTIFIER = SB.KTPLIFE
const APP_ID = 'ZAL9S5GDHG.SB.KTPLIFE';

const ASSOCIATION = {
  applinks: {
    details: [
      {
        appIDs: [APP_ID],
        components: [
          {
            '/': '/checkin/*',
            comment: 'Attendance check-in QR codes open directly in the app',
          },
        ],
      },
    ],
  },
};

export const dynamic = 'force-static';

export async function GET() {
  return new Response(JSON.stringify(ASSOCIATION), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Apple's CDN caches this aggressively anyway; a short public cache keeps
      // it cheap without making a correction take a day to propagate.
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
