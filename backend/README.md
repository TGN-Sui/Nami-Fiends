# Nami Backend

## Purpose

The backend indexes Nami Sui events and prepares app-ready views for the frontend and SDK.

The first backend service is a lightweight event indexer.

## Current Status

This backend currently supports:

- Sui client setup
- Package event polling
- Module-based event indexing
- Cursor persistence
- Local JSONL event log output

## Setup

```bash
cd backend
npm install
cp .env.example .env