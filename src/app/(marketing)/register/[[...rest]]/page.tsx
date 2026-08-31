import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center px-4 py-16">
      <SignUp
        routing="path"
        path="/register"
        signInUrl="/login"
      />
    </main>
  );
}
