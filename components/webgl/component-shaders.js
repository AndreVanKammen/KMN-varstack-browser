export const ComponentShaders = {
"slider": /*glsl*/`
float line(vec2 p, vec2 a, vec2 b)
{
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

vec4 renderComponent(vec2 center, vec2 size) {
  vec2 posCenter = center + vec2((value.x*2.0-1.0) * size.x * 0.5,0.0);
  float r = size.y * 0.5;
  float d = length(localCoord - posCenter);
  float b = 1.0-smoothstep(r-0.5,r+0.5,d);
  float a = 1.0-smoothstep(r-1.0,r,d);
  float g;
  float l = 1.0-smoothstep(0.0,3.0,length(vec2(max(0.0,abs(localCoord.x-center.x)-size.x*0.5),localCoord.y-center.y)))-b;
  if (mouseFineTune) {
    a = max(0.15-0.15*smoothstep(0.0,500.0,length(localCoord - center)),a);
    float m = a * 6.0;
    l = max(l,m-m*smoothstep(0.0,2.0,line(localCoord, posCenter, mouse.xy)));
  }
  if (mouseInside) {
    g = (1.0-smoothstep(0.0,2.5,abs(d-r+1.0+0.5*sin(float(drawCount)*0.1))))*0.9;
    l *= 1.1;
  } else {
    g = (1.0-smoothstep(0.0,2.0,abs(d-r+1.0)))*0.8;
  }
  a = max(l,a);
  g = max(l,g)*0.8;
  return  vec4(g, g, max(b-g,l)*0.8, a); // vec4(vec3(value.x),1.0);
}`,
"vertical-slider": /*glsl*/`

float line(vec2 p, vec2 a, vec2 b)
{
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

vec4 renderComponent(vec2 center, vec2 size) {
  vec2 posCenter = center + vec2(0.0,(value.x*2.0-1.0) * size.y * 0.5);
  float maxS = min(size.x,size.y);
  float lineThickness = maxS * 0.1;
  float r = size.x * 0.5;
  float d = length(localCoord - posCenter);
  float b = 1.0-smoothstep(r-lineThickness,r,d);
  float a = 1.0-smoothstep(r-lineThickness,r,d);
  float g;
  float l = 1.0-smoothstep(0.0,3.0,length(vec2(
          localCoord.x-center.x,
          max(0.0,abs(localCoord.y-center.y)-size.y*0.5))))-b;
  if (mouseFineTune) {
    a = max(0.15-0.15*smoothstep(0.0,500.0,length(localCoord - center)),a);
    float m = a * 6.0;
    l = max(l,m-m*smoothstep(0.0,2.0,line(localCoord, posCenter, mouse.xy)));
  }
  if (mouseInside) {
    float fade = 1.0+0.5*sin(float(drawCount)*0.1);
    g = (1.0-smoothstep(0.0,lineThickness * fade,abs(d-r+fade)))*0.9;
    l *= 1.1;
  } else {
    // g = (1.0-smoothstep(0.0,lineThickness,abs(d-r+1.0)))*0.8;
  }
  a = max(l,a);
  g = max(l,g)*0.8;
  return  vec4(g, g, max(b-g,l)*0.8, a); // vec4(vec3(value.x),1.0);
}
`,
"verticalLevel":/*glsl*/`
vec4 renderComponent(vec2 center, vec2 size) {
  float level = smoothstep(localCoord.y - 1.0, localCoord.y + 1.0,(1.0-value.x) * size.y);
  level = max(level,smoothstep(size.x* 0.3, size.x* 0.4,abs(localCoord.x-center.x)));
  level = 1.0 - level;
  return vec4(vec3(level), 0.3 * level);
}`,
"verticalLevel2":/*glsl*/`
vec4 renderComponent(vec2 center, vec2 size) {
  float level = smoothstep(localCoord.y - 1.0, localCoord.y + 1.0,(1.0-value.x) * size.y);
  level = max(level,smoothstep(size.x* 0.3, size.x* 0.4,abs(localCoord.x-center.x)));
  level = 1.0 - level;
  return vec4(vec3(0.4,0.4,level), 0.3 * level);
}`,
"scope": /*glsl*/`vec4 renderComponent(vec2 center, vec2 size) {
  float lineX = localCoord.x / size.x;
  mat2x4 remLR = getEnergy();
  const vec4 weight = vec4(0.25,1.0,3.0,0.4);
  vec4 remL = remLR[0].wxzy * weight;
  vec4 remR = remLR[1].wxzy * weight;
  vec4 rem = (remL + remR) * 0.5;
  rem.r = max(remL.r, remR.r);
  vec2 sampleValue = getSample(lineX) / (0.0001 + 0.9999 * rem.r) * 0.25;
  vec2 dist = abs((sampleValue + 1.0)*0.5 * size.y-vec2(localCoord.y));// + sign(sampleValue));
  vec2 lineClr = (1.0-smoothstep(0.0,3.0,dist)) * 0.95;
  vec3 barClr = smoothstep(-0.8,1.5, rem.rgb * size.x - length(
    (localCoord-center + vec2((remL.r-remR.r) * size.x,-rem.a * size.x * 0.5)
    ) / volumeScale));
  barClr.r = max(barClr.r - barClr.b * barClr.b, 0.0);
  barClr.g = max(barClr.g - barClr.b * barClr.b * 0.5, 0.0) * 0.8;
  vec3 returnClr = max(vec3(lineClr, lineClr.x),
                       vec3(barClr * vec3(0.3,0.17,0.35)));
  float alpha = smoothstep(0.0, 0.2, max(returnClr.r,max(returnClr.g,returnClr.b)));
  return vec4(pow(returnClr,vec3(1.0/2.1)), alpha);
}`
}
   