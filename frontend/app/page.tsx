import Image from "next/image";

export default function Home() {
  return (
    <div className="auth-center">
      <main className="w-full max-w-4xl mx-auto px-6 py-20">
        <div className="bg-white rounded-2xl shadow-lg p-10 flex items-center gap-8">
          <div className="flex-1">
            <h1 className="text-3xl font-semibold text-slate-900 mb-2">
              Welcome to the auth demo
            </h1>
            <p className="text-slate-600 mb-6">
              A small example that shows login and register flows wired to local
              API endpoints. Click below to try.
            </p>
            <div className="flex gap-3">
              <a
                className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-3 text-white shadow"
                href="/login"
              >
                Login
              </a>
              <a
                className="inline-flex items-center rounded-lg border border-slate-200 px-5 py-3 text-slate-700"
                href="/register"
              >
                Register
              </a>
            </div>
          </div>
          <div className="w-32 h-32 flex-shrink-0">
            <Image src="/next.svg" alt="logo" width={128} height={32} />
          </div>
        </div>
      </main>
    </div>
  );
}
