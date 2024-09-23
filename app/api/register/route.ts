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

// Função para lidar com requisições POST de registro de usuário
export async function POST(req: NextRequest) {
  try {
    // Extraindo username e password do corpo da requisição
    const { username, password } = await req.json();

    // Verificando se username e password foram fornecidos
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Verificar se o usuário já existe no banco de dados
    const { data: existingUser, error: checkError } = await supabase
      .from('usernames')
      .select('username')
      .eq('username', username)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing user:', checkError);
      return NextResponse.json({ error: 'An error occurred while checking username' }, { status: 500 });
    }

    // Se o usuário já existe, retorna um erro
    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }

    // Gerar hash da senha para armazenamento seguro
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserir novo usuário no banco de dados
    const { error: insertError } = await supabase
      .from('usernames')
      .insert([
        { username, password: hashedPassword, votes: {} }
      ]);

    // Se ocorrer um erro na inserção, lança uma exceção
    if (insertError) {
      console.error('Error inserting new user:', insertError);
      return NextResponse.json({ error: 'An error occurred while registering' }, { status: 500 });
    }

    // Gerar token JWT
    const token = jwt.sign({ username }, process.env.JWT_SECRET!, { expiresIn: '24h' });

    // Retorna uma mensagem de sucesso com o token se o usuário for registrado com sucesso
    return NextResponse.json({ message: 'User registered successfully', token, username }, { status: 201 });
  } catch (error) {
    // Em caso de erro, registra no console e retorna uma resposta de erro
    console.error('Error registering user:', error);
    return NextResponse.json({ error: 'An error occurred while registering' }, { status: 500 });
  }
}