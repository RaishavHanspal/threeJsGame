import { AfterViewChecked,Component, OnInit } from '@angular/core';
import * as THREE from 'three';
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as nipplejs from 'nipplejs';
declare let window: any
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewChecked{
  title = 'ImmortalCombatantsAngular';
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  manager: THREE.LoadingManager;
  camera: THREE.PerspectiveCamera;
  listener: THREE.AudioListener;
  audioLoader: THREE.AudioLoader;
  SOUND_VOLUME: number;
  GRAPHICS : string;
  DIFFICULTY: string;
  unlockedPlayers : Array<string>;
  characters = [];
  level:string;
  healthBar:string;
  damage:string;
  newPlayer:string;
  mixers = {player1:[],player2:[]};
  CharacterSpecs = {
    VanGuard : {
        Attack : {time:1050,distance:20},
        Attack1 : {time:1050,distance:17},
        Gender:'Man'
    },
    Lola : {
      Attack : {time:1050,distance:20},
      Attack1 : {time:800,distance:17},
      Gender:'Woman',
      Scale: '0.091'
    },
    Ely : {
      Attack : {time:1050,distance:20},
      Attack1 : {time:1050,distance:17},
      Gender:'Man',
      Scale: '0.1'
    }, 
    Arissa : {
        Attack : {time:1050,distance:17},
        Attack1 : {time:1900,distance:20},
        Gender:'Woman'
    },
    Mutant : {
        Attack : {time:1050,distance:20},
        Attack1 : {time:1050,distance:17},
        Gender:'Man'
    },
    Pirate : {
        Attack : {time:800,distance:17},
        Attack1 : {time:1050,distance:20},
        Gender:'Woman',
        Scale: '0.3'
    },
    Hulk : {
      Attack: {time:400,distance:17},
      Attack1: {time:1300,distance:20},
      Gender:'Man'
  },
  }
  gameover: any;
  paused: boolean = false;
  initialLoad: boolean = false;
  player1: string;
  player2: string;
  mode: number;
  previousRAF: any = null;
  settingsActive: boolean;
  menuActive: boolean = true;
  topBarActive:boolean = false;
  loaderActive: boolean = false;
  statsActive:boolean = false;
  topBarOptionsActive: boolean = false;
  promptActive: boolean = false;
  promptMessage: string = "";
  controlsActive: boolean = false;
  pauseButton:SafeHtml = this.sanitized.bypassSecurityTrustHtml( CONSTANTS.pause);
  menuButton:SafeHtml = this.sanitized.bypassSecurityTrustHtml( CONSTANTS.menu);
  fullscreenButton:SafeHtml = this.sanitized.bypassSecurityTrustHtml( CONSTANTS.fullscreen )
  player1Health: any = {width : "100%"};
  player2Health: any = {width : "100%"};
  loadPercentage: string;
  loadProgress: SafeHtml = this.sanitized.bypassSecurityTrustHtml('Hang in there, it usually takes more time on the first load!');
  breakAttack: any;
  breakAttackActive: boolean;
  breakAttack1: any = {width :'0%'};
  breakAttack2:  any = {width :'0%'};
  wins: boolean = false;
  backTrack: boolean = false;
  constructor(private sanitized: DomSanitizer){}
  
  ngOnInit(): void {
    this.level = localStorage.getItem('LEVEL') || "1";
    this.unlockedPlayers = Object.keys(this.CharacterSpecs).splice(0,Number(this.level));
    this.player1 = this.unlockedPlayers.reverse()[0];
    this.player2 = Object.keys(this.CharacterSpecs)[this.getRandom(7)];
    this.camera = new THREE.PerspectiveCamera(60, 1920 / 1080, 1, 1000);
    this.scene = new THREE.Scene();
    this.renderer =  new THREE.WebGLRenderer();
    this.manager = new THREE.LoadingManager();
    this.camera.position.set(75, 20, 0);
    this.listener = new THREE.AudioListener();
    this.camera.add( this.listener );
    this.audioLoader = new THREE.AudioLoader();
    this.SOUND_VOLUME = Number(localStorage.getItem('SOUND')) || 50;
    this.GRAPHICS = localStorage.getItem('GRAPHICS') || 'HIGH';
    this.DIFFICULTY = localStorage.getItem('DIFFICULTY') || 'HARD';
    if( sessionStorage.getItem('player1') && sessionStorage.getItem('players').toLocaleString().split(',').length> 0)
       { 
        this.player1 = sessionStorage.getItem('player1');
        this.player2 =  sessionStorage.getItem('players').split(',')[this.getRandom(sessionStorage.getItem('players').split(',').length)].toLocaleString();
        this.startGame(this.player1,this.player2,Number(sessionStorage.getItem('mode')));
    }    
  }

  ngAfterViewChecked(){
    // if(this.renderer)
    //   this.renderer.setSize( window.innerWidth, window.innerHeight);
    if(document.getElementById('JoyStick') && !document.getElementById('JoyStick').children.length)
      {
        let current;
        let joyStick = nipplejs.create({
        zone : document.getElementById('JoyStick'),
        mode : 'static',
        position: {top: '13%', left: '15%'},
        color:'#FAFAFA',
        dynamicPage : true,
        multitouch : true
      })
      joyStick.on('dir:up',()=>{
        this.controller('W');
        if(current)
        clearInterval(current);
        current = setInterval(()=>{this.controller('W')},1000);
      })
      joyStick.on('dir:left',()=>{
        if(current)
        clearInterval(current);
        current = setInterval(()=>{
          this.backTrack = true;
          if(!this.breakAttackActive)
          this.controller('A')},50);
      })
      joyStick.on('dir:right',()=>{
        if(current)
        clearInterval(current);
        current = setInterval(()=>{
          if(!this.breakAttackActive)
          this.controller('D')
        },50);
      })
      joyStick.on('end',()=>{
        clearInterval(current);
        this.backTrack = false;
      })
  }
  }

  startGame(player1,player2,mode){
    if(player1 && player2){
        this.menuActive = false;
        this.topBarActive = true;
        this.showPrompt(true, 'Loading...')
        this.InitializeFight(player1, player2, mode);
}}

  soundEffect(file, loop, volume, path?) {
    if(!volume) return;
    const sound = new THREE.Audio( this.listener );
    const completePath = path || 'assets/Sounds/';
    this.audioLoader.load( completePath + file , function( buffer ) {
        sound.setBuffer( buffer );
        sound.setLoop( loop );
        sound.setVolume( volume/100 );
        sound.play();
    });
  }

  controller(key) {
    if(this.characters.length > 1 && !this.gameover && !this.paused && this.initialLoad){
        let character1 = this.getCharacterbyName("player1");
        let character2 = this.getCharacterbyName("player2");
        let areClose = this.checkDistance(11);
        let character1Leaving = this.checkIfLeavingScene("player1",20);
        let character2Leaving = this.checkIfLeavingScene("player2",20);
    switch(key.toUpperCase())
    {
        case 'W': {
            if(!this.mixers['player1moving'])
            this.animation(character1, 'assets/', `Action/${this.player1}/Jump.fbx`, { loopOnce : true})
            break; 
            }
        case 'A': {
            if(!character1Leaving)
            character1.position.z += 2; 
            break; 
            }
        case 'D': {
            if(!areClose)
            character1.position.z -= 2;
            break;
            } 
        case 'F':{
            if(!this.mixers['player1moving'])
            this.Attack('player1','player2',character1,character2,'Attack', 'Impact', 90);
            break;
            } 
        case 'P':{
            if(!this.mixers['player2moving'])
            this.Attack('player2','player1',character2,character1,'Attack', 'Impact', 90)
            break;
            } 
        case 'E':{
            if(!this.mixers['player1moving'])
            this.Attack('player1','player2',character1,character2, 'Attack1', 'Impact1', 160);
            break;
            }   
        case 'CONTROL':{
            if(!this.mixers['player2moving'])
            this.Attack('player2','player1',character2,character1, 'Attack1', 'Impact1', 160);
            break;
        } 
        case 'ARROWUP':{
            if(!this.mixers['player2moving'])
            this.animation(character2, 'assets/', `Action/${this.player2}/Jump.fbx`, { loopOnce : true});
            break;
        }
        case 'ARROWLEFT':{
            if(!areClose && !this.backTrack)
            character2.position.z +=2;
            break;
        }
        case 'ARROWRIGHT':{
            if(!character2Leaving)
            character2.position.z -=2;
            break;
        }
        case 'I':{
            console.log(this.characters);
            console.log(this.mixers);
            break;
        }
        case 'Q':{
          if(character1.breakAttack === 3 )
          {
            this.animation(character1, 'assets/', `Action/${this.player1}/Breaks.fbx`, { loopOnce : true});
            if(character1.position.z > 0 )
              this.breakAttack = setInterval(()=>{this.breakAttackActive = true ;this.controller('ARROWRIGHT') },20);
            else
              this.breakAttack = setInterval(()=>{this.breakAttackActive = true ;this.controller('A') },20);
              setTimeout(() => {
                clearInterval(this.breakAttack);
                this.breakAttackActive = false;
              }, 800);
              character1.breakAttack = 0;
              this.breakAttack1 = {width :'0%'};
              this.animation(character2, 'assets/', `Action/${this.player2}/Impact.fbx`, { loopOnce : true});
              this.soundEffect( `Effort${this.CharacterSpecs[character2.name].Gender}.wav`, false, this.SOUND_VOLUME)
              character2.health -= 250; 
              this.player1Health.width = ((character1.health * 100)/character1.totalHealth > 0) ? `${(character1.health * 100)/character1.totalHealth}%` : "0%";
              this.player2Health.width = ((character2.health * 100)/character2.totalHealth > 0) ? `${(character2.health * 100)/character2.totalHealth}%` : "0%";
              this.player1Health.text =  Math.floor(character1.health) ;
              this.player2Health.text =  Math.floor(character2.health) ;
          }
          break;
        }

        case 'L' : {
          if(character2.breakAttack === 3)
          {
            this.animation(character2, 'assets/', `Action/${this.player2}/Breaks.fbx`, { loopOnce : true});
            if(character2.position.z > 0 )
              this.breakAttack = setInterval(()=>{this.breakAttackActive = true ;this.controller('ARROWRIGHT') },20);
            else
              this.breakAttack = setInterval(()=>{this.breakAttackActive = true ;this.controller('A') },20);
            setTimeout(() => {
              clearInterval(this.breakAttack);
              this.breakAttackActive = false;
            }, 800);
            character2.breakAttack = 0;
            this.breakAttack2 = {width :'0%'};
            this.animation(character1, 'assets/', `Action/${this.player1}/Impact.fbx`, { loopOnce : true});
            this.soundEffect( `Effort${this.CharacterSpecs[character1.name].Gender}.wav`, false, this.SOUND_VOLUME)
            character1.health -= 250; 
            this.player1Health.width = ((character1.health * 100)/character1.totalHealth > 0) ? `${(character1.health * 100)/character1.totalHealth}%` : "0%";
            this.player2Health.width = ((character2.health * 100)/character2.totalHealth > 0) ? `${(character2.health * 100)/character2.totalHealth}%` : "0%";
            this.player1Health.text =  Math.floor(character1.health) ;
            this.player2Health.text =  Math.floor(character2.health) ;
            }
          break;
        }

    }
    }     
  }
  getCharacterbyName(code){
    let character;
    if(this.characters.length > 0)
    character = this.characters.find(character => { return (character.code === code)});
    return character;
  }   

  checkDistance = (distance) => {
    let character1 =  this.getCharacterbyName("player1");
    let character2 =  this.getCharacterbyName("player2");
    return (character1.position.z - character2.position.z < distance
        && character1.position.z - character2.position.z > -1 * distance)
  }

  checkIfLeavingScene = (player, offset) =>{
    let character = this.getCharacterbyName(player);
    return (!(character.position.z < offset && character.position.z > (-1* offset)))
  }

  animation = (fbx, path, animFile, options?) => {
    const anim = new FBXLoader(this.manager);
    anim.setPath(path);
    anim.load(animFile, (anim) => {
      const m = new THREE.AnimationMixer(fbx);
      const idle = m.clipAction(anim.animations[0]);
      if(options && options.loopOnce === true) //All animations except Idle 
        {
            this.mixers[fbx.code].splice(1, 1, m);
            this.mixers[`${fbx.code}animFile`] = animFile.split('/')[animFile.split('/').length - 1];
            this.mixers[`${fbx.code}moving`] = true;
            if(!this.gameover && !options.aggressor)
            setTimeout(() => {
                  this.mixers[`${fbx.code}moving`] = false;
            }, 500);
            idle.setLoop( THREE.LoopOnce );
            setTimeout(()=>{
              if(!this.gameover && options.aggressor)
                    this.mixers[`${fbx.code}moving`] = false;

              else if(this.gameover)
                  this.mixers[fbx.code].splice(0,1)
                }, anim.animations[0].duration * 1000);
        }
        else{
          this.mixers[fbx.code][0] = m;
        }
      if(options && options.clampWhenFinished === true)
      idle.clampWhenFinished = true;
      idle.play();
    });
    }

  Attack(Aggressor,Aggressee,AggressorObject,AggresseeObject,Attack,Impact,loss){
      let character1,character2;
      if(this.mixers[`${Aggressor}moving`])return;
      const Sounds = [[`Effort${this.CharacterSpecs[AggressorObject.name].Gender}.wav`, "Missed0.mp3", "Missed1.wav"][this.getRandom(3)], `Punch${this.getRandom(7)}.mp3`]
      this.animation(AggressorObject, 'assets/', `Action/${AggressorObject.name}/${Attack}.fbx`, { loopOnce : true, aggressor: true});
      setTimeout(()=>{
        if(this.mixers[`${AggressorObject.code}animFile`] && !this.mixers[`${AggressorObject.code}animFile`].includes('Attack')) return;
          if(this.checkDistance(this.CharacterSpecs[AggressorObject.name][Attack].distance)){
            AggressorObject.breakAttack = 0;
            if(Aggressor === 'player1')
              this.breakAttack1 = {width:'0%'};
            else
              this.breakAttack2 = {width:'0%'};
            if(!AggresseeObject.breakAttack)
            {
              AggresseeObject.breakAttack = 1;
              {
                if(Aggressee === 'player1')
                  this.breakAttack1 = {width:'10%'};
                else
                  this.breakAttack2 = {width:'10%'};
              }
            }
            else if(AggresseeObject.breakAttack < 3)
            {
              AggresseeObject.breakAttack += 1;
              if(Aggressee === 'player1')
                this.breakAttack1 = {width: String(AggresseeObject.breakAttack * 10) + '%'} ;
              else
                this.breakAttack2 =  {width: String(AggresseeObject.breakAttack * 10) + '%'} ;
              if(this.breakAttack1.width === '30%')
                this.breakAttack1.text = 'Press ◯'
            }

            this.animation(AggresseeObject, 'assets/',`Action/${AggresseeObject.name}/${Impact}.fbx`, { loopOnce : true});
            this.soundEffect(Sounds[1], false, this.SOUND_VOLUME);
          AggresseeObject.health -= loss;
          if(Aggressor === "player1") {character1 = AggressorObject; character2 = AggresseeObject;}
          else{character2 = AggressorObject; character1 = AggresseeObject;}

          if(!this.checkIfLeavingScene(Aggressee,16)){
              let control = Aggressee === 'player1' ? 'A' : 'ARROWRIGHT'; 
              let impact = setInterval(()=>{
                this.breakAttackActive = true ;
                this.controller(control);
                this.controller(control === 'A' ? 'ARROWLEFT' : 'D')
              },20);
                setTimeout(() => {
                clearInterval(impact);
                this.breakAttackActive = false
                }, 150);
              }   
          this.player1Health.width = ((character1.health * 100)/character1.totalHealth > 0) ? `${(character1.health * 100)/character1.totalHealth}%` : "0%";
          this.player2Health.width = ((character2.health * 100)/character2.totalHealth > 0) ? `${(character2.health * 100)/character2.totalHealth}%` : "0%";
          this.player1Health.text =  Math.floor(character1.health) ;
          this.player2Health.text =  Math.floor(character2.health) ;
          if(AggresseeObject.health<= 0) 
            this.checkIfDead(AggressorObject,AggresseeObject);
          }
          else
          this.soundEffect(Sounds[0],  false, this.SOUND_VOLUME); 
      },this.CharacterSpecs[AggressorObject.name][Attack].time);
    }

  getRandom(max){
      return Math.floor(Math.random() * Math.floor(max))
    }

  loadManager(){
    this.manager.onStart = () => {
        if(!this.initialLoad){
          this.loaderActive = true;
        }
    }
    this.manager.onLoad =  () => {
        this.loaderActive = false;
        if(!this.initialLoad){
          this.showPrompt(false, "");
            this.characters.forEach(el => {el.visible = true;}
                );
                var i = 3;
                this.showPrompt(true, String(i));
                this.soundEffect('Fight.wav', false, this.SOUND_VOLUME)
                var countDown = setInterval(() => {
                    i--;
                    if(i!=0)
                    this.showPrompt(true, String(i))
                    else{
                    clearInterval(countDown);
                    this.showPrompt(true, 'FIGHT')
                    this.NPC();
                    if(this.mode === 1)
                    this.NPC1();
                    else
                      this.controlsActive = true;
                    setTimeout(()=> {
                        this.showPrompt(false,'');
                        this.topBarOptionsActive = true;
                        this.initialLoad = true;
                    },2000)
                    }
                }, 1000);
         }
        };
        this.manager.onProgress =  ( url, itemsLoaded, itemsTotal ) => {
            if(!this.initialLoad){
            this.loadPercentage = String(itemsLoaded / itemsTotal * 100) + "%";
            this.loadProgress = this.sanitized.bypassSecurityTrustHtml("loading - "+ itemsLoaded +" / "+ itemsTotal +" - " + url); }
        };
        this.manager.onError = ( url ) => {
            console.log( 'Error loading ' + url );
        };  
    }

  showPrompt(display:boolean,message:string){
      this.promptActive = display;
      this.promptMessage = message;
  }

  checkIfDead(AggressorObject, AggresseeObject){
      var message;
      this.wins = false ;
      this.gameover = true;
          this.animation(AggresseeObject, 'assets/', `Action/${AggresseeObject.name}/Dies.fbx`,{ loopOnce : true, clampWhenFinished : true })
          this.animation(AggressorObject, 'assets/', `Action/${AggressorObject.name}/Wins.fbx`,{ loopOnce : true, clampWhenFinished : true })
          if(this.mode === 0 )
          {
          if(AggresseeObject.code === "player1")
              {
                  this.soundEffect('Dies.wav', false, this.SOUND_VOLUME); 
                  sessionStorage.clear();
                  this.wins = false;
              }      
          else
          {
            this.soundEffect('Wins.wav', false, this.SOUND_VOLUME);
            this.wins = true
          }
          }
          this.soundEffect('Wins.wav', false, this.SOUND_VOLUME, `./assets/Action/${AggressorObject.name}/`);
          message = `${AggressorObject.name} Wins!`
          this.healthBar = localStorage.getItem(`${AggressorObject.name}Health`) || String(1500 * (1 + ( 0.1 * Number(localStorage.getItem('LEVEL') || 1))));
          var leftHealth = this.wins ? AggressorObject.health : AggresseeObject.health;
          this.damage = String(Math.floor(Number(this.healthBar) - Number(leftHealth)));
          if(this.wins)
          localStorage.setItem(`${AggressorObject.name}Health`, String(Math.floor(Number(this.healthBar) + 1  + (0.001* Number(leftHealth)))));
          this.healthBar = localStorage.getItem(`${AggressorObject.name}Health`);
          this.showPrompt(true, message);
          setTimeout(() => {
              if(!sessionStorage.getItem('players') && this.wins)
              {
                  var PlayerArray = Object.keys(this.CharacterSpecs);
                  if(PlayerArray.includes(AggresseeObject.name))
                  PlayerArray.splice(PlayerArray.indexOf(AggresseeObject.name), 1);
                  sessionStorage.setItem('players', PlayerArray.toLocaleString());
              }
              else if(this.wins){
                if(sessionStorage.getItem('players').toLocaleString().split(',').length == 1){
                  const level = Number(localStorage.getItem('LEVEL')) || 1 ;
                  localStorage.setItem('LEVEL', String(level + 1));
                  var PlayerArray = Object.keys(this.CharacterSpecs).splice(0,level);
                  this.newPlayer = Object.keys(this.CharacterSpecs)[level];
                  }
                if(sessionStorage.getItem('players').toLocaleString().split(',').length > 0)
                  {
                      var PlayerArray = sessionStorage.getItem('players').toLocaleString().split(',')
                      if(PlayerArray.includes(AggresseeObject.name))
                      PlayerArray.splice(PlayerArray.indexOf(AggresseeObject.name),1)
                      sessionStorage.setItem('players',  PlayerArray.toLocaleString());
                   }
                  }
              if(this.mode === 1 && !sessionStorage.getItem('players'))
              {
                var PlayerArray = Object.keys(this.CharacterSpecs);
                if(PlayerArray.includes(AggresseeObject.name))
                PlayerArray.splice(PlayerArray.indexOf(AggresseeObject.name), 1);
                sessionStorage.setItem('players', PlayerArray.toLocaleString());
              }
                  sessionStorage.setItem('mode', String(this.mode))
                  sessionStorage.setItem('player1',AggressorObject.name)
                  if(!sessionStorage.getItem('players'))
                      sessionStorage.clear();
                      if(this.mode === 0){
                      this.statsActive = true;
                      this.showPrompt(false,'');
              setTimeout(() => {
                this.statsActive = false;
                window.location.reload();
              }, 5000);}
              else
              window.location.reload();
          }, 5000);
      }

  NPC(){
    //always Player2
        const actions = ['CONTROL', 'P'];
        // const movement = ['ARROWUP', 'ARROWRIGHT'];
        const forward = ['ARROWLEFT'];
        let timeElapsed;
        if(this.DIFFICULTY == "HARD" && this.mode === 0)
          timeElapsed = [1000, 1100];
        if(this.DIFFICULTY == "HARDER" && this.mode === 0)
          timeElapsed = [500, 550];
        else if(this.DIFFICULTY == "EXPERT" && this.mode === 0){
          timeElapsed = [250, 300];
        }
        else
          timeElapsed = [2200,3000];

            var follow = setInterval(() => {
                if(!this.checkDistance(15))
                if(this.paused)
                clearInterval(follow);
                if(!this.breakAttackActive)
                this.controller(forward[0]);
            }, 50);
            var attack = setInterval(() => {
              if(this.paused)
              clearInterval(attack);
              if(this.breakAttack2.width === '30%'){
              this.controller('L');
              }
              else if(this.checkDistance(22))
                this.controller(actions[this.getRandom(2)]);
            }, timeElapsed[this.getRandom(2)]);
  }

  NPC1(){
    //always Player1(in Watch mode)
        const actions = ['E', 'F'];
        // const movement = ['W', 'A'];
        const forward = ['D'];
        const timeElapsed = [2000,3200]
            var follow = setInterval(() => {
                if(!this.checkDistance(15))
                if(this.paused)
                clearInterval(follow);
                if(!this.breakAttackActive)
                this.controller(forward[0]);
            },50);
            var attack = setInterval(() => {
              if(this.paused)
              clearInterval(attack);
               if(this.breakAttack1.width === '30%'){
                this.controller('Q');
                }
               else if(this.checkDistance(22))
                this.controller(actions[this.getRandom(2)]);
            }, timeElapsed[1]);
    }

  LoadAnimatedModelAndPlay(player, offset, playerCode, rotate?){
      const loader = new FBXLoader(this.manager);
      loader.setPath('assets/');
      loader.load(`Character/${player}.fbx`, (fbx) => {
        var health;
        if(playerCode === 'player1' && this.mode === 0)
          {
            health = localStorage.getItem(`${player}Health`) ||  1500 * (1 + ( 0.1 * Number(localStorage.getItem('LEVEL') || 1)));
            this.player1Health.text =  Math.floor(health); 
          }
        else if(playerCode === 'player1'){
            health = 1500 * (1 + ( 0.3 * Number(localStorage.getItem('LEVEL') || 1)));
            this.player1Health.text =  Math.floor(health); 
        }
        else
          {
            health = 1500 * (1 + ( 0.3 * Number(localStorage.getItem('LEVEL') || 1)));
            this.player2Health.text = Math.floor(health); 
          }
          fbx.health = Number(health);
          fbx.totalHealth = Number(health);
          fbx.visible = false;
          fbx.name = player;
          fbx.code = playerCode;
          fbx.breakAttack = 0;
        this.characters.push(fbx);
        var scale = Number(this.CharacterSpecs[player].Scale) || 0.1
        scale = scale*0.9;
        fbx.scale.setScalar(scale);
        if(this.GRAPHICS == "ULTRA"){
        fbx.traverse(el => {
          if(el.isMesh)
              el.castShadow = true;
              el.receiveShadow = true;
        });}
        if(rotate)
          fbx.rotation.y = rotate
          this.animation(fbx, 'assets/', `Action/${player}/Idle.fbx`);
        fbx.position.copy(offset);
        this.scene.add(fbx);
      },
      (xhr)=>{
      }, (err)=>{});
    }

  LoadBackground(){
      const loadBg = new THREE.CubeTextureLoader(this.manager);
      const Scene = 'Scene' + String(this.getRandom(5) + 1);
      // const Scene = 'Scene5'; 
      const texture = loadBg.load([
          `assets/Background/${Scene}/posx.jpg`,
          `assets/Background/${Scene}/negx.jpg`,
          `assets/Background/${Scene}/posy.jpg`,
          `assets/Background/${Scene}/negy.jpg`,
          `assets/Background/${Scene}/posz.jpg`,
          `assets/Background/${Scene}/negz.jpg`,
      ]);
      this.scene.background = texture;
      const plane = new THREE.Mesh(
      new THREE.PlaneGeometry( 76.5 ,121.5, 100, 100),
      new THREE.MeshStandardMaterial({
              color: 0x202020,
              map: (new THREE.TextureLoader).load("assets/Background/plane.jpg"),
          }));
      if(this.GRAPHICS=="ULTRA"){
          plane.castShadow = false;
          plane.receiveShadow = true;
      }
      plane.rotation.x = -Math.PI / 2;
      plane.position.x = 60
      this.scene.add(plane);
    }

  RAF(){
      requestAnimationFrame((t) => {
        if (this.previousRAF === null) {
          this.previousRAF = t;
        }if(!this.paused )
        this.RAF();
        this.Step(t - this.previousRAF);
        this.previousRAF = t;
      });
      this.renderer.render(this.scene, this.camera);
    }

  Step(timeElapsed){
      const timeElapsedS = timeElapsed * 0.001;
      var index = [];
      if (this.mixers["player1"]) 
            this.mixers["player1"].forEach((m,i) => {
                if(m._actions[0].enabled)
                  m.update(timeElapsedS)
                else
                    index[0] = i;
              });
            
        if (this.mixers["player2"]) 
          this.mixers["player2"].forEach((m,i) => {
            if(m._actions[0].enabled)
              m.update(timeElapsedS)
            else
              index[1] = i;
            });
    }

  InitializeFight(player1, player2, mode){
      this.loadManager();
      let hemiLight, light;
      this.player1 = player1;
      this.player2 = player2;
      this.mode = mode;
      this.renderer.setClearColor("#E5E5E5");
      hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 2);
      this.scene.add(hemiLight);
      const exposure = {HIGH:.4,ULTRA:.8,MEDIUM:0} 
      light = new THREE.SpotLight(0xffa95c,exposure[this.GRAPHICS]);
      if(this.GRAPHICS === "ULTRA"){
          light.position.set(
              75, 20, 0
          )
          light.castShadow = true;
          light.shadow.bias  = -0.0001;
          light.shadow.mapSize.width = 1024*4;
          light.shadow.mapSize.height = 1024*4;
          }
      else if(this.GRAPHICS === "HIGH"){
          light.position.set(100, 100, 0)
          light.shadow.mapSize.width = 1024*4;
          light.shadow.mapSize.height = 1024*4;
          }
      this.scene.add( light );
      this.renderer.toneMapping =  THREE.ReinhardToneMapping;
      this.renderer.toneMappingExposure = 2.3;
      this.renderer.shadowMap.enabled = true;
      const controls = new OrbitControls(this.camera, this.renderer.domElement);
      controls.target.set(0, 0, 0);
      controls.update();
      this.renderer.setSize( window.innerWidth, window.innerHeight);
      document.body.appendChild( this.renderer.domElement);
      document.addEventListener('keydown', (event) => {this.controller(event.key)});
          this.LoadBackground();
          this.LoadAnimatedModelAndPlay(
                  player2, new THREE.Vector3(52, 4, -14), 'player2');
          this.LoadAnimatedModelAndPlay(
                  player1, new THREE.Vector3(52, 4, 14), 'player1', 3);
          this.RAF();
      }      

  changeSettings(option){
      this.soundEffect('Button.wav', false, this.SOUND_VOLUME);
        switch(option){
          case "GRAPHICS" : {
            let options = ['ULTRA', 'HIGH', 'MEDIUM'];
            const current = this.GRAPHICS;
            this.GRAPHICS = options[options.indexOf(current) + 1] || options[0];
            break;
          }
          case "SOUNDUP" : {
            if(this.SOUND_VOLUME < 100)
             this.SOUND_VOLUME += 5;
             break;
          }
          case "SOUNDDOWN" : {
            if(this.SOUND_VOLUME > 0)
             this.SOUND_VOLUME -= 5;
             break;
          }
          case "SAVE": {
            localStorage.setItem("GRAPHICS",this.GRAPHICS);
            localStorage.setItem("DIFFICULTY",this.DIFFICULTY);
            localStorage.setItem("SOUND",String(this.SOUND_VOLUME));
            this.settingsActive = false;
            break;
          }
          case "DIFFICULTY":{
            let options = ["NORMAL", "HARD", "HARDER" ,"EXPERT" ];
            const current = this.DIFFICULTY;
            this.DIFFICULTY = options[options.indexOf(current) + 1] || options[0];
            break;
          }
      }
  }

  topBarOptions(option){
    switch(option){
      case "HOME":{
        sessionStorage.clear();
        window.location.reload();
        break;
      }
      case "PAUSE":{
        this.paused = !this.paused;
        if(this.paused){
            this.showPrompt(true,'PAUSED');
            this.pauseButton = this.sanitized.bypassSecurityTrustHtml( CONSTANTS.play );
        }
        else{
            this.NPC();
            if(this.mode === 1)
            this.NPC1();
            this.showPrompt(false, '');
            this.pauseButton = this.sanitized.bypassSecurityTrustHtml( CONSTANTS.pause );
            this.RAF();
        }
        this.mixers['player1'].forEach(m=>{
          m._actions[0].paused = this.paused;
        })  
        this.mixers['player2'].forEach(m=>{
          m._actions[0].paused = this.paused;
      })  
        break;
      }
  }
  }

  fullscreen(){
    if (document.exitFullscreen) 
        {
          document.exitFullscreen();
          this.fullscreenButton = this.sanitized.bypassSecurityTrustHtml( CONSTANTS.fullscreen );
        }
    if (!document.fullscreenElement) 
        {
          document.documentElement.requestFullscreen();
          this.fullscreenButton = this.sanitized.bypassSecurityTrustHtml( CONSTANTS.exitfullscreen );
          if(window.screen.orientation)
          window.screen.orientation.lock("landscape")
          .then(
            success => console.log(success),
            failure => console.log(failure)
          )}
  }

  changeMenuOptions(option, value?){
    this.soundEffect('Button.wav', false, this.SOUND_VOLUME);
    switch(option){
      case "FIGHT": {
        this.startGame(this.player1,this.player2,0);
        if( window.plugins &&  window.plugins.insomnia)
        window.plugins.insomnia.keepAwake();
        break;
      }
      case "WATCH": {
        this.startGame(this.player1,this.player2,1);
        if( window.plugins &&  window.plugins.insomnia)
        window.plugins.insomnia.keepAwake();
        break;
      }
      case "SETTINGS": {
        this.settingsActive = true;
        this.GRAPHICS = localStorage.getItem("GRAPHICS") || "HIGH";
        this.SOUND_VOLUME = Number(localStorage.getItem("SOUND")) || 30;
        break;
      }
      case "PLAYER1": {
        this.player1 = value;
        break;
      }
      case "PLAYER2": {
        this.player2 = value;
        break;
      }
    }
  }
}

export enum CONSTANTS{
  pause = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pause" viewBox="0 0 16 16">
      <path d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5z"/>
    </svg>`,
  play = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 16 16">
      <path d="M11.596 8.697l-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
    </svg>`,
  menu = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-house" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M2 13.5V7h1v6.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V7h1v6.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5zm11-11V6l-2-2V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5z"/>
      <path fill-rule="evenodd" d="M7.293 1.5a1 1 0 0 1 1.414 0l6.647 6.646a.5.5 0 0 1-.708.708L8 2.207 1.354 8.854a.5.5 0 1 1-.708-.708L7.293 1.5z"/>
    </svg>`,
  exitfullscreen = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-fullscreen-exit" viewBox="0 0 16 16">
      <path d="M5.5 0a.5.5 0 0 1 .5.5v4A1.5 1.5 0 0 1 4.5 6h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5zm5 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 10 4.5v-4a.5.5 0 0 1 .5-.5zM0 10.5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 6 11.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zm10 1a1.5 1.5 0 0 1 1.5-1.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4z"/>
    </svg>`,
  fullscreen = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrows-fullscreen" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707zm4.344 0a.5.5 0 0 1 .707 0l4.096 4.096V11.5a.5.5 0 1 1 1 0v3.975a.5.5 0 0 1-.5.5H11.5a.5.5 0 0 1 0-1h2.768l-4.096-4.096a.5.5 0 0 1 0-.707zm0-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707zm-4.344 0a.5.5 0 0 1-.707 0L1.025 1.732V4.5a.5.5 0 0 1-1 0V.525a.5.5 0 0 1 .5-.5H4.5a.5.5 0 0 1 0 1H1.732l4.096 4.096a.5.5 0 0 1 0 .707z"/>
        </svg>`
}


