// Compare a student's selected answer against a question's correct answer.
// Handles multiple-choice (A/B/C/D) and grid-in (numeric) question types.
export function isAnswerCorrect(q, sel) {
  if (!q) return false;
  if (q.question_type === "grid_in") {
    if (sel == null || String(sel).trim() === "") return false;
    const a = parseFloat(String(sel).trim());
    const b = parseFloat(String(q.numeric_answer).trim());
    if (!isNaN(a) && !isNaN(b)) return Math.abs(a - b) < 1e-9;
    // Fraction support, e.g. "7/2"
    const fracA = parseFraction(sel);
    const fracB = parseFraction(q.numeric_answer);
    if (fracA != null && fracB != null) return Math.abs(fracA - fracB) < 1e-9;
    return String(sel).trim() === String(q.numeric_answer).trim();
  }
  return sel === q.correct_answer;
}

function parseFraction(v) {
  const s = String(v).trim();
  const idx = s.indexOf("/");
  if (idx === -1) return null;
  const num = parseFloat(s.slice(0, idx));
  const den = parseFloat(s.slice(idx + 1));
  if (isNaN(num) || isNaN(den) || den === 0) return null;
  return num / den;
}

// Human-readable label for the correct answer (letter or number).
export function correctAnswerLabel(q) {
  return q?.question_type === "grid_in" ? q.numeric_answer : q?.correct_answer;
}
