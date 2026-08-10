import { Suspense }            from "react";
import { ResetPasswordForm }  from "@/features/auth/ResetPasswordForm";

export const metadata = { title: "Set New Password" };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="text-center">
        <span className="size-8 rounded-full border-2 border-tvs-charcoal-700 border-t-tvs-red-600 animate-spin inline-block" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
