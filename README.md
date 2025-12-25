# Magni

**Magni** is an all-in-one Weight Tracker, Macro Tracker and Workout Planner!

See the site at: https://swole.zoopdeeboop.uk/

## Project Structure

```
SwoleExperienceReact/
├── modi/              # Backend API (Modi/Móði - Go + Gin)
└── magni/             # Frontend (Magni - React Native/Expo)
```

## Components

### Magni (Frontend)
React Native (Expo) application with web support. See [magni/README](magni/README.md) for setup and development instructions.

### Modi (Móði) - Backend API
Go + Gin backend API server providing:
- User authentication and authorization
- Cross-device data synchronization
- GDPR-compliant data management
- Macro tracking with shared food database
- Future ML/OCR capabilities for nutrition label scanning

See [modi/BACKEND_ARCHITECTURE.md](modi/BACKEND_ARCHITECTURE.md) for detailed architecture documentation.

### Current State of Things
1. The migration to react is complete and the site is live!
3. A backend (Modi) with login and device syncing is planned and currently under development
4. A macro tracker is planned and will start development soon (hopefully)
5. Some AI and machine vision features are planned but are a long way off
