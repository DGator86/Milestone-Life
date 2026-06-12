interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const CONFIRMATION_RE =
  /^(yes|yep|yeah|y|go ahead|do it|sure|ok|okay|please|confirm|sounds good|that works|make it|add it|do that|please do)\.?$/i;

const DIRECT_ACTION_RE =
  /\b(add|create|put|schedule|set up|log|track|remind me|book|save)\b/i;

const SUCCESS_CLAIM_RE =
  /\b(i'?ve |i have |successfully )?(created|added|updated|scheduled|set up|logged|saved|completed|done it|it's on|it is on|task is|goal is)\b/i;

export function isConfirmation(text: string): boolean {
  const trimmed = text.trim();
  if (CONFIRMATION_RE.test(trimmed)) return true;
  return /^(yes|yeah|yep|sure|ok)[,!.]?\s/i.test(trimmed);
}

export function isDirectActionRequest(text: string): boolean {
  return DIRECT_ACTION_RE.test(text);
}

export function replyClaimsSuccess(reply: string): boolean {
  return SUCCESS_CLAIM_RE.test(reply);
}

/** True when the model likely should have called a tool but did not. */
export function needsExecutionRetry(
  lastUserMessage: string,
  history: ChatTurn[],
  assistantReply: string,
  mutated: boolean,
): boolean {
  if (mutated) return false;

  if (replyClaimsSuccess(assistantReply)) return true;

  if (isConfirmation(lastUserMessage)) return true;

  // Single-turn direct imperative ("add lunch with Pat on Friday").
  if (history.length === 1 && isDirectActionRequest(lastUserMessage)) return true;

  return false;
}
