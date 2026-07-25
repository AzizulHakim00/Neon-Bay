import * as THREE from 'three';

const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;

export const CITY_QUALITY = Object.freeze({
  low: Object.freeze({ shadow: 768, shadowDistance: 45, windows: 90, decals: 42, clouds: 3, ripples: 0, vehicleFx: false, ao: false, post: .2 }),
  medium: Object.freeze({ shadow: 1024, shadowDistance: 70, windows: 170, decals: 78, clouds: 5, ripples: 18, vehicleFx: true, ao: false, post: .55 }),
  high: Object.freeze({ shadow: 2048, shadowDistance: 105, windows: 280, decals: 122, clouds: 8, ripples: 38, vehicleFx: true, ao: true, post: .82 }),
  ultra: Object.freeze({ shadow: 3072, shadowDistance: 145, windows: 420, decals: 170, clouds: 11, ripples: 62, vehicleFx: true, ao: true, post: 1 }),
});

export function cityProfile(value) {
  return CITY_QUALITY[value] || CITY_QUALITY.high;
}

export const CINEMATIC_POST_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2(1, 1) },
    grade: { value: new THREE.Vector3(1.02, .98, 1.04) },
    contrast: { value: 1.08 },
    saturation: { value: 1.08 },
    vignette: { value: .22 },
    grain: { value: .025 },
    chroma: { value: 0 },
    focus: { value: 0 },
    time: { value: 0 },
  },
  vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec2 resolution; uniform vec3 grade;
    uniform float contrast; uniform float saturation; uniform float vignette;
    uniform float grain; uniform float chroma; uniform float focus; uniform float time;
    varying vec2 vUv;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+time*17.0)*43758.5453);}
    void main(){
      vec2 px=1.0/max(resolution,vec2(1.0));
      vec2 centered=vUv-.5;
      vec2 shift=normalize(centered+vec2(.0001))*chroma*px*3.0;
      vec3 color;
      color.r=texture2D(tDiffuse,vUv+shift).r;
      color.g=texture2D(tDiffuse,vUv).g;
      color.b=texture2D(tDiffuse,vUv-shift).b;
      if(focus>0.001){
        float edge=smoothstep(.18,.72,length(centered));
        vec3 blur=(texture2D(tDiffuse,vUv+vec2(px.x*2.0,0.0)).rgb+texture2D(tDiffuse,vUv-vec2(px.x*2.0,0.0)).rgb+texture2D(tDiffuse,vUv+vec2(0.0,px.y*2.0)).rgb+texture2D(tDiffuse,vUv-vec2(0.0,px.y*2.0)).rgb)*.25;
        color=mix(color,blur,edge*focus*.55);
      }
      float luminance=dot(color,vec3(.2126,.7152,.0722));
      color=mix(vec3(luminance),color,saturation);
      color=(color-.5)*contrast+.5;
      color*=grade;
      float vig=smoothstep(.92,.22,length(centered));
      color*=mix(1.0,vig,vignette);
      color+=(hash(gl_FragCoord.xy)-.5)*grain;
      gl_FragColor=vec4(color,1.0);
    }
  `,
};

function seeded(index, salt = 0) {
  const n = Math.sin(index * 129.17 + salt * 317.31) * 43758.5453;
  return n - Math.floor(n);
}

function canvasTexture(size, draw, repeat = [1, 1], colorSpace = THREE.SRGBColorSpace) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.colorSpace = colorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function roadTexture() {
  return canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#20242d'; ctx.fillRect(0, 0, s, s);
    const image = ctx.getImageData(0, 0, s, s);
    for (let i = 0; i < image.data.length; i += 4) {
      const noise = (Math.random() - .5) * 17;
      image.data[i] = clamp(image.data[i] + noise, 0, 255);
      image.data[i + 1] = clamp(image.data[i + 1] + noise, 0, 255);
      image.data[i + 2] = clamp(image.data[i + 2] + noise, 0, 255);
    }
    ctx.putImageData(image, 0, 0);
    ctx.strokeStyle = 'rgba(7,8,11,.55)'; ctx.lineWidth = 2;
    for (let i = 0; i < 34; i++) {
      let x = Math.random() * s, y = Math.random() * s;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let j = 0; j < 5; j++) { x += (Math.random() - .5) * 38; y += 8 + Math.random() * 26; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    for (let i = 0; i < 22; i++) {
      const g = ctx.createRadialGradient(Math.random()*s,Math.random()*s,2,Math.random()*s,Math.random()*s,50);
      g.addColorStop(0,'rgba(5,6,8,.15)'); g.addColorStop(1,'rgba(5,6,8,0)');
      ctx.fillStyle=g;ctx.fillRect(0,0,s,s);
    }
  }, [7, 7]);
}

function sandTexture() {
  return canvasTexture(384, (ctx, s) => {
    ctx.fillStyle='#c6a66d';ctx.fillRect(0,0,s,s);
    for(let i=0;i<13000;i++){
      const v=145+Math.random()*85;ctx.fillStyle=`rgba(${v},${v*.84},${v*.55},${.12+Math.random()*.22})`;ctx.fillRect(Math.random()*s,Math.random()*s,1,1);
    }
    for(let i=0;i<70;i++){ctx.strokeStyle='rgba(110,80,43,.08)';ctx.beginPath();const y=Math.random()*s;ctx.moveTo(0,y);ctx.bezierCurveTo(s*.3,y+Math.random()*8,s*.7,y-Math.random()*8,s,y);ctx.stroke();}
  }, [8, 28]);
}

function facadeTexture(seedValue = 1) {
  return canvasTexture(256, (ctx, s) => {
    const base = 34 + (seedValue % 18);
    ctx.fillStyle=`rgb(${base+16},${base+11},${base+25})`;ctx.fillRect(0,0,s,s);
    for(let y=0;y<s;y+=32){
      ctx.fillStyle='rgba(255,255,255,.025)';ctx.fillRect(0,y,s,2);
      for(let x=0;x<s;x+=32){
        ctx.fillStyle=((x+y+seedValue)%64===0)?'rgba(12,16,24,.18)':'rgba(255,255,255,.018)';ctx.fillRect(x+2,y+2,28,28);
      }
    }
    for(let i=0;i<160;i++){ctx.fillStyle=`rgba(0,0,0,${Math.random()*.035})`;ctx.fillRect(Math.random()*s,Math.random()*s,1+Math.random()*3,4+Math.random()*18);}
  }, [2, 4]);
}

function roomTexture(color = '#ffc56f', variant = 0) {
  return canvasTexture(128, (ctx, s) => {
    ctx.fillStyle='#0b101b';ctx.fillRect(0,0,s,s);
    const glow=ctx.createLinearGradient(0,0,0,s);glow.addColorStop(0,color);glow.addColorStop(1,'#251832');ctx.fillStyle=glow;ctx.globalAlpha=.72;ctx.fillRect(8,8,s-16,s-16);ctx.globalAlpha=1;
    ctx.fillStyle='rgba(4,6,12,.72)';ctx.fillRect(0,s*.67,s,s*.33);
    ctx.fillStyle='rgba(255,255,255,.28)';ctx.fillRect(18,22,34,4);
    if(variant%3===0){ctx.fillStyle='rgba(20,24,34,.82)';ctx.fillRect(68,35,35,45);}
    if(variant%3===1){ctx.fillStyle='rgba(255,80,170,.32)';ctx.fillRect(62,24,46,28);}
    if(variant%3===2){ctx.fillStyle='rgba(80,210,255,.28)';ctx.fillRect(25,42,70,8);}
  });
}

function circleMaterial(color, opacity) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.MultiplyBlending });
}

export class CinematicCityOverhaul {
  constructor({ scene, camera, renderer, quality = 'high', random = Math.random, testMode = false } = {}) {
    this.scene = scene; this.camera = camera; this.renderer = renderer; this.random = random; this.testMode = testMode;
    this.quality = testMode ? 'low' : quality; this.profile = cityProfile(this.quality);
    this.root = new THREE.Group(); this.root.name = 'Neon Bay v1.6 Cinematic City'; this.scene.add(this.root);
    this.windowEntries = []; this.vehicleKits = new Map(); this.actorShadows = new Map(); this.roadMaterials = new Set();
    this.decals = []; this.clouds = []; this.ripples = []; this.footprints = []; this.time = 0; this.wetness = 0; this.lightningTimer = 7;
    this.postPass = null; this.ssaoPass = null; this.fxaaPass = null; this.sun = null; this.hemi = null; this.ocean = null;
    this.roadMap = roadTexture(); this.sandMap = sandTexture(); this.exhaustAccumulator = 0; this.skidAccumulator = 0;
    this.lightning = new THREE.PointLight(0xdcecff, 0, 520, 1.25); this.lightning.position.set(0,140,0); this.root.add(this.lightning);
    this.playerShadow = this.makeContactShadow(1.05, .22); this.root.add(this.playerShadow);
    this.vehicleShadow = this.makeContactShadow(2.25, .28); this.root.add(this.vehicleShadow);
    this.titleCard = this.createTitleCard();
  }

  build() {
    this.buildRoadDetails(); this.buildClouds(); this.buildRainRipples(); this.buildShoreline(); this.buildDistrictProps();
    return this;
  }

  createTitleCard() {
    if (typeof document === 'undefined') return null;
    const root=document.createElement('div');root.className='v16-mission-card';
    root.innerHTML='<div class="v16-kicker">NEON BAY</div><div class="v16-title"></div><div class="v16-line"></div>';
    document.body.appendChild(root);return root;
  }

  makeContactShadow(radius, opacity) {
    const mesh=new THREE.Mesh(new THREE.CircleGeometry(radius,24),circleMaterial(0x03050a,opacity));mesh.rotation.x=-Math.PI/2;mesh.position.y=.045;mesh.renderOrder=2;return mesh;
  }

  configureLights(sun, hemi) {
    this.sun=sun;this.hemi=hemi;this.applyShadowQuality();
  }

  applyShadowQuality() {
    if(!this.sun)return;
    const p=this.profile;this.sun.castShadow=this.quality!=='low';this.sun.shadow.mapSize.set(p.shadow,p.shadow);
    this.sun.shadow.bias=-.00035;this.sun.shadow.normalBias=.035;this.sun.shadow.radius=this.quality==='ultra'?4:this.quality==='high'?3:2;
    const d=p.shadowDistance;Object.assign(this.sun.shadow.camera,{left:-d,right:d,top:d,bottom:-d,near:.5,far:330});this.sun.shadow.camera.updateProjectionMatrix();
  }

  setQuality(value) {
    this.quality=value in CITY_QUALITY?value:'high';this.profile=cityProfile(this.quality);this.applyShadowQuality();
    this.decals.forEach((o,i)=>o.visible=i<this.profile.decals);this.clouds.forEach((o,i)=>o.visible=i<this.profile.clouds);this.ripples.forEach((o,i)=>o.visible=i<this.profile.ripples);
    this.windowEntries.forEach((entry,i)=>entry.mesh.visible=i<this.profile.windows);
    if(this.ssaoPass)this.ssaoPass.enabled=this.profile.ao;if(this.postPass)this.postPass.enabled=this.quality!=='low';
  }

  installPostFX({ postPass, ssaoPass, fxaaPass }={}) { this.postPass=postPass||null;this.ssaoPass=ssaoPass||null;this.fxaaPass=fxaaPass||null;this.resize(innerWidth||1,innerHeight||1); }
  resize(width,height){if(this.postPass)this.postPass.uniforms.resolution.value.set(width,height);if(this.fxaaPass)this.fxaaPass.material.uniforms.resolution.value.set(1/width,1/height);}

  registerGround(material, type='ground') {
    if(!material)return;
    if(type==='road')this.registerRoadMaterial(material);
    if(type==='beach'&&this.sandMap){material.map=this.sandMap;material.roughness=.93;material.needsUpdate=true;}
  }

  registerRoadMaterial(material) {
    if(!material)return;this.roadMaterials.add(material);
    if(this.roadMap){material.map=this.roadMap;material.bumpMap=this.roadMap;material.bumpScale=.08;material.needsUpdate=true;}
    material.roughness=.88;material.metalness=.12;
  }

  registerOcean(ocean) { this.ocean=ocean; }

  registerBuilding(building,{w=12,h=12,d=12,seed=1}={}) {
    if(!building)return;
    const map=facadeTexture(seed);if(map&&building.material){building.material=building.material.clone();building.material.map=map;building.material.bumpMap=map;building.material.bumpScale=.045;building.material.roughness=.74;building.material.needsUpdate=true;}
    const countY=Math.max(1,Math.floor(h/4.6));const countX=Math.max(2,Math.floor(w/3.8));const maxRemaining=Math.max(0,CITY_QUALITY.ultra.windows-this.windowEntries.length);
    let created=0;
    for(let y=0;y<countY&&created<maxRemaining;y++)for(let x=0;x<countX&&created<maxRemaining;x++){
      if(((x+y+seed)%4)===0)continue;
      const palette=['#ffc56f','#6ee7ff','#ff78cf','#a8ffbf'];const texture=roomTexture(palette[(x+y+seed)%palette.length],x+y+seed);
      const mat=new THREE.MeshBasicMaterial({map:texture,color:0xffffff,transparent:true,opacity:.64,side:THREE.DoubleSide,toneMapped:false});
      const win=new THREE.Mesh(new THREE.PlaneGeometry(1.35,1.7),mat);
      win.position.set(-w/2+2.1+x*((w-4.2)/Math.max(1,countX-1)),-h/2+2.7+y*4.15,-d/2-.018);building.add(win);
      this.windowEntries.push({mesh:win,base:.45+seeded(this.windowEntries.length,4)*.42,phase:seeded(this.windowEntries.length,5)*20,office:(seed+x+y)%3===0});created++;
    }
    const sideCount=Math.min(Math.floor(d/5),4);
    for(let i=0;i<sideCount&&created<maxRemaining;i++){
      const mat=new THREE.MeshBasicMaterial({color:i%2?0x76dbff:0xffbf72,transparent:true,opacity:.42,toneMapped:false});
      const win=new THREE.Mesh(new THREE.PlaneGeometry(1.25,1.6),mat);win.rotation.y=Math.PI/2;win.position.set(w/2+.018,Math.min(h/2-2.6,2.8+i*4),-d/2+2.3+i*((d-4.6)/Math.max(1,sideCount-1)));building.add(win);
      this.windowEntries.push({mesh:win,base:.35,phase:seeded(this.windowEntries.length,8)*20,office:false});created++;
    }
  }

  registerActor(root, role='civilian') {
    if(!root||this.actorShadows.has(root))return;
    root.traverse(object=>{if(!object.isMesh||!object.material)return;object.castShadow=this.quality!=='low';object.receiveShadow=true;const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(m=>{if('roughness'in m)m.roughness=role === 'police' ? .48 : .58;if('metalness'in m)m.metalness=role === 'police' ? .14 : .05;});});
    const shadow=this.makeContactShadow(role === 'boss' ? .72 : .58,role === 'boss' ? .25 : .18);this.root.add(shadow);this.actorShadows.set(root,shadow);
  }

  registerVehicle(vehicle) {
    if(!vehicle?.mesh||this.vehicleKits.has(vehicle))return;
    const reverse=[];const indicators=[];const dashboard=[];
    for(const x of [-.67,.67]){
      const r=new THREE.Mesh(new THREE.BoxGeometry(.22,.12,.055),new THREE.MeshBasicMaterial({color:0xeef7ff,toneMapped:false}));r.position.set(x,.68,vehicle.mesh.children.find(c=>c.name==='Cabin')?.position.z?1.8:1.8);r.material.opacity=.08;r.material.transparent=true;vehicle.mesh.add(r);reverse.push(r);
      for(const z of [-1.8,1.8]){const i=new THREE.Mesh(new THREE.BoxGeometry(.13,.11,.06),new THREE.MeshBasicMaterial({color:0xffa72c,toneMapped:false,transparent:true,opacity:.1}));i.position.set(x > 0 ? .92 : -.92,.7,z);vehicle.mesh.add(i);indicators.push(i);}
    }
    const dash=new THREE.Mesh(new THREE.PlaneGeometry(1.08,.22),new THREE.MeshBasicMaterial({color:0x53dfff,transparent:true,opacity:.12,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));dash.rotation.x=-Math.PI/2;dash.position.set(0,1.31,-.25);vehicle.mesh.add(dash);dashboard.push(dash);
    this.vehicleKits.set(vehicle,{reverse,indicators,dashboard,smokeTimer:seeded(this.vehicleKits.size,3),lastPosition:vehicle.mesh.position.clone()});
  }

  buildRoadDetails() {
    const root=this.root;const roads=[-120,-60,0,60,120];
    const white=new THREE.MeshBasicMaterial({color:0xd8d9d3,transparent:true,opacity:.65,depthWrite:false});
    for(const x of roads)for(const z of roads){
      for(let stripe=-4;stripe<=4;stripe++){
        const a=new THREE.Mesh(new THREE.PlaneGeometry(.65,5.4),white);a.rotation.x=-Math.PI/2;a.position.set(x-6+stripe*1.5,.052,z-10);root.add(a);this.decals.push(a);
        const b=a.clone();b.rotation.z=Math.PI/2;b.position.set(x-10,.053,z-6+stripe*1.5);root.add(b);this.decals.push(b);
      }
      const manhole=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.05,.035,24),new THREE.MeshStandardMaterial({color:0x252831,roughness:.52,metalness:.64}));manhole.position.set(x+4,.055,z+4);root.add(manhole);this.decals.push(manhole);
      for(const side of [-1,1]){const drain=new THREE.Mesh(new THREE.BoxGeometry(1.6,.035,.45),new THREE.MeshStandardMaterial({color:0x151820,metalness:.7,roughness:.4}));drain.position.set(x+side*7,.055,z+7);root.add(drain);this.decals.push(drain);}
    }
    for(let i=0;i<90;i++){
      const stain=new THREE.Mesh(new THREE.CircleGeometry(.7+seeded(i,2)*2.4,18),new THREE.MeshBasicMaterial({color:i%3?0x101219:0x1a1020,transparent:true,opacity:.07+seeded(i,3)*.09,depthWrite:false}));stain.rotation.x=-Math.PI/2;const horizontal=i%2===0;const road=roads[i%roads.length];const along=-164+seeded(i,4)*328;stain.scale.y=.38+seeded(i,5)*.7;stain.position.set(horizontal?along:road+(seeded(i,6)-.5)*9,.051,horizontal?road+(seeded(i,7)-.5)*9:along);root.add(stain);this.decals.push(stain);
    }
    this.decals.forEach((o,i)=>o.visible=i<this.profile.decals);
  }

  buildClouds() {
    for(let i=0;i<CITY_QUALITY.ultra.clouds;i++){
      const group=new THREE.Group();const material=new THREE.MeshBasicMaterial({color:i%2?0x7d8395:0xb4b7c1,transparent:true,opacity:.08+seeded(i,1)*.08,depthWrite:false,side:THREE.DoubleSide});
      for(let p=0;p<5;p++){const cloud=new THREE.Mesh(new THREE.SphereGeometry(16+seeded(i,p+2)*14,12,7),material);cloud.scale.y=.28;cloud.position.set((p-2)*14,seeded(i,p+8)*4,(seeded(i,p+13)-.5)*15);group.add(cloud);}
      group.position.set(-180+seeded(i,17)*360,72+seeded(i,18)*45,-180+seeded(i,19)*360);group.visible=i<this.profile.clouds;this.root.add(group);this.clouds.push(group);
    }
  }

  buildRainRipples() {
    const mat=new THREE.MeshBasicMaterial({color:0xa8dcff,transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide});
    for(let i=0;i<CITY_QUALITY.ultra.ripples;i++){
      const ripple=new THREE.Mesh(new THREE.RingGeometry(.12,.18,16),mat.clone());ripple.rotation.x=-Math.PI/2;ripple.position.set((seeded(i,31)-.5)*55,.062,(seeded(i,32)-.5)*55);ripple.userData.phase=seeded(i,33);ripple.visible=i<this.profile.ripples;this.root.add(ripple);this.ripples.push(ripple);
    }
  }

  buildShoreline() {
    const wet=new THREE.Mesh(new THREE.PlaneGeometry(12,350),new THREE.MeshPhysicalMaterial({color:0x826f55,roughness:.26,metalness:.05,clearcoat:.55,transparent:true,opacity:.7}));wet.rotation.x=-Math.PI/2;wet.position.set(174,.032,0);this.root.add(wet);this.wetSand=wet;
    for(let i=0;i<32;i++){
      const foot=new THREE.Mesh(new THREE.CircleGeometry(.16,10),new THREE.MeshBasicMaterial({color:0x4c4438,transparent:true,opacity:.24,depthWrite:false}));foot.scale.set(.62,1.45,1);foot.rotation.x=-Math.PI/2;foot.rotation.z=(i%2?-.18:.18);foot.position.set(158+seeded(i,21)*10,.047,-145+i*9.2);this.root.add(foot);this.footprints.push(foot);
    }
    this.sunGlitter=new THREE.Mesh(new THREE.PlaneGeometry(28,230),new THREE.MeshBasicMaterial({color:0xffd9ab,transparent:true,opacity:.03,blending:THREE.AdditiveBlending,depthWrite:false}));this.sunGlitter.rotation.x=-Math.PI/2;this.sunGlitter.position.set(285,.04,0);this.root.add(this.sunGlitter);
  }

  buildDistrictProps() {
    const colors=[0x2d3b4f,0x6a3a56,0x3f6c65];
    for(let i=0;i<36;i++){
      const group=new THREE.Group();const x=-160+seeded(i,41)*315;const z=-160+seeded(i,42)*315;group.position.set(x,0,z);
      const meter=new THREE.Mesh(new THREE.CylinderGeometry(.11,.13,1.25,9),new THREE.MeshStandardMaterial({color:colors[i%colors.length],roughness:.55,metalness:.45}));meter.position.y=.63;group.add(meter);
      const head=new THREE.Mesh(new THREE.BoxGeometry(.34,.32,.2),meter.material);head.position.y=1.25;group.add(head);this.root.add(group);
    }
  }

  emitExhaust(vehicle, heavy=false) {
    if(!this.profile.vehicleFx||!vehicle?.mesh)return;
    const forward=new THREE.Vector3(-Math.sin(vehicle.rotation),0,-Math.cos(vehicle.rotation));const pos=vehicle.mesh.position.clone().addScaledVector(forward,-2).add(new THREE.Vector3(0,.48,0));
    const puff=new THREE.Mesh(new THREE.SphereGeometry(.12,7,5),new THREE.MeshBasicMaterial({color:heavy?0x9aa0aa:0xc3c7ce,transparent:true,opacity:heavy ? .22 : .12,depthWrite:false}));puff.position.copy(pos);puff.userData.life=1;puff.userData.velocity=new THREE.Vector3((this.random()-.5)*.18,.35+(heavy ? .28 : 0),(this.random()-.5)*.18);this.root.add(puff);this.puffs??=[];this.puffs.push(puff);
  }

  emitSkid(vehicle) {
    const p=vehicle.mesh.position;const mark=new THREE.Mesh(new THREE.PlaneGeometry(.18,2.4),new THREE.MeshBasicMaterial({color:0x08090d,transparent:true,opacity:.2,depthWrite:false}));mark.rotation.x=-Math.PI/2;mark.rotation.z=-vehicle.rotation;mark.position.set(p.x,.052,p.z);this.root.add(mark);this.decals.push(mark);
  }

  beginMission(index,title) {
    if(!this.titleCard)return;this.titleCard.querySelector('.v16-kicker').textContent=`CHAPTER ${index<5?'ONE':'TWO'} · JOB ${String(index+1).padStart(2,'0')}`;this.titleCard.querySelector('.v16-title').textContent=title;this.titleCard.classList.remove('show');void this.titleCard.offsetWidth;this.titleCard.classList.add('show');
  }

  update(dt,{timeOfDay=18,weather='CLEAR',playerPosition,activeVehicle,wanted=0,mission=0,cinematic=false,health=100}={}) {
    this.time+=dt;const night=timeOfDay<6.5||timeOfDay>18.2;const rain=weather==='RAIN';const overcast=weather==='OVERCAST';this.wetness=lerp(this.wetness,rain ? 1 : overcast ? .35 : 0,clamp(dt*(rain?1.4:.28),0,1));
    if(this.sun){const angle=(timeOfDay/24)*Math.PI*2-Math.PI*.5;this.sun.position.set(Math.cos(angle)*120,Math.max(18,Math.sin(angle)*135),Math.sin(angle)*90);this.sun.intensity=rain ? 1.45 : overcast ? 2.1 : night ? .3 : 3.4;this.sun.color.set(night?0x6b86d6:timeOfDay>17&&timeOfDay<20?0xff9d72:0xffd5aa);}
    if(this.hemi){this.hemi.intensity=night ? .62 : rain ? 1.05 : 1.7;}
    this.roadMaterials.forEach(m=>{m.roughness=lerp(.88,.16,this.wetness);m.metalness=lerp(.12,.42,this.wetness);if(m.map)m.map.offset.set(this.time*.0002,0);});
    if(this.wetSand)this.wetSand.material.opacity=.42+this.wetness*.38;
    if(this.sunGlitter){this.sunGlitter.material.opacity=night ? .035 : (rain ? .008 : .07);this.sunGlitter.position.z=Math.sin(this.time*.05)*35;}
    this.windowEntries.forEach((entry,i)=>{const hourOn=night||(entry.office&&timeOfDay>16.5);const flicker=.88+Math.sin(this.time*.7+entry.phase)*.08;entry.mesh.material.opacity=hourOn?entry.base*flicker:.055;entry.mesh.visible=i<this.profile.windows;});
    this.clouds.forEach((cloud,i)=>{cloud.position.x+=dt*(1.2+i*.09);if(cloud.position.x>220)cloud.position.x=-220;cloud.children.forEach(c=>{c.material.opacity=(rain ? .22 : overcast ? .16 : .07)*(1+Math.sin(this.time*.08+i)*.12);c.material.color.set(rain?0x4e596d:overcast?0x7e8797:0xb7bcc6);});});
    const origin=activeVehicle?.mesh?.position||playerPosition||new THREE.Vector3();
    this.ripples.forEach((r,i)=>{r.position.x=origin.x+(seeded(i,31)-.5)*55;r.position.z=origin.z+(seeded(i,32)-.5)*55;const phase=(this.time*1.7+r.userData.phase)%1;r.scale.setScalar(.35+phase*3.4);r.material.opacity=rain?(1-phase)*.22:0;});
    this.lightningTimer-=dt;if(rain&&this.lightningTimer<=0){this.lightning.intensity=18+this.random()*22;this.lightning.position.set(origin.x+(this.random()-.5)*260,120,origin.z+(this.random()-.5)*260);this.lightningTimer=6+this.random()*14;}this.lightning.intensity*=Math.pow(.015,dt);
    this.playerShadow.visible=!!playerPosition&&!activeVehicle;this.vehicleShadow.visible=!!activeVehicle;if(playerPosition)this.playerShadow.position.set(playerPosition.x,.047,playerPosition.z);if(activeVehicle)this.vehicleShadow.position.set(activeVehicle.mesh.position.x,.048,activeVehicle.mesh.position.z);
    this.actorShadows.forEach((shadow,root)=>{shadow.position.set(root.position.x,.047,root.position.z);shadow.visible=root.visible!==false;});
    this.exhaustAccumulator+=dt;this.skidAccumulator+=dt;
    this.vehicleKits.forEach((kit,vehicle)=>{
      if(!vehicle.mesh.visible)return;const reverse=vehicle.speed<-.5;kit.reverse.forEach(l=>l.material.opacity=reverse ? .85 : .06);const blinking=Math.sin(this.time*7)>0;kit.indicators.forEach((l,i)=>l.material.opacity=Math.abs(vehicle.steerAngle)>.18&&((vehicle.steerAngle>0)===(i%2===0))&& blinking ? .9 : .08);kit.dashboard.forEach(l=>l.material.opacity=night ? .32 : .08);
      if(this.exhaustAccumulator>.1&&Math.abs(vehicle.speed)<5&&this.random()<.16)this.emitExhaust(vehicle,vehicle.engineHealth<45);
      if(this.skidAccumulator>.14&&vehicle.braking&&Math.abs(vehicle.speed)>9&&Math.abs(vehicle.steerAngle)>.16)this.emitSkid(vehicle);
    });
    if(this.exhaustAccumulator>.1)this.exhaustAccumulator=0;if(this.skidAccumulator>.14)this.skidAccumulator=0;
    if(this.puffs){for(let i=this.puffs.length-1;i>=0;i--){const p=this.puffs[i];p.userData.life-=dt;p.position.addScaledVector(p.userData.velocity,dt);p.scale.addScalar(dt*.55);p.material.opacity*=Math.pow(.12,dt);if(p.userData.life<=0){this.root.remove(p);p.geometry.dispose();p.material.dispose();this.puffs.splice(i,1);}}}
    if(this.postPass){const u=this.postPass.uniforms;u.time.value=this.time;u.vignette.value=cinematic ? .52 : .16 + wanted * .025;u.grain.value=this.quality === 'ultra' ? .02 : this.quality === 'high' ? .027 : .014;u.chroma.value=clamp((100-health)*.015+wanted*.1,0,1.3);u.focus.value=cinematic ? .8 : 0;u.contrast.value=cinematic?1.15:1.07;u.saturation.value=rain ? .92 : night ? 1.12 : 1.04;const districtGrades=[[1.06,.96,1.04],[1.02,1.01,.96],[.96,1.03,1.08],[1.04,.97,1.06]];const g=districtGrades[mission%districtGrades.length];u.grade.value.set(...g);}
  }
}
