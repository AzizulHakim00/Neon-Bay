import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mainPath = resolve(root, 'src/main.js');
const moduleSource = resolve(root, 'overlay-v18/modules/empire-expansion-v18.js');
const moduleTarget = resolve(root, 'src/modules/empire-expansion-v18.js');
const cssSource = resolve(root, 'overlay-v18/v18.css');
const cssTarget = resolve(root, 'src/styles.css');

const replaceOnce = (source, before, after, label) => {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`v1.8 patch ${label} expected one match, found ${count}`);
  return source.replace(before, () => after);
};

await mkdir(dirname(moduleTarget), { recursive: true });
await copyFile(moduleSource, moduleTarget);

let source = await readFile(mainPath, 'utf8');
source = replaceOnce(source,
  "import { LivingCityV17, v17WantedProfile } from './modules/living-city-v17.js';",
  "import { LivingCityV17, v17WantedProfile } from './modules/living-city-v17.js';\nimport { EmpireExpansionV18 } from './modules/empire-expansion-v18.js';",
  'empire import');

source = replaceOnce(source,
  "  saveKeyPrefix: 'neon-bay-save-v5-slot-',\n  saveIndexKey: 'neon-bay-save-v5-index',\n  backupKeyPrefix: 'neon-bay-save-v5-backup-',\n  legacySaveKey: 'neon-bay-save-v4',\n  olderLegacySaveKey: 'neon-bay-save-v3',",
  "  saveKeyPrefix: 'neon-bay-save-v6-slot-',\n  saveIndexKey: 'neon-bay-save-v6-index',\n  backupKeyPrefix: 'neon-bay-save-v6-backup-',\n  legacySaveKey: 'neon-bay-save-v5-slot-1',\n  legacySaveIndexKey: 'neon-bay-save-v5-index',\n  legacySavePrefix: 'neon-bay-save-v5-slot-',\n  legacyBackupPrefix: 'neon-bay-save-v5-backup-',\n  olderLegacySaveKey: 'neon-bay-save-v4',\n  v3SaveKey: 'neon-bay-save-v3',",
  'save configuration');
source = source.replace("  olderSaveKey: 'neon-bay-save-v2',", "  olderSaveKey: 'neon-bay-save-v2',");
source = source.replace("  saveSlot: Number(localStorage.getItem('neon-bay-save-v5-index')) || 1,", "  saveSlot: Number(localStorage.getItem('neon-bay-save-v6-index') || localStorage.getItem('neon-bay-save-v5-index')) || 1,");

source = replaceOnce(source,
  "let composer=null, bloomPass=null, cinematicPass=null, ssaoPass=null, fxaaPass=null, oceanSurface=null, skyDome=null, sunDisc=null, visualOverhaul=null, cinematicCity=null, v17Director=null, eventMarker=null;",
  "let composer=null, bloomPass=null, cinematicPass=null, ssaoPass=null, fxaaPass=null, oceanSurface=null, skyDome=null, sunDisc=null, visualOverhaul=null, cinematicCity=null, v17Director=null, v18Empire=null, eventMarker=null;",
  'empire global');

source = replaceOnce(source,
  "    if (!this.police) v17Director?.recordKill();",
  "    if (!this.police) { v17Director?.recordKill(); v18Empire?.recordKill(); }",
  'contract kill tracking');

source = replaceOnce(source,
  "    const targetMax = p.maxSpeed * (boost ? 1.24 : 1) * upgradeEngine * engineFactor;",
  "    const fleetKey = this.id === 'infernus' || this.type === 'exotic' ? 'infernus' : this.id === 'ocean' ? 'ocean' : 'sunset';\n    const fleetEngine = v18Empire?.vehicleEffect(fleetKey,'engine') || 1;\n    const fleetNitro = boost ? (v18Empire?.vehicleEffect(fleetKey,'nitro') || 1) : 1;\n    const targetMax = p.maxSpeed * (boost ? 1.24 : 1) * upgradeEngine * engineFactor * fleetEngine * fleetNitro;",
  'fleet performance');
source = replaceOnce(source,
  "      if (impact > 8) { const impactFactor=v17Director?.skillEffect('vehicleDamage')||1; applyVehicleImpact(this,impact*impactFactor,'front'); visualOverhaul?.emitImpact(this.mesh.position.clone(), impact); damagePlayer(impact * .1 * impactFactor); audio.hit(); }",
  "      if (impact > 8) { const fleetKey=this.id==='infernus'||this.type==='exotic'?'infernus':this.id==='ocean'?'ocean':'sunset';const impactFactor=(v17Director?.skillEffect('vehicleDamage')||1)*(v18Empire?.vehicleEffect(fleetKey,'armor')||1); applyVehicleImpact(this,impact*impactFactor,'front'); visualOverhaul?.emitImpact(this.mesh.position.clone(), impact); damagePlayer(impact * .1 * impactFactor); audio.hit(); }",
  'fleet armor');

source = replaceOnce(source,
  "  v17Director = new LivingCityV17({}, { random });\n  v17Director.mountUI(document);",
  "  v17Director = new LivingCityV17({}, { random });\n  v17Director.mountUI(document);\n  v18Empire = new EmpireExpansionV18();\n  v18Empire.mountUI(document);",
  'empire creation');
source = replaceOnce(source,
  "  player = createPlayer();\n  updateLighting(0);",
  "  player = createPlayer();\n  v18Empire.buildWorld(scene);\n  updateLighting(0);",
  'empire world');

const v18Update = `
function updateV18Systems(dt){
  if(!v18Empire||!player)return;
  const nitroActive=!!state.activeVehicle&&(input.keys.has('ShiftLeft')||input.keys.has('ShiftRight'))&&state.nitro>0;
  v18Empire.update(dt,{playerPosition:getPlayerPosition(),activeVehicle:state.activeVehicle,wanted:state.wanted,nitroActive,health:state.health,running:state.running,paused:state.paused});
}
`;
source = replaceOnce(source,
  "function rotateToward(current, target, maxDelta) {",
  `${v18Update}\nfunction rotateToward(current, target, maxDelta) {`,
  'empire update function');
source = replaceOnce(source,
  "  updateV17Systems(dt);\n  visualOverhaul?.update(dt",
  "  updateV17Systems(dt);\n  updateV18Systems(dt);\n  visualOverhaul?.update(dt",
  'empire update hook');

const saveStart = source.indexOf('function slotKey(slot=state.saveSlot)');
const saveEnd = source.indexOf('\nfunction beginPlay()', saveStart);
if (saveStart < 0 || saveEnd < 0) throw new Error('v1.8 save block missing');
const saveBlock = `function slotKey(slot=state.saveSlot){return \`${'${CONFIG.saveKeyPrefix}${clamp(Number(slot)||1,1,3)}'}\`;}
function backupKey(slot=state.saveSlot){return \`${'${CONFIG.backupKeyPrefix}${clamp(Number(slot)||1,1,3)}'}\`;}
function legacySlotKey(slot=state.saveSlot){return \`${'${CONFIG.legacySavePrefix}${clamp(Number(slot)||1,1,3)}'}\`;}
function hasAnySave(){return [1,2,3].some(slot=>localStorage.getItem(slotKey(slot))||localStorage.getItem(legacySlotKey(slot)))||localStorage.getItem(CONFIG.olderLegacySaveKey)||localStorage.getItem(CONFIG.v3SaveKey)||localStorage.getItem(CONFIG.olderSaveKey)||localStorage.getItem(CONFIG.oldestSaveKey);}
function setSaveSlot(slot){state.saveSlot=clamp(Number(slot)||1,1,3);localStorage.setItem(CONFIG.saveIndexKey,String(state.saveSlot));document.querySelectorAll('#v17-save-slot').forEach(select=>select.value=String(state.saveSlot));dom.continueBtn.disabled=!hasAnySave();if(state.running||state.paused)notify(\`Save slot ${'${state.saveSlot}'} selected.\`,1.4);}

function saveGame(silent=false) {
  if(!player)return;
  state.weaponData[state.weapon].ammo=state.ammo;state.weaponData[state.weapon].reserve=state.reserve;
  const p=getPlayerPosition();
  const data={version:6,saveSlot:state.saveSlot,currentMission:state.currentMission,missionStep:state.missionStep,cash:state.cash,health:state.health,armor:state.armor,weapon:state.weapon,weaponData:state.weaponData,ownedWeapons:{...state.ownedWeapons},timeOfDay:state.timeOfDay,position:{x:p.x,z:p.z},chapterComplete:state.chapterComplete,storyComplete:state.storyComplete,firstRideCinematicSeen:state.firstRideCinematicSeen,progression:progression.serialize(),businessEmpire:businessEmpire.serialize(),vehicleUpgrades:{...state.vehicleUpgrades},territoryControl:{...state.territoryControl},radioStation:state.radioStation,outfitIndex:state.outfitIndex,nitro:state.nitro,v17:v17Director?.serialize(),v18:v18Empire?.serialize()};
  const key=slotKey();const existing=localStorage.getItem(key);if(existing)localStorage.setItem(backupKey(),existing);localStorage.setItem(key,JSON.stringify(data));localStorage.setItem(CONFIG.saveIndexKey,String(state.saveSlot));dom.continueBtn.disabled=false;if(!silent)notify(\`Game saved to slot ${'${state.saveSlot}'}.\`,1.5);
}

function loadGame(slot=state.saveSlot,allowBackup=true) {
  state.saveSlot=clamp(Number(slot)||1,1,3);localStorage.setItem(CONFIG.saveIndexKey,String(state.saveSlot));
  const raw=localStorage.getItem(slotKey())||localStorage.getItem(legacySlotKey())||localStorage.getItem(CONFIG.olderLegacySaveKey)||localStorage.getItem(CONFIG.v3SaveKey)||localStorage.getItem(CONFIG.olderSaveKey)||localStorage.getItem(CONFIG.oldestSaveKey);if(!raw)return false;
  try{
    const d=JSON.parse(raw);state.cash=d.cash??500;state.health=d.health??100;state.armor=d.armor??25;state.nitro=d.nitro??100;state.timeOfDay=d.timeOfDay??18.3;state.chapterComplete=!!d.chapterComplete;state.storyComplete=!!d.storyComplete;state.firstRideCinematicSeen=d.firstRideCinematicSeen??true;
    progression=new ProgressionSystem(d.progression||{});businessEmpire=new BusinessEmpire(d.businessEmpire||{});v17Director?.hydrate(d.v17||{});v18Empire?.hydrate(d.v18||{});state.vehicleUpgrades={engine:0,brakes:0,grip:0,...d.vehicleUpgrades};state.ownedWeapons={pistol:true,shotgun:true,smg:false,...d.ownedWeapons};state.territoryControl={...state.territoryControl,...d.territoryControl};state.radioStation=d.radioStation||0;state.outfitIndex=d.outfitIndex||0;
    const defaultWeapons={pistol:{ammo:d.ammo??12,reserve:d.reserve??72,mag:12},shotgun:{ammo:6,reserve:24,mag:6},smg:{ammo:30,reserve:90,mag:30}};state.weaponData={...defaultWeapons,...(d.weaponData||{})};state.weapon=d.weapon||'pistol';if(!state.ownedWeapons[state.weapon])state.weapon='pistol';state.ammo=state.weaponData[state.weapon].ammo;state.reserve=state.weaponData[state.weapon].reserve;
    startMission(d.currentMission??0,false);player.position.set(d.position?.x??MISSIONS[state.currentMission].start.x,0,d.position?.z??MISSIONS[state.currentMission].start.z);playerActor?.setWeapon(state.weapon);applyOutfit(state.outfitIndex);
    [1,2,3].forEach(index=>{if(index===state.saveSlot)localStorage.removeItem(legacySlotKey(index));});localStorage.removeItem(CONFIG.legacySaveIndexKey);localStorage.removeItem(CONFIG.olderLegacySaveKey);localStorage.removeItem(CONFIG.v3SaveKey);localStorage.removeItem(CONFIG.olderSaveKey);localStorage.removeItem(CONFIG.oldestSaveKey);audio.setRadio(state.radioStation,false);saveGame(true);return true;
  }catch(error){const backup=allowBackup?localStorage.getItem(backupKey()):null;if(backup){localStorage.setItem(slotKey(),backup);notify('Recovered the previous save backup.',2.4);return loadGame(state.saveSlot,false);}console.warn('Save load failed',error);return false;}
}

function newGame() {
  localStorage.removeItem(slotKey());localStorage.removeItem(backupKey());
  Object.assign(state,{health:100,armor:25,stamina:100,cash:850,weapon:'pistol',ammo:12,reserve:72,weaponData:{pistol:{ammo:12,reserve:72,mag:12},shotgun:{ammo:6,reserve:24,mag:6},smg:{ammo:30,reserve:90,mag:30}},ownedWeapons:{pistol:true,shotgun:true,smg:false},wanted:0,wantedHeat:0,nitro:100,eventKills:0,eventTime:0,timeOfDay:18.3,weather:'CLEAR',chapterComplete:false,storyComplete:false,gameOver:false,currentInterior:null,firstRideCinematicSeen:false,activeActivity:null,vehicleUpgrades:{engine:0,brakes:0,grip:0},radioStation:0,territoryControl:{'ocean-drive':35,'vice-point':20,harbor:15,downtown:10,'little-bay':45},outfitIndex:0});
  progression=new ProgressionSystem();businessEmpire=new BusinessEmpire();v17Director?.hydrate({});v18Empire?.hydrate({});audio.setRadio(0,false);applyOutfit(0);playerActor?.setWeapon('pistol');startMission(0,true);beginPlay();
}
`;
source = source.slice(0, saveStart) + saveBlock + source.slice(saveEnd);

const listeners = `
  document.addEventListener('nb:v18-reward',event=>{const amount=Math.max(0,Number(event.detail?.amount)||0);state.cash+=amount;progression.record('moneyEarned',amount);audio.cash();notify(event.detail?.message||\`Empire reward +$${'${amount}'}\`,2.2);saveGame(true);});
  document.addEventListener('nb:v18-contract-complete',event=>{const result=event.detail;if(!result)return;if(result.success){state.cash+=result.reward;progression.record('moneyEarned',result.reward);awardReputation(90+result.reward*.02,result.name);audio.cash();notify(\`${'${result.name}'} complete · +$${'${result.reward}'}\`,3);saveGame(true);}else notify(\`${'${result.name}'} failed.\`,2.2);});
  document.addEventListener('nb:v18-action',event=>{const detail=event.detail||{};let result;if(detail.action==='buy-property'){result=v18Empire?.purchaseProperty(detail.id,state.cash);if(result?.ok){state.cash-=result.cost;audio.cash();notify(\`${'${result.property.name}'} purchased.\`,2.4);saveGame(true);}}else if(detail.action==='collect-income'){const amount=v18Empire?.collectIncome()||0;if(amount>0){state.cash+=amount;audio.cash();notify(\`Empire income +$${'${amount}'}\`,2.2);saveGame(true);}return;}else if(detail.action==='start-contract'){result=v18Empire?.startContract(detail.id);if(result?.ok)notify(\`${'${result.contract.name}'} started.\`,2.2);}else if(detail.action==='complete-operation'){result=v18Empire?.completeOperation(detail.id);if(result?.ok){state.cash+=result.operation.reward;awardReputation(180,result.operation.name);audio.cash();notify(\`${'${result.operation.name}'} complete · +$${'${result.operation.reward}'}\`,3);saveGame(true);}}else if(detail.action==='fleet-upgrade'){result=v18Empire?.upgradeFleet(detail.vehicle,detail.track,state.cash);if(result?.ok){state.cash-=result.cost;audio.cash();notify(result.purchased?\`${'${detail.vehicle.toUpperCase()}'} added to fleet.\`:\`${'${detail.vehicle.toUpperCase()} ${detail.track.toUpperCase()}'} upgraded.\`,2.2);saveGame(true);}}if(result&&!result.ok)notify(result.reason||'Empire action unavailable.',2.2);});
`;
source = replaceOnce(source,
  "  document.addEventListener('nb:v17-slot',event=>setSaveSlot(event.detail?.slot));\n  bindMobileControls();",
  "  document.addEventListener('nb:v17-slot',event=>setSaveSlot(event.detail?.slot));" + listeners + "  bindMobileControls();",
  'empire event listeners');

await writeFile(mainPath, source, 'utf8');
const css = await readFile(cssSource, 'utf8');
let styles = await readFile(cssTarget, 'utf8');
if (!styles.includes('.v18-empire-card')) styles += `\n\n/* Neon Bay v1.8 Empire Expansion */\n${css}\n`;
await writeFile(cssTarget, styles, 'utf8');
console.log('Applied Neon Bay v1.8 Empire Expansion overlay.');
