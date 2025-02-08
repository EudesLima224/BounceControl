// Seleciona o elemento canvas pelo id e obtém o contexto 2D para desenhar
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --------------------------------------------
// Definição dos objetos do jogo
// --------------------------------------------

// Objeto bola: armazena posição, tamanho, velocidade e aceleração
let ball = {
    x: canvas.width / 2,   // Posição horizontal centralizada
    y: 100,                // Posição vertical inicial
    radius: 15,            // Tamanho da bola
    dy: 2,                 // Velocidade vertical inicial
    acceleration: 0.1,     // Aceleração devido à gravidade
    accelerated: false     // Flag para saber se a bola está acelerada (seta para baixo pressionada)
};

// Objeto retângulo: armazena posição, tamanho, velocidade e estado de "fixação"
// Array para armazenar os retângulos fixados (a base da torre)
let fixedRects = [];

// Objeto para o retângulo atual (a plataforma que se move)
let currentRect = {
    x: canvas.width / 2 - 75,  // Inicia centralizado (largura = 150)
    y: canvas.height - 50,     // 50 pixels acima do fundo do canvas
    width: 150,
    height: 20,
    speed: 3,
    fixed: false             // Indica se já foi fixado ou não
};

// Função para criar um novo retângulo (após o atual ser fixado)
// Ele começará acima do retângulo fixado anterior
function createNewRect() {
    // Se for o primeiro retângulo, começamos do mesmo ponto base
    // Caso contrário, posicionamos o novo retângulo acima do último fixado.
    let newY = (fixedRects.length === 0) ? canvas.height - 50 : fixedRects[fixedRects.length - 1].y - 50;
    
    currentRect = {
        x: canvas.width / 2 - 75,  // Centralizado inicialmente
        y: newY,
        width: currentRect.width, // Começa com a mesma largura que o anterior
        height: 20,
        speed: 3,
        fixed: false
    };
}


// --------------------------------------------
// Eventos de teclado
// --------------------------------------------

// Evento para quando uma tecla é pressionada
document.addEventListener('keydown', function(event) {
    // Se a tecla pressionada for a seta para baixo, acelera a descida da bola
    if (event.code === 'ArrowDown') {
        ball.accelerated = true;
    }
    // Se a tecla pressionada for a barra de espaço, fixa o retângulo atual
    if (event.code === 'Space') {
        if (!currentRect.fixed) {
            // Define que o retângulo atual está fixado
            currentRect.fixed = true;
            
            // Se já houver um retângulo fixado, vamos calcular a sobreposição
            if (fixedRects.length > 0) {
                let previous = fixedRects[fixedRects.length - 1]; // Último retângulo fixado
                
                // Calcula o limite esquerdo da sobreposição
                let overlapX = Math.max(currentRect.x, previous.x);
                // Calcula o limite direito da sobreposição
                let overlapRight = Math.min(currentRect.x + currentRect.width, previous.x + previous.width);
                // A largura da sobreposição é a diferença
                let overlapWidth = overlapRight - overlapX;
                
                // Se houver sobreposição positiva, ajusta o retângulo atual
                if (overlapWidth > 0) {
                    currentRect.x = overlapX;
                    currentRect.width = overlapWidth;
                } else {
                    // Se não houver sobreposição, podemos definir a largura como 0
                    // ou acionar uma lógica de Game Over (por enquanto, vamos definir como 0)
                    currentRect.width = 0;
                    // Aqui você pode chamar uma função de gameOver se desejar
                }
            }
            
            // Adiciona o retângulo atual (já ajustado) ao array de retângulos fixados
            fixedRects.push({ ...currentRect });
            
            // Em seguida, movemos a "câmera" para cima (veremos isso no próximo passo)
            shiftCamera(50);  // por exemplo, 50 pixels para cima
            
            // Cria um novo retângulo para o próximo nível
            createNewRect();
        }
    }
});


// Evento para quando a tecla é liberada (para a seta para baixo)
document.addEventListener('keyup', function(event) {
    if (event.code === 'ArrowDown') {
        ball.accelerated = false;
    }
});


// --------------------------------------------
// Função principal de desenho e atualização (game loop)
// --------------------------------------------
function draw() {
    // Limpa o canvas para redesenhar o quadro atual
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // -------------------------------
    // Atualização da bola
    // -------------------------------
    
    // Se a bola estiver acelerada (seta para baixo pressionada), aumenta a aceleração
    if (ball.accelerated) {
        ball.dy += ball.acceleration * 2;  // Aplica uma aceleração extra
    } else {
        ball.dy += ball.acceleration;      // Aplica a aceleração padrão (gravidade)
    }
    
    // Atualiza a posição vertical da bola
    ball.y += ball.dy;
    
    // Verifica colisão da bola com o retângulo atual:
    // Se a parte inferior da bola (ball.y + ball.radius) atingir ou ultrapassar a parte superior do currentRect
    // e a bola estiver horizontalmente sobre o currentRect, ocorre a colisão.
    if (ball.y + ball.radius >= currentRect.y && 
        ball.x >= currentRect.x && 
        ball.x <= currentRect.x + currentRect.width && 
        ball.dy > 0) {
        
        // Ajusta a posição da bola para que ela não "entre" no retângulo
        ball.y = currentRect.y - ball.radius;
        // Inverte a velocidade vertical (faz a bola quicar) e aplica um fator de amortecimento (aqui 0.9)
        ball.dy = -ball.dy * 0.9;
    }
    
    // Se a bola atingir o topo do canvas, inverte a velocidade vertical (para evitar que saia pela parte superior)
    if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.dy = -ball.dy;
    }
    
    // Se a bola cair abaixo do canvas, reinicia sua posição (pode ser adaptado para Game Over ou outra mecânica)
    if (ball.y - ball.radius > canvas.height) {
        ball.x = canvas.width / 2;
        ball.y = 100;
        ball.dy = 2;
    }
    
    // Desenhar a bola:
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FF0000';  // Cor vermelha para a bola
    ctx.fill();
    ctx.closePath();
    
    // -------------------------------
    // Atualização do retângulo (plataforma) atual
    // -------------------------------
    
    // Se o currentRect não estiver fixo, atualiza sua posição horizontal
    if (!currentRect.fixed) {
        currentRect.x += currentRect.speed;
        // Inverte a direção se atingir as bordas do canvas
        if (currentRect.x <= 0 || currentRect.x + currentRect.width >= canvas.width) {
            currentRect.speed = -currentRect.speed;
        }
    }
    
    // Desenhar o currentRect (retângulo atual)
    ctx.fillStyle = '#0000FF';  // Cor azul para o retângulo
    ctx.fillRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
    
    // -------------------------------
    // Desenhar os retângulos fixados
    // -------------------------------
    
    for (let i = 0; i < fixedRects.length; i++) {
        let fixedRect = fixedRects[i];
        ctx.fillStyle = '#0000FF';
        ctx.fillRect(fixedRect.x, fixedRect.y, fixedRect.width, fixedRect.height);
    }
    
    // -------------------------------
    // Loop da animação: chama a função draw novamente para o próximo frame
    requestAnimationFrame(draw);
}


// Inicia o loop do jogo
draw();
