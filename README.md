# Simple Calculator (Without Multiplication)

A sleek, responsive calculator web app created strictly without a multiplication operator.

## Features
- **Dual Mode: DEC & BIN**:
  - Toggle between **DEC** and **BIN** using the segmented mode selector or by pressing `B`.
  - In **BIN Mode**:
    - Keypad adapts dynamically: only binary digits `0` and `1` (plus `.` for binary fractions) are active; digits `2`–`9` are disabled.
    - Keyboard inputs `2`–`9` are intercepted with an informative prompt.
    - Full binary arithmetic supported: addition, subtraction, and division.
    - Real-time dual base conversion preview (shows equivalent value in the other mode).
    - Switching modes smoothly converts values between DEC and BIN in real-time.
- **Supported Operations**: Addition (`+`), Subtraction (`−`), Division (`÷`).
- **No Multiplication**: Multiplication (`×` / `*`) is completely removed from the keypad and actively blocked with a friendly alert if pressed on a keyboard.
- **Additional Utilities**:
  - `AC` (All Clear)
  - `⌫` (Backspace / Delete)
  - `±` (Sign Inverter)
  - Floating-point accuracy handling (e.g. `0.1 + 0.2 = 0.3`)
  - Division by zero safety check (`Cannot divide by 0`)
- **Calculation History Panel**:
  - View previous calculations and their computed results tagged with base (`[BIN]` or `[DEC]`).
  - Click or press Enter on any history item to recall its result back into the calculator (automatically syncing the base mode).
  - Persistent storage via `localStorage` across page reloads.
  - Dedicated Clear History action.
  - Toggle with the history button in the header or by pressing `H`.
- **Keyboard Support**:
  - `0`–`9` and `.` for numeric entry (in BIN mode, `2`–`9` are blocked)
  - `+`, `-`, `/` for operations
  - `*`, `x`, `X` trigger a notification that multiplication is disabled
  - `b` or `B` to switch between DEC and BIN modes
  - `h` or `H` to toggle calculation history panel
  - `Enter` or `=` to compute
  - `Backspace` to delete
  - `Escape` or `c` to clear (or closes history if open)

## How to Run
Simply open `index.html` in any web browser, or serve it using your preferred local development server.
