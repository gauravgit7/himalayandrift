import { Suspense }            from "react";
import { ResetPasswordForm }  from "@/features/auth/ResetPasswordForm";

export const metadata = { title: "Set New Password" };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="text-center">
        <span className="size-8 rounded-full border-2 border-hd-ink-700 border-t-hd-ember-600 animate-spin inline-block" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
