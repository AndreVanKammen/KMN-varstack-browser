export const ComponentShaders = {
"distance-drawing": /*glsl*/`
const float pi = 3.141592653589793;
const float pi2 = 6.283185307179586;

float edgeDistance=0.9;

#define top(ps) ps.w
#define bottom(ps) -ps.w
#define left(ps) -ps.z
#define right(ps) ps.z

#define minSize(ps) min(ps.z, ps.w)
#define maxSize(ps) max(ps.z, ps.w)

/* Draw */

float drw_LineRight(vec2 p, vec2 a, vec2 b)
{
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  pa = pa - ba * h;
  return sign(dot(pa,vec2(ba.y,-ba.x)))*length(pa);
}

float maxmin(float a, float b) {
  if (a>0.0 && b > 0.0) {
    return min(a,b);
  } else {
    return max(a,b);
  }
}

float drw_Rectangle(vec2 p, vec2 center, vec2 sizeFromCenter) {
  vec2 rectDist = abs(center - p) - sizeFromCenter;
  if (rectDist.x > 0.0 && rectDist.y > 0.0) {
    return length(rectDist); // rounded corner distance
  } else {
    return max(rectDist.x,rectDist.y);
  }
}

float drw_RectangleFlat(vec2 p, vec2 center, vec2 sizeFromCenter) {
  vec2 rectDist = abs(center - p) - sizeFromCenter;
  return max(rectDist.x,rectDist.y);
}


float drw_Triangle(vec2 p, vec2 a, vec2 b, vec2 c) {
  return maxmin(maxmin(drw_LineRight( p, a, b),
                       drw_LineRight( p, b, c)),
                drw_LineRight( p, c, a)          );
}

float drw_Quad(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d) {
  return maxmin(
    maxmin(drw_LineRight( p, a, b),
           drw_LineRight( p, b, c)),
    maxmin(drw_LineRight( p, c, d),
           drw_LineRight( p, d, a)) );
}

float drw_Line(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba*h);
}

float drw_Circle(vec2 posSize, float radius) {
  return length(posSize) - radius;
}

ivec2 tf_TilePos = ivec2(0);
vec4 tf_Tiles(
       vec4 posSize,
       vec2 tileSize) {
  tf_TilePos = ivec2(floor(posSize.xy / tileSize * 0.5));
  return vec4(
    mod(posSize.xy, tileSize * 2.0) - tileSize,
    tileSize);
}

float tf_CircleSegmentNr = 0.0;
vec4 tf_CircleSegments(
       vec4 posSize,
       float radius, 
       float startAngle, 
       float endAngle, 
       int count,
       int coordinateType) {
  // Use x,y so we get start at bottom
  float angle = atan(posSize.x,posSize.y);
  float range = endAngle - startAngle;
  float rangeStep = range / float(count - 1);
  float desiredAngle = clamp(
            round((angle - startAngle) / rangeStep) * rangeStep + startAngle,
            startAngle, endAngle);
  posSize.zw = vec2(
    radius * rangeStep * 0.5,
    min(radius,minSize(posSize)-radius));
  vec2 dest = vec2(sin(desiredAngle),
                   cos(desiredAngle)) * radius;
  float normalOffset = dot(posSize.xy, dest) / dot(dest, dest);
  vec2 normalDest = normalOffset * dest;
  posSize.xy = vec2(coordinateType != 0 ? (angle - desiredAngle) * radius
                   : distance(posSize.xy, normalDest) * sign(angle - desiredAngle),
                   normalOffset * radius - radius);
  return posSize;
}

vec4 tf_CircleSegments(
       vec4 posSize,
       float radius, 
       float startAngle, 
       float endAngle, 
       int count) {
  return tf_CircleSegments(
        posSize,
        radius, 
        startAngle, 
        endAngle, 
        count,
        0);
}

void dst_Combine(inout float dist, float distB) {
  dist = min(dist, distB);
}

float dst_CombineAll(float distA, float distB) {
  return min(distA, distB);
}

float dst_CombineAll(float distA, float distB, float distC) {
  return min(min(distA, distB), distC);
}

void dst_substract(inout float dist, float distB) {
  dist = max(dist, -distB);
}

vec4 addColor(float dist,vec3 color) {
  return (1.0 - smoothstep(-edgeDistance, edgeDistance, dist)) * vec4(color.rgb, 1.0);
}

vec4 addColorAndOutline(
       float dist,
       vec3  color,
       vec3  outLineColor,
       float thickness) {
  vec4 result = (1.0 - smoothstep(-edgeDistance - thickness, edgeDistance - thickness, dist)) * vec4(color.rgb, 1.0);
  dist = abs(dist) - thickness - edgeDistance * 0.5;
  result += (1.0 - smoothstep(-edgeDistance, edgeDistance, dist)) * vec4(outLineColor.rgb, 1.0);
  return result;
}`,
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
  float activeColor = max(b-g,l);
  return  vec4(activeColor, activeColor, g, a); // vec4(vec3(value.x),1.0);
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
  vec2 posCenter = center + vec2(0.0,(1.0-value.x*2.0) * size.y * 0.5);
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
    g = (1.0-smoothstep(0.0,lineThickness * fade,abs(d-r+fade+lineThickness)))*0.9;
    l *= 1.1;
  } else {
    g = (1.0-smoothstep(0.0,lineThickness,abs(d-r+lineThickness)))*0.8;
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
   