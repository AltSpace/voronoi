/**
 * @author Hakim El Hattab
 */
document.addEventListener( "DOMContentLoaded", function(){
	
	var canvas,
		
		mouse = {
			x: 0,
			y: 0,
			down: false
		},
		
		world = {
			width: window.innerWidth,
			height: window.innerHeight
		},
		
		camera, 
		scene, 
		renderer,
		
		uniforms;
	
	/**
	 * 
	 */
	function initialize() {
		container = document.getElementById( 'container' );
		
		camera = new THREE.Camera( 20, world.width / world.height, 1, 10000 );
		camera.position.z = 1800;
		
		scene = new THREE.Scene();
		
		renderer = new THREE.WebGLRenderer();
		renderer.setSize( world.width, world.height );
		
		container.appendChild( renderer.domElement );
		
		document.addEventListener( 'mousemove', documentMouseMoveHandler, false );
		window.addEventListener( 'resize', windowResizeMoveHandler, false );
		
		createProjector();
		
		windowResizeMoveHandler();
	}
	
	function createProjector() {
		uniforms = {
			time: 			{ type: "f", value: 1.0 },
			resolution: { type: "v2", value: new THREE.Vector2() },
			mouse: 			{ type: "v2", value: new THREE.Vector2() },
			//tex0: 			{ type: "t", value: 0, texture: ImageUtils.loadTexture( "texture.jpg" ) }
			radius:     { type: "f", value: 50.0 }
		};
 		
		var material = new THREE.ShaderMaterial( {
			uniforms: uniforms,
			vertexShader: document.getElementById( 'vertexShader' ).textContent,
			fragmentShader: document.getElementById( 'fragmentShader' ).textContent
		} );
		
		var mesh = new THREE.Mesh( new THREE.PlaneGeometry( 30, 30, 1, 1 ), material );
		mesh.position.z = 100;
		mesh.scale.x = 100;
		mesh.scale.y = 100;
		mesh.scale.z = 100;
		scene.add( mesh );
	}
	
	function documentMouseMoveHandler( event ) {
		mouse.x = event.clientX;
		mouse.y = event.clientY;
		
		uniforms.mouse.value.x = mouse.x;// / world.width;
		uniforms.mouse.value.y = mouse.y;// / world.height;
	}
	
	function windowResizeMoveHandler( event ) {
		world.width = window.innerWidth;
		world.height = window.innerHeight;
		
		uniforms.resolution.value.x = world.width;
		uniforms.resolution.value.y = world.height;
		
		renderer.setSize( world.width, world.height );
		
		camera.aspect = world.width / world.height;
		//camera.updateProjectionMatrix();
	}
	
	function animate() {

		requestAnimationFrame( animate );

		render();

	}
	
	function render() {
		
		uniforms.time.value += 0.05;
		
		renderer.render( scene, camera );

	}
	
  initialize();
	animate();
	
}, false );
