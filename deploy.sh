#!/bin/bash

# ============================================================================
# GitHub & Vercel Deployment Script
# ============================================================================
# This script helps you:
# 1. Create a GitHub repository
# 2. Push code to GitHub
# 3. Deploy to Vercel
# ============================================================================

set -e

echo "=========================================="
echo "Certificate Practice App - Deployment"
echo "=========================================="
echo

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: GitHub Setup
echo -e "${BLUE}Step 1: GitHub Repository Setup${NC}"
echo "You need to create a GitHub repository first."
echo "Visit: https://github.com/new"
echo
read -p "Enter your GitHub username: " GITHUB_USERNAME
read -p "Enter the repository name (e.g., certificate-practice-app): " REPO_NAME
read -p "Enter your GitHub personal access token (PAT): " GITHUB_TOKEN

# Validate inputs
if [ -z "$GITHUB_USERNAME" ] || [ -z "$REPO_NAME" ] || [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}❌ Error: Missing required inputs${NC}"
    exit 1
fi

REPO_URL="https://${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

echo
echo -e "${GREEN}✓ Configuration:${NC}"
echo "  Repository: $GITHUB_USERNAME/$REPO_NAME"
echo

# Step 2: Add Remote and Push
echo -e "${BLUE}Step 2: Pushing Code to GitHub${NC}"

cd "$(dirname "$0")"

# Remove existing remote if any
git remote remove origin 2>/dev/null || true

# Add new remote
git remote add origin "$REPO_URL"

# Push to main branch
echo "Pushing code to GitHub..."
git push -u origin master

echo -e "${GREEN}✓ Code pushed successfully!${NC}"
echo

# Step 3: Vercel Setup
echo -e "${BLUE}Step 3: Vercel Deployment${NC}"
echo "Vercel deployment requires:"
echo "1. A Vercel account (https://vercel.com)"
echo "2. Vercel CLI installed (npm install -g vercel)"
echo "3. GitHub repository linked to Vercel"
echo

read -p "Have you installed Vercel CLI? (y/n): " HAS_VERCEL
if [ "$HAS_VERCEL" = "y" ] || [ "$HAS_VERCEL" = "Y" ]; then
    read -p "Deploy frontend now? (y/n): " DEPLOY_NOW
    if [ "$DEPLOY_NOW" = "y" ] || [ "$DEPLOY_NOW" = "Y" ]; then
        cd frontend
        echo "Deploying frontend to Vercel..."
        vercel --prod
        cd ..
        echo -e "${GREEN}✓ Frontend deployed!${NC}"
    fi
else
    echo "Install Vercel CLI with: npm install -g vercel"
fi

echo
echo "=========================================="
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo "=========================================="
echo
echo "Next steps:"
echo "1. Set environment variables in Vercel:"
echo "   - NEXT_PUBLIC_API_URL (your backend URL)"
echo "   - DATABASE_URL (PostgreSQL connection)"
echo
echo "2. Deploy backend to a hosting service:"
echo "   - Render: https://render.com"
echo "   - Railway: https://railway.app"
echo "   - PythonAnywhere: https://www.pythonanywhere.com"
echo
echo "3. Deploy PostgreSQL database:"
echo "   - Vercel Postgres: https://vercel.com/storage/postgres"
echo "   - Railway: https://railway.app"
echo "   - Neon: https://neon.tech"
echo
