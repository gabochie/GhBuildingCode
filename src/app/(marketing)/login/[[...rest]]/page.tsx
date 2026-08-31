import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center px-4 py-16">
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/register"
      />
    </main>
  );
}
