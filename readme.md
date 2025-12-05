# VM Configuration Validator

A desktop application for validating and setting up VM configurations across multiple servers. Built with  React, NestJS, TypeScript, and SQLite.

## 📋 Features

- ✅ Validate 7 critical VM configurations
- 🔧 Automated setup for missing configurations
- 💾 SQLite database for local storage
- 🔐 Secure SSH connection handling
- 📊 Execution logs

## 🎯 Configuration Checks

1. **User & Group Setup** - Verify user and user group exist
2. **Ulimit Configuration** - Check `/etc/security/limits.conf`
3. **Security Limits** - Validate `/etc/security/limits.d/` settings
4. **Sysctl Configuration** - Verify kernel parameters in `/etc/sysctl.conf`
5. **JVM Installation** - Check Java version and JAVA_HOME
6. **Thread Pool Settings** - Validate application thread pool configuration
7. **Garbage Collector** - Verify JVM GC settings

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- yarn
- Git

### Installation

#### Frontend

```bash
# Clone the repository
git clone <vm-configurator-url>
cd <vm-configurator-url>/frontend

# Install dependencies
yarn install

# set env
NEXT_PUBLIC_API_URL=http://localhost:3001

# Start development server
yarn run dev
```

The app will open automatically at `http://localhost:3000` (or similar port).

#### Backend

```bash
# Clone the repository
git clone <vm-configurator-url>
cd <vm-configurator-url>/backend

# Install dependencies
yarn install

# set env
PORT=3001 or your port

# Start development server
yarn run dev
```

The app will open automatically at `http://localhost:3001` (or similar port).

---