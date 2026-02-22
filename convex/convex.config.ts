import workflow from "@convex-dev/workflow/convex.config";
import workOSAuthKit from "@convex-dev/workos-authkit/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(workOSAuthKit);
app.use(workflow);
export default app;
