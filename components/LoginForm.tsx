import React from "react";

interface LoginFormProps {
  handleAuth: (e: React.FormEvent) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  authError: string;
  authMode: "login" | "register";
  setAuthMode: (mode: "login" | "register") => void;
  setAuthError: (msg: string) => void;
}

export function LoginForm({
  handleAuth,
  email,
  setEmail,
  password,
  setPassword,
  authError,
  authMode,
  setAuthMode,
  setAuthError,
}: LoginFormProps) {
  return (
    <div className="flex bg-[var(--dark)] text-[var(--text)] min-h-screen items-center justify-center p-4">
      <div className="bg-[var(--card)] border border-[var(--border)] p-8 rounded-2xl w-full max-w-md shadow-lg">
        <div className="text-center mb-6">
          <div className="bg-[var(--blue)] w-14 h-14 mx-auto rounded-xl flex items-center justify-center text-white font-['Bebas_Neue'] text-2xl tracking-wider mb-4">
            FE
          </div>
          <h1 className="font-['Bebas_Neue'] text-3xl text-[var(--sky)] tracking-wide uppercase">
            SÚMULA DIGITAL
          </h1>
          <p className="text-[var(--sub)] font-light mt-1 text-sm">
            Acesse sua conta para continuar
          </p>
        </div>
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[var(--sub)] font-bold uppercase tracking-tight text-[0.7rem]">
              E-mail de Acesso
            </label>
            <input
              type="email"
              required
              className="inp"
              placeholder="seu@fefuspa.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[var(--sub)] font-bold uppercase tracking-tight text-[0.7rem]">
              Senha Secreta
            </label>
            <input
              type="password"
              required
              className="inp"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {authError && (
            <div className="text-red-500 text-xs font-bold mt-1 bg-red-100/10 p-2 rounded border border-red-500/20">
              ⚠️ {authError}
            </div>
          )}
          <button
            type="submit"
            className="btn btn-primary justify-center mt-2 w-full text-[0.9rem] py-3 font-black"
          >
            {authMode === "login" ? "ENTRAR NO MÓDULO" : "CRIAR MINHA CONTA"}
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-[var(--sub)] pt-4 border-t border-[var(--border)] font-bold">
          {authMode === "login"
            ? "AINDA NÃO TEM ACESSO?"
            : "JÁ POSSUI CADASTRO?"}
          <button
            type="button"
            className="text-[var(--sky)] ml-2 hover:underline"
            onClick={() => {
              setAuthMode(authMode === "login" ? "register" : "login");
              setAuthError("");
            }}
          >
            {authMode === "login" ? "SOLICITAR AGORA" : "FAZER LOGIN"}
          </button>
        </div>
      </div>
    </div>
  );
}
