import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

setBaseUrl("/api");

setAuthTokenGetter(() => {
  return localStorage.getItem("drip_token");
});
