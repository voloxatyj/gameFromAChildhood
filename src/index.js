let canvas = document.getElementById("gameScreen");
let ctx = canvas.getContext('2d');
const Game_Width = 800;
const Game_Height = 600;
const GameState = {
    Paused: 0,
    Running: 1,
    StartMenu: 2,
    GameOver: 3,
    NewLevel: 4
}


//Constructor for the game
class Game {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.gamestate = GameState.Menu;
        this.paddle = new Paddle(this);    
        this.ball = new Ball(this);
        this.gameObjects = [];
        this.lives = 3;
        this.monkeys=[];
        this.levels=[level1, level2, level3, level4, level5, level6];
        this.currentLevel =0;
        new InputHandler(this.paddle,this);
    }

    start() {
        if (this.gamestate !== GameState.Menu && this.gamestate !== GameState.NewLevel) return;
        this.monkeys = buildLevel(this, this.levels[this.currentLevel]);
        this.ball.reset();
        this.gameObjects = [this.paddle, this.ball];
        this.gamestate = GameState.Running;
    }

    update(deltaTime) {
        if (this.lives === 0) this.gamestate = GameState.GameOver;
        if (this.gamestate === GameState.Paused || this.gamestate === GameState.Menu || this.gamestate === GameState.GameOver) return;
        [...this.gameObjects,...this.monkeys].forEach(object=>object.update(deltaTime));
        this.monkeys = this.monkeys.filter(monkey=>!monkey.markForDeletion);
        if (this.monkeys.length ===0) {
            this.currentLevel++;
            this.gamestate = GameState.NewLevel;
            this.start();
            
        }
    } 

    draw(ctx) {
        [...this.gameObjects,...this.monkeys].forEach(object=>object.draw(ctx));

        if (this.gamestate === GameState.Paused) {
            ctx.rect (0, 0, this.gameWidth, this.gameHeight);
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fill();

            ctx.font = "30px Arial";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText("Paused", this.gameWidth/2, this.gameHeight/2);
        }

        if (this.gamestate === GameState.Menu) {
            ctx.rect (0, 0, this.gameWidth, this.gameHeight);
            ctx.fillStyle = "rgba(0, 0, 0, 1)";
            ctx.fill();

            ctx.font = "30px Arial";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText("Please, Press SpaceBar to Continue...", this.gameWidth/2, this.gameHeight/2);
        }

        if (this.gamestate === GameState.GameOver) {
            ctx.rect (0, 0, this.gameWidth, this.gameHeight);
            ctx.fillStyle = "rgba(0, 0, 0, 1)";
            ctx.fill();

            ctx.font = "30px Arial";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText("It’s Game Over", this.gameWidth/2, this.gameHeight/2);
        }
    }

    togglePaused() {
        if (this.gamestate == GameState.Paused){
            this.gamestate = GameState.Running;
        } else {
            this.gamestate = GameState.Paused;
        }
    }
}

// Constructor for my slider
class Paddle {
    constructor(game) {
    this.gameWidth = game.gameWidth;    
    this.width = 150;
    this.height = 20;
    this.maxSpeed = 10;
    this.speed = 0;
    
    this.position = {
        x: game.gameWidth/2 - this.width/2,
        y: game.gameHeight - this.height - 10
        };
    }

    moveLeft() {
        this.speed =- this.maxSpeed;
    } 

    moveRigth() {
        this.speed =+ this.maxSpeed;
    }

    stop() {
        this.speed = 0;
    }

    update(deltaTime){
        this.position.x += this.speed;
        if (this.position.x<0) this.position.x=0;
        if (this.position.x+this.width>this.gameWidth) 
            this.position.x=this.gameWidth - this.width;
    }

    draw(ctx) {
    ctx.fillStyle = '#0ff';   
    ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
}

// Constructor for Input Keys
class InputHandler {
    constructor(paddle,game) {
        document.addEventListener("keydown",event=>{
            switch(event.keyCode){
                case 37:
                    paddle.moveLeft();
                    break;
                case 39:
                    paddle.moveRigth();
                    break;
            }});
        document.addEventListener("keyup",event=>{
            switch(event.keyCode){
                case 37:
                    if(paddle.speed<0) paddle.stop();
                        break;
                case 39:
                    if(paddle.speed>0) paddle.stop();
                        break;
                case 27:
                    game.togglePaused();
                        break;
                case 32:
                    game.start();
                        break;
                    }});
    }
}

// Constructor for the ball

class Ball {
    constructor(game) {
        this.gameWidth = game.gameWidth;
        this.gameHeight = game.gameHeight;
        this.image = document.getElementById("image_ball");
        this.size = 26;
        this.game = game;
        this.reset();
    }
        
        reset() {
            this.position = {
                x: 10,
                y: 400
            };
            this.speed = {
                x: 4,
                y: -2
            };
        }

        update(deltaTime) {
            this.position.x += this.speed.x;
            this.position.y += this.speed.y;
            
            // wall on left or right
            if (this.position.x + this.size > this.gameWidth || this.position.x < 0)
             {this.speed.x = -this.speed.x;}
            
            // wall on top 
            if (this.position.y < 0)
             {this.speed.y = -this.speed.y;}

            // bottom of game
            if (this.position.y + this.size > this.gameHeight){
                this.game.lives--;
                this.reset();
            } 

            // ckeck collision with paddle
            if (collisionDetection(this, this.game.paddle)) {
                this.speed.y = -this.speed.y;
                this.position.y = this.game.paddle.position.y - this.size;
            }
        }
        
        draw(ctx) {
            ctx.drawImage(this.image, this.position.x, this.position.y, this.size, this.size);
        }
    }

// Constructor of Monkey
class MonkeyWall {
    constructor(game, position) {
        this.image = document.getElementById('image_monkey');
        this.position = position;
        this.game = game;
        this.width = 80;
        this.height = 32;
        this.markForDeletion = false;
    }

        update() {
            if (collisionDetection(this.game.ball, this)){
            this.game.ball.speed.y = -this.game.ball.speed.y;
            this.markForDeletion = true;
            }
        }

        draw(ctx) {
            ctx.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
        }        
}

// Constructor of Level’s
function buildLevel(game,level){
    let monkeys =[];
    level.forEach((row, rowIndex) => {
        row.forEach((monkey,monkeyIndex) => {
            if (monkey === 1) {
                let position = {
                    x: 80 * monkeyIndex,
                    y: 55 + 24 * rowIndex
                };
                monkeys.push(new MonkeyWall(game, position));
            }
        });
    });
    return monkeys;
}
const level1 = [
    [0,1,1,0,0,1,1,0,1,0],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,0,0,1,1,0]
];
const level2 = [
    [0,1,1,0,0,1,1,0,1,0],
    [1,1,0,1,1,1,1,0,1,1],
    [1,1,1,0,1,1,0,1,1,1],
    [1,1,0,1,1,0,0,1,1,0],
    [1,0,1,1,0,1,1,0,1,1]
];
const level3 = [
    [0,1,1,0,0,1,1,0,1,0],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,0,0,1,1,0],
    [1,0,1,1,0,1,1,0,1,1],
    [1,1,0,1,1,1,1,0,1,1]
];
const level4 = [
    [0,1,1,0,0,1,1,0,1,0],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,0,0,1,1,0],
    [1,1,1,1,1,0,0,1,1,0],
    [1,0,1,0,0,1,0,0,1,1],
    [1,1,0,0,1,0,1,1,0,1]
];
const level5 = [
    [0,1,1,0,0,1,1,0,1,0],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,0],
    [1,1,1,1,1,1,0,1,1,0],
    [1,0,1,1,1,0,1,1,0,1],
    [1,1,1,1,1,1,0,1,1,1],
    [1,1,0,0,1,0,1,1,0,1]
];
const level6 = [
    [0,1,1,0,0,1,1,0,1,0],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,0,0,1,1,0],
    [1,1,1,1,1,1,0,1,1,0],
    [1,1,1,1,1,1,0,1,1,0],
    [1,0,1,1,1,0,1,1,0,1],
    [1,1,1,1,1,1,0,1,1,1],
    [1,0,1,1,1,0,1,1,0,1],
];
    
// Function for destruction

function collisionDetection(ball, gameObjects) {
    let bottomOfBall = ball.position.y + ball.size;
    let topOfBall = ball.position.y;

    let topOfObject = gameObjects.position.y;
    let rightSideOfObject = gameObjects.position.x + gameObjects.width;
    let leftSideOfObject = gameObjects.position.x;
    let bottomOfObject = gameObjects.position.y + gameObjects.height;

        if (bottomOfBall >= topOfObject && 
            topOfBall <=bottomOfObject &&
            ball.position.x >= leftSideOfObject &&
            ball.position.x + ball.size <= rightSideOfObject) {
                return true;
            } else {
                return false;
            }
}

let game = new Game(Game_Width, Game_Height);
let monkey = new MonkeyWall(this, {x:20,y:20});



function gameLoop(timeStamp) {
    let lastTime = 0;
    let deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    
    ctx.clearRect(0, 0, Game_Width, Game_Height);
    game.update(deltaTime);
    game.draw(ctx);    

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
