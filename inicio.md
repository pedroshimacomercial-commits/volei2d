# CONTEXTO
Desenvolver um jogo de vôlei de praia 2D, no estilo 2v2, com física, movimentação, ataques, defesas, stamina e inteligência artificial.

# OBJETIVO
Criar um jogo em que o objetivo é fazer a bola tocar o chão da quadra adversária.

Modos de jogo:

Contra IA.
Multiplayer local, permitindo dois jogadores na mesma equipe.
Mecânicas:

Movimentação horizontal e saltos.
Ataques e saltos com força variável conforme o tempo de carregamento.
Sobrecarga: ultrapassar o limite de carregamento reduz a força do ataque ou a altura do salto.
Stamina individual que influencia a velocidade e a capacidade defensiva.
Defesas bem executadas não consomem stamina.
Stamina zerada deixa o jogador mais lento e prejudica sua defesa.
Física da bola com gravidade, colisões e interação com jogadores, rede e chão.
# REGRAS DE PONTUAÇÃO
Vence quem alcançar pelo menos 5 pontos com vantagem de 2 pontos.
Em caso de 4x4, continua o sistema de vantagem até uma equipe abrir 2 pontos.
Exemplos de resultados vencedores: 5x3, 6x4 e 7x5.
Ao terminar, exibir o vencedor e permitir reiniciar a partida.
# RESTRIÇÕES
Manter obrigatoriamente o formato 2v2.
Respeitar os limites da quadra.
Não permitir que a bola atravesse a rede ou o chão.
Preservar todas as mecânicas descritas.
Não permitir carregamento infinito de ataque ou salto.
Não consumir stamina em defesas bem executadas.
Não adicionar funcionalidades não solicitadas.
Não remover funcionalidades existentes sem justificativa.
# SAÍDA ESPERADA
Um jogo completo e funcional, contendo:

Quadra, rede e jogadores.
Física da bola.
Movimentação, saltos, ataques e defesas.
Sistema de stamina e carregamento.
IA e multiplayer local.
Placar, interface e telas de início e encerramento.
Código organizado e instruções para executar o projeto.
# CRITÉRIOS DE ACEITE
Partidas completas de 2v2 funcionando.
Todas as mecânicas implementadas e testadas.
IA funcional.
Multiplayer local funcional.
Física e colisões sem falhas críticas.
Pontuação e condições de vitória funcionando corretamente.
Possibilidade de concluir e reiniciar partidas sem erros.
# DIRETRIZES DE PLANEJAMENTO
Analisar a estrutura atual do projeto antes de começar.
Identificar engine, versão, linguagem e ferramentas.
Planejar arquitetura, arquivos e etapas de desenvolvimento.
Priorizar recursos nativos da engine.
Identificar riscos e possíveis conflitos técnicos.
Apresentar um plano de implementação e testes.
Não escrever código antes de apresentar o plano e receber aprovação.