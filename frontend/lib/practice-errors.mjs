/** Plain-language messages for the practice page, plus the AI-mentor switch. No dependencies, so it is easy to test. */

/** @param {number | undefined} status HTTP status, or undefined when the server could not be reached */
export function practiceLoadMessage(status) {
  if (status === undefined) return "We couldn't reach the server. Check your connection and try again.";
  if (status === 401) return "Please log in again.";
  if (status === 403) return "Your teacher needs to record your parent or guardian's consent before you can start. Please tell your teacher.";
  if (status === 404) return "There are no questions ready for this topic yet. Please tell your teacher.";
  if (status === 503) return "Questions are not available right now. Please try again in a moment.";
  return "Something went wrong loading your questions. Please tell your teacher.";
}

/** @param {number | undefined} status */
export function practiceSubmitMessage(status) {
  if (status === undefined) return "We couldn't reach the server. Your answers are still on this page; try submitting again.";
  if (status === 401) return "Please log in again.";
  if (status === 409) return "This quiz was already submitted. Go back and start a new one.";
  if (status === 400) return "Some answers couldn't be accepted. Go back and start a new quiz.";
  return "Something went wrong submitting your answers. Please tell your teacher.";
}

/** The AI mentor sidebar is shown only when NEXT_PUBLIC_ENABLE_AI_MENTOR is exactly "true" (any case). */
export function aiMentorEnabled(flag) {
  return String(flag ?? "").toLowerCase() === "true";
}
