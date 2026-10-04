# Quiz App

A modern quiz application built with React, TypeScript, and Vite that allows users to create quizzes and let participants join by scanning a QR code.

## Features

- Interactive quiz creation and management
- Real-time quiz participation
- QR code joining: no phone numbers or accounts needed
- Modern, responsive user interface
- TypeScript for type safety and better development experience

## Technical Stack

- React + TypeScript
- Vite for fast development and building
- Modern UI components and styling
- `qrcode.react` for the join QR code

## How Joining Works

After creating a quiz, the host sees a QR code. Participants scan it, enter a name, and wait in the lobby. The quiz begins when the host clicks Start; nobody can join after that.

The QR code points at the address the host's browser is using, so when developing locally open the app via your machine's LAN address (not `localhost`) if you want to scan it with a phone.

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Development

The project uses ESLint for code quality and TypeScript for type safety. The configuration is set up to provide a good balance between strict type checking and development convenience.

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## License

MIT
