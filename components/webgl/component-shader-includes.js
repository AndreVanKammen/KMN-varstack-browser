export const ComponentShaderIncludes = {
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
}
#define currentForgroundColor (mouseInside ? forgroundHoverColor : forgroundColor)
#define currentActionColor (mouseInside ? actionHoverColor : actionColor)
#define defaultColor(dist) addColorAndOutline(dist, currentActionColor, currentForgroundColor, outLineThickness)
`,
"default-constants": /*glsl*/`
const vec3 forgroundColor = vec3(0.6);
const vec3 forgroundHoverColor = vec3(1.0);
const vec3 actionColor = vec3(5.0,5.0,192.0)/255.0;
const vec3 actionHoverColor = vec3(0.3,0.3,1.0);

const float outLineThickness = 0.25;
`
}

export function RegisterComponentShaderInclude(name, source) {
  ComponentShaderIncludes[name] = source;
}

const defaultConstants = {
  forgroundColor: { t: 'vec3', v: 'vec3(0.6)' },
  forgroundHoverColor: { t: 'vec3', v: 'vec3(1.0)' },
  actionColor: { t: 'vec3', v: 'vec3(5.0, 5.0, 192.0) / 255.0' },
  actionHoverColor: { t: 'vec3', v: 'vec3(0.3, 0.3, 1.0)' },
  outLineThickness: { t: 'float', v: '0.25' }
};

function updateDefaultConstantsInclude() {
  let str = '';
  for (let [key, value] of Object.entries(defaultConstants)) {
    str += `${value.t} ${key} = ${value.v};\n`;
  }
  RegisterComponentShaderInclude("default-constants", str);
}

/**
 * Overide default constants
 * @param {Record<string,string>} newConstants 
 */
export function UpdateConstants(newConstants) {
  for (let [key, value] of Object.entries(newConstants)) {
    defaultConstants[key].v = value;
  }
  updateDefaultConstantsInclude();
}

updateDefaultConstantsInclude();

