#!/bin/bash

# ChickenFit Deployment Script
# Usage: ./scripts/deploy.sh [preview|prod]

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI is not installed"
    print_info "Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    print_error ".env.local file not found"
    print_info "Please create .env.local with your environment variables"
    exit 1
fi

# Parse arguments
ENVIRONMENT=${1:-preview}

if [ "$ENVIRONMENT" != "preview" ] && [ "$ENVIRONMENT" != "prod" ]; then
    print_error "Invalid environment. Use 'preview' or 'prod'"
    exit 1
fi

print_info "Starting deployment to $ENVIRONMENT..."
echo ""

# Step 1: Install dependencies
print_info "Step 1: Installing dependencies..."
npm install
print_success "Dependencies installed"
echo ""

# Step 2: Run build
print_info "Step 2: Building the application..."
npm run build
print_success "Build completed"
echo ""

# Step 3: Deploy
print_info "Step 3: Deploying to Vercel ($ENVIRONMENT)..."
if [ "$ENVIRONMENT" = "prod" ]; then
    vercel --prod
else
    vercel
fi
print_success "Deployment completed!"
echo ""

# Step 4: Run Lighthouse audit (optional)
read -p "Do you want to run Lighthouse audit? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Running Lighthouse audit..."
    if command -v lighthouse &> /dev/null; then
        # Get the deployed URL
        DEPLOYED_URL=$(vercel ls --prod 2>/dev/null | head -n 2 | tail -n 1 | awk '{print $2}')
        if [ -z "$DEPLOYED_URL" ]; then
            DEPLOYED_URL="https://chickenfit.vercel.app"
        fi
        lighthouse "$DEPLOYED_URL" --view
    else
        print_warning "Lighthouse CLI not installed. Install with: npm install -g lighthouse"
    fi
fi

echo ""
print_success "Deployment process completed!"
print_info "Check your Vercel dashboard for deployment status"
print_info "Visit: https://vercel.com/dashboard"