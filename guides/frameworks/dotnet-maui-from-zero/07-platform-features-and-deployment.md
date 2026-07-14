---
title: "Platform Features & Deployment"
guide: "dotnet-maui-from-zero"
phase: 7
summary: "One C# call reaches each platform's native features - sensors, connectivity, permissions. When that's not enough, drop into per-platform code. Then package your app for the stores."
tags: [dotnet-maui, csharp, platform, deployment, permissions]
difficulty: intermediate
synonyms: ["maui essentials", "maui platform specific code", "maui permissions", "maui deploy android ios", "maui build store", "maui geolocation"]
updated: 2026-07-10
---

# Platform Features & Deployment

MAUI gives you **one C# API that reaches each platform's native features** - the GPS chip, the
network state, the battery, the clipboard. Call one method, and MAUI talks to Android's location
services on Android and Apple's on iOS. For the rare case the shared API doesn't cover, you drop
into the `Platforms/` folders with native code guarded by `#if`. Once the app does what you want,
you **package it per store** - a different bundle and signing process for each target.

Three moves, in order: reach native features with shared code, escape to platform code only
when forced, then ship. Our notes app has lived on a single codebase since Phase 1, and that's
about to pay off - the same app, with the same logic, becomes an Android `.aab`, an iOS build,
and a Windows `.msix`.

> 📝 These device APIs used to be a separate package called **Xamarin.Essentials**. In modern
> MAUI they're built in, under namespaces like `Microsoft.Maui.Devices` and
> `Microsoft.Maui.ApplicationModel`. If you find old tutorials importing `Xamarin.Essentials`,
> that's the same feature set - the names just moved.

## Device APIs - one call, all platforms

A phone is a pile of sensors and services: location, network, battery, contacts, the camera.
Each platform exposes these through its own native SDK with its own types and ceremony. MAUI
wraps the common ones so you write the call **once**.

Take connectivity. Before our notes app syncs to a server, it should know whether there's a
network at all - firing an `HttpClient` request into airplane mode just gives a slow,
confusing failure. One property tells you:

```csharp
using Microsoft.Maui.Networking;

async Task SyncNotesAsync()
{
    if (Connectivity.Current.NetworkAccess != NetworkAccess.Internet)
    {
        await Shell.Current.DisplayAlert(
            "Offline",
            "You're not connected. Your notes are saved locally and will sync later.",
            "OK");
        return;
    }

    // We have a connection - safe to call the API (Phase 6).
    await _notesApi.PushAsync(_notes);
}
```

*What just happened:* `Connectivity.Current.NetworkAccess` returns an enum describing the
device's network state. We check for `Internet` *before* touching the network, so an offline
user gets a clear message instead of a timeout. The exact same code runs on Android, iOS, and
Windows - MAUI asks each platform's connectivity API under the hood.

Want to react when the connection changes mid-session? Subscribe to an event:

```csharp
Connectivity.Current.ConnectivityChanged += (s, e) =>
{
    bool online = e.NetworkAccess == NetworkAccess.Internet;
    SyncBanner.IsVisible = !online; // show an "offline" banner when we drop
};
```

*What just happened:* `ConnectivityChanged` fires whenever the device gains or loses a
connection. We flip a banner's visibility so the user always knows the app's sync state.

That single-call shape repeats across the whole family. A quick map of the ones you'll reach
for most:

| API | What it gives you | Example call |
|-----|-------------------|--------------|
| `Geolocation` | Current GPS coordinates | `await Geolocation.GetLocationAsync()` |
| `Connectivity` | Network state + changes | `Connectivity.Current.NetworkAccess` |
| `Battery` | Charge level, charging state | `Battery.Default.ChargeLevel` |
| `DeviceInfo` | Model, OS version, platform | `DeviceInfo.Current.Platform` |
| `Clipboard` | Copy/paste text | `await Clipboard.SetTextAsync(note)` |
| `Email` / `Browser` | Open a composer / a URL | `await Browser.OpenAsync(url)` |
| `Preferences` | Small key-value storage (Phase 6) | `Preferences.Set("key", value)` |

`DeviceInfo` is handy for branching on platform without leaving C#:

```csharp
using Microsoft.Maui.Devices;

if (DeviceInfo.Current.Platform == DevicePlatform.iOS)
{
    // e.g. nudge layout for the iOS status bar
}
```

*What just happened:* `DeviceInfo.Current.Platform` tells you which OS you're running on at
runtime, so you can make small adjustments in shared code without dropping into a `Platforms/`
folder. Use it for tweaks; use platform code below for genuinely native behavior.

## Permissions - ask, and declare

Some features touch private user data - location, camera, contacts. Both Android and iOS guard
these behind **runtime permission prompts**: the OS asks the user, at the moment of use, whether
your app may have access. MAUI gives you a shared API to check and request:

```csharp
using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Devices.Sensors;

async Task<Location?> GetCurrentLocationAsync()
{
    var status = await Permissions.CheckStatusAsync<Permissions.LocationWhenInUse>();

    if (status != PermissionStatus.Granted)
        status = await Permissions.RequestAsync<Permissions.LocationWhenInUse>();

    if (status != PermissionStatus.Granted)
        return null; // user said no - degrade gracefully, don't crash

    return await Geolocation.Default.GetLocationAsync();
}
```

*What just happened:* we **check** the current permission status first (no need to nag a user
who already said yes), and only **request** if we don't have it. If the user declines, we
return `null` and the caller handles the no-location case. For our notes app, this might tag a
note with "where it was written," skipping the tag gracefully if location is off.

> ⚠️ The C# call is only half the job. Each platform also requires you to **declare** the
> permission in its manifest - and the request will **silently fail** (or the store will
> **reject your app**) if you forget. The declaration is per-platform:
>
> - **Android** → an entry in `Platforms/Android/AndroidManifest.xml`:
>   ```
>   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
>   ```
> - **iOS** → a *usage-description string* in `Platforms/iOS/Info.plist`. Apple shows your text
>   to the user in the prompt and rejects apps that omit it:
>   ```
>   <key>NSLocationWhenInUseUsageDescription</key>
>   <string>We tag notes with where you wrote them.</string>
>   ```

Two halves, every time: **request in C#, declare in the manifest.** When a permission
"doesn't work," a missing manifest entry is the first thing to check.

## Platform-specific code - only when you must

The shared APIs cover a lot, but not everything. Sometimes you need behavior that exists only on
one platform - a native widget, a vendor SDK, an OS-specific tweak. MAUI gives you three escape
hatches.

**1. Conditional compilation with `#if`.** The compiler defines a symbol per target
(`ANDROID`, `IOS`, `MACCATALYST`, `WINDOWS`), so you can fence off platform code inline:

```csharp
public void Vibrate()
{
#if ANDROID
    var vibrator = Android.Views.View.GetSystemService(/* ... Android API ... */);
    // call into the native Android vibrator
#elif IOS
    UIKit.UIImpactFeedbackGenerator
        .Init(UIKit.UIImpactFeedbackStyle.Medium)
        .ImpactOccurred();
#endif
}
```

*What just happened:* the code inside `#if ANDROID` only compiles into the Android build, and
`#elif IOS` only into the iOS build. Each branch calls that platform's native API directly.
Great for a one-off; messy if it sprawls.

**2. The `Platforms/` folders + partial classes.** For anything bigger, MAUI's project layout
already separates native code into `Platforms/Android/`, `Platforms/iOS/`, and so on. Declare a
`partial` method in shared code and implement it once per platform folder - same shape as `#if`,
but each platform's code lives in its own clean file.

**3. An interface with per-platform implementations.** The cleanest pattern for real native
features: define an interface in shared code, write one implementation per platform, and inject
the right one via dependency injection.

```csharp
// Shared code - the contract
public interface IDeviceTorch
{
    Task ToggleAsync(bool on);
}

// In a ViewModel - depend on the abstraction, never the platform
public class NoteEditorViewModel(IDeviceTorch torch)
{
    public Task FlashAsync() => torch.ToggleAsync(true);
}
```

*What just happened:* the ViewModel knows only `IDeviceTorch` - pure shared C#, fully testable.
The Android and iOS implementations live in their `Platforms/` folders and get registered with
the DI container at startup. Your app logic never sees a platform type.

> 💡 Reach for these only when the cross-platform API doesn't cover you. Most of what an app
> needs already has a shared API - check the device-API table first. Platform code is a tool
> for the edges, not the default.

## Deployment - package per store

Your notes app runs. Now you turn one codebase into store-ready bundles. Each target produces a
different artifact with its own signing, icons, and review process - the build command picks the
target with `-f`:

**Android** → a signed `.aab` (Android App Bundle, what Google Play wants) or `.apk`:

```bash
dotnet publish -f net8.0-android -c Release
```

*What just happened:* `dotnet publish` compiles a Release build for the Android target and
produces the app bundle. Sign it with a keystore (Google Play also offers managed signing) and
upload it to the Play Console. The `.aab` lets Google generate device-optimized APKs per user.

**iOS / Mac Catalyst** → an App Store build:

```bash
dotnet publish -f net8.0-ios -c Release
```

> ⚠️ Building and shipping iOS **requires a Mac** - Apple's toolchain (the signing and packaging
> step) only runs on macOS. You'll also need an **Apple Developer account** (paid) and
> **provisioning profiles** that tie your app ID and signing certificate together. There's no way
> around the Mac; even from a Windows dev box, the final iOS build runs on a connected or remote
> Mac.

**Windows** → an `.msix` package for the Microsoft Store or sideloading:

```bash
dotnet publish -f net8.0-windows10.0.19041.0 -c Release
```

*What just happened:* this produces an `.msix`, Windows' modern app-package format. Submit it
to the Microsoft Store or distribute it directly (sideloading) with a trusted certificate.

Each store then has its **own** gauntlet: signing keys to guard, icon and splash assets at the
right sizes, metadata and screenshots, and a review queue. Apple's review is the strictest - 
budget days, not minutes. Packaging is the easy part; store paperwork is where first-time
shippers lose time.

> 📝 The mechanics of *actually getting through a store review* - assets, metadata, privacy
> labels, beta tracks, and the waiting - are their own discipline. The
> [Ship Your Side Project](/guides/ship-your-side-project) guide walks the whole release path,
> and it applies directly here.

## Recap

- **One C# API reaches each platform's native features.** `Geolocation`, `Connectivity`,
  `Battery`, `DeviceInfo`, `Clipboard`, and friends are single calls that work everywhere - 
  check connectivity before syncing, read the GPS, copy text, all from shared code.
- **Permissions are two halves: request in C#, declare in the manifest.** Use
  `Permissions.CheckStatusAsync<T>()` / `RequestAsync<T>()`, AND add the entry to
  `AndroidManifest.xml` / `Info.plist`. ⚠️ A missing manifest entry fails silently or gets the
  app rejected.
- **Drop into platform code only when forced** - `#if ANDROID`, `Platforms/` partial classes,
  or an interface with per-platform implementations behind DI. Check the shared APIs first.
- **Package per target:** Android `.aab` via `dotnet publish -f net8.0-android`, iOS (⚠️ needs a
  Mac + Apple Developer account + provisioning profiles), Windows `.msix`. Each store brings its
  own signing, assets, and review.
- The whole point of MAUI pays off here: the same notes app, one codebase, becomes a native
  bundle on every platform.

## Quick check

```quiz
[
  {
    "q": "Your app calls Permissions.RequestAsync<Permissions.LocationWhenInUse>() and the GPS read still fails on a real Android device. What's the most likely cause?",
    "choices": ["MAUI doesn't support location on Android", "You forgot to declare the permission in AndroidManifest.xml", "You must use #if ANDROID for all location code", "Connectivity is off"],
    "answer": 1,
    "explain": "The C# request is only half the job - Android also needs the matching <uses-permission> entry in AndroidManifest.xml, and iOS needs a usage-description string in Info.plist. Without the manifest declaration, the request silently fails."
  },
  {
    "q": "Before syncing notes to a server, which API tells you whether the device has a network connection?",
    "choices": ["DeviceInfo.Current.Platform", "Battery.Default.ChargeLevel", "Connectivity.Current.NetworkAccess", "Preferences.Get"],
    "answer": 2,
    "explain": "Connectivity.Current.NetworkAccess returns the device's network state. Checking for NetworkAccess.Internet before an HttpClient call lets you fail fast and show an offline message instead of waiting on a timeout."
  },
  {
    "q": "Which deployment fact is true?",
    "choices": ["iOS apps can be built and shipped entirely from Windows with no Mac", "Android publishes to a .msix package", "Building/shipping iOS requires a Mac, an Apple Developer account, and provisioning profiles", "Windows apps ship as a signed .aab"],
    "answer": 2,
    "explain": "Apple's toolchain only runs on macOS, so iOS needs a Mac plus a paid Apple Developer account and provisioning profiles. Android ships an .aab/.apk; Windows ships an .msix."
  }
]
```

---

[← Phase 6: Data & Calling APIs](06-data-and-apis.md) · [Guide overview](_guide.md) · [Phase 8: Where to Go Next →](08-where-to-go-next.md)
