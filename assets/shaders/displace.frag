uniform sampler2D uTex0;
uniform sampler2D uTexDisplace;

uniform vec2	  uDisplaceScale;

in vec2			  TexCoord;

out vec4 outColor;

void main()
{
	vec2 uv = TexCoord;

	vec2 displace = texture( uTexDisplace, uv ).xy;
	
	displace = (displace - vec2(.5,.5)) * 2.; // renormalize 0..1 to -1...+1
	
	displace *= uDisplaceScale;
	
	outColor = texture( uTex0, uv + displace );
}