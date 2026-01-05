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

