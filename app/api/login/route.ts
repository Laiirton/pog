// Importando as dependências necessárias
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Criando um cliente Supabase com as credenciais do ambiente
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função para lidar com requisições POST de login
export async function POST(req: NextRequest) {
  // Extraindo username e password do corpo da requisição
  const { username, password } = await req.json();

  // Verificando se username e password foram fornecidos
  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
  }

  try {
    // Buscando o usuário no banco de dados
    const { data: user, error } = await supabase
      .from('usernames')
      .select('*')
      .eq('username', username)
      .single();

    // Se o usuário não for encontrado, retorna um erro
    if (error || !user) {
      return NextResponse.json({ error: 'User not found, please register' }, { status: 404 });
    }

    // Comparando a senha fornecida com a senha armazenada
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      // Se a senha estiver correta, gera um token JWT
      const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET!, { expiresIn: '24h' });
      // Retorna uma mensagem de sucesso com o token e o nome de usuário
      return NextResponse.json({ message: 'Login successful', token, username: user.username });
    }

    // Se a senha estiver incorreta, retorna um erro
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch (error) {
    // Em caso de erro, registra no console e retorna uma resposta de erro
    console.error('Error logging in:', error);
    return NextResponse.json({ error: 'An error occurred while logging in' }, { status: 500 });
  }
}