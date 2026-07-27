import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const mainPath=path.join(root,'src','main.js');
const cssPath=path.join(root,'src','styles.css');
let main=fs.readFileSync(mainPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');
const replace=(from,to,label)=>{if(!main.includes(from))throw new Error(`v1.8.1 patch missing: ${label}`);main=main.replace(from,to);};

replace("import './styles.css';","import './styles.css';\nimport '../overlay-v181/v181.css';",'css import');
replace("let playerActor, interiorSystem, dialogue, demoDirector, missionContact;","let playerActor, interiorSystem, dialogue, demoDirector, missionContact;\nlet v181MoveVelocity=new THREE.Vector3();\nlet v181PointerGraceUntil=0;\nlet v181LastSafePosition=new THREE.Vector3(-130,0,-118);\nlet v181RecoveryHint=null;",'runtime state');

const oldUpdatePlayer=`function updatePlayer(dt) {
  if (!player || state.activeVehicle || !state.running || state.paused || state.gameOver) return;
  const forward=inputAxis('forward'),turn=inputAxis('turn');
  const moving=Math.abs(forward)>.03||Math.abs(turn)>.03;
  const sprint=(input.keys.has('ShiftLeft')||input.keys.has('ShiftRight'))&&state.stamina>2&&forward>.1;
  const speed=sprint?CONFIG.sprintSpeed:CONFIG.playerSpeed;
  if(sprint)state.stamina=Math.max(0,state.stamina-dt*24);else state.stamina=Math.min(100,state.stamina+dt*(moving?9:16));
  const fwd=tmpV.set(-Math.sin(cameraYaw),0,-Math.cos(cameraYaw));
  const right=tmpV2.set(Math.cos(cameraYaw),0,-Math.sin(cameraYaw));
  const move=new THREE.Vector3().addScaledVector(fwd,forward).addScaledVector(right,turn);
  if(move.lengthSq()>1)move.normalize();
  if(move.lengthSq()>.01){
    player.rotation.y=Math.atan2(move.x,move.z);
    const nx=player.position.x+move.x*speed*dt,nz=player.position.z+move.z*speed*dt;
    if(!collidesAt(nx,player.position.z,.52))player.position.x=nx;
    if(!collidesAt(player.position.x,nz,.52))player.position.z=nz;
  }
  if((input.jumpQueued||input.keys.has('Space'))&&player.position.y<=.001){playerVelocity.y=CONFIG.jumpVelocity;audio.tone(180,.08,'triangle',.06,80);}
  input.jumpQueued=false;
  playerVelocity.y-=CONFIG.gravity*dt;
  player.position.y+=playerVelocity.y*dt;
  if(player.position.y<0){player.position.y=0;playerVelocity.y=0;}
  const desiredAnimation = player.position.y > .08 ? 'Run' : sprint ? 'Run' : moving ? 'Walk' : (input.aim ? 'Aim' : 'Idle');
  playerActor?.setWeapon(state.weapon);
  playerActor?.update(dt, desiredAnimation);
}`;
const newUpdatePlayer=`function updatePlayer(dt) {
  if (!player || state.activeVehicle || !state.running || state.paused || state.gameOver) return;
  const forward=inputAxis('forward'),turn=inputAxis('turn');
  const moving=Math.abs(forward)>.03||Math.abs(turn)>.03;
  const sprint=(input.keys.has('ShiftLeft')||input.keys.has('ShiftRight'))&&state.stamina>2&&forward>.1;
  const speed=sprint?CONFIG.sprintSpeed:CONFIG.playerSpeed;
  if(sprint)state.stamina=Math.max(0,state.stamina-dt*24);else state.stamina=Math.min(100,state.stamina+dt*(moving?9:16));
  const fwd=tmpV.set(-Math.sin(cameraYaw),0,-Math.cos(cameraYaw));
  const right=tmpV2.set(Math.cos(cameraYaw),0,-Math.sin(cameraYaw));
  const desiredMove=new THREE.Vector3().addScaledVector(fwd,forward).addScaledVector(right,turn);
  if(desiredMove.lengthSq()>1)desiredMove.normalize();
  desiredMove.multiplyScalar(speed);
  const response=moving?(sprint?13:16):20;
  v181MoveVelocity.lerp(desiredMove,1-Math.exp(-response*dt));
  if(v181MoveVelocity.lengthSq()>.02){
    const nx=player.position.x+v181MoveVelocity.x*dt,nz=player.position.z+v181MoveVelocity.z*dt;
    let moved=false;
    if(!collidesAt(nx,player.position.z,.48)){player.position.x=nx;moved=true;}else v181MoveVelocity.x*=.12;
    if(!collidesAt(player.position.x,nz,.48)){player.position.z=nz;moved=true;}else v181MoveVelocity.z*=.12;
    if(moved){player.rotation.y=rotateToward(player.rotation.y,Math.atan2(v181MoveVelocity.x,v181MoveVelocity.z),Math.min(1,dt*12));v181LastSafePosition.copy(player.position);}
  }
  if((input.jumpQueued||input.keys.has('Space'))&&player.position.y<=.001){playerVelocity.y=CONFIG.jumpVelocity;audio.tone(180,.08,'triangle',.06,80);}
  input.jumpQueued=false;
  playerVelocity.y-=CONFIG.gravity*dt;
  player.position.y+=playerVelocity.y*dt;
  if(player.position.y<0){player.position.y=0;playerVelocity.y=0;}
  const desiredAnimation = player.position.y > .08 ? 'Run' : sprint ? 'Run' : moving ? 'Walk' : (input.aim ? 'Aim' : 'Idle');
  playerActor?.setWeapon(state.weapon);
  playerActor?.update(dt, desiredAnimation);
}`;
replace(oldUpdatePlayer,newUpdatePlayer,'smooth player movement');

const oldCamera=`function updateCamera(dt) {
  const target=state.activeVehicle?state.activeVehicle.mesh.position:player.position;
  const height=state.activeVehicle?2.4:1.65;
  const distance=state.activeVehicle?10.5:cameraDistance;
  const desired=new THREE.Vector3(
    target.x+Math.sin(cameraYaw)*Math.cos(cameraPitch)*distance,
    target.y+height-Math.sin(cameraPitch)*distance,
    target.z+Math.cos(cameraYaw)*Math.cos(cameraPitch)*distance
  );
  camera.position.lerp(desired,1-Math.pow(.001,dt));
  camera.lookAt(target.x,target.y+height,target.z);
}`;
const newCamera=`function updateCamera(dt) {
  const target=state.activeVehicle?state.activeVehicle.mesh.position:player.position;
  const height=state.activeVehicle?2.4:1.65;
  const baseDistance=state.activeVehicle?10.5:cameraDistance;
  const focus=new THREE.Vector3(target.x,target.y+height,target.z);
  const direction=new THREE.Vector3(Math.sin(cameraYaw)*Math.cos(cameraPitch),-Math.sin(cameraPitch),Math.cos(cameraYaw)*Math.cos(cameraPitch));
  let safeDistance=baseDistance;
  for(let d=1.2;d<=baseDistance;d+=.45){const probe=focus.clone().addScaledVector(direction,d);if(collidesAt(probe.x,probe.z,.28)){safeDistance=Math.max(1.15,d-.75);break;}}
  const desired=focus.clone().addScaledVector(direction,safeDistance);
  camera.position.lerp(desired,1-Math.exp(-10*dt));
  const speed=Math.abs(state.activeVehicle?.speed||0);
  const targetFov=state.activeVehicle?clamp(62+speed*.22,62,76):input.aim?52:64;
  camera.fov=lerp(camera.fov,targetFov,1-Math.exp(-6*dt));camera.updateProjectionMatrix();
  camera.lookAt(focus);
}`;
replace(oldCamera,newCamera,'collision camera');

replace("if(e.code==='KeyP'&&!e.repeat)togglePhone();","if(e.code==='KeyP'&&!e.repeat){v181PointerGraceUntil=performance.now()+800;togglePhone();}\n    if(e.code==='KeyF'&&!e.repeat)recoverPlayerPosition();",'recovery hotkey');
replace("document.addEventListener('pointerlockchange',()=>{state.pointerLocked=document.pointerLockElement===dom.canvas;if(state.running&&!state.pointerLocked&&!isTouch)togglePause(true);});","document.addEventListener('pointerlockchange',()=>{state.pointerLocked=document.pointerLockElement===dom.canvas;const modalOpen=!!document.querySelector('.modal:not(.hidden),#phone-panel:not(.hidden)');if(state.running&&!state.pointerLocked&&!isTouch&&!modalOpen&&performance.now()>v181PointerGraceUntil)togglePause(true);});",'pointer lock safety');

replace("function beginPlay() {","function recoverPlayerPosition(){\n  if(!player)return;\n  const target=state.currentMission!=null?MISSIONS[state.currentMission]?.start:null;\n  const fallback=target?new THREE.Vector3(target.x,0,target.z):v181LastSafePosition;\n  if(state.activeVehicle){state.activeVehicle.mesh.position.copy(fallback);state.activeVehicle.speed=0;}else{player.position.copy(fallback);playerVelocity.set(0,0,0);v181MoveVelocity.set(0,0,0);}\n  notify('Position recovered. Press F anytime if stuck.',2.2);\n}\n\nfunction mountV181HUD(){\n  if(document.getElementById('v181-recovery-hint'))return;\n  v181RecoveryHint=document.createElement('div');v181RecoveryHint.id='v181-recovery-hint';v181RecoveryHint.textContent='F · RECOVER POSITION';document.body.append(v181RecoveryHint);\n  setTimeout(()=>v181RecoveryHint?.classList.add('show'),1800);setTimeout(()=>v181RecoveryHint?.classList.remove('show'),6200);\n}\n\nfunction buildV181WorldPolish(){\n  const roadMat=new THREE.MeshStandardMaterial({color:0xf5f0d6,roughness:.72,metalness:.02,emissive:0x18150b,emissiveIntensity:.12});\n  for(let z=-156;z<=156;z+=12){for(const x of [-120,-60,0,60,120]){const mark=new THREE.Mesh(new THREE.BoxGeometry(.16,.018,4.8),roadMat);mark.position.set(x,.035,z);mark.receiveShadow=true;scene.add(mark);}}\n  const trunkMat=new THREE.MeshStandardMaterial({color:0x68452e,roughness:.95});const leafMat=new THREE.MeshStandardMaterial({color:0x1f6a48,roughness:.82});\n  for(let i=0;i<28;i++){const a=i*2.399,r=148+(i%3)*7,x=Math.cos(a)*r,z=Math.sin(a)*r;if(collidesAt(x,z,1.5))continue;const tree=new THREE.Group();const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18,.26,2.5,8),trunkMat);trunk.position.y=1.25;const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.25,1),leafMat);crown.position.y=3;tree.add(trunk,crown);tree.position.set(x,0,z);tree.traverse(o=>{if(o.isMesh){o.castShadow=state.quality==='high'||state.quality==='ultra';o.receiveShadow=true;}});scene.add(tree);}\n}\n\nfunction beginPlay() {",'recovery and world polish');
replace("buildWorld();\n    await initPostFX();","buildWorld();\n    buildV181WorldPolish();\n    mountV181HUD();\n    await initPostFX();",'init polish');
replace("renderer.setPixelRatio(ratio);renderer.shadowMap.enabled=value==='high'||value==='ultra';renderer.shadowMap.type=THREE.PCFSoftShadowMap;","renderer.setPixelRatio(ratio);renderer.shadowMap.enabled=value==='high'||value==='ultra';renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=value==='ultra'?1.12:value==='high'?1.06:1;renderer.outputColorSpace=THREE.SRGBColorSpace;",'renderer quality');

main=main.replaceAll('v1.8.0','v1.8.1');
css += '\n/* v1.8.1 generated compatibility marker */\n';
fs.writeFileSync(mainPath,main);
fs.writeFileSync(cssPath,css);
console.log('Applied Neon Bay v1.8.1 playability and visual hotfix.');
