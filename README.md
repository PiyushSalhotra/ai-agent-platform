node_modules → avoids huge repo size

.env → protects API keys (very important for OpenAI)

.next / dist → build output (should never be committed)

coverage → test artifacts

.vscode → editor-specific settings (optional but fine)

If someone asks:

“What was a tricky production issue you faced?”

You can say:
In Next.js App Router, page files have strict export rules. I initially exported configuration objects directly from a page, which worked in dev but failed in production. I fixed it by moving shared logic into separate modules and keeping page files compliant.

You were manually routing to /sign-in, which is a special Clerk-controlled route, while also running global client-side providers and middleware.
That combination created a redirect loop.

Routing to a protected normal page (/dashboard) let Clerk + middleware handle auth correctly, which is why it fixed the issue.


Why does “Get Started” redirect to Sign-In even when it links to /dashboard?
In my application, routes like /dashboard are protected using Clerk middleware.

When a user clicks Get Started, they are navigated to /dashboard.

Before React renders the page, Next.js middleware runs on the server.

The middleware checks whether the user is authenticated.

If the user is not logged in, Clerk automatically redirects them to /sign-in.

This redirection happens even before the dashboard component executes, so the UI never loads.


“Credits were being calculated and displayed on the frontend, but agent creation was not restricted at the backend level. Since frontend checks are only for UX and not security, the Convex mutation still allowed agent creation. The correct fix is to enforce the credit limit inside the backend mutation, ensuring business rules cannot be bypassed.”

Credits were calculated in the sidebar for display, but agent creation relied on a different state that was never updated. As a result, the UI showed zero credits while creation logic still allowed unlimited agents