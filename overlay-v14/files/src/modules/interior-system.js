import * as THREE from 'three';

const DEFINITIONS = {
  apartment: { label: 'Apartment 3B', center: [470,0], size: [22,18], color: 0x443653 },
  gunshop: { label: 'Coastline Arms', center: [510,0], size: [24,18], color: 0x3c3444 },
  garage: { label: 'Coastline Garage', center: [552,0], size: [28,20], color: 0x263c47 },
  police: { label: 'Police Station Lobby', center: [598,0], size: [26,20], color: 0x25334b },
  nightclub: { label: 'Starfall Nightclub', center: [642,0], size: [34,24], color: 0x34234f },
};

function mat(color, emissive = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness: .78, metalness: .05, emissive, emissiveIntensity: emissive ? .55 : 0 });
}
function box(w,h,d,color,x,y,z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat(color));
  mesh.position.set(x,y,z); mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
}

export class InteriorSystem {
  constructor(scene) {
    this.scene = scene;
    this.current = null;
    this.returnPosition = null;
    this.colliders = new Map();
    this.entries = [];
    this.build();
  }

  build() {
    this.entries = [
      { id:'apartment-door', type:'interior-door', interior:'apartment', label:'Enter apartment', position:new THREE.Vector3(-143,0,-132), radius:3.2, color:0xff76cb },
      { id:'gunshop-door', type:'interior-door', interior:'gunshop', label:'Enter Coastline Arms', position:new THREE.Vector3(-12,0,-57), radius:3.2, color:0xff3eb5 },
      { id:'garage-door', type:'interior-door', interior:'garage', label:'Enter garage workshop', position:new THREE.Vector3(108,0,-86), radius:3.5, color:0x38e8ff },
      { id:'police-door', type:'interior-door', interior:'police', label:'Enter police station lobby', position:new THREE.Vector3(94,0,85), radius:3.4, color:0x4a8dff },
      { id:'nightclub-door', type:'interior-door', interior:'nightclub', label:'Enter Starfall Nightclub', position:new THREE.Vector3(112,0,42), radius:3.6, color:0xff4fb7 },
    ];
    Object.entries(DEFINITIONS).forEach(([id, def]) => this.buildRoom(id, def));
  }

  buildRoom(id, def) {
    const [cx,cz]=def.center,[w,d]=def.size;
    const group=new THREE.Group(); group.name=`Interior:${id}`;
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat(def.color)); floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; group.add(floor);
    group.add(box(w,4,.35,0x171b29,0,2,-d/2),box(w,4,.35,0x171b29,0,2,d/2),box(.35,4,d,0x171b29,-w/2,2,0),box(.35,4,d,0x171b29,w/2,2,0));
    const ceiling=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat(0x111521)); ceiling.rotation.x=Math.PI/2; ceiling.position.y=4; group.add(ceiling);
    for(let x=-w/2+3;x<w/2-2;x+=5){const light=box(2.2,.08,.3,0xe6f8ff,x,3.86,0);light.material.emissive.setHex(0x9edfff);light.material.emissiveIntensity=1.7;group.add(light);}
    const colliders=[];
    const furniture=(fw,fh,fd,color,x,y,z)=>{const item=box(fw,fh,fd,color,x,y,z);group.add(item);colliders.push({minX:cx+x-fw/2-.2,maxX:cx+x+fw/2+.2,minZ:cz+z-fd/2-.2,maxZ:cz+z+fd/2+.2});return item;};
    if(id==='apartment'){
      furniture(5,.65,3,0x283147,-5,.33,3); furniture(2.5,1.1,1.1,0x3f2d4d,4,.55,3); furniture(4,.8,2.2,0x754f3a,3,.4,-3);
      const screen=furniture(2.8,1.6,.18,0x0a101d,-5,1.7,-7.7);screen.material.emissive.setHex(0x3b75a0);screen.material.emissiveIntensity=.8;
    } else if(id==='gunshop'){
      furniture(8,1.1,1.2,0x4a342e,0,.55,3); for(let x=-8;x<=8;x+=4)furniture(2.4,2.2,.5,0x252a35,x,1.1,-7.7);
      for(let x=-7;x<=7;x+=3.5){const gun=furniture(1.7,.12,.18,0x171a20,x,1.6,-7.35);gun.material.metalness=.7;}
    } else if(id==='garage'){
      furniture(7,.35,3,0x2b3039,0,.18,0); furniture(5,1.1,1.3,0x38414a,-8,.55,5); furniture(5,2.6,.8,0x26313d,9,1.3,-8.8);
      for(const x of [-8,8]){const lift=furniture(.35,3,.35,0xffb33b,x,1.5,-1);lift.material.emissive.setHex(0x3a2100);}
    } else if(id==='police') {
      furniture(7,1.05,1.2,0x2e3a52,0,.53,3); furniture(3,2.2,.7,0x263246,-8,1.1,-8.8); furniture(3,2.2,.7,0x263246,8,1.1,-8.8);
      for(let x=-7;x<=7;x+=3.5)furniture(1.6,.65,1.6,0x39465e,x,.33,-2);
    } else {
      furniture(11,.8,2.2,0x4f294f,0,.4,7.5);
      const dance=furniture(13,.16,9,0x17152b,0,.08,-2);dance.material.emissive.setHex(0x3b1458);dance.material.emissiveIntensity=.8;
      for(let x=-5;x<=5;x+=5)for(let z=-5;z<=1;z+=3){const tile=furniture(2.2,.05,2.2,(x+z)%2?0xff3eb5:0x3de8ff,x,.18,z);tile.material.emissive.setHex((x+z)%2?0xff3eb5:0x3de8ff);tile.material.emissiveIntensity=1.4;}
      for(const x of [-12,12]){const speaker=furniture(2.2,3,1.6,0x12131c,x,1.5,-7);speaker.material.emissive.setHex(0x281840);speaker.material.emissiveIntensity=.5;}
      for(let x=-12;x<=12;x+=4){const rail=furniture(2.8,.7,.7,0x273048,x,.35,10);rail.material.metalness=.35;}
    }
    const exitPos=new THREE.Vector3(cx,0,cz+d/2-2.2);
    const exitMarker=new THREE.Mesh(new THREE.TorusGeometry(1,.1,8,28),new THREE.MeshBasicMaterial({color:0x66f6ff}));exitMarker.rotation.x=Math.PI/2;exitMarker.position.copy(exitPos).sub(new THREE.Vector3(cx,0,cz));exitMarker.position.y=.12;group.add(exitMarker);
    group.position.set(cx,0,cz);this.scene.add(group);
    this.colliders.set(id,{bounds:{minX:cx-w/2+.7,maxX:cx+w/2-.7,minZ:cz-d/2+.7,maxZ:cz+d/2-.7},items:colliders,spawn:new THREE.Vector3(cx,0,cz+d/2-3.5),exit:exitPos,label:def.label});
    this.entries.push({id:`${id}-exit`,type:'interior-exit',interior:id,label:'Return to Vice Coast',position:exitPos,radius:3,color:0x66f6ff});
  }

  enter(id, playerPosition) {
    const room=this.colliders.get(id); if(!room)return null;
    this.returnPosition=playerPosition.clone(); this.current=id; return room.spawn.clone();
  }
  exit() { const destination=this.returnPosition?.clone(); this.current=null; this.returnPosition=null; return destination; }
  label() { return this.current ? this.colliders.get(this.current)?.label : ''; }
  collidesAt(x,z,radius=.55) {
    if(!this.current)return null;
    const room=this.colliders.get(this.current),b=room.bounds;
    if(x-radius<b.minX||x+radius>b.maxX||z-radius<b.minZ||z+radius>b.maxZ)return true;
    return room.items.some(box=>x+radius>box.minX&&x-radius<box.maxX&&z+radius>box.minZ&&z-radius<box.maxZ);
  }
  isInsidePosition(position) { return this.current && this.colliders.get(this.current)?.bounds && position.x>440; }
}
