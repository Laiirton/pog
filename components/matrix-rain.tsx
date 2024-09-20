/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useRef, useEffect } from 'react'

export const MatrixRain: React.FC = () => {

  // Referência para o elemento canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Define a largura e altura do canvas para ocupar a tela inteira
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Caracteres que serão usados na chuva
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const fontSize = 14
    const columns = canvas.width / fontSize

    // Array para armazenar a posição das gotas
    const drops: number[] = Array(Math.floor(columns)).fill(1)

    // Função para desenhar a chuva de caracteres
    const draw = () => {
      // Preenche o fundo com uma cor preta semi-transparente
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Define a cor e fonte dos caracteres
      ctx.fillStyle = '#0F0'
      ctx.font = `${fontSize}px monospace`

      // Desenha cada caractere na posição correspondente
      drops.forEach((drop, i) => {
        const text = characters[Math.floor(Math.random() * characters.length)]
        ctx.fillText(text, i * fontSize, drop * fontSize)

        // Reinicia a gota se ela sair da tela com uma pequena chance
        if (drop * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      })
    }

    // Define um intervalo para atualizar o desenho a cada 33ms
    const interval = setInterval(draw, 33)

    // Função para ajustar o tamanho do canvas quando a janela é redimensionada
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    // Adiciona o evento de redimensionamento da janela
    window.addEventListener('resize', handleResize)

    // Limpa o intervalo e remove o evento de redimensionamento quando o componente é desmontado
    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Renderiza o elemento canvas
  return <canvas ref={canvasRef} className="fixed inset-0 z-0" />
}