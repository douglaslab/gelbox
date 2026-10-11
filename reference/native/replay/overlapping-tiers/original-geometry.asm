
/Applications/Gelbox.app/Contents/MacOS/Gelbox:	file format mach-o 64-bit x86-64

Disassembly of section __TEXT,__text:

00000001000572f0 <__ZN6GelSim16calcBandGeometryENS_7ContextE4BandN6cinder5RectTIfEEf>:
1000572f0: 55                          	pushq	%rbp
1000572f1: 48 89 e5                    	movq	%rsp, %rbp
1000572f4: 41 57                       	pushq	%r15
1000572f6: 41 56                       	pushq	%r14
1000572f8: 41 54                       	pushq	%r12
1000572fa: 53                          	pushq	%rbx
1000572fb: 48 83 ec 70                 	subq	$0x70, %rsp
1000572ff: f3 0f 11 55 b4              	movss	%xmm2, -0x4c(%rbp)
100057304: 0f 29 4d 80                 	movaps	%xmm1, -0x80(%rbp)
100057308: 0f 29 85 70 ff ff ff        	movaps	%xmm0, -0x90(%rbp)
10005730f: 48 89 f3                    	movq	%rsi, %rbx
100057312: 49 89 fe                    	movq	%rdi, %r14
100057315: f3 0f 16 c1                 	movshdup	%xmm1, %xmm0            ## xmm0 = xmm1[1,1,3,3]
100057319: 0f 29 45 a0                 	movaps	%xmm0, -0x60(%rbp)
10005731d: 44 8b 7b 0c                 	movl	0xc(%rbx), %r15d
100057321: 44 8b 63 10                 	movl	0x10(%rbx), %r12d
100057325: 44 89 f8                    	movl	%r15d, %eax
100057328: 2b 43 18                    	subl	0x18(%rbx), %eax
10005732b: f3 0f 10 45 10              	movss	0x10(%rbp), %xmm0
100057330: f3 0f 11 45 dc              	movss	%xmm0, -0x24(%rbp)
100057335: f3 0f 10 55 14              	movss	0x14(%rbp), %xmm2
10005733a: f3 0f 11 55 cc              	movss	%xmm2, -0x34(%rbp)
10005733f: f3 0f 10 0d a5 1d 1f 00     	movss	0x1f1da5(%rip), %xmm1   ## 0x1002490ec <__ZN6GelSim7gTuningE+0x1c>
100057347: f3 0f 11 4d bc              	movss	%xmm1, -0x44(%rbp)
10005734c: f3 0f 10 05 ac d1 15 00     	movss	0x15d1ac(%rip), %xmm0   ## 0x1001b4500 <dyld_stub_binder+0x1001b4500>
100057354: 0f 2e 45 2c                 	ucomiss	0x2c(%rbp), %xmm0
100057358: 0f 28 f0                    	movaps	%xmm0, %xmm6
10005735b: 48 8d 0d 8e 1d 1f 00        	leaq	0x1f1d8e(%rip), %rcx    ## 0x1002490f0 <__ZN6GelSim7gTuningE+0x20>
100057362: 48 8d 15 8b 1d 1f 00        	leaq	0x1f1d8b(%rip), %rdx    ## 0x1002490f4 <__ZN6GelSim7gTuningE+0x24>
100057369: 48 0f 45 d1                 	cmovneq	%rcx, %rdx
10005736d: f3 0f 10 05 1b 0e 16 00     	movss	0x160e1b(%rip), %xmm0   ## 0x1001b8190 <__ZTSZN9FileWatch10loadShaderEN5boost10filesystem4pathES2_NSt3__18functionIFvNS3_10shared_ptrIN6cinder2gl8GlslProgEEEEEEE3$_3+0xd0>
100057375: 0f 2e 45 28                 	ucomiss	0x28(%rbp), %xmm0
100057379: 48 0f 45 d1                 	cmovneq	%rcx, %rdx
10005737d: 0f 57 c0                    	xorps	%xmm0, %xmm0
100057380: 0f 2e 45 24                 	ucomiss	0x24(%rbp), %xmm0
100057384: 0f 57 ed                    	xorps	%xmm5, %xmm5
100057387: 48 0f 45 d1                 	cmovneq	%rcx, %rdx
10005738b: f3 0f 10 05 b5 d1 15 00     	movss	0x15d1b5(%rip), %xmm0   ## 0x1001b4548 <dyld_stub_binder+0x1001b4548>
100057393: 0f 2e 45 20                 	ucomiss	0x20(%rbp), %xmm0
100057397: 48 0f 45 d1                 	cmovneq	%rcx, %rdx
10005739b: f3 0f 10 02                 	movss	(%rdx), %xmm0
10005739f: f3 0f 11 45 c8              	movss	%xmm0, -0x38(%rbp)
1000573a4: 41 0f af c4                 	imull	%r12d, %eax
1000573a8: 0f 57 c0                    	xorps	%xmm0, %xmm0
1000573ab: f3 0f 2a c0                 	cvtsi2ss	%eax, %xmm0
1000573af: f3 0f 2a 1d 1d 1d 1f 00     	cvtsi2ssl	0x1f1d1d(%rip), %xmm3 ## 0x1002490d4 <__ZN6GelSim7gTuningE+0x4>
1000573b7: 0f 28 e6                    	movaps	%xmm6, %xmm4
1000573ba: f3 0f 5e e3                 	divss	%xmm3, %xmm4
1000573be: 0f 29 65 90                 	movaps	%xmm4, -0x70(%rbp)
1000573c2: f3 0f 59 c4                 	mulss	%xmm4, %xmm0
1000573c6: 0f 28 e6                    	movaps	%xmm6, %xmm4
1000573c9: f3 0f 5d e0                 	minss	%xmm0, %xmm4
1000573cd: f3 0f 10 5b 20              	movss	0x20(%rbx), %xmm3
1000573d2: f3 0f 58 1d 32 ea 15 00     	addss	0x15ea32(%rip), %xmm3   ## 0x1001b5e0c <__ZTSZN15GelSettingsView11makeSlidersEvE4$_12+0x2c>
1000573da: f3 0f 5e 1d 4a 1d 1f 00     	divss	0x1f1d4a(%rip), %xmm3   ## 0x10024912c <__ZN6GelSim7gTuningE+0x5c>
1000573e2: f3 0f 59 da                 	mulss	%xmm2, %xmm3
1000573e6: f3 0f 59 1d 0a 1d 1f 00     	mulss	0x1f1d0a(%rip), %xmm3   ## 0x1002490f8 <__ZN6GelSim7gTuningE+0x28>
1000573ee: 0f 28 fb                    	movaps	%xmm3, %xmm7
1000573f1: f3 0f 11 7d c0              	movss	%xmm7, -0x40(%rbp)
1000573f6: 0f 28 d6                    	movaps	%xmm6, %xmm2
1000573f9: f3 0f 5c d4                 	subss	%xmm4, %xmm2
1000573fd: f3 0f c2 c5 01              	cmpltss	%xmm5, %xmm0
100057402: 0f 28 d8                    	movaps	%xmm0, %xmm3
100057405: 0f 55 da                    	andnps	%xmm2, %xmm3
100057408: 0f 54 c6                    	andps	%xmm6, %xmm0
10005740b: 0f 56 c3                    	orps	%xmm3, %xmm0
10005740e: f3 0f 58 c7                 	addss	%xmm7, %xmm0
100057412: e8 f3 c1 15 00              	callq	0x1001b360a <dyld_stub_binder+0x1001b360a>
100057417: f3 0f 58 45 c8              	addss	-0x38(%rbp), %xmm0
10005741c: f3 0f 11 45 b8              	movss	%xmm0, -0x48(%rbp)
100057421: f3 0f 10 05 f3 1c 1f 00     	movss	0x1f1cf3(%rip), %xmm0   ## 0x10024911c <__ZN6GelSim7gTuningE+0x4c>
100057429: f3 0f 10 4d dc              	movss	-0x24(%rbp), %xmm1
10005742e: f3 0f 5c c8                 	subss	%xmm0, %xmm1
100057432: f3 0f 5e c8                 	divss	%xmm0, %xmm1
100057436: f3 0f 10 1d c2 d0 15 00     	movss	0x15d0c2(%rip), %xmm3   ## 0x1001b4500 <dyld_stub_binder+0x1001b4500>
10005743e: f3 0f 58 cb                 	addss	%xmm3, %xmm1
100057442: f3 0f 11 4d dc              	movss	%xmm1, -0x24(%rbp)
100057447: f3 0f 10 45 cc              	movss	-0x34(%rbp), %xmm0
10005744c: f3 0f 59 c1                 	mulss	%xmm1, %xmm0
100057450: f3 0f 11 45 c4              	movss	%xmm0, -0x3c(%rbp)
100057455: 44 2b 7b 14                 	subl	0x14(%rbx), %r15d
100057459: 45 0f af fc                 	imull	%r12d, %r15d
10005745d: 0f 57 c0                    	xorps	%xmm0, %xmm0
100057460: f3 41 0f 2a c7              	cvtsi2ss	%r15d, %xmm0
100057465: f3 0f 59 45 90              	mulss	-0x70(%rbp), %xmm0
10005746a: 0f 28 cb                    	movaps	%xmm3, %xmm1
10005746d: f3 0f 5d c8                 	minss	%xmm0, %xmm1
100057471: 0f 28 d3                    	movaps	%xmm3, %xmm2
100057474: f3 0f 5c d1                 	subss	%xmm1, %xmm2
100057478: f3 0f c2 05 7b d3 15 00 01  	cmpltss	0x15d37b(%rip), %xmm0   ## 0x1001b47fc <__ZTSNSt3__120__shared_ptr_emplaceI12FragmentViewNS_9allocatorIS1_EEEE+0x4c>
100057481: 0f 28 c8                    	movaps	%xmm0, %xmm1
100057484: 0f 55 ca                    	andnps	%xmm2, %xmm1
100057487: 0f 54 c3                    	andps	%xmm3, %xmm0
10005748a: 0f 56 c1                    	orps	%xmm1, %xmm0
10005748d: f3 0f 58 45 c0              	addss	-0x40(%rbp), %xmm0
100057492: f3 0f 10 4d bc              	movss	-0x44(%rbp), %xmm1
100057497: e8 6e c1 15 00              	callq	0x1001b360a <dyld_stub_binder+0x1001b360a>
10005749c: f3 0f 58 45 c8              	addss	-0x38(%rbp), %xmm0
1000574a1: f3 0f 10 5d 18              	movss	0x18(%rbp), %xmm3
1000574a6: f3 0f 10 4d c4              	movss	-0x3c(%rbp), %xmm1
1000574ab: f3 0f 59 cb                 	mulss	%xmm3, %xmm1
1000574af: f3 0f 59 4d b8              	mulss	-0x48(%rbp), %xmm1
1000574b4: 0f 28 e1                    	movaps	%xmm1, %xmm4
1000574b7: f3 0f 10 55 cc              	movss	-0x34(%rbp), %xmm2
1000574bc: f3 0f 59 da                 	mulss	%xmm2, %xmm3
1000574c0: f3 0f 59 5d dc              	mulss	-0x24(%rbp), %xmm3
1000574c5: f3 0f 59 d8                 	mulss	%xmm0, %xmm3
1000574c9: f3 0f 11 5d dc              	movss	%xmm3, -0x24(%rbp)
1000574ce: 0f 28 85 70 ff ff ff        	movaps	-0x90(%rbp), %xmm0
1000574d5: 0f 13 43 50                 	movlps	%xmm0, 0x50(%rbx)
1000574d9: 0f 28 4d 80                 	movaps	-0x80(%rbp), %xmm1
1000574dd: 0f 13 4b 58                 	movlps	%xmm1, 0x58(%rbx)
1000574e1: 4c 8d 7b 30                 	leaq	0x30(%rbx), %r15
1000574e5: 0f 13 43 30                 	movlps	%xmm0, 0x30(%rbx)
1000574e9: 0f 13 4b 38                 	movlps	%xmm1, 0x38(%rbx)
1000574ed: f3 0f 16 c0                 	movshdup	%xmm0, %xmm0            ## xmm0 = xmm0[1,1,3,3]
1000574f1: 0f 28 5d a0                 	movaps	-0x60(%rbp), %xmm3
1000574f5: 0f 28 cb                    	movaps	%xmm3, %xmm1
1000574f8: f3 0f 5c c8                 	subss	%xmm0, %xmm1
1000574fc: f3 0f 58 c4                 	addss	%xmm4, %xmm0
100057500: f3 0f 11 43 34              	movss	%xmm0, 0x34(%rbx)
100057505: f3 0f 58 e3                 	addss	%xmm3, %xmm4
100057509: f3 0f 11 63 3c              	movss	%xmm4, 0x3c(%rbx)
10005750e: f3 0f 10 45 b4              	movss	-0x4c(%rbp), %xmm0
100057513: f3 0f 58 05 f1 e8 15 00     	addss	0x15e8f1(%rip), %xmm0   ## 0x1001b5e0c <__ZTSZN15GelSettingsView11makeSlidersEvE4$_12+0x2c>
10005751b: f3 0f 59 05 11 d0 15 00     	mulss	0x15d011(%rip), %xmm0   ## 0x1001b4534 <dyld_stub_binder+0x1001b4534>
100057523: f3 0f 59 ca                 	mulss	%xmm2, %xmm1
100057527: f3 0f 59 c8                 	mulss	%xmm0, %xmm1
10005752b: c7 45 d0 00 00 00 00        	movl	$0x0, -0x30(%rbp)
100057532: f3 0f 11 4d d4              	movss	%xmm1, -0x2c(%rbp)
100057537: 4c 8d 65 d0                 	leaq	-0x30(%rbp), %r12
10005753b: 4c 89 ff                    	movq	%r15, %rdi
10005753e: 4c 89 e6                    	movq	%r12, %rsi
100057541: e8 ea bb 15 00              	callq	0x1001b3130 <dyld_stub_binder+0x1001b3130>
100057546: f3 0f 10 55 dc              	movss	-0x24(%rbp), %xmm2
10005754b: 0f 57 c9                    	xorps	%xmm1, %xmm1
10005754e: f3 0f 58 53 5c              	addss	0x5c(%rbx), %xmm2
100057553: f3 0f 10 43 3c              	movss	0x3c(%rbx), %xmm0
100057558: f3 0f 5c d0                 	subss	%xmm0, %xmm2
10005755c: f3 0f 11 53 64              	movss	%xmm2, 0x64(%rbx)
100057561: 0f 2e 4d 20                 	ucomiss	0x20(%rbp), %xmm1
100057565: 75 3c                       	jne	0x1000575a3 <__ZN6GelSim16calcBandGeometryENS_7ContextE4BandN6cinder5RectTIfEEf+0x2b3>
100057567: 48 8d 45 10                 	leaq	0x10(%rbp), %rax
10005756b: 0f 2e 48 14                 	ucomiss	0x14(%rax), %xmm1
10005756f: 75 32                       	jne	0x1000575a3 <__ZN6GelSim16calcBandGeometryENS_7ContextE4BandN6cinder5RectTIfEEf+0x2b3>
100057571: 0f 57 c9                    	xorps	%xmm1, %xmm1
100057574: 0f 2e 48 18                 	ucomiss	0x18(%rax), %xmm1
100057578: 75 29                       	jne	0x1000575a3 <__ZN6GelSim16calcBandGeometryENS_7ContextE4BandN6cinder5RectTIfEEf+0x2b3>
10005757a: 0f 2e 48 1c                 	ucomiss	0x1c(%rax), %xmm1
10005757e: 75 23                       	jne	0x1000575a3 <__ZN6GelSim16calcBandGeometryENS_7ContextE4BandN6cinder5RectTIfEEf+0x2b3>
100057580: 48 8d 43 60                 	leaq	0x60(%rbx), %rax
100057584: f3 0f 5c 43 34              	subss	0x34(%rbx), %xmm0
100057589: f3 0f 59 05 4f 1b 1f 00     	mulss	0x1f1b4f(%rip), %xmm0   ## 0x1002490e0 <__ZN6GelSim7gTuningE+0x10>
100057591: f3 0f 11 45 d0              	movss	%xmm0, -0x30(%rbp)
100057596: 0f 2e 43 60                 	ucomiss	0x60(%rbx), %xmm0
10005759a: 49 0f 47 c4                 	cmovaq	%r12, %rax
10005759e: 8b 00                       	movl	(%rax), %eax
1000575a0: 89 43 60                    	movl	%eax, 0x60(%rbx)
1000575a3: 48 8d 43 60                 	leaq	0x60(%rbx), %rax
1000575a7: f3 0f 10 43 34              	movss	0x34(%rbx), %xmm0
1000575ac: f3 0f 5c 45 a0              	subss	-0x60(%rbp), %xmm0
1000575b1: f3 0f 11 45 d0              	movss	%xmm0, -0x30(%rbp)
1000575b6: 0f 2e 43 60                 	ucomiss	0x60(%rbx), %xmm0
1000575ba: 49 0f 42 c4                 	cmovbq	%r12, %rax
1000575be: 8b 00                       	movl	(%rax), %eax
1000575c0: 89 43 60                    	movl	%eax, 0x60(%rbx)
1000575c3: 48 8d 7b 40                 	leaq	0x40(%rbx), %rdi
1000575c7: 49 8b 0f                    	movq	(%r15), %rcx
1000575ca: 49 8b 57 08                 	movq	0x8(%r15), %rdx
1000575ce: 48 89 4b 40                 	movq	%rcx, 0x40(%rbx)
1000575d2: 48 89 53 48                 	movq	%rdx, 0x48(%rbx)
1000575d6: 66 0f 6e c0                 	movd	%eax, %xmm0
1000575da: f3 0f 5f 43 78              	maxss	0x78(%rbx), %xmm0
1000575df: f3 0f 10 4b 44              	movss	0x44(%rbx), %xmm1
1000575e4: f3 0f 5c c8                 	subss	%xmm0, %xmm1
1000575e8: f3 0f 11 4b 44              	movss	%xmm1, 0x44(%rbx)
1000575ed: f3 0f 58 53 4c              	addss	0x4c(%rbx), %xmm2
1000575f2: f3 0f 11 53 4c              	movss	%xmm2, 0x4c(%rbx)
1000575f7: 0f 57 c0                    	xorps	%xmm0, %xmm0
1000575fa: f3 0f 2a 83 84 00 00 00     	cvtsi2ssl	0x84(%rbx), %xmm0
100057602: f3 0f 11 45 d0              	movss	%xmm0, -0x30(%rbp)
100057607: f3 0f 11 45 d4              	movss	%xmm0, -0x2c(%rbp)
10005760c: 48 8d 75 d0                 	leaq	-0x30(%rbp), %rsi
100057610: e8 1b bb 15 00              	callq	0x1001b3130 <dyld_stub_binder+0x1001b3130>
100057615: 8b 43 20                    	movl	0x20(%rbx), %eax
100057618: 41 89 46 20                 	movl	%eax, 0x20(%r14)
10005761c: 48 8b 43 18                 	movq	0x18(%rbx), %rax
100057620: 49 89 46 18                 	movq	%rax, 0x18(%r14)
100057624: 48 8b 43 10                 	movq	0x10(%rbx), %rax
100057628: 49 89 46 10                 	movq	%rax, 0x10(%r14)
10005762c: 48 8b 03                    	movq	(%rbx), %rax
10005762f: 48 8b 4b 08                 	movq	0x8(%rbx), %rcx
100057633: 49 89 4e 08                 	movq	%rcx, 0x8(%r14)
100057637: 49 89 06                    	movq	%rax, (%r14)
10005763a: 8b 43 24                    	movl	0x24(%rbx), %eax
10005763d: 41 89 46 24                 	movl	%eax, 0x24(%r14)
100057641: 8b 43 28                    	movl	0x28(%rbx), %eax
100057644: 41 89 46 28                 	movl	%eax, 0x28(%r14)
100057648: 8b 43 2c                    	movl	0x2c(%rbx), %eax
10005764b: 41 89 46 2c                 	movl	%eax, 0x2c(%r14)
10005764f: 49 8d 7e 30                 	leaq	0x30(%r14), %rdi
100057653: b9 17 00 00 00              	movl	$0x17, %ecx
100057658: 4c 89 fe                    	movq	%r15, %rsi
10005765b: f3 a5                       	rep		movsl	(%rsi), %es:(%rdi)
10005765d: 8b 83 8c 00 00 00           	movl	0x8c(%rbx), %eax
100057663: 41 89 86 8c 00 00 00        	movl	%eax, 0x8c(%r14)
10005766a: 8b 83 90 00 00 00           	movl	0x90(%rbx), %eax
100057670: 41 89 86 90 00 00 00        	movl	%eax, 0x90(%r14)
100057677: 8b 83 94 00 00 00           	movl	0x94(%rbx), %eax
10005767d: 41 89 86 94 00 00 00        	movl	%eax, 0x94(%r14)
100057684: 8b 83 a0 00 00 00           	movl	0xa0(%rbx), %eax
10005768a: 41 89 86 a0 00 00 00        	movl	%eax, 0xa0(%r14)
100057691: 48 8b 83 98 00 00 00        	movq	0x98(%rbx), %rax
100057698: 49 89 86 98 00 00 00        	movq	%rax, 0x98(%r14)
10005769f: 4c 89 f0                    	movq	%r14, %rax
1000576a2: 48 83 c4 70                 	addq	$0x70, %rsp
1000576a6: 5b                          	popq	%rbx
1000576a7: 41 5c                       	popq	%r12
1000576a9: 41 5e                       	popq	%r14
1000576ab: 41 5f                       	popq	%r15
1000576ad: 5d                          	popq	%rbp
1000576ae: c3                          	retq
1000576af: 90                          	nop
