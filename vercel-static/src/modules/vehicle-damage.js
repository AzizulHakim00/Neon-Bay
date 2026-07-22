import * as THREE from 'three';

export function attachVehicleDamage(vehicle) {
  vehicle.engineHealth = 100;
  vehicle.tireHealth = 100;
  vehicle.bodyHealth = 100;
  vehicle.fireTimer = 0;
  const smokeGroup=new THREE.Group(); smokeGroup.position.set(0,1.15,-1.15); vehicle.mesh.add(smokeGroup);
  const smoke=[];
  for(let i=0;i<11;i++){
    const puff=new THREE.Mesh(new THREE.SphereGeometry(.16+i*.012,7,5),new THREE.MeshBasicMaterial({color:0x22242a,transparent:true,opacity:0,depthWrite:false}));
    puff.userData.phase=i/11; smokeGroup.add(puff); smoke.push(puff);
  }
  const fire=[];
  for(let i=0;i<5;i++){
    const flame=new THREE.Mesh(new THREE.ConeGeometry(.11+i*.025,.45+i*.08,7),new THREE.MeshBasicMaterial({color:i%2?0xffce4a:0xff5b22,transparent:true,opacity:0,depthWrite:false}));
    flame.position.set((i-2)*.12,1.15,-1.22); vehicle.mesh.add(flame); fire.push(flame);
  }
  const sparks=new THREE.Points(new THREE.BufferGeometry(),new THREE.PointsMaterial({color:0xffa43b,size:.12,transparent:true,opacity:0}));
  const points=new Float32Array(36);sparks.geometry.setAttribute('position',new THREE.BufferAttribute(points,3));sparks.position.set(0,.7,-1.45);vehicle.mesh.add(sparks);
  const dent=new THREE.Mesh(new THREE.BoxGeometry(.8,.06,.72),new THREE.MeshStandardMaterial({color:0x17191d,roughness:.6,metalness:.4,transparent:true,opacity:0}));dent.position.set(.52,.98,-1.7);dent.rotation.x=.24;vehicle.mesh.add(dent);
  const crack=new THREE.Mesh(new THREE.PlaneGeometry(.9,.55),new THREE.MeshBasicMaterial({color:0xb9e8ff,transparent:true,opacity:0,wireframe:true}));crack.position.set(0,1.48,-.9);crack.rotation.x=-.25;vehicle.mesh.add(crack);
  vehicle.damageFx={smoke,smokeGroup,fire,sparks,dent,crack,baseScale:vehicle.mesh.scale.clone()};
}

export function applyVehicleImpact(vehicle, impact, area = 'body') {
  const amount = Math.max(0, impact);
  vehicle.health = Math.max(0, vehicle.health - amount * .52);
  vehicle.bodyHealth = Math.max(0, vehicle.bodyHealth - amount * (area === 'body' ? .9 : .45));
  vehicle.engineHealth = Math.max(0, vehicle.engineHealth - amount * (area === 'front' ? 1.15 : .42));
  vehicle.tireHealth = Math.max(0, vehicle.tireHealth - amount * (area === 'tires' ? 1.35 : .2));
  return {
    health: vehicle.health,
    engine: vehicle.engineHealth,
    body: vehicle.bodyHealth,
    tires: vehicle.tireHealth,
  };
}

export function updateVehicleDamage(vehicle,dt,time) {
  const fx=vehicle.damageFx;if(!fx)return;
  const damage=Math.max(0,1-vehicle.health/100);
  fx.dent.material.opacity=Math.max(0,(damage-.18)*1.75);
  fx.crack.material.opacity=Math.max(0,(damage-.38)*1.35);
  fx.smokeGroup.visible=damage>.35;
  fx.smoke.forEach((puff,index)=>{
    const phase=(time*.32+puff.userData.phase)%1;
    puff.position.set(Math.sin(index*2.1+time)*.18,phase*2.4,Math.cos(index*1.7+time)*.14);
    puff.scale.setScalar(.65+phase*1.9);
    puff.material.opacity=damage>.35?(1-phase)*Math.min(.55,damage*.62):0;
  });
  fx.fire.forEach((flame,index)=>{
    const active=damage>.86;
    flame.material.opacity=active?.72+Math.sin(time*18+index)*.2:0;
    flame.scale.y=active?.75+Math.sin(time*11+index)*.3:0;
  });
  const attr=fx.sparks.geometry.attributes.position;
  if(damage>.68){
    for(let i=0;i<attr.count;i++){
      const a=i*2.399+time*5,life=(time*2+i*.17)%1;
      attr.setXYZ(i,Math.cos(a)*life*.8,(1-life)*.7,Math.sin(a)*life*.8);
    }
    attr.needsUpdate=true;fx.sparks.material.opacity=.45+.45*Math.sin(time*18);
  }else fx.sparks.material.opacity=0;
  const shake=damage>.82?Math.sin(time*35)*.006:0;
  vehicle.mesh.scale.set(fx.baseScale.x*(1+shake),fx.baseScale.y*(1-shake),fx.baseScale.z);
  const lightsBroken=vehicle.bodyHealth<38;
  vehicle.headlights?.forEach((light,index)=>{light.visible=!lightsBroken||index===0&&vehicle.bodyHealth>20;});
  if(vehicle.tireHealth<35){
    vehicle.wheels?.forEach((wheel,index)=>{wheel.rotation.z=Math.sin(time*4+index)*.12;});
  }
  if(damage>.93){
    vehicle.fireTimer += dt;
    vehicle.health = Math.max(0, vehicle.health - dt * 2.2);
  } else vehicle.fireTimer = 0;
}

export function resetVehicleDamage(vehicle) {
  vehicle.health=100;vehicle.engineHealth=100;vehicle.tireHealth=100;vehicle.bodyHealth=100;vehicle.fireTimer=0;
  if(!vehicle.damageFx)return;
  vehicle.damageFx.dent.material.opacity=0;vehicle.damageFx.crack.material.opacity=0;vehicle.damageFx.sparks.material.opacity=0;vehicle.damageFx.smokeGroup.visible=false;vehicle.damageFx.fire.forEach(flame=>flame.material.opacity=0);vehicle.mesh.scale.copy(vehicle.damageFx.baseScale);vehicle.headlights?.forEach(light=>light.visible=true);
}
