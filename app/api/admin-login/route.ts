// Importando as dependências necessárias
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Função para lidar com requisições POST de login de administrador
export async function POST(req: NextRequest) {
  // Extraindo username e password do corpo da requisição
  const { username, password } = await req.json();

  // Verificando se as credenciais fornecidas correspondem às credenciais de administrador
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    // Se as credenciais estiverem corretas, gera um token JWT com flag de admin
    const token = jwt.sign({ isAdmin: true }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    // Retorna o token como resposta
    return NextResponse.json({ token });
  } else {
    // Se as credenciais estiverem incorretas, retorna um erro
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}