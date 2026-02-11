# EcoMonitor AI - UI Components Documentation

## Overview

This document provides a comprehensive overview of all UI components in the EcoMonitor AI mobile application, including their features, usage, and 2025-2026 trend integrations.

## Component Library

### Core Components (Updated for 2025-2026 Trends)

#### Button (`/components/ui/Button.tsx`)
**Enhanced with:**
- Micro-interactions (press animations via Reanimated)
- Gradient variant with purple-pink gradient
- New size variants: sm, md, lg, xl
- New variant: `success` (emerald), `gradient`
- Loading shimmer effect support
- Haptic feedback integration

**Usage:**
```tsx
<Button
  title="Sign In"
  variant="gradient"
  size="lg"
  isLoading={loading}
  fullWidth
/>
```

#### Input (`/components/ui/Input.tsx`)
**Enhanced with:**
- Password toggle with eye icon
- Left/right icon support
- Success state with checkmark
- Character count display
- Helper text support
- Focus ring animation
- Error state with shake animation potential

**Usage:**
```tsx
<Input
  label="Email"
  placeholder="you@example.com"
  leftIcon="mail-outline"
  value={email}
  onChangeText={setEmail}
  helperText="We'll never share your email"
  characterCount
  maxLength={100}
/>
```

#### Modal (`/components/ui/Modal.tsx`)
**Enhanced with:**
- Blur backdrop effect (expo-blur)
- Spring animations for scale/opacity
- Size variants: sm, md, lg
- Close button with haptic feedback
- Subtitle support
- Dark mode optimized

**Usage:**
```tsx
<Modal
  visible={showModal}
  onClose={() => setShowModal(false)}
  title="Confirm Action"
  subtitle="This cannot be undone"
  size="md"
  showCloseButton
>
  {/* Modal content */}
</Modal>
```

#### AppleSignInButton (`/components/ui/AppleSignInButton.tsx`)
**Enhanced with:**
- Loading state support
- Press animation with Reanimated
- Android fallback UI
- Haptic feedback integration

**Usage:**
```tsx
<AppleSignInButton
  onError={(error) => console.error(error)}
  isLoading={isAuthenticating}
/>
```

### New Components (2025-2026 Trends)

#### GradientButton (`/components/ui/GradientButton.tsx`)
**Features:**
- Linear gradient backgrounds
- Spring press animations
- Multiple color variants: primary, secondary, accent, success, warning
- Shimmer loading effect support

**Trend:** AI Gradient Haze

#### EnhancedInput (`/components/ui/EnhancedInput.tsx`)
**Features:**
- Animated border scaling on focus
- Error shake animation
- Password visibility toggle
- Icon support (left/right)
- Character counter
- Success state indicator

**Trend:** Micro-Interactions + Privacy Transparency

#### EnhancedModal (`/components/ui/EnhancedModal.tsx`)
**Features:**
- Swipe-to-dismiss gesture
- Blur backdrop
- Spring animations
- Size variants: sm, md, lg, fullscreen
- Swipe indicator handle

**Trend:** Gesture-First Navigation

#### StreakCard (`/components/ui/StreakCard.tsx`)
**Features:**
- Gradient tiers (bronze → celestial)
- Animated glow for high tiers
- Progress bar to next tier
- Tier badge display
- Icon rotation animation

**Trend:** Gamified Retention Loops

**Tiers:**
- Bronze (0-2 days)
- Silver (3-6 days)
- Gold (7-13 days)
- Platinum (14-20 days)
- Diamond (21-29 days)
- Cosmic (30-49 days)
- Celestial (50+ days)

#### EnhancedSkeleton (`/components/ui/EnhancedSkeleton.tsx`)
**Features:**
- Three variants: pulse, shimmer, wave
- Preset components: CardSkeleton, StatsCardSkeleton, ListItemSkeleton
- Dark mode optimized
- Smooth animations

**Trend:** Generative AI Streaming Interfaces

#### BentoGrid (`/components/ui/BentoGrid.tsx`)
**Features:**
- Modular grid layout system
- Column span support
- Row span support
- Preset card components
- Scrollable option

**Trend:** Bento Box Grids

#### GestureCard (`/components/ui/GestureCard.tsx`)
**Features:**
- Press animations
- Micro-interaction variants: scale, glow, bounce
- Swipeable action support
- Haptic feedback

**Trend:** Gesture-First Navigation + Micro-Interactions

#### AIGradientHaze (`/components/ui/AIGradientHaze.tsx`)
**Features:**
- Animated gradient orbs
- Blur effects
- Multiple intensity levels
- Preset gradient combinations
- AI processing overlay component

**Trend:** AI Gradient Haze

**Presets:**
- cosmic: purple → pink
- ocean: cyan → blue → purple
- sunset: orange → pink → purple
- forest: emerald → cyan → blue
- aurora: green → emerald → cyan
- neon: pink → purple → indigo
- gold: yellow → orange → red

#### PrivacyDashboard (`/components/ui/PrivacyDashboard.tsx`)
**Features:**
- Privacy score display
- Data collection breakdown
- Data usage explanation
- Third-party sharing transparency
- Data management actions
- Secure badge

**Trend:** Privacy Transparency UI

#### ContextualPaywall (`/components/ui/ContextualPaywall.tsx`)
**Features:**
- Context-aware messaging
- Tier comparison (monthly, yearly, lifetime)
- Feature checklist
- Animated selection
- Gradient tier cards
- Best value badges

**Trend:** Contextual Paywalls

#### EnhancedReportButton (`/components/ui/EnhancedReportButton.tsx`)
**Features:**
- Multi-step flow (2 steps)
- Category selection with chips
- Severity level selection
- Description input
- Progress indicator
- Haptic feedback

**Trend:** Gesture-First Navigation + Micro-Interactions

**Categories:**
- Harassment
- Hate Speech
- Spam or Scam
- Misinformation
- Violence or Threats
- Privacy Violation
- Impersonation
- Other

**Severity Levels:**
- Low: Minor issue, not urgent
- Medium: Needs attention
- High: Serious violation

#### EnhancedBlockButton (`/components/ui/EnhancedBlockButton.tsx`)
**Features:**
- Multi-step modal
- Reason selection
- Block consequences preview
- Undo toast (5 second window)
- Haptic feedback

**Trend:** Micro-Interactions + Privacy Transparency

**Block Reasons:**
- Harassment
- Spam
- Inappropriate Content
- Personal Preference
- Other

## Design Tokens

### Colors
- **Primary Purple:** `#8b5cf6`
- **Primary Pink:** `#ec4899`
- **Success Emerald:** `#10b981`
- **Warning Orange:** `#f97316`
- **Error Red:** `#ef4444`
- **Background Dark:** `#111827`
- **Border Dark:** `#1f2937`
- **Text Primary:** `#ffffff`
- **Text Secondary:** `#9ca3af`
- **Text Muted:** `#6b7280`

### Typography
- **Hero:** 32px, Bold
- **H1:** 28px, Bold
- **H2:** 24px, Bold
- **H3:** 20px, Semibold
- **Body:** 16px, Regular
- **Caption:** 14px, Regular
- **Small:** 12px, Medium

### Spacing
- **xs:** 4px
- **sm:** 8px
- **md:** 12px
- **lg:** 16px
- **xl:** 24px
- **2xl:** 32px

### Border Radius
- **sm:** 8px
- **md:** 12px
- **lg:** 16px
- **xl:** 20px
- **2xl:** 24px
- **3xl:** 32px

## Animation Specifications

### Spring Animations
```typescript
{
  damping: 15,
  stiffness: 300
}
```

### Timing Animations
- **Fast:** 150ms
- **Normal:** 250ms
- **Slow:** 350ms

### Haptic Feedback
- **Selection:** Light impact
- **Success:** Success notification
- **Error:** Error notification
- **Warning:** Warning notification
- **Medium:** Medium impact

## iOS Compliance

All components follow Apple App Store guidelines:
- **Guideline 4.2:** Native haptic feedback
- **Guideline 4.3:** Smooth animations (60fps)
- **Guideline 5.1.1:** Clear privacy indicators
- **Accessibility:** VoiceOver labels, minimum touch targets (44x44pt)

## Dependencies

Required packages for enhanced components:
- `expo-blur`: Blur effects
- `expo-linear-gradient`: Gradient backgrounds
- `react-native-reanimated`: Smooth animations
- `react-native-gesture-handler`: Gesture handling

## Migration Notes

### From Old Components
To migrate to enhanced components:
1. Replace `Button` with gradient variant for CTAs
2. Replace `Input` with enhanced version for forms
3. Replace `Modal` with enhanced version for dialogs
4. Add `StreakCard` for gamification features
5. Use `PrivacyDashboard` for data transparency

## Performance Considerations

- All animations use native driver where possible
- Skeleton states prevent layout shifts
- Lazy loading for large lists
- Image optimization for memory efficiency

## Future Enhancements

Planned for Q2 2026:
- [ ] Dark mode auto-detection
- [ ] Reduced motion support
- [ ] Dynamic Island support
- [ ] Widget components
- [ ] Apple Watch companion UI

---

Last Updated: February 12, 2026
Version: 1.0.0
