import { Suspense } from "react";
import { CompleteRegistrationForm } from "./CompleteRegistrationForm";

export default function CompleteRegistrationPage() {
  return (
    <Suspense>
      <CompleteRegistrationForm />
    </Suspense>
  );
}
