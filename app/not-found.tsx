import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-xl text-gray-600 mb-4">Página não encontrada</p>
      <Link href="/" className="text-blue-600 hover:underline">Voltar para o início</Link>
    </div>
  );
}
