# LobsterLoop

Production Next.js app with GitHub OAuth (NextAuth), optional password test login, CDK-managed AWS runner infrastructure, and Vercel hosting.

## Prerequisites
- Node 20+
- npm
- AWS CLI configured for the target account
- GitHub OAuth app (client ID/secret)
- Vercel project

## Environment variables
Create `.env.local` for local dev:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-string
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
# enable credential test login for API automation
ALLOW_TEST_LOGIN=true
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPass!234
# enable /api/test/execute helper
TEST_API_ENABLED=true
TEST_API_SECRET=<random-64-hex>
DATABASE_URL=postgres://...  # Neon or RDS
EC2_AMI_ID=ami-xxxx
EC2_SECURITY_GROUP_ID=sg-xxxx
EC2_INSTANCE_PROFILE_ARN=arn:aws:iam::...:instance-profile/...
EC2_LAUNCH_TEMPLATE_ID=lt-xxxx
MAX_EC2_INSTANCES=5
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

For Vercel, set the same keys (production). Only one callback URL is allowed in the GitHub OAuth app—keep it in sync with `NEXTAUTH_URL` (e.g., `https://lobsterloop.com/api/auth/callback/github` or the temporary Vercel domain if the apex is blocked).
If Safe Browsing is blocking the apex domain, point both `NEXTAUTH_URL` and the GitHub callback to the Vercel preview/alias host until review is cleared.

## Local development
```
npm install
npm run dev
```
Visit http://localhost:3000/login and sign in with GitHub _or_ the test account:
```
test@example.com / TestPass!234
```

## Deployment (Vercel)
1) Ensure `NEXTAUTH_URL` matches the deployed host (e.g., https://lobsterloop.com). If temporarily testing on a Vercel domain, set both the GitHub callback and `NEXTAUTH_URL` to that domain.
2) `vercel --prod` (uses `vercel.json` build/install commands).
3) Required Vercel env keys: everything in the env block above plus `TEST_API_*` and `ALLOW_TEST_LOGIN` when you need non-GitHub testing.

## AWS infrastructure (CDK)
Code lives in `infrastructure/cdk/` (TypeScript).
```
cd infrastructure/cdk
npm install
npx cdk bootstrap aws://<ACCOUNT>/<REGION>
npx cdk deploy --require-approval never
```
Stack provisions:
- Security group
- EC2 roles + instance profile
- Launch template for runner instances

Export the generated resource IDs into your app env (`EC2_*` vars above).

## Test API helper (no browser)
POST `/api/test/execute` with header `x-test-secret: $TEST_API_SECRET`
```json
{
  "prd": { "product": "...", "userStories": [...] },
  "apiKey": "sk-test-...",
  "provider": "claude-code | codex | opencode",
  "tool": "claude-code",
  "name": "Smoke loop",
  "description": "Quick health check"
}
```
Response returns `loopId`, `executionId`, and the stored API key id; progress stream is at `/api/loops/:loopId/progress`.

## Flowchart viewer
Loop pages render an in-app @xyflow/react graph (inspired by snarktank/ralph flowchart) that highlights the current step as executions advance. No external viewer is required.

## Auth/session details
- NextAuth uses JWT sessions (`strategy: 'jwt'`).
- Middleware uses `withAuth` to protect `/dashboard`, `/loops`, `/settings`.

## Safe Browsing note
If Google Safe Browsing flags the apex domain, you can temporarily point `NEXTAUTH_URL` and the GitHub callback to the Vercel domain until the review clears, then switch back.
