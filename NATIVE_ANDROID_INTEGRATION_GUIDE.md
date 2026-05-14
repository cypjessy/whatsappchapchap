# Native Android Features Integration Guide

This guide shows how to integrate Capacitor native Android plugins throughout your WhatsApp Chap Chap app.

## 📦 Installed Plugins

All plugins are installed and configured in `capacitor.config.ts`:

### High Priority ✅
1. **@capacitor/haptics** - Tactile feedback for buttons
2. **@capacitor/push-notifications** - Push notifications for orders/bookings
3. **@capacitor/local-notifications** - Scheduled reminders
4. **@capacitor/network** - Online/offline detection
5. **@capacitor/status-bar** - Status bar customization (green theme)
6. **@capacitor/app** - App lifecycle & back button handling
7. **@capacitor/screen-orientation** - Lock to portrait mode
8. **@capacitor/splash-screen** - Custom splash screen

### Medium Priority ✅
9. **@capacitor/share** - Share products/orders
10. **@capacitor/clipboard** - Copy M-Pesa codes, order IDs
11. **@capacitor/camera** - Upload product photos
12. **@capacitor/toast** - Lightweight feedback messages

### Nice to Have ✅
13. **@capacitor/keyboard** - Keyboard handling

---

## 🎯 Centralized Import File

All hooks are exported from a single file for easy imports:

```typescript
// Import any hook from this file
import { useHaptics, useClipboard, useShare, useToast, useNetworkStatus } from '@/hooks/useNativeAndroid';
```

---

## ✅ Already Integrated

### 1. App Layout (`src/app/(app)/layout.tsx`)
- ✅ Status bar color (#25D366 green)
- ✅ Navigation bar color via meta tag
- ✅ Screen orientation locked to portrait
- ✅ Android back button handler
- ✅ Splash screen manual hide with fade
- ✅ Network status monitoring with offline banner
- ✅ App lifecycle management (idle session fix)

### 2. Login Page (`src/app/login/page.tsx`)
- ✅ Haptic feedback on login button press
- ✅ Success haptic on successful login
- ✅ Error haptic on failed login

### 3. Registration Page (`src/app/(auth)/register/page.tsx`)
- ✅ Haptic feedback on form submission
- ✅ Success haptic on account creation
- ✅ Success haptic on WhatsApp connection
- ✅ Haptic on back button

### 4. Dashboard Quick Actions (`src/app/(app)/dashboard/components/QuickActions.tsx`)
- ✅ Medium haptic on action card tap

### 5. Global CSS (`src/app/globals.css`)
- ✅ Safe area insets for notch screens
- ✅ Smooth momentum scrolling
- ✅ Text selection disabled (native feel)
- ✅ Android ripple effect on buttons
- ✅ Overscroll behavior containment

---

## 📝 How to Use Each Hook

### 1. Haptic Feedback

```typescript
import { useHaptics } from '@/hooks/useNativeAndroid';

function MyComponent() {
  const { impactLight, impactMedium, impactHeavy, notificationSuccess, notificationError } = useHaptics();

  const handleClick = async () => {
    await impactLight(); // Button press
    // ... do something
    await notificationSuccess(); // Success
  };

  return <button onClick={handleClick}>Click Me</button>;
}
```

**When to use:**
- `impactLight` - Regular button presses
- `impactMedium` - Important actions (save, submit)
- `impactHeavy` - Critical actions (delete, confirm)
- `notificationSuccess` - Success operations
- `notificationError` - Error states
- `notificationWarning` - Warning states

---

### 2. Clipboard Operations

```typescript
import { useClipboard } from '@/hooks/useNativeAndroid';

function OrderDetails({ mpesaCode }: { mpesaCode: string }) {
  const { copy } = useClipboard();
  const { show: showToast } = useToast();

  const handleCopy = async () => {
    const success = await copy(mpesaCode);
    if (success) {
      await showToast({ text: 'M-Pesa code copied!', duration: 'short' });
    }
  };

  return <button onClick={handleCopy}>Copy Code</button>;
}
```

**Use cases:**
- Copy M-Pesa payment codes
- Copy order IDs
- Copy tracking numbers
- Copy customer phone numbers

---

### 3. Share Functionality

```typescript
import { useShare } from '@/hooks/useNativeAndroid';

function ProductCard({ product }: { product: Product }) {
  const { share } = useShare();

  const handleShare = async () => {
    await share({
      title: `Check out ${product.name}`,
      text: product.description,
      url: `${window.location.origin}/products/${product.id}`
    });
  };

  return <button onClick={handleShare}>Share Product</button>;
}
```

**Use cases:**
- Share products with customers
- Share order links
- Share booking confirmations
- Share business profile

---

### 4. Toast Messages

```typescript
import { useToast } from '@/hooks/useNativeAndroid';

function MyComponent() {
  const { show: showToast } = useToast();

  const handleAction = async () => {
    // Do something...
    await showToast({
      text: 'Order confirmed ✓',
      duration: 'short', // or 'long'
      position: 'bottom' // or 'top', 'center'
    });
  };
}
```

**Use cases:**
- Form submission feedback
- Save confirmation
- Delete confirmation
- Network status changes

---

### 5. Network Status

```typescript
import { useNetworkStatus } from '@/hooks/useNativeAndroid';

function MyComponent() {
  const { isOnline } = useNetworkStatus();

  if (!isOnline) {
    return <div>You're offline. Some features may be limited.</div>;
  }

  return <div>Your online content...</div>;
}
```

**Already integrated in:** App layout (shows red banner when offline)

---

### 6. HapticButton Component

A reusable wrapper that adds haptics to any clickable element:

```typescript
import { HapticButton } from '@/components/HapticButton';

function MyComponent() {
  return (
    <HapticButton 
      onClick={() => console.log('Clicked!')}
      hapticType="light" // light | medium | heavy | success | error | warning | none
      className="px-4 py-2 bg-green-500 text-white rounded"
    >
      Click Me
    </HapticButton>
  );
}
```

---

## 🎨 Pages That Need Integration

### Priority 1: Core Commerce Features

#### Products Page (`src/app/(app)/products/page.tsx`)
Add haptics to:
- [ ] Add product button
- [ ] Edit product button
- [ ] Delete product button (heavy + warning)
- [ ] Toggle visibility switch
- [ ] Category filter buttons

Add clipboard to:
- [ ] Copy product link button
- [ ] Copy SKU/code button

Add share to:
- [ ] Share product button

Example:
```typescript
import { useHaptics, useClipboard, useShare } from '@/hooks/useNativeAndroid';

// In your component
const { impactLight, notificationSuccess } = useHaptics();
const { copy } = useClipboard();
const { share } = useShare();
```

---

#### Orders Page (`src/app/(app)/orders/page.tsx`)
Add haptics to:
- [ ] Confirm order button (success)
- [ ] Cancel order button (error)
- [ ] Mark as shipped button (medium)
- [ ] Print invoice button (light)

Add clipboard to:
- [ ] Copy order ID
- [ ] Copy customer phone
- [ ] Copy M-Pesa transaction code

Add share to:
- [ ] Share order link with customer

---

#### Bookings Page (`src/app/(app)/bookings/page.tsx`)
Add haptics to:
- [ ] Create booking button
- [ ] Confirm booking button (success)
- [ ] Cancel booking button (error)
- [ ] Reschedule button (medium)

Add local notifications:
```typescript
import { LocalNotifications } from '@capacitor/local-notifications';

// Schedule reminder
await LocalNotifications.schedule({
  notifications: [{
    title: 'Upcoming Booking',
    body: `Booking with ${customerName} in 1 hour`,
    id: bookingId,
    schedule: { at: new Date(bookingTime - 3600000) } // 1 hour before
  }]
});
```

---

#### Customers Page (`src/app/(app)/customers/page.tsx`)
Add haptics to:
- [ ] Add customer button
- [ ] Send message button (light)
- [ ] Create segment button

Add clipboard to:
- [ ] Copy customer phone number
- [ ] Copy customer email

Add share to:
- [ ] Share customer referral link

---

### Priority 2: Settings & Configuration

#### Settings Page (`src/app/(app)/settings/page.tsx`)
Add haptics to:
- [ ] Toggle switches (light)
- [ ] Save settings button (medium + success)
- [ ] Reset settings button (heavy + warning)
- [ ] Logout button (heavy + error)

Add camera for:
```typescript
import { Camera, CameraSource, CameraResultType } from '@capacitor/camera';

const takePhoto = async () => {
  const photo = await Camera.getPhoto({
    quality: 90,
    source: CameraSource.Camera,
    resultType: CameraResultType.Uri
  });
  // Upload photo...
};
```

---

### Priority 3: Chat & Communication

#### Chat Page (`src/app/(app)/chat/[phone]/page.tsx`)
Add haptics to:
- [ ] Send message button (light)
- [ ] Attach file button
- [ ] Voice message button

Add keyboard handling:
```typescript
import { Keyboard } from '@capacitor/keyboard';

useEffect(() => {
  Keyboard.addListener('keyboardWillShow', info => {
    // Scroll chat to bottom when keyboard opens
    window.scrollTo(0, document.body.scrollHeight);
  });

  return () => Keyboard.removeAllListeners();
}, []);
```

---

## 🔧 Implementation Pattern

For each page/component, follow this pattern:

1. **Import the hooks you need:**
```typescript
import { useHaptics, useClipboard, useShare, useToast } from '@/hooks/useNativeAndroid';
```

2. **Initialize in component:**
```typescript
const { impactLight, notificationSuccess } = useHaptics();
const { copy } = useClipboard();
const { share } = useShare();
const { show: showToast } = useToast();
```

3. **Add to button handlers:**
```typescript
const handleAction = async () => {
  await impactLight(); // Always first
  
  try {
    // Your logic here
    await doSomething();
    
    await notificationSuccess(); // On success
    await showToast({ text: 'Success!' });
  } catch (error) {
    await notificationError(); // On error
    await showToast({ text: 'Failed', position: 'top' });
  }
};
```

4. **Test on device:**
   - Build APK with GitHub Actions
   - Install on Android device
   - Test haptic feedback feels natural
   - Verify no delays or errors

---

## 🚀 Quick Reference

| Feature | Hook | Import From |
|---------|------|-------------|
| Haptics | `useHaptics()` | `@/hooks/useNativeAndroid` |
| Clipboard | `useClipboard()` | `@/hooks/useNativeAndroid` |
| Share | `useShare()` | `@/hooks/useNativeAndroid` |
| Toast | `useToast()` | `@/hooks/useNativeAndroid` |
| Network | `useNetworkStatus()` | `@/hooks/useNativeAndroid` |
| Lifecycle | `useAppLifecycle()` | `@/hooks/useNativeAndroid` |

---

## 📱 Testing Checklist

Before deploying each page:

- [ ] Haptics work on button presses
- [ ] No console errors in Chrome DevTools
- [ ] Fallback works on web (non-Capacitor)
- [ ] Clipboard copies correctly
- [ ] Share sheet opens properly
- [ ] Toast messages display
- [ ] Network banner shows when offline
- [ ] Back button navigates correctly
- [ ] Screen stays in portrait mode
- [ ] Status bar is green (#25D366)
- [ ] Splash screen fades smoothly

---

## 🎯 Next Steps

1. **Complete Priority 1 pages** (Products, Orders, Bookings, Customers)
2. **Add push notifications** for real-time order alerts
3. **Integrate camera** for product photo uploads
4. **Add local notifications** for booking reminders
5. **Test thoroughly** on multiple Android devices
6. **Deploy new APK** via GitHub Actions

---

## 💡 Pro Tips

1. **Always call haptics FIRST** in event handlers (before async operations)
2. **Use different intensities** to create hierarchy (light for nav, heavy for delete)
3. **Combine haptics + toast** for complete feedback
4. **Test without network** to ensure graceful degradation
5. **Keep haptics subtle** - they should enhance, not distract
6. **Use clipboard for codes** users need to paste elsewhere
7. **Share links with context** (title + description + URL)

---

**Last Updated:** May 12, 2026  
**Status:** Auth pages ✅ | Dashboard partial ✅ | Remaining pages 🔄
