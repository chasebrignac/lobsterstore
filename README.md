# LobsterLoop

Production Next.js app with GitHub OAuth (NextAuth), CDK-managed AWS runner infrastructure, and Vercel hosting.

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

## Local development
```
npm install
npm run dev
```
Visit http://localhost:3000/login and sign in with GitHub.

## Deployment (Vercel)
1) Ensure `NEXTAUTH_URL` matches the deployed host (e.g., https://lobsterloop.com). If temporarily testing on a Vercel domain, set both the GitHub callback and `NEXTAUTH_URL` to that domain.
2) `vercel --prod` (uses `vercel.json` build/install commands).

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

## Auth/session details
- NextAuth uses JWT sessions (`strategy: 'jwt'`).
- Middleware uses `withAuth` to protect `/dashboard`, `/loops`, `/settings`.

## Safe Browsing note
If Google Safe Browsing flags the apex domain, you can temporarily point `NEXTAUTH_URL` and the GitHub callback to the Vercel domain until the review clears, then switch back.
