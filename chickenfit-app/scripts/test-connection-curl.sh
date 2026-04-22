#!/bin/bash

# Load environment variables
export $(cat ../.env.local | grep -v '^#' | xargs)

echo "🔌 Testing Supabase Connection with curl..."
echo ""

# Check if URL is set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL is not set"
    exit 1
fi

echo "📍 Testing connectivity to: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

# Test 1: Basic connectivity
echo "Test 1: Basic HTTP connectivity..."
curl -I -s -o /dev/null -w "HTTP Status: %{http_code}\n" "$NEXT_PUBLIC_SUPABASE_URL"

echo ""

# Test 2: REST API connectivity
echo "Test 2: REST API connectivity..."
if [ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
        "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/recipes?limit=1")
    
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
    BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')
    
    echo "HTTP Status: $HTTP_CODE"
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ REST API is accessible!"
        echo "Response: $BODY"
    else
        echo "❌ REST API returned status: $HTTP_CODE"
        echo "Response: $BODY"
    fi
else
    echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set"
fi

echo ""

# Test 3: Auth service
echo "Test 3: Auth service connectivity..."
AUTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/user")

AUTH_HTTP_CODE=$(echo "$AUTH_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
AUTH_BODY=$(echo "$AUTH_RESPONSE" | sed '/HTTP_CODE/d')

echo "HTTP Status: $AUTH_HTTP_CODE"
echo "Response: $AUTH_BODY"

echo ""
echo "✅ Connection tests completed!"