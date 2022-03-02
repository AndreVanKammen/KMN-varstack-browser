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
}`,
"spectrumAnalyzer_analyzer":/*glsl*/`
const float log10 = 1.0 / log(10.0);

vec4 renderComponent(vec2 center, vec2 size) {
  vec2 lineClr = vec2(0.0);
  for (int ix = -133; ix <= 0; ix++) {
    float lineX = (localCoord.x / size.x);
    float n = fract(lineX * 128.0);
    // if (mod(value.y+ float(ix),2.0) >0.99) {
    //   n = 1.0-n;
    // }
    float scale1 = (float(136+ix) - n)/136.0;
    float scale = pow(scale1,2.0);

    // float lineX = (localCoord.x / size.x) / 2.0 + 0.25;// zoom
    lineX = lineX / scale - 0.5 * (1.0-scale);// * scale + 0.5 * (1.0-scale);
    //float lineX = (localCoord.x / size.x);
    vec4 fftValue = getSample4Hist(lineX, ix);
    vec2 sampleValue = vec2(length(fftValue.rg), length(fftValue.ba));
    if (ix == 0) {
      vec4 fftValue1 = getSample4Hist(lineX, ix - 1);
      vec2 sampleValue1 = vec2(length(fftValue1.rg), length(fftValue1.ba));
      sampleValue = mix(sampleValue1, sampleValue, n);
      scale1 = (float(136+ix))/136.0;
      scale = pow(scale1,2.0);
    }

    // sampleValue.xy = vec2(sampleValue.x + sampleValue.y) * 0.5; // Mono
    float dBRange = 115.0 - getLoudnesDataData(int(floor(lineX * float(bufferWidth)))).x;
    // dBRange *= 0.8;
    // sampleValue = (dBRange + (20.0 * log10 * log(0.000001 + sampleValue) )) / dBRange * 0.3;
    sampleValue *= pow(10.0,dBRange / 30.0) * 0.07;
    sampleValue = clamp(sampleValue, 0.0, 1.0) * scale1;
    vec2 dist = vec2(size.y * scale - localCoord.y) - sampleValue * size.y;// + sign(sampleValue));
    vec2 lineThickness = pow(sampleValue.xy,vec2(0.3))*size.y * 0.02;
    if (ix!=0) {
      dist = abs(dist);
    } else {
      lineThickness = vec2(1.0);
    }
    lineClr += (1.0-smoothstep(0.7*lineThickness,lineThickness,dist)) * vec2(1.75 / float(-ix + 1)) * (0.2+7.0*sampleValue);
  }
  vec3 returnClr = clamp(vec3(lineClr, lineClr.x), 0.0, 1.0);
  float alpha = smoothstep(0.01, 0.03, max(returnClr.r,max(returnClr.g,returnClr.b))) * opacity;
  return vec4(pow(returnClr,vec3(1.0/2.1)), alpha);
}`,
"spectrumAnalyzer_3D":/*glsl*/`
const float log10 = 1.0 / log(10.0);

vec4 renderComponent(vec2 center, vec2 size) {
  vec3 lineClr = vec3(0.0);
  for (int ix = -53; ix <= 0; ix++) {
    float lineX = (localCoord.x / size.x);
    float scale1 = float(56+ix)/56.2;
    float scale = pow(scale1,2.0);
    float scaleLine = pow(scale1,0.5);

    lineX = lineX * scaleLine + 0.5 * (1.0 - scaleLine);// * scale + 0.5 * (1.0-scale);
    vec4 fftValue = getSample4Hist(lineX, ix);
    vec2 sampleValue = vec2(length(fftValue.rg), length(fftValue.ba));

    float dBRange = 115.0 - getLoudnesDataData(int(floor(lineX * float(bufferWidth)))).x;
    float multiplier = pow(10.0,dBRange / 30.0) * 0.04;
    sampleValue *= multiplier;
    sampleValue = clamp(sampleValue, 0.0, 1.0) * scale1;
    vec2 dist = vec2(size.y * scale - localCoord.y) - sampleValue * size.y;// + sign(sampleValue));
    vec2 lineThickness = pow(sampleValue.xy,vec2(0.3))*size.y * 0.02 - float(ix)*0.4;
    if (ix!=0) {
      dist = abs(dist);
    } else {
      lineThickness = vec2(1.0);
    }
    vec2 line = (1.0-smoothstep(0.7*lineThickness,lineThickness,dist)) * vec2(1.75 / float(-ix + 1)) * (0.2+7.0*sampleValue);
    lineClr.xy += line;
    lineClr.z += (fftValue.x + fftValue.z) * multiplier * max(line.x,line.y) * 18.0;
  }
  vec3 returnClr = clamp(lineClr, 0.0, 1.0);
  float alpha = smoothstep(0.01, 0.03, max(returnClr.r,max(returnClr.g,returnClr.b))) * opacity;
  return vec4(pow(returnClr,vec3(1.0/2.1)), alpha);
}`,
"spectrumAnalyzer2Danalyze":/*glsl*/`
const float log10 = 1.0 / log(10.0);

vec4 renderComponent(vec2 center, vec2 size) {
  float lineX = (localCoord.x / size.x);
  float lineY = localCoord.y / 8.0;
  float historyY = fract(lineY);
  float historyX = fract(lineX * 256.0+0.5);
  lineX = lineX - historyX/256.0 + (historyY/256.0);

  vec4 fftValue1 = getSample4Hist(lineX, int(-floor(lineY)));
  vec4 fftValue2 = getSample4Hist(lineX+ 1.0/256.0, int(-floor(lineY)));
  vec2 sampleValue1 = vec2(length(fftValue1.rg), length(fftValue1.ba));
  vec2 sampleValue2 = vec2(length(fftValue2.rg), length(fftValue2.ba));

  vec2 sampleValue = mix(sampleValue1,sampleValue2,historyX);
  sampleValue.xy = vec2(sampleValue.x + sampleValue.y) * 0.5; // Mono
  float dBRange = 115.0 - getLoudnesDataData(int(floor(lineX * float(bufferWidth)))).x;
  float multiplier = pow(10.0,dBRange / 30.0) * 0.1;
  sampleValue *= multiplier;
  vec3 lineClr = vec3(sampleValue.xy, max(sampleValue.x,sampleValue.y));
  vec3 returnClr = clamp(lineClr, 0.0, 1.0);
  float alpha = smoothstep(0.01, 0.03, max(returnClr.r,max(returnClr.g,returnClr.b))) * opacity;
  return vec4(pow(returnClr,vec3(1.0/2.1)), alpha);
}`,
"spectrumAnalyzer":/*glsl*/`
const float log10 = 1.0 / log(10.0);

vec4 renderComponent(vec2 center, vec2 size) {
  float lineX = (localCoord.x / size.x);
  float lineY = (localCoord.y / size.y) * value.w;
  vec4 fftValue = getSample4Hist(lineX, int(-floor(lineY)));
  vec2 sampleValue = vec2(length(fftValue.rg), length(fftValue.ba));
  // sampleValue.xy = vec2(sampleValue.x + sampleValue.y) * 0.5; // Mono
  float dBRange = 115.0 - getLoudnesDataData(int(floor(lineX * float(bufferWidth)))).x;
  float multiplier = pow(10.0,dBRange / 30.0) * 0.1;
  sampleValue *= multiplier;
  vec3 lineClr = vec3(sampleValue.xy, 0.5*(min(sampleValue.x,sampleValue.y)+max(sampleValue.x,sampleValue.y)));
  vec3 returnClr = clamp(lineClr, 0.0, 1.0);
  float alpha = smoothstep(0.01, 0.03, max(returnClr.r,max(returnClr.g,returnClr.b))) * opacity;
  return vec4(pow(returnClr,vec3(1.0/2.1)), alpha);
}`,
"music-keyboard": /*glsl*/`vec2 getKeyDist(vec2 uv, out vec2 keyX, out int keyNr) {
  vec2 loc = mod(uv,1.0); // Coordinate for one octave

  // slightly scale black up and shift left and right half
  float blackScaledX = loc.x * 0.89 + 0.123 + sign(loc.x-3./7.) * 0.025;

  // calculate key coordinates
  keyX = mod(vec2(loc.x,blackScaledX),1.0/7.0)*7.0;
  vec4 keyCoord = vec4( vec2(abs(keyX-0.5)),
                        vec2(1.0-loc.y));

  // calculate distance field  x-white x-black y-white y-black
  vec4 keysHV = smoothstep( vec4( 0.45,   0.2,    0.02,   0.36),
                            vec4( 0.47,   0.3,    0.03,   0.42), keyCoord);

  // Combine the distance fields
  vec2 keyDist = min(1.0 - keysHV.xy, keysHV.zw);

  // leave out black keys nr 0, 3 and 7
  float blackKeyNr = blackScaledX * 7.0 - keyX.y;
  keyDist.y *= float(all(greaterThan(abs(vec3(blackKeyNr) - vec3(0.0, 3.0, 7.0)), vec3(.01))));

  // Substract black key from white key /
  keyDist.x = min(keyDist.x, 1.0-smoothstep(0.0,0.05,keyDist.y));

  keyNr = int(uv.x) * 12;
  if (keyDist.y > 0.5) {
    if (blackKeyNr <3.0) {
      keyNr += 1 + int(floor(blackKeyNr-1.0)) * 2;
    } else {
      keyNr += int(floor(blackKeyNr)) * 2 - 2;
    }
  } else {
    if (keyDist.x > 0.5) {
      int whiteKeyNr = int(loc.x * 7.0);
      if (whiteKeyNr < 3) {
        keyNr += whiteKeyNr * 2;
      } else {
        keyNr += whiteKeyNr * 2 - 1;
      }
    } else {
      keyNr = -1;
    }
  }

  return keyDist;
}

const vec2 aspect = vec2(3.0/5.0,1.0);

vec4 renderComponent(vec2 center, vec2 size) {
  // Normalized pixel coordinates (Y from 0 to 1, X to aspect ratio)
  vec2 uv = localCoord / size.y * aspect;
  vec2 loc = mod(uv,1.0); // Coordinate for one octave

  int keyNr;
  int mouseKeyNr;
  vec2 keyX;

  getKeyDist(mouse.xy / size.y * aspect, keyX, mouseKeyNr);

  // calculate key coordinates
  vec2 keyDist = getKeyDist(uv, keyX, keyNr);
  // calculate grayscale
  vec3 col = vec3( keyDist.x * 0.95 + // white key
                   0.5 * keyDist.y * smoothstep(0.5,1.0,loc.y+keyX.y)); // black key,
  if (keyNr!=-1) {
    if ((keyNr==mouseKeyNr) && (mouse.x>0.0) && (mouse.z>0.0)) {
      col += vec3(0.0,0.0,0.6);
      col *= 0.8+sin(float(drawCount)*0.1)*0.1;
      // keyDist *= 0.8;
    }
    vec4 noteData = getNoteData(keyNr);
    if (noteData.x > 0.0 && noteData.x * size.y > localCoord.y) {
      if (noteData.y >0.0) {
        col = vec3(1.0,0.2,0.2);
      } else {
        col = vec3(0.0,0.8,0.0);
      }
    }
  }

  return vec4(clamp(col, 0.0, 1.0), 1.0);
}
`
}
   