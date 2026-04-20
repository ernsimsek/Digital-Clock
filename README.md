# VOID.TERMINAL - Digital Clock

An interactive clock application built with `Next.js`.

This project combines 3 time tools in a single interface:
- Digital clock (with timezone support)
- Stopwatch (with lap tracking)
- Pomodoro timer (25/5 work-break cycle)

## Features

- **Live clock display**: Updates hours/minutes/seconds and date in real time.
- **Timezone selection**: Switch between Local, UTC, and multiple city timezones.
- **Stopwatch**: Start/pause, reset, and lap recording.
- **Pomodoro**: Work/Break modes, remaining time indicator, and completed session counter.
- **Custom UI style**: Neon cyberpunk design, glitch effects, and terminal-inspired interface.

## Tech Stack

- `Next.js 14`
- `React 18`
- `TypeScript`
- `CSS` (custom theme via global stylesheet)

## Setup

Run the following commands to start the project locally:

```bash
npm install
npm run dev
```

Then open:

[`http://localhost:3000`](http://localhost:3000)

## Available Scripts

- `npm run dev` - Starts the app in development mode.
- `npm run build` - Creates a production build.
- `npm run start` - Runs the production build.

## Project Structure

```text
.
├─ app/
│  ├─ layout.tsx      # Root layout and metadata
│  ├─ page.tsx        # Main clock/stopwatch/pomodoro interface
│  └─ globals.css     # Global styles and animations
├─ next.config.mjs
├─ package.json
└─ README.md
```

## Development Notes

- The app is currently designed as a client-side (`use client`) single-page experience.
- Pomodoro durations are hardcoded in the source (`25 min` work, `5 min` break).
- Design language and UI copy are customized around the "VOID.TERMINAL" theme.

<img width="1919" height="1079" alt="Ekran görüntüsü 2026-04-20 121243" src="https://github.com/user-attachments/assets/2a1e0504-429e-48cc-8556-7484a55201ff" />

## License

This project may currently be intended for private/internal use. If you want to open-source it, you can update this section with `MIT` (or your preferred license).
