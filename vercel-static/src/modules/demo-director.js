import * as THREE from 'three';

export class DemoDirector {
  constructor({ caption, onFinish }={}) { this.time=0;this.caption=caption;this.onFinish=onFinish;this.finished=false; }
  update(dt,ctx){
    this.time+=dt;const t=this.time;
    const {camera,player,vehicles,enemies,state}=ctx;
    if(t<15){this.say('NEON BAY v1.3 · LIVING CITY');this.orbit(camera,new THREE.Vector3(0,8,0),48,t*.12,19);}
    else if(t<31){this.say('ROUTE-DRIVEN TRAFFIC · SIGNALS · DAY/NIGHT DENSITY');const v=vehicles.find(v=>v.id==='taxi')||vehicles[0];state.activeVehicle=v;player.visible=false;v.speed=18;this.follow(camera,v.mesh.position,new THREE.Vector3(11,5,13));}
    else if(t<47){this.say('PEDESTRIAN ROUTINES · WITNESSES REPORT CRIME');state.activeVehicle=null;player.visible=true;player.position.set(76,0,-12);ctx.playerActor?.setAction(t%7<3.5?'Walk':'Run');this.follow(camera,player.position,new THREE.Vector3(8,4,9));}
    else if(t<63){this.say('THREE-STAGE POLICE RESPONSE · ARRESTS · ROADBLOCKS');state.wanted=3;const police=enemies.find(e=>e.police)||enemies.find(e=>e.alive);if(police)this.follow(camera,police.group.position,new THREE.Vector3(-8,4,9));else this.orbit(camera,new THREE.Vector3(0,3,0),38,t*.15,15);}
    else if(t<79){this.say('ENGINE · BODY · TIRE DAMAGE');const v=vehicles.find(v=>v.id==='sunset');state.activeVehicle=v;player.visible=false;v.speed=24;v.rotation-=dt*.25;v.health=Math.max(12,100-(t-63)*5);v.engineHealth=v.health;v.tireHealth=Math.max(20,v.health+8);this.follow(camera,v.mesh.position,new THREE.Vector3(10,5,12));}
    else if(t<95){this.say('TAXI JOBS · STREET RACES · REPUTATION');state.activeVehicle=vehicles.find(v=>v.id==='taxi');this.orbit(camera,new THREE.Vector3(-72,2,-8),18,(t-79)*.22,8);}
    else if(t<109){this.say('USEFUL APARTMENT + GARAGE INTERIORS');state.activeVehicle=null;player.visible=true;ctx.enterDemoInterior?.(Math.floor((t-95)/7)%2===0?0:2);this.follow(camera,player.position,new THREE.Vector3(7,3.5,7));}
    else if(t<120){this.say('FIVE STORY MISSIONS · SIDE ACTIVITIES · SAVED PROGRESSION');ctx.exitDemoInterior?.();player.position.set(-118,0,-136);this.orbit(camera,player.position,9,(t-109)*.2,4);}
    else if(t<126){this.say('PLAY NEON BAY v1.3');this.orbit(camera,new THREE.Vector3(0,4,0),44,t*.09,20);}
    else if(!this.finished){this.finished=true;this.onFinish?.();}
  }
  say(text){if(this.caption&&this.caption.textContent!==text)this.caption.textContent=text;}
  follow(camera,target,offset){camera.position.lerp(target.clone().add(offset),.08);camera.lookAt(target.x,target.y+1.4,target.z);}
  orbit(camera,target,radius,angle,height){camera.position.set(target.x+Math.cos(angle)*radius,target.y+height,target.z+Math.sin(angle)*radius);camera.lookAt(target);}
}
