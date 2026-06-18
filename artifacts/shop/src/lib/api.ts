import { setAuthTokenGetter } from "@workspace/api-client-react";

// Generated API paths already include `/api` — do not set a base URL here
// or requests will hit `/api/api/...` and 404.

setAuthTokenGetter(() => {
  return localStorage.getItem("drip_token");
});
