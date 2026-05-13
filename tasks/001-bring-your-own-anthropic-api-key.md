---
id: "001"
title: Bring-your-own Anthropic API key
status: backlog
area: settings
priority: normal
started:
finished:
---

## Description

Let end users supply their own Anthropic API key instead of using the shared key baked into the build. Store the key locally in iOS Keychain / Android Keystore via `expo-secure-store`, expose a Settings UI to paste/clear it, and switch `claudeApi.js` to read from the secure store rather than `@env`. Once shipped, the EAS secret + `eas-build-pre-install` hook can be removed.

## Work log

- 2026-05-13: filed to backlog. Decided to keep the baked-in key for TestFlight dogfooding and revisit before public release.

## Summary

_(filled in at /task-done)_
