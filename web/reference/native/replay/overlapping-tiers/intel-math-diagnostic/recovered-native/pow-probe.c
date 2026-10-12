#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <dlfcn.h>
int main(int argc,char **argv){
 if(argc!=3)return 2;
 float x=strtof(argv[1],0),y=strtof(argv[2],0);
 float (*volatile fn)(float,float)=dlsym(RTLD_DEFAULT,"powf");
 if(!fn)return 3;
 float z=fn(x,y);Dl_info info={0};dladdr((void*)fn,&info);
 printf("{\"base\":%.17g,\"exponent\":%.17g,\"result\":%.17g,\"image\":\"%s\",\"symbolOffset\":%llu}\n",x,y,z,info.dli_fname?info.dli_fname:"",(unsigned long long)((char*)(void*)fn-(char*)info.dli_fbase));
 return 0;
}
