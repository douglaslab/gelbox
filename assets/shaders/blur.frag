#version 150

uniform sampler2D uTex0;

in vec4	Color;
//in vec3	Normal;
in vec2	TexCoord;

out vec4 			oColor;

void main( void )
{
	vec4 c = texture( uTex0, TexCoord );
	
	oColor = c;
//	oColor = vec4(1,1,1,.1);
	
//	oColor = vec4(1,1,1,1);
//	oColor = vec4(1,0,0,1);
	
//	oColor = vec4(TexCoord,TexCoord.s, TexCoord.t);
//	oColor = 
	
//	oColor = c * Color;

//	oColor = vec4(1,1,1,1) - oColor;
}