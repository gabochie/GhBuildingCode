import { redirect } from "next/navigation";

export default function LoginSsoCallbackPage() {
  redirect("/sign-in/sso-callback");
}
