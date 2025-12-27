# Development Scripts

Scripts to start and manage all components of the POS system.

> 📖 **For complete documentation**, see the main [README.md](../Readme.md) at the workspace root.

## Quick Start

### Start All Components
```bash
# From workspace root
./scripts/start-all.sh
# or
npm start
```

This will start:
- **API Server** on http://localhost:3001
- **Admin Panel** on http://localhost:3000
- **Mobile App** in iOS Simulator

### Start Individual Components

```bash
# Start only API
./scripts/start-all.sh --api-only
# or
npm run start:api

# Start only Admin
./scripts/start-all.sh --admin-only
# or
npm run start:admin

# Start only Mobile
./scripts/start-all.sh --mobile-only
# or
npm run start:mobile

# Start API and Admin (no mobile)
./scripts/start-all.sh --no-mobile
```

### Stop All Components

```bash
# From workspace root
./scripts/stop-all.sh
# or
npm run stop
```

## Scripts

### `start-all.sh`
Main script to start all components. It:
- Checks Docker is running (for database)
- Verifies database connection
- Starts API server in background (from `src/system-pos/apps/api`)
- Starts Admin panel in background (from `src/system-pos/apps/admin`)
- Launches Mobile app in iOS Simulator (from `src/system-pos/apps/mobile`)

**Options:**
- `--api-only` - Start only API server
- `--admin-only` - Start only Admin panel
- `--mobile-only` - Start only Mobile app
- `--no-mobile` - Start API and Admin (skip mobile)
- `--no-admin` - Start API and Mobile (skip admin)
- `--no-api` - Start Admin and Mobile (skip API)

**Background Processes:**
- Process IDs are saved to `/tmp/api-server.pid`, `/tmp/admin-server.pid`, `/tmp/mobile-ios.pid`
- Logs are written to `/tmp/api-server.log`, `/tmp/admin-server.log`, `/tmp/mobile-ios.log`

**Paths:**
- Scripts are located in: `/Users/bationoyvesjunior/workspace/emiconfection/scripts/`
- POS system is located in: `/Users/bationoyvesjunior/workspace/emiconfection/src/system-pos/`

### `stop-all.sh`
Stops all running components by:
- Killing processes using saved PIDs
- Killing any processes on ports 3001 and 3002
- Cleaning up PID files

## Logs

View logs for each component:
```bash
# API Server
tail -f /tmp/api-server.log

# Admin Panel
tail -f /tmp/admin-server.log

# Mobile App
tail -f /tmp/mobile-ios.log
```

## Prerequisites

1. **Docker** - Must be running for database
2. **Node.js** - Installed in each app directory
3. **Xcode** - Required for iOS Simulator (for mobile app)
4. **Database** - PostgreSQL should be accessible (auto-started via Docker if needed)

> 💡 **See [README.md](../Readme.md) for:**
> - Database seeding instructions
> - Complete troubleshooting guide
> - Testing instructions
> - Default credentials

## Notes

- All components run in the background
- Process IDs are saved to `/tmp/*.pid` files
- Logs are written to `/tmp/*.log` files
- Press `Ctrl+C` in the terminal running `start-all.sh` to stop all services
- Or use `stop-all.sh` to stop services from another terminal

