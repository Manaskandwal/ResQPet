# VetsCue Android App

This is the native Android client for the existing VetsCue backend.

## Configure

Copy `.env.example` to `.env` and set the same public values used by the website:

```bash
EXPO_PUBLIC_API_URL=https://resqpet-backend.onrender.com/api
EXPO_PUBLIC_SOCKET_URL=https://resqpet-backend.onrender.com
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_or_live_public_key
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_web_client_id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_google_android_client_id
```

Or generate it from the existing frontend/backend env files:

```bash
npm run sync-env
```

For local phone testing, do not use `localhost`. Use your computer LAN IP:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.10:5000/api
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.10:5000
```

## Run On Android

```bash
npm install
npx expo prebuild --platform android
npx expo run:android
```

## Build APK

```bash
npx eas login
npx eas build:configure
npm run build:apk
```

Open the EAS build link on your Android phone, download the APK, allow installs from the browser if prompted, and install VetsCue.

Use the same accounts as the website. All roles connect to the same backend and database.
