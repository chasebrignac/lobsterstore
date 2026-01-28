#!/bin/bash
# Quick Environment Variables Setup Script for Vercel

echo "🚀 LobsterLoop Environment Setup"
echo "================================"
echo ""

# Generate NextAuth Secret
echo "📝 Generating NEXTAUTH_SECRET..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "Generated: $NEXTAUTH_SECRET"
echo ""

# Add to Vercel
echo "Adding environment variables to Vercel..."
echo ""

# NextAuth URL (Production)
vercel env add NEXTAUTH_URL production <<EOF
https://lobsterloop.com
EOF

# NextAuth URL (Preview/Dev)
vercel env add NEXTAUTH_URL preview <<EOF
https://lobsterstore-k31hwixta-aginow.vercel.app
EOF

vercel env add NEXTAUTH_URL development <<EOF
http://localhost:3000
EOF

# NextAuth Secret
echo "$NEXTAUTH_SECRET" | vercel env add NEXTAUTH_SECRET production preview development

echo ""
echo "✅ Basic environment variables added!"
echo ""
echo "⚠️  You still need to add manually:"
echo "   1. DATABASE_URL (create Vercel Postgres first)"
echo "   2. GITHUB_CLIENT_ID (from GitHub OAuth app)"
echo "   3. GITHUB_CLIENT_SECRET (from GitHub OAuth app)"
echo "   4. AWS credentials (optional for loop execution)"
echo ""
echo "📖 See NAMECHEAP_DNS_SETUP.md for complete instructions"
echo ""
echo "Next steps:"
echo "1. Add DNS records in Namecheap"
echo "2. Create Vercel Postgres database"
echo "3. Create GitHub OAuth app"
echo "4. Add remaining environment variables"
echo "5. Run: vercel --prod"
