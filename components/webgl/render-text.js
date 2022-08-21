import { BaseBinding } from "../../../KMN-varstack.js/vars/base.js";
import { BoolVar } from "../../../KMN-varstack.js/vars/bool.js";
import { FloatVar } from "../../../KMN-varstack.js/vars/float.js";
import { BaseValueComponent, BooleanPointerControl, ValueControl, ValuePointerControl } from "./component-base.js";
import { ComponentShaders } from "./component-shaders.js";
import { ToggleButtonControl } from "./play-pause.js";
import { ComponentInfo, getElementHash, RenderControl} from "./render-control.js";
import { HorizontalSliderControl } from "./sliders.js";

const playPauseShader = /*glsl*/`
// #include distance-drawing
const vec3 forgroundColor = vec3(0.0,0.0,0.6);
const vec3 forgroundHoverColor = vec3(0.0,0.0,1.0);
const vec3 actionColor = vec3(255.0/255.0,255.0/255.0,3.0/255.0);
const vec3 actionHoverColor = vec3(255.0/255.0,255.0/255.0,48.0/255.0);

// line function, used in k, v, w, x, y, z, 1, 2, 4, 7 and ,
// rest is drawn using (stretched) circle(g)

// todo: distance fields of s,S, J { and }
// todo before we can show shaders :)
// 

float line(vec2 p, vec2 a, vec2 b)
{
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

//These functions are re-used by multiple letters
float _u(vec2 uv, float w, float v) {
  return length(vec2(
        abs(length(vec2(uv.x,
                         max(0.0,-(.4-v)-uv.y) ))-w)
        ,max(0.,uv.y-.4)));
}
float _i(vec2 uv) {
  return length(vec2(uv.x,max(0.,abs(uv.y)-.4)));
}
float _j(vec2 uv) {
  uv.x+=.2;
  uv.y+=.55;
  float x = uv.x>0.&&uv.y<0.?
                abs(length(uv)-.25)
                :min(length(uv+vec2(0.,.25)),
                      length(vec2(uv.x-.25,max(0.,abs(uv.y-.475)-.475))));
  return x;
}
float _l(vec2 uv) {
  uv.y -= .2;
  return length(vec2(uv.x,max(0.,abs(uv.y)-.6)));
}
float _o(vec2 uv) {
  return abs(length(vec2(uv.x,max(0.,abs(uv.y)-.15)))-.25);
}

// Here is the alphabet
float aa(vec2 uv) {
  uv = -uv;
  float x = abs(length(vec2(max(0.,abs(uv.x)-.05),uv.y-.2))-.2);
  x = min(x,length(vec2(uv.x+.25,max(0.,abs(uv.y-.2)-.2))));
  return min(x,(uv.x<0.?uv.y<0.:atan(uv.x,uv.y+0.15)>2.)?_o(uv):length(vec2(uv.x-.22734,uv.y+.254)));
}
float bb(vec2 uv) {
  float x = _o(uv);
  uv.x += .25;
  return min(x,_l(uv));
}
float cc(vec2 uv) {
  float x = _o(uv);
  uv.y= abs(uv.y);
  return uv.x<0.||atan(uv.x,uv.y-0.15)<1.14?x:
  min(length(vec2(uv.x+.25,max(0.0,abs(uv.y)-.15))),//makes df right 
       length(uv+vec2(-.22734,-.254)));
}
float dd(vec2 uv) {
  uv.x *= -1.;
  return bb(uv);
}
float ee(vec2 uv) {
  float x = _o(uv);
  return min(uv.x<0.||uv.y>.05||atan(uv.x,uv.y+0.15)>2.?x:length(vec2(uv.x-.22734,uv.y+.254)),
              length(vec2(max(0.,abs(uv.x)-.25),uv.y-.05)));
}
float ff(vec2 uv) {
  uv.x *= -1.;
  uv.x += .05;
  float x = _j(vec2(uv.x,-uv.y));
  uv.y -= .4;
  x = min(x,length(vec2(max(0.,abs(uv.x-.05)-.25),uv.y)));
  return x;
}
float gg(vec2 uv) {
  float x = _o(uv);
  return min(x,uv.x>0.||atan(uv.x,uv.y+.6)<-2.?
              _u(uv,0.25,-0.2):
              length(uv+vec2(.23,.7)));
}
float hh(vec2 uv) {
  uv.y *= -1.;
  float x = _u(uv,.25,.25);
  uv.x += .25;
  uv.y *= -1.;
  return min(x,_l(uv));
}
float ii(vec2 uv) {
  return min(_i(uv),length(vec2(uv.x,uv.y-.6)));
}
float jj(vec2 uv) {
  uv.x+=.05;
  return min(_j(uv),length(vec2(uv.x-.05,uv.y-.6)));
}
float kk(vec2 uv) {
  float x = line(uv,vec2(-.25,-.1), vec2(0.25,0.4));
  x = min(x,line(uv,vec2(-.15,.0), vec2(0.25,-0.4)));
  uv.x+=.25;
  return min(x,_l(uv));
}
float ll(vec2 uv) {
  return _l(uv);
}
float mm(vec2 uv) {
  //uv.x *= 1.4;
  uv.y *= -1.;
  uv.x-=.175;
  float x = _u(uv,.175,.175);
  uv.x+=.35;
  x = min(x,_u(uv,.175,.175));
  uv.x+=.175;
  return min(x,_i(uv));
}
float nn(vec2 uv) {
  uv.y *= -1.;
  float x = _u(uv,.25,.25);
  uv.x+=.25;
  return min(x,_i(uv));
}
float oo(vec2 uv) {
  return _o(uv);
}
float pp(vec2 uv) {
  float x = _o(uv);
  uv.x += .25;
  uv.y += .4;
  return min(x,_l(uv));
}
float qq(vec2 uv) {
  uv.x = -uv.x;
  return pp(uv);
}
float rr(vec2 uv) {
  uv.x -= .05;
  float x =atan(uv.x,uv.y-0.15)<1.14&&uv.y>0.?_o(uv):length(vec2(uv.x-.22734,uv.y-.254));
    
  //)?_o(uv):length(vec2(uv.x-.22734,uv.y+.254))+.4);
    
  uv.x+=.25;
  return min(x,_i(uv));
}
float ss(vec2 uv) {
  if (uv.y <.225-uv.x*.5 && uv.x>0. || uv.y<-.225-uv.x*.5)
    uv = -uv;
  float a = abs(length(vec2(max(0.,abs(uv.x)-.05),uv.y-.2))-.2);
  float b = length(vec2(uv.x-.231505,uv.y-.284));
  float x = atan(uv.x-.05,uv.y-0.2)<1.14?a:b;
  return x;
}
float tt(vec2 uv) {
  uv.x *= -1.;
  uv.y -= .4;
  uv.x += .05;
  float x = min(_j(uv),length(vec2(max(0.,abs(uv.x-.05)-.25),uv.y)));
  return x;
}
float uu(vec2 uv) {
  return _u(uv,.25,.25);
}
float vv(vec2 uv) {
  uv.x=abs(uv.x);
  return line(uv,vec2(0.25,0.4), vec2(0.,-0.4));
}
float ww(vec2 uv) {
  uv.x=abs(uv.x);
  return min(line(uv,vec2(0.3,0.4), vec2(.2,-0.4)),
              line(uv,vec2(0.2,-0.4), vec2(0.,0.1)));
}
float xx(vec2 uv) {
  uv=abs(uv);
  return line(uv,vec2(0.,0.), vec2(.3,0.4));
}
float yy(vec2 uv) {
  return min(line(uv,vec2(.0,-.2), vec2(-.3,0.4)),
              line(uv,vec2(.3,.4), vec2(-.3,-0.8)));
}
float zz(vec2 uv) {
  float l = line(uv,vec2(0.25,0.4), vec2(-0.25,-0.4));
  uv.y=abs(uv.y);
  float x = length(vec2(max(0.,abs(uv.x)-.25),uv.y-.4));
  return min(x,l);
}

// Capitals
float AA(vec2 uv) {
  float x = length(vec2(
        abs(length(vec2(uv.x,
                         max(0.0,uv.y-.35) ))-0.25)
        ,min(0.,uv.y+.4)));
  return min(x,length(vec2(max(0.,abs(uv.x)-.25),uv.y-.1) ));
}

float BB(vec2 uv) {
  uv.y -=.1;
  uv.y = abs(uv.y);
  float x = length(vec2(
        abs(length(vec2(max(0.0,uv.x),
                         uv.y-.25))-0.25)
        ,min(0.,uv.x+.25)));
  return min(x,length(vec2(uv.x+.25,max(0.,abs(uv.y)-.5)) ));
}
float CC(vec2 uv) {
  float x = abs(length(vec2(uv.x,max(0.,abs(uv.y-.1)-.25)))-.25);
  uv.y -= .1;
  uv.y= abs(uv.y);
  return uv.x<0.||atan(uv.x,uv.y-0.25)<1.14?x:
  min(length(vec2(uv.x+.25,max(0.0,abs(uv.y)-.25))),//makes df right 
       length(uv+vec2(-.22734,-.354)));
}
float DD(vec2 uv) {
  uv.y -=.1;
  //uv.y = abs(uv.y);
  float x = length(vec2(
        abs(length(vec2(max(0.0,uv.x),
                         max(0.0,abs(uv.y)-.25)))-0.25)
        ,min(0.,uv.x+.25)));
  return min(x,length(vec2(uv.x+.25,max(0.,abs(uv.y)-.5)) ));
}
float EE(vec2 uv) {
  uv.y -=.1;
  uv.y = abs(uv.y);
  float x = min(length(vec2(max(0.,abs(uv.x)-.25),uv.y)),
                 length(vec2(max(0.,abs(uv.x)-.25),uv.y-.5)));
  return min(x,length(vec2(uv.x+.25,max(0.,abs(uv.y)-.5))));
}
float FF(vec2 uv) {
  uv.y -=.1;
  float x = min(length(vec2(max(0.,abs(uv.x)-.25),uv.y)),
                 length(vec2(max(0.,abs(uv.x)-.25),uv.y-.5)));
  return min(x,length(vec2(uv.x+.25,max(0.,abs(uv.y)-.5))));
}
float GG(vec2 uv) {
  float x = abs(length(vec2(uv.x,max(0.,abs(uv.y-.1)-.25)))-.25);
  uv.y -= .1;
  float a = atan(uv.x,max(0.,abs(uv.y)-0.25));
  x = uv.x<0.||a<1.14 || a>3.?x:
          min(length(vec2(uv.x+.25,max(0.0,abs(uv.y)-.25))),//makes df right 
               length(uv+vec2(-.22734,-.354)));
  x = min(x,line(uv,vec2(.22734,-.1),vec2(.22734,-.354)));
  return min(x,line(uv,vec2(.22734,-.1),vec2(.05,-.1)));
}
float HH(vec2 uv) {
  uv.y -=.1;
  uv.x = abs(uv.x);
  float x = length(vec2(max(0.,abs(uv.x)-.25),uv.y));
  return min(x,length(vec2(uv.x-.25,max(0.,abs(uv.y)-.5))));
}
float II(vec2 uv) {
  uv.y -= .1;
  float x = length(vec2(uv.x,max(0.,abs(uv.y)-.5)));
  uv.y = abs(uv.y);
  return min(x,length(vec2(max(0.,abs(uv.x)-.1),uv.y-.5)));
}
float JJ(vec2 uv) {
  uv.x += .125;
  float x = length(vec2(
        abs(length(vec2(uv.x,
                         min(0.0,uv.y+.15) ))-0.25)
        ,max(0.,max(-uv.x,uv.y-.6))));
  return min(x,length(vec2(max(0.,abs(uv.x-.125)-.125),uv.y-.6)));
}
float KK(vec2 uv) {
  float x = line(uv,vec2(-.25,-.1), vec2(0.25,0.6));
  x = min(x,line(uv,vec2(-.1, .1), vec2(0.25,-0.4)));
  //    uv.x+=.25;
  return min(x,length(vec2(uv.x+.25,max(0.,abs(uv.y-.1)-.5))));
}
float LL(vec2 uv) {
  uv.y -=.1;
  float x = length(vec2(max(0.,abs(uv.x)-.2),uv.y+.5));
  return min(x,length(vec2(uv.x+.2,max(0.,abs(uv.y)-.5))));
}
float MM(vec2 uv) {
  uv.y-=.1;
  float x = min(length(vec2(uv.x-.35,max(0.,abs(uv.y)-.5))),
                 line(uv,vec2(-.35,.5),vec2(.0,-.1)));
  x = min(x,line(uv,vec2(.0,-.1),vec2(.35,.5)));
  return min(x,length(vec2(uv.x+.35,max(0.,abs(uv.y)-.5))));
}
float NN(vec2 uv) {
  uv.y-=.1;
  float x = min(length(vec2(uv.x-.25,max(0.,abs(uv.y)-.5))),
                 line(uv,vec2(-.25,.5),vec2(.25,-.5)));
  return min(x,length(vec2(uv.x+.25,max(0.,abs(uv.y)-.5))));
}
float OO(vec2 uv) {
  return abs(length(vec2(uv.x,max(0.,abs(uv.y-.1)-.25)))-.25);
}
float PP(vec2 uv) {
  float x = length(vec2(
        abs(length(vec2(max(0.0,uv.x),
                         uv.y-.35))-0.25)
        ,min(0.,uv.x+.25)));
  return min(x,length(vec2(uv.x+.25,max(0.,abs(uv.y-.1)-.5)) ));
}
float QQ(vec2 uv) {
  float x = abs(length(vec2(uv.x,max(0.,abs(uv.y-.1)-.25)))-.25);
  uv.y += .3;
  uv.x -= .2;
  return min(x,length(vec2(abs(uv.x+uv.y),max(0.,abs(uv.x-uv.y)-.2)))/sqrt(2.));
}
float RR(vec2 uv) {
  float x = length(vec2(
        abs(length(vec2(max(0.0,uv.x),
                         uv.y-.35))-0.25)
        ,min(0.,uv.x+.25)));
  x = min(x,length(vec2(uv.x+.25,max(0.,abs(uv.y-.1)-.5)) ));
  return min(x,line(uv,vec2(0.0,0.1),vec2(0.25,-0.4)));
}
float SS(vec2 uv) {
  uv.y -= .1;
  if (uv.y <.275-uv.x*.5 && uv.x>0. || uv.y<-.275-uv.x*.5)
    uv = -uv;
  float a = abs(length(vec2(max(0.,abs(uv.x)),uv.y-.25))-.25);
  float b = length(vec2(uv.x-.236,uv.y-.332));
  float x = atan(uv.x-.05,uv.y-0.25)<1.14?a:b;
  return x;
}
float TT(vec2 uv) {
  uv.y -= .1;
  float x = length(vec2(uv.x,max(0.,abs(uv.y)-.5)));
  return min(x,length(vec2(max(0.,abs(uv.x)-.25),uv.y-.5)));
}
float UU(vec2 uv) {
  float x = length(vec2(
        abs(length(vec2(uv.x,
                         min(0.0,uv.y+.15) ))-0.25)
        ,max(0.,uv.y-.6)));
  return x;
}
float VV(vec2 uv) {
  uv.x=abs(uv.x);
  return line(uv,vec2(0.25,0.6), vec2(0.,-0.4));
}
float WW(vec2 uv) {
  uv.x=abs(uv.x);
  return min(line(uv,vec2(0.3,0.6), vec2(.2,-0.4)),
              line(uv,vec2(0.2,-0.4), vec2(0.,0.2)));
}
float XX(vec2 uv) {
  uv.y -= .1;
  uv=abs(uv);
  return line(uv,vec2(0.,0.), vec2(.3,0.5));
}
float YY(vec2 uv) {
  return min(min(line(uv,vec2(.0, .1), vec2(-.3, 0.6)),
                  line(uv,vec2(.0, .1), vec2( .3, 0.6))),
              length(vec2(uv.x,max(0.,abs(uv.y+.15)-.25))));
}
float ZZ(vec2 uv) {
  float l = line(uv,vec2(0.25,0.6), vec2(-0.25,-0.4));
  uv.y-=.1;
  uv.y=abs(uv.y);
  float x = length(vec2(max(0.,abs(uv.x)-.25),uv.y-.5));
  return min(x,l);
}

//Numbers
float _11(vec2 uv) {
  return min(min(
        line(uv,vec2(-0.2,0.45),vec2(0.,0.6)),
        length(vec2(uv.x,max(0.,abs(uv.y-.1)-.5)))),
              length(vec2(max(0.,abs(uv.x)-.2),uv.y+.4)));
             
}
float _22(vec2 uv) {
  float x = min(line(uv,vec2(0.185,0.17),vec2(-.25,-.4)),
                 length(vec2(max(0.,abs(uv.x)-.25),uv.y+.4)));
  uv.y-=.35;
  uv.x += 0.025;
  return min(x,abs(atan(uv.x,uv.y)-0.63)<1.64?abs(length(uv)-.275):
              length(uv+vec2(.23,-.15)));
}
float _33(vec2 uv) {
  uv.y-=.1;
  uv.y = abs(uv.y);
  uv.y-=.25;
  return atan(uv.x,uv.y)>-1.?abs(length(uv)-.25):
    min(length(uv+vec2(.211,-.134)),length(uv+vec2(.0,.25)));
}
float _44(vec2 uv) {
  float x = min(length(vec2(uv.x-.15,max(0.,abs(uv.y-.1)-.5))),
                 line(uv,vec2(0.15,0.6),vec2(-.25,-.1)));
  return min(x,length(vec2(max(0.,abs(uv.x)-.25),uv.y+.1)));
}
float _55(vec2 uv) {
  float b = min(length(vec2(max(0.,abs(uv.x)-.25),uv.y-.6)),
                 length(vec2(uv.x+.25,max(0.,abs(uv.y-.36)-.236))));
  uv.y += 0.1;
  uv.x += 0.05;
  float c = abs(length(vec2(uv.x,max(0.,abs(uv.y)-.0)))-.3);
  return min(b,abs(atan(uv.x,uv.y)+1.57)<.86 && uv.x<0.?
              length(uv+vec2(.2,.224))
              :c);
}
float _66(vec2 uv) {
  uv.y-=.075;
  uv = -uv;
  float b = abs(length(vec2(uv.x,max(0.,abs(uv.y)-.275)))-.25);
  uv.y-=.175;
  float c = abs(length(vec2(uv.x,max(0.,abs(uv.y)-.05)))-.25);
  return min(c,cos(atan(uv.x,uv.y+.45)+0.65)<0.||(uv.x>0.&& uv.y<0.)?b:
              length(uv+vec2(0.2,0.6)));
}
float _77(vec2 uv) {
  return min(length(vec2(max(0.,abs(uv.x)-.25),uv.y-.6)),
              line(uv,vec2(-0.25,-0.39),vec2(0.25,0.6)));
}
float _88(vec2 uv) {
  float l = length(vec2(max(0.,abs(uv.x)-.08),uv.y-.1+uv.x*.07));
  uv.y-=.1;
  uv.y = abs(uv.y);
  uv.y-=.245;
  return min(abs(length(uv)-.255),l);
}
float _99(vec2 uv) {
  uv.y-=.125;
  float b = abs(length(vec2(uv.x,max(0.,abs(uv.y)-.275)))-.25);
  uv.y-=.175;
  float c = abs(length(vec2(uv.x,max(0.,abs(uv.y)-.05)))-.25);
  return min(c,cos(atan(uv.x,uv.y+.45)+0.65)<0.||(uv.x>0.&& uv.y<0.)?b:
              length(uv+vec2(0.2,0.6)));
}
float _00(vec2 uv) {
  uv.y-=.1;
  return abs(length(vec2(uv.x,max(0.,abs(uv.y)-.25)))-.25);
}

//Symbols
float ddot(vec2 uv) {
  uv.y+=.4;
  return length(uv)*0.97;//-.03;
}
float comma(vec2 uv) {
  return min(ddot(uv),line(uv,vec2(.031,-.405),vec2(-.029,-.52)));
}
float exclam(vec2 uv) {
  return min(ddot(uv),length(vec2(uv.x,max(0.,abs(uv.y-.2)-.4)))-uv.y*.06);
}
float question(vec2 uv) {
  float x = min(ddot(uv),length(vec2(uv.x,max(0.,abs(uv.y+.035)-.1125))));
  uv.y-=.35;
  uv.x += 0.025;
  return min(x,abs(atan(uv.x,uv.y)-1.05)<2.?abs(length(uv)-.275):
              length(uv+vec2(.225,-.16))-.0);
}
float open1(vec2 uv) {
  uv.x-=.62;
  return abs(atan(uv.x,uv.y)+1.57)<1.?
    abs(length(uv)-.8)
    :length(vec2(uv.x+.435,abs(uv.y)-.672));
}
float close1(vec2 uv) {
  uv.x = -uv.x;
  return open1(uv);
}
float dotdot(vec2 uv) {
  uv.y -= .1;
  uv.y = abs(uv.y);
  uv.y-=.25;
  return length(uv);
}
float dotcomma(vec2 uv) {
  uv.y -= .1;
  float x = line(uv,vec2(.0,-.28),vec2(-.029,-.32));
  uv.y = abs(uv.y);
  uv.y-=.25;
  return min(length(uv),x);
}
float eequal(vec2 uv) {
  uv.y -= .1;
  uv.y = abs(uv.y);
  return length(vec2(max(0.,abs(uv.x)-.25),uv.y-.15));
}
float aadd(vec2 uv) {
  uv.y -= .1;
  return min(length(vec2(max(0.,abs(uv.x)-.25),uv.y)),
              length(vec2(uv.x,max(0.,abs(uv.y)-.25))));
}
float ssub(vec2 uv) {
  return length(vec2(max(0.,abs(uv.x)-.25),uv.y-.1));
}
float mmul(vec2 uv) {
  uv.y -= .1;
  uv = abs(uv);
  return min(line(uv,vec2(0.866*.25,0.5*.25),vec2(0.))
              ,length(vec2(uv.x,max(0.,abs(uv.y)-.25))));
}
float ddiv(vec2 uv) {
  return line(uv,vec2(-0.25,-0.4),vec2(0.25,0.6));
}
float lt(vec2 uv) {
  uv.y-=.1;
  uv.y = abs(uv.y);
  return line(uv,vec2(0.25,0.25),vec2(-0.25,0.));
}
float gt(vec2 uv) {
  uv.x=-uv.x;
  return lt(uv);
}
float hash(vec2 uv) {
  uv.y-=.1;
  uv.x -= uv.y*.1;
  uv = abs(uv);
  return min(length(vec2(uv.x-.125,max(0.,abs(uv.y)-.3))),
              length(vec2(max(0.,abs(uv.x)-.25),uv.y-.125)));
}
float and(vec2 uv) {
  uv.y-=.44;
  uv.x+=.05;
  float x = abs(atan(uv.x,uv.y))<2.356?abs(length(uv)-.15):1.0;
  x = min(x,line(uv,vec2(-0.106,-0.106),vec2(0.4,-0.712)));
  x = min(x,line(uv,vec2( 0.106,-0.106),vec2(-0.116,-0.397)));
  uv.x-=.025;
  uv.y+=.54;
  x = min(x,abs(atan(uv.x,uv.y)-.785)>1.57?abs(length(uv)-.2):1.0);
  return min(x,line(uv,vec2( 0.141,-0.141),vec2( 0.377,0.177)));
}
float or(vec2 uv) {
  uv.y -= .1;
  return length(vec2(uv.x,max(0.,abs(uv.y)-.5)));
}
float und(vec2 uv) {
  return length(vec2(max(0.,abs(uv.x)-.25),uv.y+.4));
}
float open2(vec2 uv) {
  uv.y -= .1;
  uv.y = abs(uv.y);
  return min(length(vec2(uv.x+.125,max(0.,abs(uv.y)-.5))),
              length(vec2(max(0.,abs(uv.x)-.125),uv.y-.5)));
}
float close2(vec2 uv) {
  uv.x=-uv.x;
  return open2(uv);
}
float open3(vec2 uv) {
  uv.y -= .1;
  uv.y = abs(uv.y);
  float x = length(vec2(
        abs(length(vec2((uv.x*sign(uv.y-.25)-.2),
                         max(0.0,abs(uv.y-.25)-.05) ))-0.2)
        ,max(0.,abs(uv.x)-.2)));
  return  x;
    
}
float close3(vec2 uv) {
  uv.x=-uv.x;
  return open3(uv);
}

vec2 clc(vec2 uv, float cp, float w, float ital) {
  return uv-vec2(cp-(w*.5)+uv.y*ital,0.);
}
bool hit(vec2 uv,inout float cp,float w, float px) {
  return abs((cp+=w)-uv.x)<w+.2;
}

#define lc(nr,ch) case nr: return ch(p);

float getLetterDistance(vec4 posSize, int nr) {
  float maxS = minSize(posSize);
  float d = 0.0;
  vec2 p = posSize.xy/maxS;
  switch (nr) {
    lc(0,aa)
    lc(1,bb)
    lc(2,cc)
    lc(3,dd)
    lc(4,ee)
    lc(5,ff)
    lc(6,gg)
    lc(7,hh)
    lc(8,ii)
    lc(9,jj)
    lc(10,kk)
    lc(11,ll)
    lc(12,mm)
    lc(13,nn)
    lc(14,oo)
    lc(15,pp)
    lc(16,qq)
    lc(17,rr)
    lc(18,ss)
    lc(19,tt)
    lc(20,uu)
    lc(21,vv)
    lc(22,ww)
    lc(23,xx)
    lc(24,yy)
    lc(25,zz)
    lc(26,AA)
    lc(27,BB)
    lc(28,CC)
    lc(29,DD)
    lc(30,EE)
    lc(31,FF)
    lc(32,GG)
    lc(33,HH)
    lc(34,II)
    lc(35,JJ)
    lc(36,KK)
    lc(37,LL)
    lc(38,MM)
    lc(39,NN)
    lc(40,OO)
    lc(41,PP)
    lc(42,QQ)
    lc(43,RR)
    lc(44,SS)
    lc(45,TT)
    lc(46,UU)
    lc(47,VV)
    lc(48,WW)
    lc(49,XX)
    lc(50,YY)
    lc(51,ZZ)
    lc(52,_11)
    lc(53,_22)
    lc(54,_33)
    lc(55,_44)
    lc(56,_55)
    lc(57,_66)
    lc(58,_77)
    lc(59,_88)
    lc(60,_99)
    lc(61,_00)
    lc(62,ddot)
    lc(63,comma)
    lc(64,exclam)
    lc(65,question)
    lc(66,open1)
    lc(67,close1)
    lc(68,dotdot)
    lc(69,dotcomma)
    lc(70,eequal)
    lc(71,aadd)
    lc(72,ssub)
    lc(73,mmul)
    lc(74,ddiv)
    lc(75,lt)
    lc(76,gt)
    lc(77,hash)
    lc(78,and)
    lc(79,or)
    lc(80,und)
    lc(81,open2)
    lc(82,close2)
    lc(83,open3)
    lc(84,close3)
  }
}

vec4 renderComponent(vec2 center, vec2 size) {
  float iTime = float(drawCount) / 180.0;
  vec4 posSize = vec4((localCoord.xy-center) * vec2(1.0,-1.0),size * 0.5);
  float maxS = minSize(posSize);
  float dist = getLetterDistance(posSize,int(value.x)) * maxS - 1.25;//1.15;
  return addColor(
      // dist*1.5,
      dist * 0.8,
      vec3(0.8));
}
`;

const letterInfo = [
  { ch: 'a', w: 0.7 },
  { ch: 'b', w: 0.7 },
  { ch: 'c', w: 0.7 },
  { ch: 'd', w: 0.7 },
  { ch: 'e', w: 0.7 },
  { ch: 'f', w: 0.6 },
  { ch: 'g', w: 0.7 },
  { ch: 'h', w: 0.7 },
  { ch: 'i', w: 0.33 },
  { ch: 'j', w: 0.33 },
  { ch: 'k', w: 0.7 },
  { ch: 'l', w: 0.33 },
  { ch: 'm', w: 0.9 },
  { ch: 'n', w: 0.7 },
  { ch: 'o', w: 0.7 },
  { ch: 'p', w: 0.7 },
  { ch: 'q', w: 0.7 },
  { ch: 'r', w: 0.7 },
  { ch: 's', w: 0.7 },
  { ch: 't', w: 0.7 },
  { ch: 'u', w: 0.7 },
  { ch: 'v', w: 0.7 },
  { ch: 'w', w: 0.8 },
  { ch: 'x', w: 0.8 },
  { ch: 'y', w: 0.8 },
  { ch: 'z', w: 0.7 },
  { ch: 'A', w: 0.7 },
  { ch: 'B', w: 0.7 },
  { ch: 'C', w: 0.7 },
  { ch: 'D', w: 0.7 },
  { ch: 'E', w: 0.7 },
  { ch: 'F', w: 0.7 },
  { ch: 'G', w: 0.7 },
  { ch: 'H', w: 0.7 },
  { ch: 'I', w: 0.5 },
  { ch: 'J', w: 0.5 },
  { ch: 'K', w: 0.7 },
  { ch: 'L', w: 0.5 },
  { ch: 'M', w: 0.9 },
  { ch: 'N', w: 0.7 },
  { ch: 'O', w: 0.7 },
  { ch: 'P', w: 0.7 },
  { ch: 'Q', w: 0.7 },
  { ch: 'R', w: 0.7 },
  { ch: 'S', w: 0.7 },
  { ch: 'T', w: 0.7 },
  { ch: 'U', w: 0.7 },
  { ch: 'V', w: 0.7 },
  { ch: 'W', w: 0.8 },
  { ch: 'X', w: 0.8 },
  { ch: 'Y', w: 0.8 },
  { ch: 'Z', w: 0.7 },
  { ch: '1', w: 0.7 },
  { ch: '2', w: 0.7 },
  { ch: '3', w: 0.7 },
  { ch: '4', w: 0.7 },
  { ch: '5', w: 0.7 },
  { ch: '6', w: 0.7 },
  { ch: '7', w: 0.7 },
  { ch: '8', w: 0.7 },
  { ch: '9', w: 0.7 },
  { ch: '0', w: 0.7 },
  { ch: '.', w: 0.33 }, // #define _dot ch(ddot
  { ch: ',', w: 0.33 }, // #define _comma ch(comma
  { ch: '!', w: 0.33 }, // #define _exclam ch(exclam
  { ch: '?', w: 0.8 }, // #define _question ch(question
  { ch: '(', w: 0.7 }, // #define _open1 ch(open1
  { ch: ')', w: 0.7 }, // #define _close1 ch(close1
  { ch: ':', w: 0.33 }, // #define _dotdot ch(dotdot
  { ch: ';', w: 0.33 }, // #define _dotcomma ch(dotcomma
  { ch: '=', w: 0.7 }, // #define _equal ch(eequal
  { ch: '+', w: 0.7 }, // #define _add ch(aadd
  { ch: '-', w: 0.7 }, // #define _sub ch(ssub
  { ch: '*', w: 0.7 }, // #define _mul ch(mmul
  { ch: '/', w: 0.7 }, // #define _div ch(ddiv
  { ch: '<', w: 0.7 }, // #define _lt ch(lt
  { ch: '>', w: 0.7 }, // #define _gt ch(gt
  { ch: '#', w: 0.7 }, // #define _hash ch(hash
  { ch: '&', w: 0.9 }, // #define _and ch(and
  { ch: '|', w: 0.33 }, // #define _or ch(or
  { ch: '_', w: 0.7 }, // #define _und ch(und
  { ch: '[', w: 0.6 }, // #define _open2 ch(open2
  { ch: ']', w: 0.6 }, // #define _close2 ch(close2
  { ch: '{', w: 0.7 }, // #define _open3 ch(open3
  { ch: '}', w: 0.7 }]; // #define _close3 ch(close3
// ascii:   !"#$%&'()*+,-./0-9:;<=>?@A-Z[\]^_`a-z{|}~
// missing:  "#$% '                 @    \ ^ `      ~
export class LetterTest extends BaseValueComponent {
  /**
   * @param {HTMLElement} element
   * @param {BoolVar} boolVar
   */
  constructor(boolVar, element) {
    super(boolVar, element, HorizontalSliderControl, 'letter-test');
  }

  static get preferredSize() {
    return {
      width: 128,
      height: 128
    }
  }
}

const letterMap = {};
for (let ix = 0; ix < letterInfo.length; ix++) {
  let li = letterInfo[ix];
  letterMap[li.ch] = { ix: ix, w: li.w };
}
export class LetterComponent {
  constructor(box, fontSize, xOffset, letterInfo) {
    // TODO make Refactor ShaderClass from ComponentInfo in RenderControl for now its a string
    this._render = RenderControl.geInstance();
    this.letterInfo = letterInfo;
    this.xOffset = xOffset;
    this.fontSize = fontSize;
    this._box = box;
    this._componentInfo = this._render.getComponentInfo(
      12349875,//getElementHash(this._clipElement),
      'letter-test',
      this.updateComponentInfo.bind(this));
    this._componentInfoHandle = this._componentInfo.getFreeIndex(this.updateRenderInfo.bind(this))
  }

  static get preferredSize() {
    return {
      width: 48,
      height: 48
    }
  }

  /**
   * @param {ComponentInfo} info 
   */
  updateComponentInfo(info) {
    // RenderControl.setClipBoxFromElement(info, this._clipElement);
    info.clipRect.width  = window.innerWidth;
    info.clipRect.height = window.innerHeight;
    info.clipRect.x = 0;
    info.clipRect.y = 0;
  }

  /**@param {import("./render-control.js").RectInfo} info */
  updateRenderInfo(info) {
    this._box.update();
    let box = {
      width: this.fontSize,
      height: this.fontSize,
      x: this._box.x + this.xOffset,
      y: this._box.y
    }
    info.rect.width = Math.min(Math.max(this._box.cw - this.xOffset, 0), this.fontSize);
    info.rect.height = Math.min(this._box.ch, this.fontSize);
    info.rect.x = box.x + this._box.cx;
    info.rect.y = box.y + this._box.cy;

    info.size.centerX = this.fontSize / 2 - this._box.cx;
    info.size.centerY = this.fontSize / 2 - this._box.cy; //Math.sin(this.letterInfo.ix+performance.now()/1000.0)*2;

    info.size.width   = this.fontSize;
    info.size.height = box.height;
    
    info.value[0] = this.letterInfo.ix;
  }

  dispose() {
    if (this._componentInfoHandle) {
      this._componentInfo.freeRectInfo(this._componentInfoHandle);
      this._componentInfoHandle = undefined;
    }
  }
}

export class GLTextComponent {
  /**
   * 
   * @param {HTMLElement} element 
   * @param {string} textStr 
   */
  constructor(element, textStr) {
    this.letterComponents = [];
    this.clipElement = element.$getClippingParent();
    this.element = element;
    let fontSize = 23; //this.element.clientHeight;
    let xOffset = 0;
    this.box = {
      element,
      clipElement: this.clipElement,
      // viewport
      x: 0,
      y: 0,
      w: 0,
      h: 0,
      // cropbox
      cx: 0,
      cy: 0,
      cw: 0,
      ch: 0,
      lastUpd: RenderControl.geInstance().drawCount,
      update: function () {
        // @ts-ignore this is the current object we are called upon TS seems to mis that here
        if (this.lastUpd !== RenderControl.geInstance().drawCount) {
          // @ts-ignore
          let clipBox = this.clipElement.getBoundingClientRect();
          // @ts-ignore
          let box = this.element.getBoundingClientRect();
          this.x = box.x;
          this.y = box.y;
          this.w = box.width;
          this.h = box.height;
          this.cx = Math.max(clipBox.x - box.x, 0);
          this.cy = Math.max(clipBox.y - box.y, 0);
          this.cw = Math.min(box.width, (clipBox.x + clipBox.width) - box.x);
          this.ch = Math.min(box.height, (clipBox.y + clipBox.height) - box.y);

          this.lastUpd = RenderControl.geInstance().drawCount;
        }
      }
    }
    let first = true;
    for (let ch of textStr) {
      let letterInfo = letterMap[ch];
      if (letterInfo) {
        if (first) {
          first = false;
          xOffset -= fontSize / 4.;
        } else {
          xOffset += letterInfo.w * fontSize / 4.;
        }
        this.letterComponents.push(new LetterComponent(
          this.box,
          fontSize,
          xOffset,
          letterInfo));
        xOffset += letterInfo.w * fontSize / 4.;
      } else {
        xOffset += 0.7 * fontSize * 0.5;
      }
      xOffset = Math.ceil(xOffset + 0.2);
    }
    this.width = xOffset;
  }

  dispose() {
    for (let lc of this.letterComponents) {
      lc.dispose();
    }
  }
}

export class GLTextBinding extends BaseBinding {
  constructor (baseVar, element) {
    super(baseVar);
    if (element) {
      this.setElement(element);
    }
    this.glText = null;
  }

  handleVarChanged(baseVar) {
    if (this.glText) {
      this.glText.dispose();
    }
    this.glText = new GLTextComponent(this.element, this.baseVar.$niceStr);
    // this.element.innerText = this.baseVar.$niceStr;
  }

  setElement (element) {
    this.element = element;
    this.element.style.height = '16px';
    this.changeEvent = this.baseVar.$addDeferedEvent(this.handleVarChanged.bind(this), true);
  }
}

ComponentShaders['letter-test'] = playPauseShader;
RenderControl.geInstance().registerShader('letter-test', LetterTest, HorizontalSliderControl);

// HTMLElement.prototype.$setTextNode = function(str) {
//   this.$removeChildren();
//   if (this.dataGlText) {
//     this.dataGlText.dispose();
//   }
//   this.style.height = '24px';
//   this.dataGlText = new GLTextComponent(this, str);
//   this.style.width = this.dataGlText.width + 'px';
// }


