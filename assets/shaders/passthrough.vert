#version 150

uniform mat4	ciModelViewProjection;
//uniform mat3	ciNormalMatrix;

uniform vec2 uPositionOffset;
uniform vec2 uPositionScale;

uniform vec2 uTexCoordOffset;
uniform vec2 uTexCoordScale;

in vec2		ciPosition;
in vec2		ciTexCoord0;
//in vec3		ciNormal;
//in vec4		ciColor;
out highp vec2	TexCoord;
//out highp vec4	Color;
//out highp vec3	Normal;

void main( void )
{
	gl_Position	= ciModelViewProjection * vec4( (ciPosition * uPositionScale) + uPositionOffset, 0, 1 );
	TexCoord	= (ciTexCoord0 * uTexCoordScale) + uTexCoordOffset;
}
