# Atsumalo
```
-----------------------------------------------------------------------
   ##     ######    #####   ##   ##  ##   ##    ##     ####      #####
  ####    # ## #   ##   ##  ##   ##  ### ###   ####     ##      ##   ##
 ##  ##     ##     #        ##   ##  #######  ##  ##    ##      ##   ##
 ##  ##     ##      #####   ##   ##  #######  ##  ##    ##      ##   ##
 ######     ##          ##  ##   ##  ## # ##  ######    ##   #  ##   ##
 ##  ##     ##     ##   ##  ##   ##  ##   ##  ##  ##    ##  ##  ##   ##
 ##  ##    ####     #####    #####   ##   ##  ##  ##   #######   #####
-----------------------------------------------------------------------
```

An event and schedule coordination tool designed for laboratories and small groups.
Easily coordinate meetings and events among members by simply sharing a dedicated URL. It also features a reservation calendar and scheduling capabilities to centralize the management of laboratory equipment and room usage.

## Features
- Event schedule coordination via URL sharing (Chouseisan-like functionality)
- Flexible configuration of multiple date and time candidates
- Calendar-based booking for equipment and rooms
- Reservation history and notification capability for each member
- Administrative interface to manage resources and users
- Fast UI built with Next.js 15 and React 19
- Responsive styling powered by Tailwind CSS
- Authentication and real-time data management with Firebase

## Requirements
- Node.js 18 or later
- Yarn

## Setup
```bash
yarn install
```

## Running the development server
```bash
yarn dev
```
Open http://localhost:3000 in your browser.

## Build
```bash
yarn build
```

## Production start
```bash
yarn start
```

## Lint and test
```bash
yarn lint
yarn test
```

## MCP (Model Context Protocol) / APM

Atsumalo supports the Model Context Protocol (MCP), enabling AI agents (Claude Code, Cursor, GitHub Copilot, etc.) to create events and submit availability.

### Installation via APM (Agent Package Manager)

You can easily integrate Atsumalo into your agent environment using [APM (Agent Package Manager)](https://github.com/microsoft/apm).

#### Install as a package
```bash
apm install dekopon21020014/atsumalo
```

#### Or install the MCP server directly
```bash
apm install --mcp atsumalo --transport http --url https://atsumalo.vercel.app/api/mcp
```

#### In your `apm.yml`
Add the following to your `apm.yml` and run `apm install`:
```yaml
dependencies:
  mcp:
    - name: atsumalo
      registry: false
      transport: http
      url: https://atsumalo.vercel.app/api/mcp
```

### Available Tools
- `create_event`: Creates a new scheduling event (recurring or onetime) and returns the event URL (`https://atsumalo.vercel.app/events/<eventId>`).
- `submit_answer`: Submits a participant's availability answers to an event (returns `editToken` if required).
