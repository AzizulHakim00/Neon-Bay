import{c as Re,V as ke,D as Ie,d as ze,e as Oe,W as _e,H as ye,f as be,S as ae,N as V,U as se,g as Le,h as Ne,Z as Ee,i as Ke,j as qe,a as We,k as Ge,b as Qe,l as Be,m as He,R as Xe,F as Ye,n as je}from"./neon-bay-v1.7.0-engine.CNbk1pvv.js";import{P as Je,F as $e}from"./neon-bay-v1.7.0-Pass.Bm9CkgIe.js";import{C as Ce}from"./neon-bay-v1.7.0-CopyShader.BzTUYzf6.js";class et{constructor(e=Math){this.grad3=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]],this.grad4=[[0,1,1,1],[0,1,1,-1],[0,1,-1,1],[0,1,-1,-1],[0,-1,1,1],[0,-1,1,-1],[0,-1,-1,1],[0,-1,-1,-1],[1,0,1,1],[1,0,1,-1],[1,0,-1,1],[1,0,-1,-1],[-1,0,1,1],[-1,0,1,-1],[-1,0,-1,1],[-1,0,-1,-1],[1,1,0,1],[1,1,0,-1],[1,-1,0,1],[1,-1,0,-1],[-1,1,0,1],[-1,1,0,-1],[-1,-1,0,1],[-1,-1,0,-1],[1,1,1,0],[1,1,-1,0],[1,-1,1,0],[1,-1,-1,0],[-1,1,1,0],[-1,1,-1,0],[-1,-1,1,0],[-1,-1,-1,0]],this.p=[];for(let t=0;t<256;t++)this.p[t]=Math.floor(e.random()*256);this.perm=[];for(let t=0;t<512;t++)this.perm[t]=this.p[t&255];this.simplex=[[0,1,2,3],[0,1,3,2],[0,0,0,0],[0,2,3,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,3,0],[0,2,1,3],[0,0,0,0],[0,3,1,2],[0,3,2,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,3,2,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,0,3],[0,0,0,0],[1,3,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,3,0,1],[2,3,1,0],[1,0,2,3],[1,0,3,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,3,1],[0,0,0,0],[2,1,3,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,1,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,0,1,2],[3,0,2,1],[0,0,0,0],[3,1,2,0],[2,1,0,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,1,0,2],[0,0,0,0],[3,2,0,1],[3,2,1,0]]}noise(e,t){let i,a,r;const o=.5*(Math.sqrt(3)-1),s=(e+t)*o,b=Math.floor(e+s),n=Math.floor(t+s),T=(3-Math.sqrt(3))/6,S=(b+n)*T,y=b-S,d=n-S,g=e-y,w=t-d;let R,_;g>w?(R=1,_=0):(R=0,_=1);const p=g-R+T,f=w-_+T,m=g-1+2*T,M=w-1+2*T,x=b&255,D=n&255,P=this.perm[x+this.perm[D]]%12,l=this.perm[x+R+this.perm[D+_]]%12,c=this.perm[x+1+this.perm[D+1]]%12;let h=.5-g*g-w*w;h<0?i=0:(h*=h,i=h*h*this._dot(this.grad3[P],g,w));let u=.5-p*p-f*f;u<0?a=0:(u*=u,a=u*u*this._dot(this.grad3[l],p,f));let C=.5-m*m-M*M;return C<0?r=0:(C*=C,r=C*C*this._dot(this.grad3[c],m,M)),70*(i+a+r)}noise3d(e,t,i){let a,r,o,s;const n=(e+t+i)*.3333333333333333,T=Math.floor(e+n),S=Math.floor(t+n),y=Math.floor(i+n),d=1/6,g=(T+S+y)*d,w=T-g,R=S-g,_=y-g,p=e-w,f=t-R,m=i-_;let M,x,D,P,l,c;p>=f?f>=m?(M=1,x=0,D=0,P=1,l=1,c=0):p>=m?(M=1,x=0,D=0,P=1,l=0,c=1):(M=0,x=0,D=1,P=1,l=0,c=1):f<m?(M=0,x=0,D=1,P=0,l=1,c=1):p<m?(M=0,x=1,D=0,P=0,l=1,c=1):(M=0,x=1,D=0,P=1,l=1,c=0);const h=p-M+d,u=f-x+d,C=m-D+d,I=p-P+2*d,z=f-l+2*d,O=m-c+2*d,L=p-1+3*d,K=f-1+3*d,v=m-1+3*d,U=T&255,F=S&255,Z=y&255,$=this.perm[U+this.perm[F+this.perm[Z]]]%12,ee=this.perm[U+M+this.perm[F+x+this.perm[Z+D]]]%12,te=this.perm[U+P+this.perm[F+l+this.perm[Z+c]]]%12,ie=this.perm[U+1+this.perm[F+1+this.perm[Z+1]]]%12;let N=.6-p*p-f*f-m*m;N<0?a=0:(N*=N,a=N*N*this._dot3(this.grad3[$],p,f,m));let E=.6-h*h-u*u-C*C;E<0?r=0:(E*=E,r=E*E*this._dot3(this.grad3[ee],h,u,C));let j=.6-I*I-z*z-O*O;j<0?o=0:(j*=j,o=j*j*this._dot3(this.grad3[te],I,z,O));let k=.6-L*L-K*K-v*v;return k<0?s=0:(k*=k,s=k*k*this._dot3(this.grad3[ie],L,K,v)),32*(a+r+o+s)}noise4d(e,t,i,a){const r=this.grad4,o=this.simplex,s=this.perm,b=(Math.sqrt(5)-1)/4,n=(5-Math.sqrt(5))/20;let T,S,y,d,g;const w=(e+t+i+a)*b,R=Math.floor(e+w),_=Math.floor(t+w),p=Math.floor(i+w),f=Math.floor(a+w),m=(R+_+p+f)*n,M=R-m,x=_-m,D=p-m,P=f-m,l=e-M,c=t-x,h=i-D,u=a-P,C=l>c?32:0,I=l>h?16:0,z=c>h?8:0,O=l>u?4:0,L=c>u?2:0,K=h>u?1:0,v=C+I+z+O+L+K,U=o[v][0]>=3?1:0,F=o[v][1]>=3?1:0,Z=o[v][2]>=3?1:0,$=o[v][3]>=3?1:0,ee=o[v][0]>=2?1:0,te=o[v][1]>=2?1:0,ie=o[v][2]>=2?1:0,N=o[v][3]>=2?1:0,E=o[v][0]>=1?1:0,j=o[v][1]>=1?1:0,k=o[v][2]>=1?1:0,Se=o[v][3]>=1?1:0,le=l-U+n,ce=c-F+n,he=h-Z+n,ue=u-$+n,me=l-ee+2*n,pe=c-te+2*n,fe=h-ie+2*n,de=u-N+2*n,ve=l-E+3*n,ge=c-j+3*n,Me=h-k+3*n,xe=u-Se+3*n,De=l-1+4*n,Te=c-1+4*n,we=h-1+4*n,Pe=u-1+4*n,q=R&255,W=_&255,G=p&255,Q=f&255,Ue=s[q+s[W+s[G+s[Q]]]]%32,Fe=s[q+U+s[W+F+s[G+Z+s[Q+$]]]]%32,Ze=s[q+ee+s[W+te+s[G+ie+s[Q+N]]]]%32,Ae=s[q+E+s[W+j+s[G+k+s[Q+Se]]]]%32,Ve=s[q+1+s[W+1+s[G+1+s[Q+1]]]]%32;let B=.6-l*l-c*c-h*h-u*u;B<0?T=0:(B*=B,T=B*B*this._dot4(r[Ue],l,c,h,u));let H=.6-le*le-ce*ce-he*he-ue*ue;H<0?S=0:(H*=H,S=H*H*this._dot4(r[Fe],le,ce,he,ue));let X=.6-me*me-pe*pe-fe*fe-de*de;X<0?y=0:(X*=X,y=X*X*this._dot4(r[Ze],me,pe,fe,de));let Y=.6-ve*ve-ge*ge-Me*Me-xe*xe;Y<0?d=0:(Y*=Y,d=Y*Y*this._dot4(r[Ae],ve,ge,Me,xe));let J=.6-De*De-Te*Te-we*we-Pe*Pe;return J<0?g=0:(J*=J,g=J*J*this._dot4(r[Ve],De,Te,we,Pe)),27*(T+S+y+d+g)}_dot(e,t,i){return e[0]*t+e[1]*i}_dot3(e,t,i,a){return e[0]*t+e[1]*i+e[2]*a}_dot4(e,t,i,a,r){return e[0]*t+e[1]*i+e[2]*a+e[3]*r}}const re={defines:{PERSPECTIVE_CAMERA:1,KERNEL_SIZE:32},uniforms:{tNormal:{value:null},tDepth:{value:null},tNoise:{value:null},kernel:{value:null},cameraNear:{value:null},cameraFar:{value:null},resolution:{value:new ke},cameraProjectionMatrix:{value:new Re},cameraInverseProjectionMatrix:{value:new Re},kernelRadius:{value:8},minDistance:{value:.005},maxDistance:{value:.05}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`
		uniform highp sampler2D tNormal;
		uniform highp sampler2D tDepth;
		uniform sampler2D tNoise;

		uniform vec3 kernel[ KERNEL_SIZE ];

		uniform vec2 resolution;

		uniform float cameraNear;
		uniform float cameraFar;
		uniform mat4 cameraProjectionMatrix;
		uniform mat4 cameraInverseProjectionMatrix;

		uniform float kernelRadius;
		uniform float minDistance; // avoid artifacts caused by neighbour fragments with minimal depth difference
		uniform float maxDistance; // avoid the influence of fragments which are too far away

		varying vec2 vUv;

		#include <packing>

		float getDepth( const in vec2 screenPosition ) {

			return texture2D( tDepth, screenPosition ).x;

		}

		float getLinearDepth( const in vec2 screenPosition ) {

			#if PERSPECTIVE_CAMERA == 1

				float fragCoordZ = texture2D( tDepth, screenPosition ).x;
				float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
				return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );

			#else

				return texture2D( tDepth, screenPosition ).x;

			#endif

		}

		float getViewZ( const in float depth ) {

			#if PERSPECTIVE_CAMERA == 1

				return perspectiveDepthToViewZ( depth, cameraNear, cameraFar );

			#else

				return orthographicDepthToViewZ( depth, cameraNear, cameraFar );

			#endif

		}

		vec3 getViewPosition( const in vec2 screenPosition, const in float depth, const in float viewZ ) {

			float clipW = cameraProjectionMatrix[2][3] * viewZ + cameraProjectionMatrix[3][3];

			vec4 clipPosition = vec4( ( vec3( screenPosition, depth ) - 0.5 ) * 2.0, 1.0 );

			clipPosition *= clipW; // unprojection.

			return ( cameraInverseProjectionMatrix * clipPosition ).xyz;

		}

		vec3 getViewNormal( const in vec2 screenPosition ) {

			return unpackRGBToNormal( texture2D( tNormal, screenPosition ).xyz );

		}

		void main() {

			float depth = getDepth( vUv );

			if ( depth == 1.0 ) {

				gl_FragColor = vec4( 1.0 ); // don't influence background

			} else {

				float viewZ = getViewZ( depth );

				vec3 viewPosition = getViewPosition( vUv, depth, viewZ );
				vec3 viewNormal = getViewNormal( vUv );

				vec2 noiseScale = vec2( resolution.x / 4.0, resolution.y / 4.0 );
				vec3 random = vec3( texture2D( tNoise, vUv * noiseScale ).r );

				// compute matrix used to reorient a kernel vector

				vec3 tangent = normalize( random - viewNormal * dot( random, viewNormal ) );
				vec3 bitangent = cross( viewNormal, tangent );
				mat3 kernelMatrix = mat3( tangent, bitangent, viewNormal );

				float occlusion = 0.0;

				for ( int i = 0; i < KERNEL_SIZE; i ++ ) {

					vec3 sampleVector = kernelMatrix * kernel[ i ]; // reorient sample vector in view space
					vec3 samplePoint = viewPosition + ( sampleVector * kernelRadius ); // calculate sample point

					vec4 samplePointNDC = cameraProjectionMatrix * vec4( samplePoint, 1.0 ); // project point and calculate NDC
					samplePointNDC /= samplePointNDC.w;

					vec2 samplePointUv = samplePointNDC.xy * 0.5 + 0.5; // compute uv coordinates

					float realDepth = getLinearDepth( samplePointUv ); // get linear depth from depth texture
					float sampleDepth = viewZToOrthographicDepth( samplePoint.z, cameraNear, cameraFar ); // compute linear depth of the sample view Z value
					float delta = sampleDepth - realDepth;

					if ( delta > minDistance && delta < maxDistance ) { // if fragment is before sample point, increase occlusion

						occlusion += 1.0;

					}

				}

				occlusion = clamp( occlusion / float( KERNEL_SIZE ), 0.0, 1.0 );

				gl_FragColor = vec4( vec3( 1.0 - occlusion ), 1.0 );

			}

		}`},oe={defines:{PERSPECTIVE_CAMERA:1},uniforms:{tDepth:{value:null},cameraNear:{value:null},cameraFar:{value:null}},vertexShader:`varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`uniform sampler2D tDepth;

		uniform float cameraNear;
		uniform float cameraFar;

		varying vec2 vUv;

		#include <packing>

		float getLinearDepth( const in vec2 screenPosition ) {

			#if PERSPECTIVE_CAMERA == 1

				float fragCoordZ = texture2D( tDepth, screenPosition ).x;
				float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
				return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );

			#else

				return texture2D( tDepth, screenPosition ).x;

			#endif

		}

		void main() {

			float depth = getLinearDepth( vUv );
			gl_FragColor = vec4( vec3( 1.0 - depth ), 1.0 );

		}`},ne={uniforms:{tDiffuse:{value:null},resolution:{value:new ke}},vertexShader:`varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`uniform sampler2D tDiffuse;

		uniform vec2 resolution;

		varying vec2 vUv;

		void main() {

			vec2 texelSize = ( 1.0 / resolution );
			float result = 0.0;

			for ( int i = - 2; i <= 2; i ++ ) {

				for ( int j = - 2; j <= 2; j ++ ) {

					vec2 offset = ( vec2( float( i ), float( j ) ) ) * texelSize;
					result += texture2D( tDiffuse, vUv + offset ).r;

				}

			}

			gl_FragColor = vec4( vec3( result / ( 5.0 * 5.0 ) ), 1.0 );

		}`};class A extends Je{constructor(e,t,i=512,a=512,r=32){super(),this.width=i,this.height=a,this.clear=!0,this.needsSwap=!1,this.camera=t,this.scene=e,this.kernelRadius=8,this.kernel=[],this.noiseTexture=null,this.output=0,this.minDistance=.005,this.maxDistance=.1,this._visibilityCache=[],this._generateSampleKernel(r),this._generateRandomKernelRotations();const o=new Ie;o.format=ze,o.type=Oe,this.normalRenderTarget=new _e(this.width,this.height,{minFilter:be,magFilter:be,type:ye,depthTexture:o}),this.ssaoRenderTarget=new _e(this.width,this.height,{type:ye}),this.blurRenderTarget=this.ssaoRenderTarget.clone(),this.ssaoMaterial=new ae({defines:Object.assign({},re.defines),uniforms:se.clone(re.uniforms),vertexShader:re.vertexShader,fragmentShader:re.fragmentShader,blending:V}),this.ssaoMaterial.defines.KERNEL_SIZE=r,this.ssaoMaterial.uniforms.tNormal.value=this.normalRenderTarget.texture,this.ssaoMaterial.uniforms.tDepth.value=this.normalRenderTarget.depthTexture,this.ssaoMaterial.uniforms.tNoise.value=this.noiseTexture,this.ssaoMaterial.uniforms.kernel.value=this.kernel,this.ssaoMaterial.uniforms.cameraNear.value=this.camera.near,this.ssaoMaterial.uniforms.cameraFar.value=this.camera.far,this.ssaoMaterial.uniforms.resolution.value.set(this.width,this.height),this.ssaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.ssaoMaterial.uniforms.cameraInverseProjectionMatrix.value.copy(this.camera.projectionMatrixInverse),this.normalMaterial=new Le,this.normalMaterial.blending=V,this.blurMaterial=new ae({defines:Object.assign({},ne.defines),uniforms:se.clone(ne.uniforms),vertexShader:ne.vertexShader,fragmentShader:ne.fragmentShader}),this.blurMaterial.uniforms.tDiffuse.value=this.ssaoRenderTarget.texture,this.blurMaterial.uniforms.resolution.value.set(this.width,this.height),this.depthRenderMaterial=new ae({defines:Object.assign({},oe.defines),uniforms:se.clone(oe.uniforms),vertexShader:oe.vertexShader,fragmentShader:oe.fragmentShader,blending:V}),this.depthRenderMaterial.uniforms.tDepth.value=this.normalRenderTarget.depthTexture,this.depthRenderMaterial.uniforms.cameraNear.value=this.camera.near,this.depthRenderMaterial.uniforms.cameraFar.value=this.camera.far,this.copyMaterial=new ae({uniforms:se.clone(Ce.uniforms),vertexShader:Ce.vertexShader,fragmentShader:Ce.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,blendSrc:qe,blendDst:Ee,blendEquation:Ne,blendSrcAlpha:Ke,blendDstAlpha:Ee,blendEquationAlpha:Ne}),this._fsQuad=new $e(null),this._originalClearColor=new We}dispose(){this.normalRenderTarget.dispose(),this.ssaoRenderTarget.dispose(),this.blurRenderTarget.dispose(),this.normalMaterial.dispose(),this.blurMaterial.dispose(),this.copyMaterial.dispose(),this.depthRenderMaterial.dispose(),this._fsQuad.dispose()}render(e,t,i){switch(this._overrideVisibility(),this._renderOverride(e,this.normalMaterial,this.normalRenderTarget,7829503,1),this._restoreVisibility(),this.ssaoMaterial.uniforms.kernelRadius.value=this.kernelRadius,this.ssaoMaterial.uniforms.minDistance.value=this.minDistance,this.ssaoMaterial.uniforms.maxDistance.value=this.maxDistance,this._renderPass(e,this.ssaoMaterial,this.ssaoRenderTarget),this._renderPass(e,this.blurMaterial,this.blurRenderTarget),this.output){case A.OUTPUT.SSAO:this.copyMaterial.uniforms.tDiffuse.value=this.ssaoRenderTarget.texture,this.copyMaterial.blending=V,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:i);break;case A.OUTPUT.Blur:this.copyMaterial.uniforms.tDiffuse.value=this.blurRenderTarget.texture,this.copyMaterial.blending=V,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:i);break;case A.OUTPUT.Depth:this._renderPass(e,this.depthRenderMaterial,this.renderToScreen?null:i);break;case A.OUTPUT.Normal:this.copyMaterial.uniforms.tDiffuse.value=this.normalRenderTarget.texture,this.copyMaterial.blending=V,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:i);break;case A.OUTPUT.Default:this.copyMaterial.uniforms.tDiffuse.value=this.blurRenderTarget.texture,this.copyMaterial.blending=Ge,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:i);break;default:console.warn("THREE.SSAOPass: Unknown output type.")}}setSize(e,t){this.width=e,this.height=t,this.ssaoRenderTarget.setSize(e,t),this.normalRenderTarget.setSize(e,t),this.blurRenderTarget.setSize(e,t),this.ssaoMaterial.uniforms.resolution.value.set(e,t),this.ssaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.ssaoMaterial.uniforms.cameraInverseProjectionMatrix.value.copy(this.camera.projectionMatrixInverse),this.blurMaterial.uniforms.resolution.value.set(e,t)}_renderPass(e,t,i,a,r){e.getClearColor(this._originalClearColor);const o=e.getClearAlpha(),s=e.autoClear;e.setRenderTarget(i),e.autoClear=!1,a!=null&&(e.setClearColor(a),e.setClearAlpha(r||0),e.clear()),this._fsQuad.material=t,this._fsQuad.render(e),e.autoClear=s,e.setClearColor(this._originalClearColor),e.setClearAlpha(o)}_renderOverride(e,t,i,a,r){e.getClearColor(this._originalClearColor);const o=e.getClearAlpha(),s=e.autoClear;e.setRenderTarget(i),e.autoClear=!1,a=t.clearColor||a,r=t.clearAlpha||r,a!=null&&(e.setClearColor(a),e.setClearAlpha(r||0),e.clear()),this.scene.overrideMaterial=t,e.render(this.scene,this.camera),this.scene.overrideMaterial=null,e.autoClear=s,e.setClearColor(this._originalClearColor),e.setClearAlpha(o)}_generateSampleKernel(e){const t=this.kernel;for(let i=0;i<e;i++){const a=new Qe;a.x=Math.random()*2-1,a.y=Math.random()*2-1,a.z=Math.random(),a.normalize();let r=i/e;r=Be.lerp(.1,1,r*r),a.multiplyScalar(r),t.push(a)}}_generateRandomKernelRotations(){const i=new et,a=16,r=new Float32Array(a);for(let o=0;o<a;o++){const s=Math.random()*2-1,b=Math.random()*2-1,n=0;r[o]=i.noise3d(s,b,n)}this.noiseTexture=new He(r,4,4,Xe,Ye),this.noiseTexture.wrapS=je,this.noiseTexture.wrapT=je,this.noiseTexture.needsUpdate=!0}_overrideVisibility(){const e=this.scene,t=this._visibilityCache;e.traverse(function(i){(i.isPoints||i.isLine||i.isLine2)&&i.visible&&(i.visible=!1,t.push(i))})}_restoreVisibility(){const e=this._visibilityCache;for(let t=0;t<e.length;t++)e[t].visible=!0;e.length=0}}A.OUTPUT={Default:0,SSAO:1,Blur:2,Depth:3,Normal:4};export{A as SSAOPass};
