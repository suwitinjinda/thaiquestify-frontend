#!/bin/bash
echo "🚀 Setting up ThaiQuestify EAS project..."
echo "==========================================="

# 1. Check login
echo "1. Checking EAS login..."
npx eas whoami || {
  echo "❌ Not logged in. Please login:"
  npx eas login
}

# 2. Update app.json
echo "2. Updating app.json..."
cat > app.json << 'APPJSON'
{
  "expo": {
    "name": "ThaiQuestify",
    "slug": "thaiquestify",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "scheme": "thaiquestify",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.thaiquestify.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#4a6baf"
      },
      "package": "com.thaiquestify.app"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "owner": "munmunback",
    "extra": {
      "eas": {
        "projectId": "00a0158d-1068-4c25-9906-c32706640ba7"
      }
    },
    "updates": {
      "url": "https://u.expo.dev/00a0158d-1068-4c25-9906-c32706640ba7",
      "enabled": true
    },
    "runtimeVersion": {
      "policy": "sdkVersion"
    }
  }
}
APPJSON

# 3. Create eas.json
echo "3. Creating eas.json..."
cat > eas.json << 'EASJSON'
{
  "cli": {
    "version": ">= 6.0.0",
    "appVersionSource": "local"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleDebug"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "http://34.72.174.29:5000"
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
EASJSON

# 4. Check project
echo "4. Checking project..."
npx eas project:info --id 00a0158d-1068-4c25-9906-c32706640ba7 2>/dev/null || {
  echo "⚠️ Project not found or not accessible. Creating/linking..."
  npx eas project:link 00a0158d-1068-4c25-9906-c32706640ba7 2>/dev/null || {
    echo "❌ Could not link project. Creating new project..."
    npx eas project:create
  }
}

# 5. Test backend
echo "5. Testing backend connection..."
curl -s http://34.72.174.29:5000/api/health > /dev/null && echo "✅ Backend is working" || echo "❌ Backend not reachable"

echo "==========================================="
echo "✅ Setup complete!"
echo "📱 Start app: npx expo start"
echo "🏗️  Build: npx eas build --profile development --platform android"
