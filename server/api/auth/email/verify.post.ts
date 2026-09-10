import { defineApiRoute } from "../../../utils/defineApiRoute";
import { proxyAuthRequest } from "../../../utils/authProxy";

export default defineApiRoute((event) => proxyAuthRequest(event, "email/verify"));
