# TKO Toy Co Loyalty Program

A premium loyalty program system for TKO Toy Co, designed to track customer spending across in-store and online channels, assign loyalty tiers, and provide exclusive rewards and benefits.

## Project Overview

The TKO Toy Co Loyalty Program is a custom-built solution that integrates with existing Shopify and POS Binder systems to create a seamless loyalty experience for both staff and customers. The program features physical membership cards, tier-based rewards, and a comprehensive admin dashboard for program management.

### Key Features

- Customer spending tracking across online and in-store channels
- Tier-based loyalty system with configurable thresholds
- Physical membership cards with NFC/barcode capabilities
- Reward management and distribution
- Admin dashboard for program configuration and analytics
- Seamless integration with Shopify and POS Binder
- Email notifications for tier changes and rewards

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or Yarn
- PostgreSQL (v13+)
- Redis
- Git

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/TKOToyCo/loyalty-program.git
   cd loyalty-program
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Set up environment variables:

   ```
   cp .env.example .env
   ```

   Edit the `.env` file with your configuration settings.

4. Set up the database:

   ```
   npm run db:setup
   ```

5. Start the development server:
   ```
   npm run dev
   ```

## Project Structure

```
loyalty-program/
├── memory-bank/          # Project documentation and context
├── src/                  # Source code
│   ├── backend/          # Backend API and services
│   ├── frontend/         # React frontend application
│   └── shared/           # Shared code and types
├── scripts/              # Utility scripts
├── config/               # Configuration files
└── tests/                # Test files
```

## Memory Bank

This project uses a Memory Bank approach for comprehensive documentation. The Memory Bank contains all project context, decisions, and progress tracking.

Key Memory Bank files:

- `memory-bank/projectbrief.md` - Core requirements and goals
- `memory-bank/productContext.md` - Business context and user experience goals
- `memory-bank/systemPatterns.md` - System architecture and design patterns
- `memory-bank/techContext.md` - Technology stack and technical decisions
- `memory-bank/activeContext.md` - Current work focus and active decisions
- `memory-bank/progress.md` - Project status and milestone tracking

## Development Workflow

1. Create a feature branch from `main`
2. Implement your changes
3. Write tests for your changes
4. Submit a pull request
5. After review and approval, merge to `main`

## License

Proprietary - All rights reserved by TKO Toy Co.

## Contact

For questions or support, contact the development team at [dev@tkotoyco.com](mailto:dev@tkotoyco.com).
