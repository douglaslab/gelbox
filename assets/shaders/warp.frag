uniform sampler2D uTex0;
uniform sampler2D uTexWarp;

uniform vec2	  uWarpScale;

in vec2			  TexCoord;

out vec4 outColor;

void main()
{
	vec2 uv = TexCoord;

	vec2 warp = texture( uTexWarp, uv ).xy;
	
	warp = (warp - vec2(.5,.5)) * 2.; // renormalize 0..1 to -1...+1
	
	warp *= uWarpScale;
	
	outColor = texture( uTex0, uv + warp );
}
