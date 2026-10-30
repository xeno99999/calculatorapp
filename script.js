// Calculator State
let currentOperand = '0';
let previousOperand = null;
let currentOperator = null;
let expressionHistory = '';
let resetInputOnNextDigit = false;
let toastTimeout = null;

// DOM Elements
const currentDisplay = document.getElementById('current');
const historyDisplay = document.getElementById('history');
const toastElement = document.getElementById('toast');
const keypad = document.querySelector('.keypad');

/**
 * Format number for clean display (handles floating point artifacts)
 */
function formatNumber(num) {
  if (isNaN(num)) return 'Error';
  if (!isFinite(num)) return 'Cannot divide by 0';

  // Round to max 10 decimal places to eliminate floating point issues (e.g. 0.1 + 0.2)
  const precision = 10;
  const factor = Math.pow(10, precision);
  const rounded = Math.round((num + Number.EPSILON) * factor) / factor;

  // If number exceeds standard length, use exponential notation
  const str = rounded.toString();
  if (str.length > 12) {
    return rounded.toExponential(6);
  }
  return str;
}

/**
 * Update UI display
 */
function updateDisplay() {
  currentDisplay.textContent = currentOperand;

  // Dynamic font sizing if number is long
  if (currentOperand.length > 12) {
    currentDisplay.style.fontSize = '1.55rem';
  } else if (currentOperand.length > 8) {
    currentDisplay.style.fontSize = '1.95rem';
  } else {
    currentDisplay.style.fontSize = '2.35rem';
  }

  // Update history display
  if (expressionHistory) {
    historyDisplay.textContent = expressionHistory;
  } else {
    historyDisplay.innerHTML = '&nbsp;';
  }

  // Highlight active operator button
  document.querySelectorAll('.btn-operator').forEach((btn) => {
    if (currentOperator && btn.dataset.operator === currentOperator) {
      btn.classList.add('active-op');
    } else {
      btn.classList.remove('active-op');
    }
  });
}

/**
 * Show toast message (e.g. when multiplication is attempted)
 */
function showToast(message) {
  if (toastTimeout) clearTimeout(toastTimeout);
  toastElement.textContent = message;
  toastElement.classList.add('show');
  toastTimeout = setTimeout(() => {
    toastElement.classList.remove('show');
  }, 2200);
}

/**
 * Handle number / decimal input
 */
function appendNumber(digit) {
  if (currentOperand === 'Cannot divide by 0' || currentOperand === 'Error') {
    clearAll();
  }

  if (resetInputOnNextDigit) {
    if (previousOperand === null) {
      // Starting a brand new calculation after equals
      expressionHistory = '';
    }
    currentOperand = digit === '.' ? '0.' : digit;
    resetInputOnNextDigit = false;
    updateDisplay();
    return;
  }

  if (digit === '.') {
    if (currentOperand.includes('.')) return; // Prevent multiple decimal points
    currentOperand += '.';
  } else {
    if (currentOperand === '0') {
      currentOperand = digit;
    } else {
      // Limit total digits to 14
      if (currentOperand.replace(/[^0-9]/g, '').length >= 14) return;
      currentOperand += digit;
    }
  }

  updateDisplay();
}

/**
 * Perform single calculation
 */
function compute(a, b, op) {
  const numA = parseFloat(a);
  const numB = parseFloat(b);

  if (isNaN(numA) || isNaN(numB)) return 'Error';

  switch (op) {
    case '+':
      return formatNumber(numA + numB);
    case '-':
      return formatNumber(numA - numB);
    case '/':
      if (numB === 0) return 'Cannot divide by 0';
      return formatNumber(numA / numB);
    default:
      return b;
  }
}

/**
 * Select Operator (+, -, /)
 */
function chooseOperator(op) {
  if (currentOperand === 'Cannot divide by 0' || currentOperand === 'Error') {
    return;
  }

  const symbol = op === '/' ? '÷' : (op === '-' ? '−' : '+');

  if (previousOperand !== null && !resetInputOnNextDigit) {
    // Chain intermediate operation
    const result = compute(previousOperand, currentOperand, currentOperator);
    if (result === 'Cannot divide by 0' || result === 'Error') {
      currentOperand = result;
      previousOperand = null;
      currentOperator = null;
      expressionHistory = '';
      resetInputOnNextDigit = true;
      updateDisplay();
      return;
    }
    previousOperand = result;
    currentOperand = result;
  } else {
    previousOperand = currentOperand;
  }

  currentOperator = op;
  expressionHistory = `${previousOperand} ${symbol}`;
  resetInputOnNextDigit = true;
  updateDisplay();
}

/**
 * Evaluate equals (=)
 */
function evaluate() {
  if (!currentOperator || previousOperand === null) return;

  const result = compute(previousOperand, currentOperand, currentOperator);
  const opSymbol = currentOperator === '/' ? '÷' : (currentOperator === '-' ? '−' : '+');
  
  expressionHistory = `${previousOperand} ${opSymbol} ${currentOperand} =`;
  currentOperand = result.toString();
  previousOperand = null;
  currentOperator = null;
  resetInputOnNextDigit = true;

  updateDisplay();
}

/**
 * Clear All (AC)
 */
function clearAll() {
  currentOperand = '0';
  previousOperand = null;
  currentOperator = null;
  expressionHistory = '';
  resetInputOnNextDigit = false;
  updateDisplay();
}

/**
 * Delete / Backspace (⌫)
 */
function backspace() {
  if (resetInputOnNextDigit || currentOperand === 'Cannot divide by 0' || currentOperand === 'Error') {
    clearAll();
    return;
  }

  if (currentOperand.length <= 1 || (currentOperand.length === 2 && currentOperand.startsWith('-'))) {
    currentOperand = '0';
  } else {
    currentOperand = currentOperand.slice(0, -1);
  }
  updateDisplay();
}

/**
 * Toggle sign (±)
 */
function toggleSign() {
  if (currentOperand === '0' || currentOperand === 'Cannot divide by 0' || currentOperand === 'Error') {
    return;
  }
  if (currentOperand.startsWith('-')) {
    currentOperand = currentOperand.slice(1);
  } else {
    currentOperand = '-' + currentOperand;
  }
  updateDisplay();
}

// Button Click Handling
keypad.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  const num = btn.dataset.number;
  const action = btn.dataset.action;
  const operator = btn.dataset.operator;

  if (num !== undefined) {
    appendNumber(num);
  } else if (operator) {
    chooseOperator(operator);
  } else if (action === 'equals') {
    evaluate();
  } else if (action === 'clear') {
    clearAll();
  } else if (action === 'delete') {
    backspace();
  } else if (action === 'negate') {
    toggleSign();
  }
});

/**
 * Helper to trigger button animation on keyboard press
 */
function flashButton(selector) {
  const btn = document.querySelector(selector);
  if (btn) {
    btn.classList.add('pressed');
    setTimeout(() => btn.classList.remove('pressed'), 120);
  }
}

// Keyboard Support
window.addEventListener('keydown', (e) => {
  // Check if user attempts multiplication via keyboard (* or x or X)
  if (e.key === '*' || e.key === 'x' || e.key === 'X') {
    e.preventDefault();
    showToast('Multiplication is disabled');
    return;
  }

  // Numbers 0-9
  if (/^[0-9]$/.test(e.key)) {
    e.preventDefault();
    appendNumber(e.key);
    flashButton(`button[data-number="${e.key}"]`);
    return;
  }

  // Decimal point
  if (e.key === '.' || e.key === ',') {
    e.preventDefault();
    appendNumber('.');
    flashButton(`button[data-number="."]`);
    return;
  }

  // Allowed operators: + - /
  if (e.key === '+') {
    e.preventDefault();
    chooseOperator('+');
    flashButton(`button[data-operator="+"]`);
    return;
  }
  if (e.key === '-') {
    e.preventDefault();
    chooseOperator('-');
    flashButton(`button[data-operator="-"]`);
    return;
  }
  if (e.key === '/') {
    e.preventDefault();
    chooseOperator('/');
    flashButton(`button[data-operator="/"]`);
    return;
  }

  // Equals / Enter
  if (e.key === 'Enter' || e.key === '=') {
    e.preventDefault();
    evaluate();
    flashButton(`button[data-action="equals"]`);
    return;
  }

  // Backspace
  if (e.key === 'Backspace') {
    e.preventDefault();
    backspace();
    flashButton(`button[data-action="delete"]`);
    return;
  }

  // Clear (Escape or Delete or c / C)
  if (e.key === 'Escape' || e.key === 'Delete' || e.key.toLowerCase() === 'c') {
    e.preventDefault();
    clearAll();
    flashButton(`button[data-action="clear"]`);
    return;
  }
});

// Initial display setup
updateDisplay();
