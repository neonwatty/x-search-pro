#!/bin/bash

# Ensure X.com authentication exists before running E2E tests

AUTH_FILE="tests/.auth/user.json"

if [ ! -f "$AUTH_FILE" ]; then
  echo "🔐 No authentication found, running X.com login setup..."
  echo "   (This uses credentials from .env file)"
  npx playwright test tests/setup/auth.setup.ts

  if [ $? -ne 0 ]; then
    echo "❌ Authentication failed! Please check your .env credentials or run manually:"
    echo "   npx playwright test tests/setup/auth.setup.ts"
    exit 1
  fi

  echo "✅ Authentication successful"
fi

exit 0
