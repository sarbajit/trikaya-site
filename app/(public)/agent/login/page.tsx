import { Suspense } from "react";
import { AgentLoginForm } from "./AgentLoginForm";

export default function AgentLoginPage() {
  return (
    <Suspense>
      <AgentLoginForm />
    </Suspense>
  );
}
