# FlowLens AI

### AI-Powered Operations Intelligence & SLA Monitoring Platform

FlowLens AI is an operations intelligence platform designed to help teams identify process bottlenecks, monitor SLA violations, and understand operational performance through a unified dashboard.

## Problem

Operational data is often scattered across process records, making it difficult to quickly identify where delays and SLA violations are occurring.

FlowLens AI consolidates operational data into a single intelligence layer that highlights bottlenecks, processing times, SLA breaches, and active incidents.

## Key Features

- Operations performance dashboard
- Stage-level processing analysis
- SLA breach monitoring
- Automated bottleneck scoring
- Active incident detection
- AI-powered operational Q&A
- PostgreSQL-backed data layer
- Power BI analytics integration

## Tech Stack

**Frontend**
- React
- Vite
- JavaScript
- CSS
- Lucide React

**Backend**
- FastAPI
- Python
- PostgreSQL
- psycopg

**Analytics**
- Power BI
- DAX

## Architecture

CSV / Operational Data
→ PostgreSQL
→ FastAPI
→ React Dashboard
→ Operations Intelligence

The AI assistant uses the operational data exposed by the backend to answer questions about bottlenecks, SLA breaches, and process performance.

## Current Insights

The current dataset contains 25,000 process cases across five operational stages.

The highest bottleneck score is observed in Document Verification, with:

- 670 SLA breaches
- 13.40% breach rate
- 13.91 hours average processing time

Credit Assessment follows with:

- 371 SLA breaches
- 7.42% breach rate
- 11.58 hours average processing time

## Project Structure

```text
FlowLensAI/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── requirements.txt
│   └── .env
├── data/
│   └── raw/
├── docs/
│   └── powerbi/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── scripts/
├── sql/
└── workflows/