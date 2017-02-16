const THREE = require('three');
const Random = require("random-js");


class Generator
{
	constructor()
	{		
	}

	// Overall complexity of this Voronoi implementation:
	// N + N^2 * 27 * 2
	build(scene)
	{
		var count = 20;
  		var random = new Random(Random.engines.mt19937().autoSeed());

  		var geometry = new THREE.Geometry();
  		var pointsGeo = new THREE.Geometry();
  		var points = [];

  		// From center
  		var randomAmplitude = .5;

  		// Distribute points
  		for(var x = 0; x < count; x++)
  		{
  			points.push(new Array());

  			for(var y = 0; y < count; y++)
  			{
  				var p = new THREE.Vector2( x + .5 + random.real(-randomAmplitude,randomAmplitude), y + .5 + random.real(-randomAmplitude,randomAmplitude));
  				points[x].push(p);
  				pointsGeo.vertices.push(new THREE.Vector3( p.x, 0, p.y ));
  			}
  		}

  		// Build half planes
  		var segments = [];
  		for(var x = 0; x < count; x++)
  		{
  			segments.push(new Array());

  			for(var y = 0; y < count; y++)
  			{
  				segments[x].push(new Array());

  				var p = points[x][y];

  				for(var i = -2; i < 3; i++)
  				{
  					for(var j = -2; j < 3; j++)
  					{
  						if(x+i >= 0 && y+j >= 0 && x+i < count && y+j < count)
  						{
  							var neighbor = points[x+i][y+j];

  							var normal = neighbor.clone().sub(p).normalize();
  							var midpoint = neighbor.clone().add(p).multiplyScalar(.5);
  							var tangent = new THREE.Vector2( -normal.y, normal.x );

  							var segment = { valid : false, center : p, normal: normal, dir: tangent, midpoint: midpoint, min : 1000, max : -1000 }
  							segments[x][y].push(segment)
  						}
  					}
  				}

  				// N^3 over amount of segments per cell (which is 27)
				for(var i = 0; i < segments[x][y].length; i++)
				{
					for(var j = 0; j < segments[x][y].length; j++)
					{
						if(i == j)
							continue;

						var s1 = segments[x][y][i];
						var s2 = segments[x][y][j];

						// Parallel
						if(Math.abs(s1.dir.dot(s2.normal)) < .001)
							continue;

						var diff = s2.midpoint.clone().sub(s1.midpoint);
						var det = s2.dir.x * s1.dir.y - s2.dir.y * s1.dir.x;

						var u = (diff.y * s2.dir.x - diff.x * s2.dir.y) / det;
						var v = (diff.y * s1.dir.x - diff.x * s1.dir.y) / det;

						var newPoint = s1.midpoint.clone().add(s1.dir.clone().multiplyScalar(u));
						var insideHull = true;

						for(var k = 0; k < segments[x][y].length; k++)
						{
							if(k != j && k != i)
							{
								var dP = newPoint.clone().sub(segments[x][y][k].midpoint);
								
								// Remember normals are inverted, this is why it is > 0 and not <= 0
								if(segments[x][y][k].normal.clone().dot(dP) > 0)
									insideHull = false;
							}
						}

						if(!insideHull)
							continue;

						s1.min = Math.min(s1.min, u);
						s1.max = Math.max(s1.max, u);
						s1.valid = true;
					}
				}

  				// Save geo for display
				for(var s = 0; s < segments[x][y].length; s++)
				{
					var segment = segments[x][y][s];

					if(!segment.valid)
						continue;

					var from = segment.midpoint.clone().add(segment.dir.clone().multiplyScalar(segment.min));
					var to = segment.midpoint.clone().add(segment.dir.clone().multiplyScalar(segment.max));
					
					geometry.vertices.push(new THREE.Vector3( from.x, 0, from.y ))
					geometry.vertices.push(new THREE.Vector3( to.x, 0, to.y ))
				}  				
  			}
  		}

  		console.log(geometry.vertices.length);

  		var material = new THREE.LineBasicMaterial( {color: 0xffffff} );

		var line = new THREE.LineSegments(geometry, material);
		scene.add(line);

  		// material.wireframe = true;

		// var mesh = new THREE.Mesh(geometry, material);
		// scene.add(mesh);

		var pointsMaterial = new THREE.PointsMaterial( { color: 0xffffff } )
		pointsMaterial.size = .1;
		var pointsMesh = new THREE.Points( pointsGeo, pointsMaterial );
		scene.add( pointsMesh );
	}
}

export {Generator}