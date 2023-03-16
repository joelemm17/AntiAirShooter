const c = document.getElementById("canvas1");
const ctx = c.getContext("2d");

let mouse = {x:0, y:0}
let mouseDown = false;
let bulletCount = 0;
let isRunning = false;
c.height = 1080;
c.width = 1920;

function mouseIsDown(evt){
    mouseDown = true
    let rect = c.getBoundingClientRect();
    mouse.x = evt.clientX - rect.left;
    mouse.y = evt.clientY - rect.top;
}

function updateMouse(evt){
    let rect = c.getBoundingClientRect();
    mouse.x = evt.clientX - rect.left;
    mouse.y = evt.clientY - rect.top;
}

function mouseIsUp(){
    mouseDown = false;
}

var bomberImg = new Image();
bomberImg.src = './bomber.png';

var expImg = new Image();
expImg.src = './explosion.png'

var splashImg = new Image();
splashImg.src = './splash.png'

var ammoImg = new Image();
ammoImg.src = './ammo.png'

var buildingImg = new Image();
buildingImg.src = './highrise.jpg'

var billBoardImg = new Image();
billBoardImg.src = './billboard.png'

var boom = new Audio("./boom.ogg");
var music = new Audio("./music.wav");
var fire = new Audio("./cannon.wav");
var splash = new Audio("./splash.wav");
fire.volume = 0.3;


class Tower{
    constructor(){
        this.energy = 100;
        this.health = 100;
        this.pos = {x:250, y:950};
        this.coolDown = 0;
        this.tipX = 0;
        this.tipY = 0;
    }

    drawBarrel(context){
        let dx = this.pos.x - mouse.x;
        let dy = this.pos.y - mouse.y;
        let dist = Math.sqrt((dx*dx)+(dy*dy))/80;
        this.tipX = dx/dist;
        this.tipY = dy/dist;
        context.strokeStyle = "#616161"
        context.globalAlpha = 1;
        context.lineWidth = 15;
        context.beginPath();
        context.moveTo(this.pos.x,this.pos.y);
        context.lineTo(this.pos.x-this.tipX, this.pos.y-this.tipY);
        context.stroke();
    }
    drawFlash(context){
        if(bulletCount%5==0){
            context.globalAlpha = 0.5;
            context.lineWidth = 1
            context.fillStyle = "#ffb1a3";
            context.strokeStyle = "#fa8816";
            context.beginPath();
            context.arc(this.pos.x-this.tipX, this.pos.y-this.tipY, 20, 0, Math.PI * 2);
            context.fill();
            context.stroke();
        }
    }
    
    fire(x,y){
        this.coolDown = 2;
        let bulletData = {
            pos: {x:this.pos.x-this.tipX, y:this.pos.y-this.tipY},
            target: {x: x, y: y},
            count: bulletCount
        }
        new TracerRound(bulletData);
        fire.volume = 0.1;
        fire.cloneNode(true).play();
        
    }

    draw(context){
    context.globalAlpha = 1;
    // context.fillStyle = "white";
    // context.fillRect(this.pos.x, this.pos.y, 50, 50);
    context.drawImage(buildingImg, this.pos.x-100, this.pos.y-10, 200, 300);
    }
    towerHandler(context){
        if(this.coolDown > 0){
            this.coolDown -= 1
        }
        if(mouseDown && this.coolDown == 0){
            this.fire(mouse.x,mouse.y)
            this.drawFlash(context)
        }
        this.drawBarrel(context);
    }
}

class Laser{
    static allLasers = []
    constructor(data){
        this.sPos={x: data.sPos.x, y: data.sPos.y};
        this.ePos={x:data.ePos.x, y:data.ePos.y};
        this.power = 10;
        this.lifeSpan = 1;
        this.targetData = this.getTarget();
        this.drag = 0.1;
        this.gravity = 0.1
        Laser.allLasers.push(this);

    
    }
    getTarget(){
        var dx = this.ePos.x - this.sPos.x;
        var dy = this.ePos.y - this.sPos.y;
        var length = Math.sqrt((dx*dx)+(dy*dy));
        var angle = Math.atan2(dy, dx);
    
        // Calculate the force vector components
        var forceX = Math.cos(angle);
        var forceY = Math.sin(angle);
    
        // Apply the force to the particle's velocity
        return {fx:forceX, fy:forceY, dx: dx, dy: dy, l:length/20}
    }

    update(){
        this.sPos.x += this.targetData.fx*20;
        this.sPos.y += this.targetData.fy*20;
        this.ePos.x += this.targetData.fx*20;
        this.ePos.y += this.targetData.fy*20;
    } 

    draw(context){
        context.globalAlpha = 1;
        context.strokeStyle = 'red';
        context.lineWidth = 5;
        context.beginPath();
        context.moveTo(this.sPos.x,this.sPos.y);
        context.lineTo((this.sPos.x + this.targetData.dx/this.targetData.l), (this.sPos.y + this.targetData.dy/this.targetData.l));
        context.stroke();
    }

    checkCollision(){
        Bomb.allBombs.forEach((bomb,i)=>{
            let dx = this.sPos.x - bomb.pos.x;
            let dy = this.sPos.y - bomb.pos.y;
            let dist = Math.sqrt((dx*dx)+(dy*dy));
            if(dist<bomb.radius){
                Bomb.allBombs.splice(i,1);
            }
        });
    }
    static laserHandler(){
        Laser.allLasers.forEach((laser,i)=>{
            laser.lifeSpan -= 0.01;
            laser.checkCollision();
            laser.update();
            laser.draw(ctx)
            if(laser.lifeSpan < 0){
                Laser.allLasers.splice(i,1);
                i--
            }
        });
    }
}

class Bomb{
    static allBombs = [];
    static fireRate = 100;
    constructor(){
        this.pos = {x:c.width, y: Math.random() * (c.height-350 - 200) + 200}
        this.vel = {x: -2, y:0}
        this.radius = 10;
        this.color = "white";
        this.detonated = false;
        this.fade = 1;
        Bomb.allBombs.push(this);
    }
    update(){
        if(this.detonated){
            this.fade -= 0.1
        }
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
    }
    draw(context){
        if(this.detonated){
            context.globalAlpha = this.fade;
            context.drawImage(expImg, this.pos.x-30, this.pos.y-15, 60, 60);
            context.globalAlpha = 0.1;
            context.lineWidth = 1;
            context.fillStyle = "#white";
            context.strokeStyle = "#white";
            context.beginPath();
            context.arc(this.pos.x, this.pos.y, 50, 0, Math.PI * 2);
            context.fill();
            context.stroke();
        }
        else{
            context.globalAlpha = 1;
            context.drawImage(bomberImg, this.pos.x-30, this.pos.y-15, 60,15);
        }
        // context.globalAlpha = 1;
        // context.fillStyle = this.color;
        // context.beginPath();
        // context.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        // context.fill();
        // context.stroke();
    }
    handler(context){
        this.update();
        this.draw(context)
    }

    static handleAll(context){
        Bomb.fireRate--;
        if(Bomb.fireRate==0){
            Bomb.fireRate=500
            new Bomb()
        }
        Bomb.allBombs.forEach((bomb,i)=>{
            if(bomb.pos.x<-20 || bomb.fade < 0){
                Bomb.allBombs.splice(i,1);
                console.log("removed bomb "+i)
            }
        });
        Bomb.allBombs.forEach((bomb,i)=>{
            bomb.handler(context)
        });
    }
}

class TracerRound{
    static allRounds = []
    constructor(data){
        this.pos={x:data.pos.x, y: data.pos.y};
        this.target = {x:data.target.x, y: data.target.y}
        this.vel = this.getVelocity();
        this.collided = false;
        this.groundHit = false;
        this.fade = 1;
        this.count = data.count;
        TracerRound.allRounds.push(this);
        bulletCount++
    }
    getVelocity(){
        let dx = this.target.x - this.pos.x;
        let dy = this.target.y - this.pos.y;
        let length = Math.sqrt((dx*dx)+(dy*dy));
        let angle = Math.atan2(dy, dx);
    
        // Calculate the force vector components
        let forceX = Math.cos(angle);
        let forceY = Math.sin(angle);
    
        // Apply the force to the particle's velocity
        return {x:forceX*25, y:forceY*19, vx:forceX/length*25, vy: forceY/length*19}
    }
    draw(context){
        context.strokeStyle = '#2c2e38';
        if(this.count%5==0){
            context.strokeStyle = '#f54d05';
        }
        if(!this.collided && !this.groundHit){
            context.globalAlpha = 1;
            context.lineWidth = 5;
            context.beginPath();
            context.moveTo(this.pos.x,this.pos.y);
            context.lineTo(this.pos.x-this.vel.x, this.pos.y-this.vel.y);
            context.stroke();
            if(this.count%5==0 && !this.groundHit){
                context.lineWidth = 1;
                context.strokeStyle = 'white';
                context.fillstyle = '#f54d05';
                context.globalAlpha = 0.3;
                context.beginPath();
                context.arc(this.pos.x-this.vel.x, this.pos.y-this.vel.y, 10, 0, Math.PI * 2);
                context.fill();
                context.stroke();
            }
        }
        if(this.groundHit && this.fade>0){
            if(this.count%5==0){
                context.globalAlpha = this.fade;
                splash.play();
                context.drawImage(splashImg, this.pos.x-5, 990, 20, 20);
            }
            else{
                context.globalAlpha = this.fade;
                splash.play();
                context.drawImage(splashImg, this.pos.x-5, 990, 10, 10);
            }
        }
    }
    checkCollision(){
        Bomb.allBombs.forEach(bomb=>{
        let dx = this.pos.x - bomb.pos.x;
        let dy = this.pos.y - bomb.pos.y;
        let dist = Math.sqrt((dx*dx)+(dy*dy));
        if(dist<20 && this.collided==false && this.vel.y>0){
            ctx.globalAlpha = 0.5
            ctx.fillRect(0,0,c.width, c.height);
            this.collided = true;
            this.vel.x=0;
            this.vel.y=0;
            if(!bomb.detonated){
                score.addScore(10)
                boom.cloneNode(true).play();
            }
            bomb.detonated = true;
            
        }
        if(this.pos.y>990){
            this.groundHit=true;
            this.vel.x = 0;
        }
        });
    }
    dragAndGravity(){
        this.vel.x *= 0.991;
        this.vel.y *= 0.99;
        this.vel.y += 0.1;
    }
    update(){
        if(this.groundHit){
            this.fade -= 0.05;
        }
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
    }
    static handle(context){

        TracerRound.allRounds.forEach((round,i)=>{
            round.draw(context);
            round.dragAndGravity();
            round.checkCollision();
            round.update();
            if(round.collided || round.fade<0){
                TracerRound.allRounds.splice(i,1);
            }
        });
    }
}

class ScoreBoard{
    constructor(){
        this.pos = {x:1350, y:850};
        this.score = 0;
    }
    draw(context){
        context.globalAlpha = 1;
        context.drawImage(billBoardImg, this.pos.x, this.pos.y, 450, 250);
        context.fillStyle = "#737373"
        context.save();
        context.translate(-45,45);
        context.rotate(-2 * Math.PI / 180);
        context.fillRect( this.pos.x+75, this.pos.y+70, 330, 95);
        context.font = "30px lucida console";
        context.fillStyle = "#00a62c";
        context.fontWeight = "bold"
        context.fillText("Score:", this.pos.x+100, this.pos.y+100);
        context.fillText(this.score, this.pos.x+100, this.pos.y+150)
        context.restore()
    }
    addScore(value){
        this.score += value;
    }
}

let score = new ScoreBoard();

let tower1 = new Tower();
let bomb = new Bomb();
function fireLaser(evt){
    let rect = c.getBoundingClientRect();
    let x = evt.clientX - rect.left;
    let y = evt.clientY - rect.top;
    tower1.fire(x,y)
    console.log('fire!')
}

function animate(){
    ctx.clearRect(0, 0 , c.width, c.height);
    TracerRound.handle(ctx);
    // music.play();
    Laser.laserHandler();
    Bomb.handleAll(ctx);
    score.draw(ctx);
    tower1.towerHandler(ctx);
    tower1.draw(ctx);
    requestAnimationFrame(animate);
}
animate();