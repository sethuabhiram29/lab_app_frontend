// Utility to safely evaluate formula strings with a variable 'Reading'
export function calculateFormula(formula, reading) {
  if (typeof formula !== 'string' || formula.trim() === '') return reading;
  let result = reading;
  try {
    // Replace 'Reading' (case-insensitive) with the value
    const expr = formula.replace(/reading/gi, reading);
    // Only allow numbers, operators, parentheses, and decimal points
    if (!/^[-+*/().0-9\s]+$/.test(expr.replace(/reading/gi, ''))) {
      throw new Error('Unsafe formula');
    }
    // eslint-disable-next-line no-eval
    result = eval(expr);
  } catch (e) {
    result = reading; // fallback to input if error
  }
  // Round up to 1 decimal place
  if (typeof result === 'number' && !isNaN(result)) {
    result = Math.ceil(result * 10) / 10;
    // To always show 1 decimal, convert to string with 1 decimal
    return result.toFixed(1);
  }
  return result;
}
