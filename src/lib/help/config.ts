import "server-only";

import { enabledOnlyWhenExplicitlyTrue } from "./flag-value";

export class ShowUpDisabledError extends Error {
  constructor() {
    super("SHOW UP is not enabled.");
    this.name = "ShowUpDisabledError";
  }
}

/** Server-only and fail-closed: missing, malformed, and client values are off. */
export function isShowUpEnabled() {
  return enabledOnlyWhenExplicitlyTrue(process.env.SHOW_UP_ENABLED);
}

export function assertShowUpEnabled() {
  if (!isShowUpEnabled()) throw new ShowUpDisabledError();
}
