# Simple Calculator (Without Multiplication)

A sleek, responsive calculator web app created strictly without a multiplication operator.

## Features
- **Supported Operations**: Addition (`+`), Subtraction (`−`), Division (`÷`).
- **No Multiplication**: Multiplication (`×` / `*`) is completely removed from the keypad and actively blocked with a friendly alert if pressed on a keyboard.
- **Additional Utilities**:
  - `AC` (All Clear)
  - `⌫` (Backspace / Delete)
  - `±` (Sign Inverter)
  - Floating-point accuracy handling (e.g. `0.1 + 0.2 = 0.3`)
  - Division by zero safety check (`Cannot divide by 0`)
- **Calculation History Panel**:
  - View previous calculations and their computed results.
  - Click or press Enter on any history item to recall its result back into the calculator.
  - Persistent storage via `localStorage` across page reloads.
  - Dedicated Clear History action.
  - Toggle with the history button in the header or by pressing `H`.
- **Keyboard Support**:
  - `0`–`9` and `.` for numeric entry
  - `+`, `-`, `/` for operations
  - `*`, `x`, `X` trigger a notification that multiplication is disabled
  - `Enter` or `=` to compute
  - `Backspace` to delete
  - `Escape` or `c` to clear (or closes history if open)
  - `h` or `H` to toggle calculation history panel

## How to Run
Simply open `index.html` in any web browser, or serve it using your preferred local development server.
