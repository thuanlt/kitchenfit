#!/bin/bash

# ChickenFit Deployment Check Script
# Run this after deployment to verify everything is working

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

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

# Get deployment URL
if [ -z "$1" ]; then
    print_warning "No URL provided. Using default: https://chickenfit.vercel.app"
    DEPLOYED_URL="https://chickenfit.vercel.app"
else
    DEPLOYED_URL="$1"
fi

print_info "Checking deployment at: $DEPLOYED_URL"
echo ""

# Check 1: Site is accessible
print_info "Check 1: Verifying site is accessible..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYED_URL")
if [ "$HTTP_STATUS" = "200" ]; then
    print_success "Site is accessible (HTTP $HTTP_STATUS)"
else
    print_error "Site returned HTTP $HTTP_STATUS"
    exit 1
fi
echo ""

# Check 2: Manifest is accessible
print_info "Check 2: Verifying PWA manifest..."
MANIFEST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYED_URL/manifest.json")
if [ "$MANIFEST_STATUS" = "200" ]; then
    print_success "Manifest is accessible (HTTP $MANIFEST_STATUS)"
else
    print_error "Manifest returned HTTP $MANIFEST_STATUS"
fi
echo ""

# Check 3: API endpoints
print_info "Check 3: Checking API endpoints..."

# Login endpoint
LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$DEPLOYED_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test123"}')
if [ "$LOGIN_STATUS" = "401" ] || [ "$LOGIN_STATUS" = "400" ]; then
    print_success "Login API is responding (HTTP $LOGIN_STATUS)"
else
    print_warning "Login API returned HTTP $LOGIN_STATUS"
fi

# Signup endpoint
SIGNUP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$DEPLOYED_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test123","name":"Test"}')
if [ "$SIGNUP_STATUS" = "409" ] || [ "$SIGNUP_STATUS" = "201" ]; then
    print_success "Signup API is responding (HTTP $SIGNUP_STATUS)"
else
    print_warning "Signup API returned HTTP $SIGNUP_STATUS"
fi

# Recipes endpoint
RECIPES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYED_URL/api/recipes")
if [ "$RECIPES_STATUS" = "200" ]; then
    print_success "Recipes API is responding (HTTP $RECIPES_STATUS)"
else
    print_warning "Recipes API returned HTTP $RECIPES_STATUS"
fi
echo ""

# Check 4: Environment variables
print_info "Check 4: Checking environment configuration..."
print_warning "Please verify these environment variables in Vercel Dashboard:"
echo "  - NEXT_PUBLIC_SUPABASE_URL"
echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  - NEXT_PUBLIC_VAPID_PUBLIC_KEY"
echo "  - VAPID_PRIVATE_KEY"
echo "  - NEXT_PUBLIC_APP_URL"
echo ""

# Check 5: Lighthouse audit
print_info "Check 5: Running Lighthouse audit..."
if command -v lighthouse &> /dev/null; then
    lighthouse "$DEPLOYED_URL" --output=json --output-path=./lighthouse-report.json --quiet
    print_success "Lighthouse report saved to lighthouse-report.json"
    
    # Extract scores
    PERFORMANCE=$(node -e "console.log(JSON.parse(require('fs').readFileSync('./lighthouse-report.json')).categories.performance.score * 100)")
    PWA=$(node -e "console.log(JSON.parse(require('fs').readFileSync('./lighthouse-report.json')).categories.pwa.score * 100)")
    ACCESSIBILITY=$(node -e "console.log(JSON.parse(require('fs').readFileSync('./lighthouse-report.json')).categories.accessibility.score * 100)")
    BEST_PRACTICES=$(node -e "console.log(JSON.parse(require('fs').readFileSync('./lighthouse-report.json')).categories['best-practices'].score * 100)")
    
    echo ""
    print_info "Lighthouse Scores:"
    echo "  Performance: $PERFORMANCE/100"
    echo "  PWA: $PWA/100"
    echo "  Accessibility: $ACCESSIBILITY/100"
    echo "  Best Practices: $BEST_PRACTICES/100"
    echo ""
    
    if [ "$PERFORMANCE" -gt 90 ] && [ "$PWA" -gt 90 ]; then
        print_success "Excellent scores! 🎉"
    else
        print_warning "Some scores are below 90. Check lighthouse-report.json for details."
    fi
else
    print_warning "Lighthouse CLI not installed. Install with: npm install -g lighthouse"
fi
echo ""

# Summary
echo "========================================"
print_success "Deployment check completed!"
echo "========================================"
echo ""
print_info "Next steps:"
echo "  1. Test login/signup manually at $DEPLOYED_URL"
echo "  2. Test PWA installation on mobile device"
echo "  3. Verify push notifications work"
echo "  4. Monitor logs in Vercel Dashboard"
echo "  5. Set up error tracking (optional)"
echo ""