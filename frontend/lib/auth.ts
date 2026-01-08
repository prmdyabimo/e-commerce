type SignInArgs = { email: string; password: string };
type SignUpArgs = { name: string; email: string; password: string };

export async function signIn({ email, password }: SignInArgs) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function signUp({ name, email, password }: SignUpArgs) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return res.json();
}
