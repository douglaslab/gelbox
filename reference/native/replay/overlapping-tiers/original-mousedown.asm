
/Applications/Gelbox.app/Contents/MacOS/Gelbox:	file format mach-o 64-bit x86-64

Disassembly of section __TEXT,__text:

000000010000cfa0 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE>:
10000cfa0: 55                          	pushq	%rbp
10000cfa1: 48 89 e5                    	movq	%rsp, %rbp
10000cfa4: 41 57                       	pushq	%r15
10000cfa6: 41 56                       	pushq	%r14
10000cfa8: 41 55                       	pushq	%r13
10000cfaa: 41 54                       	pushq	%r12
10000cfac: 53                          	pushq	%rbx
10000cfad: 48 81 ec 78 01 00 00        	subq	$0x178, %rsp            ## imm = 0x178
10000cfb4: 49 89 f6                    	movq	%rsi, %r14
10000cfb7: 49 89 fd                    	movq	%rdi, %r13
10000cfba: 48 8b 05 17 f0 22 00        	movq	0x22f017(%rip), %rax    ## 0x10023bfd8 <dyld_stub_binder+0x10023bfd8>
10000cfc1: 48 8b 00                    	movq	(%rax), %rax
10000cfc4: 48 89 45 d0                 	movq	%rax, -0x30(%rbp)
10000cfc8: f3 41 0f 2a 46 24           	cvtsi2ssl	0x24(%r14), %xmm0
10000cfce: f3 0f 11 85 6c ff ff ff     	movss	%xmm0, -0x94(%rbp)
10000cfd6: 0f 57 c0                    	xorps	%xmm0, %xmm0
10000cfd9: f3 41 0f 2a 46 28           	cvtsi2ssl	0x28(%r14), %xmm0
10000cfdf: f3 0f 11 85 68 ff ff ff     	movss	%xmm0, -0x98(%rbp)
10000cfe7: 48 8d bd f0 fe ff ff        	leaq	-0x110(%rbp), %rdi
10000cfee: 4c 89 ee                    	movq	%r13, %rsi
10000cff1: e8 0a f6 05 00              	callq	0x10006c600 <__ZNK4View20getRootToChildMatrixEv>
10000cff6: f3 0f 10 8d f0 fe ff ff     	movss	-0x110(%rbp), %xmm1
10000cffe: f3 0f 10 85 6c ff ff ff     	movss	-0x94(%rbp), %xmm0
10000d006: f3 0f 59 c8                 	mulss	%xmm0, %xmm1
10000d00a: f3 0f 59 85 f4 fe ff ff     	mulss	-0x10c(%rbp), %xmm0
10000d012: f3 0f 11 85 6c ff ff ff     	movss	%xmm0, -0x94(%rbp)
10000d01a: f3 0f 10 95 00 ff ff ff     	movss	-0x100(%rbp), %xmm2
10000d022: f3 0f 10 85 68 ff ff ff     	movss	-0x98(%rbp), %xmm0
10000d02a: f3 0f 59 d0                 	mulss	%xmm0, %xmm2
10000d02e: f3 0f 59 85 04 ff ff ff     	mulss	-0xfc(%rbp), %xmm0
10000d036: f3 0f 11 85 68 ff ff ff     	movss	%xmm0, -0x98(%rbp)
10000d03e: f3 0f 10 a5 20 ff ff ff     	movss	-0xe0(%rbp), %xmm4
10000d046: f3 0f 10 9d 24 ff ff ff     	movss	-0xdc(%rbp), %xmm3
10000d04e: 0f 28 05 db 77 1a 00        	movaps	0x1a77db(%rip), %xmm0   ## 0x1001b4830 <__ZTSNSt3__120__shared_ptr_emplaceI12FragmentViewNS_9allocatorIS1_EEEE+0x80>
10000d055: 41 0f 11 85 e0 00 00 00     	movups	%xmm0, 0xe0(%r13)
10000d05d: 49 c7 85 f0 00 00 00 01 00 00 00    	movq	$0x1, 0xf0(%r13)
10000d068: 49 c7 85 f8 00 00 00 00 00 00 00    	movq	$0x0, 0xf8(%r13)
10000d073: 41 c7 85 00 01 00 00 00 00 80 3f    	movl	$0x3f800000, 0x100(%r13) ## imm = 0x3F800000
10000d07e: 41 c7 85 44 01 00 00 00 00 00 00    	movl	$0x0, 0x144(%r13)
10000d089: 49 c7 85 3c 01 00 00 00 00 00 00    	movq	$0x0, 0x13c(%r13)
10000d094: 49 c7 85 34 01 00 00 00 00 00 00    	movq	$0x0, 0x134(%r13)
10000d09f: 49 c7 85 2c 01 00 00 00 00 00 00    	movq	$0x0, 0x12c(%r13)
10000d0aa: 49 c7 85 24 01 00 00 00 00 00 00    	movq	$0x0, 0x124(%r13)
10000d0b5: 49 c7 85 1c 01 00 00 00 00 00 00    	movq	$0x0, 0x11c(%r13)
10000d0c0: 49 c7 85 14 01 00 00 00 00 00 00    	movq	$0x0, 0x114(%r13)
10000d0cb: 49 c7 85 0c 01 00 00 00 00 00 00    	movq	$0x0, 0x10c(%r13)
10000d0d6: 49 c7 85 04 01 00 00 00 00 00 00    	movq	$0x0, 0x104(%r13)
10000d0e1: 49 c7 85 48 01 00 00 00 00 80 3f    	movq	$0x3f800000, 0x148(%r13) ## imm = 0x3F800000
10000d0ec: 41 c7 85 50 01 00 00 00 00 80 3f    	movl	$0x3f800000, 0x150(%r13) ## imm = 0x3F800000
10000d0f7: 41 c7 85 64 01 00 00 00 00 00 00    	movl	$0x0, 0x164(%r13)
10000d102: 49 c7 85 5c 01 00 00 00 00 00 00    	movq	$0x0, 0x15c(%r13)
10000d10d: 49 c7 85 54 01 00 00 00 00 00 00    	movq	$0x0, 0x154(%r13)
10000d118: 0f 28 05 31 77 1a 00        	movaps	0x1a7731(%rip), %xmm0   ## 0x1001b4850 <__ZTSNSt3__120__shared_ptr_emplaceI12FragmentViewNS_9allocatorIS1_EEEE+0xa0>
10000d11f: 41 0f 11 85 68 01 00 00     	movups	%xmm0, 0x168(%r13)
10000d127: 41 c7 85 78 01 00 00 00 00 00 00    	movl	$0x0, 0x178(%r13)
10000d132: 41 c7 85 7c 01 00 00 00 00 00 00    	movl	$0x0, 0x17c(%r13)
10000d13d: 41 c7 85 80 01 00 00 00 00 00 00    	movl	$0x0, 0x180(%r13)
10000d148: 49 8b 9d 68 02 00 00        	movq	0x268(%r13), %rbx
10000d14f: 0f 57 c0                    	xorps	%xmm0, %xmm0
10000d152: 41 0f 11 85 60 02 00 00     	movups	%xmm0, 0x260(%r13)
10000d15a: 48 85 db                    	testq	%rbx, %rbx
10000d15d: 74 63                       	je	0x10000d1c2 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x222>
10000d15f: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
10000d166: f0                          	lock
10000d167: 48 0f c1 43 08              	xaddq	%rax, 0x8(%rbx)
10000d16c: 48 85 c0                    	testq	%rax, %rax
10000d16f: 75 51                       	jne	0x10000d1c2 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x222>
10000d171: 48 8b 03                    	movq	(%rbx), %rax
10000d174: 48 89 df                    	movq	%rbx, %rdi
10000d177: f3 0f 11 95 60 ff ff ff     	movss	%xmm2, -0xa0(%rbp)
10000d17f: f3 0f 11 8d 64 ff ff ff     	movss	%xmm1, -0x9c(%rbp)
10000d187: f3 0f 11 9d 58 ff ff ff     	movss	%xmm3, -0xa8(%rbp)
10000d18f: f3 0f 11 a5 5c ff ff ff     	movss	%xmm4, -0xa4(%rbp)
10000d197: ff 50 10                    	callq	*0x10(%rax)
10000d19a: 48 89 df                    	movq	%rbx, %rdi
10000d19d: e8 c2 61 1a 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
10000d1a2: f3 0f 10 a5 5c ff ff ff     	movss	-0xa4(%rbp), %xmm4
10000d1aa: f3 0f 10 9d 58 ff ff ff     	movss	-0xa8(%rbp), %xmm3
10000d1b2: f3 0f 10 8d 64 ff ff ff     	movss	-0x9c(%rbp), %xmm1
10000d1ba: f3 0f 10 95 60 ff ff ff     	movss	-0xa0(%rbp), %xmm2
10000d1c2: 41 c7 85 28 02 00 00 ff ff ff ff    	movl	$0xffffffff, 0x228(%r13) ## imm = 0xFFFFFFFF
10000d1cd: 41 8b 85 c4 00 00 00        	movl	0xc4(%r13), %eax
10000d1d4: 41 89 85 cc 00 00 00        	movl	%eax, 0xcc(%r13)
10000d1db: 41 f6 46 2c 40              	testb	$0x40, 0x2c(%r14)
10000d1e0: 0f 85 38 03 00 00           	jne	0x10000d51e <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x57e>
10000d1e6: 41 f6 46 20 02              	testb	$0x2, 0x20(%r14)
10000d1eb: 0f 85 c3 04 00 00           	jne	0x10000d6b4 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x714>
10000d1f1: 4c 89 b5 c8 fe ff ff        	movq	%r14, -0x138(%rbp)
10000d1f8: f3 0f 58 d1                 	addss	%xmm1, %xmm2
10000d1fc: f3 0f 58 d4                 	addss	%xmm4, %xmm2
10000d200: f3 0f 10 85 68 ff ff ff     	movss	-0x98(%rbp), %xmm0
10000d208: f3 0f 58 85 6c ff ff ff     	addss	-0x94(%rbp), %xmm0
10000d210: f3 0f 58 c3                 	addss	%xmm3, %xmm0
10000d214: f3 0f 11 85 68 ff ff ff     	movss	%xmm0, -0x98(%rbp)
10000d21c: 0f 57 c0                    	xorps	%xmm0, %xmm0
10000d21f: 0f 29 85 70 ff ff ff        	movaps	%xmm0, -0x90(%rbp)
10000d226: c7 45 80 00 00 00 00        	movl	$0x0, -0x80(%rbp)
10000d22d: 49 8b 85 b0 00 00 00        	movq	0xb0(%r13), %rax
10000d234: 8b 40 64                    	movl	0x64(%rax), %eax
10000d237: 85 c0                       	testl	%eax, %eax
10000d239: 0f 8e 79 01 00 00           	jle	0x10000d3b8 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x418>
10000d23f: 48 8d 0d a2 28 23 00        	leaq	0x2328a2(%rip), %rcx    ## 0x10023fae8 <_kLayout>
10000d246: 4c 8b 21                    	movq	(%rcx), %r12
10000d249: 45 31 f6                    	xorl	%r14d, %r14d
10000d24c: bb 08 00 00 00              	movl	$0x8, %ebx
10000d251: 4c 8d bd f0 fe ff ff        	leaq	-0x110(%rbp), %r15
10000d258: f3 0f 11 95 60 ff ff ff     	movss	%xmm2, -0xa0(%rbp)
10000d260: f2 41 0f 10 45 38           	movsd	0x38(%r13), %xmm0
10000d266: f3 41 0f 10 5d 40           	movss	0x40(%r13), %xmm3
10000d26c: f3 0f 5c d8                 	subss	%xmm0, %xmm3
10000d270: 0f 57 c9                    	xorps	%xmm1, %xmm1
10000d273: f3 0f 2a c8                 	cvtsi2ss	%eax, %xmm1
10000d277: f3 0f 5e d9                 	divss	%xmm1, %xmm3
10000d27b: f3 0f 11 9d 6c ff ff ff     	movss	%xmm3, -0x94(%rbp)
10000d283: 66 0f 70 e0 f5              	pshufd	$0xf5, %xmm0, %xmm4     ## xmm4 = xmm0[1,1,3,3]
10000d288: 0f 28 cb                    	movaps	%xmm3, %xmm1
10000d28b: f3 0f 10 15 a1 72 1a 00     	movss	0x1a72a1(%rip), %xmm2   ## 0x1001b4534 <dyld_stub_binder+0x1001b4534>
10000d293: f3 0f 59 ca                 	mulss	%xmm2, %xmm1
10000d297: f3 0f 5c e1                 	subss	%xmm1, %xmm4
10000d29b: 0f 57 ed                    	xorps	%xmm5, %xmm5
10000d29e: f3 41 0f 2a ee              	cvtsi2ss	%r14d, %xmm5
10000d2a3: f3 0f 58 ea                 	addss	%xmm2, %xmm5
10000d2a7: f3 0f 59 eb                 	mulss	%xmm3, %xmm5
10000d2ab: f3 0f 58 e8                 	addss	%xmm0, %xmm5
10000d2af: f3 0f 11 ad 64 ff ff ff     	movss	%xmm5, -0x9c(%rbp)
10000d2b7: f3 41 0f 5c 5c 24 4c        	subss	0x4c(%r12), %xmm3
10000d2be: f3 0f 59 da                 	mulss	%xmm2, %xmm3
10000d2c2: 0f 28 c5                    	movaps	%xmm5, %xmm0
10000d2c5: f3 0f 5c c3                 	subss	%xmm3, %xmm0
10000d2c9: 0f 28 cc                    	movaps	%xmm4, %xmm1
10000d2cc: f3 0f 5c cb                 	subss	%xmm3, %xmm1
10000d2d0: 0f 28 d3                    	movaps	%xmm3, %xmm2
10000d2d3: f3 0f 58 d5                 	addss	%xmm5, %xmm2
10000d2d7: f3 0f 58 dc                 	addss	%xmm4, %xmm3
10000d2db: 4c 89 ff                    	movq	%r15, %rdi
10000d2de: e8 35 5e 1a 00              	callq	0x1001b3118 <dyld_stub_binder+0x1001b3118>
10000d2e3: f3 0f 10 85 6c ff ff ff     	movss	-0x94(%rbp), %xmm0
10000d2eb: f3 0f 59 05 11 72 1a 00     	mulss	0x1a7211(%rip), %xmm0   ## 0x1001b4504 <dyld_stub_binder+0x1001b4504>
10000d2f3: f3 41 0f 5d 44 24 48        	minss	0x48(%r12), %xmm0
10000d2fa: 0f 57 05 af 71 1a 00        	xorps	0x1a71af(%rip), %xmm0   ## 0x1001b44b0 <dyld_stub_binder+0x1001b44b0>
10000d301: c7 45 b8 00 00 00 00        	movl	$0x0, -0x48(%rbp)
10000d308: f3 0f 11 45 bc              	movss	%xmm0, -0x44(%rbp)
10000d30d: 4c 89 ff                    	movq	%r15, %rdi
10000d310: 48 8d 75 b8                 	leaq	-0x48(%rbp), %rsi
10000d314: e8 0b 5e 1a 00              	callq	0x1001b3124 <dyld_stub_binder+0x1001b3124>
10000d319: f3 0f 10 95 60 ff ff ff     	movss	-0xa0(%rbp), %xmm2
10000d321: f3 0f 10 8d 6c ff ff ff     	movss	-0x94(%rbp), %xmm1
10000d329: f3 0f 59 0d e3 71 1a 00     	mulss	0x1a71e3(%rip), %xmm1   ## 0x1001b4514 <dyld_stub_binder+0x1001b4514>
10000d331: f3 41 0f 5d 4c 24 28        	minss	0x28(%r12), %xmm1
10000d338: f3 0f 10 9d 64 ff ff ff     	movss	-0x9c(%rbp), %xmm3
10000d340: 0f 28 c3                    	movaps	%xmm3, %xmm0
10000d343: f3 0f 5c c1                 	subss	%xmm1, %xmm0
10000d347: f3 0f 11 85 f0 fe ff ff     	movss	%xmm0, -0x110(%rbp)
10000d34f: f3 0f 58 cb                 	addss	%xmm3, %xmm1
10000d353: f3 0f 11 8d f8 fe ff ff     	movss	%xmm1, -0x108(%rbp)
10000d35b: f2 0f 10 85 f0 fe ff ff     	movsd	-0x110(%rbp), %xmm0
10000d363: 0f 2e d0                    	ucomiss	%xmm0, %xmm2
10000d366: 72 36                       	jb	0x10000d39e <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x3fe>
10000d368: 0f 2e 95 f8 fe ff ff        	ucomiss	-0x108(%rbp), %xmm2
10000d36f: 77 2d                       	ja	0x10000d39e <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x3fe>
10000d371: f3 0f 16 c0                 	movshdup	%xmm0, %xmm0            ## xmm0 = xmm0[1,1,3,3]
10000d375: f3 0f 10 8d 68 ff ff ff     	movss	-0x98(%rbp), %xmm1
10000d37d: 0f 2e c8                    	ucomiss	%xmm0, %xmm1
10000d380: 72 1c                       	jb	0x10000d39e <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x3fe>
10000d382: f3 41 0f 7e 45 38           	movq	0x38(%r13), %xmm0
10000d388: 66 0f 70 c0 f5              	pshufd	$0xf5, %xmm0, %xmm0     ## xmm0 = xmm0[1,1,3,3]
10000d38d: f3 0f 10 8d 68 ff ff ff     	movss	-0x98(%rbp), %xmm1
10000d395: 0f 2e c8                    	ucomiss	%xmm0, %xmm1
10000d398: 0f 86 6e 07 00 00           	jbe	0x10000db0c <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xb6c>
10000d39e: 49 8b 85 b0 00 00 00        	movq	0xb0(%r13), %rax
10000d3a5: 8b 40 64                    	movl	0x64(%rax), %eax
10000d3a8: 49 ff c6                    	incq	%r14
10000d3ab: 48 83 c3 10                 	addq	$0x10, %rbx
10000d3af: 41 39 c6                    	cmpl	%eax, %r14d
10000d3b2: 0f 8c a8 fe ff ff           	jl	0x10000d260 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x2c0>
10000d3b8: 4d 8d bd c8 00 00 00        	leaq	0xc8(%r13), %r15
10000d3bf: 41 c7 85 c8 00 00 00 ff ff ff ff    	movl	$0xffffffff, 0xc8(%r13) ## imm = 0xFFFFFFFF
10000d3ca: 31 c0                       	xorl	%eax, %eax
10000d3cc: 31 c9                       	xorl	%ecx, %ecx
10000d3ce: 49 89 8d d0 00 00 00        	movq	%rcx, 0xd0(%r13)
10000d3d5: 49 8b 9d d8 00 00 00        	movq	0xd8(%r13), %rbx
10000d3dc: 49 89 85 d8 00 00 00        	movq	%rax, 0xd8(%r13)
10000d3e3: 48 85 db                    	testq	%rbx, %rbx
10000d3e6: 74 16                       	je	0x10000d3fe <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x45e>
10000d3e8: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
10000d3ef: f0                          	lock
10000d3f0: 48 0f c1 43 08              	xaddq	%rax, 0x8(%rbx)
10000d3f5: 48 85 c0                    	testq	%rax, %rax
10000d3f8: 0f 84 ab 03 00 00           	je	0x10000d7a9 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x809>
10000d3fe: 41 8b 07                    	movl	(%r15), %eax
10000d401: 83 f8 ff                    	cmpl	$-0x1, %eax
10000d404: 0f 84 cc 03 00 00           	je	0x10000d7d6 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x836>
10000d40a: 41 39 85 c4 00 00 00        	cmpl	%eax, 0xc4(%r13)
10000d411: 74 64                       	je	0x10000d477 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x4d7>
10000d413: 41 89 85 c4 00 00 00        	movl	%eax, 0xc4(%r13)
10000d41a: 49 8b bd 40 02 00 00        	movq	0x240(%r13), %rdi
10000d421: 48 85 ff                    	testq	%rdi, %rdi
10000d424: 74 49                       	je	0x10000d46f <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x4cf>
10000d426: e8 25 52 ff ff              	callq	0x100002650 <__ZN10SampleView5closeEv>
10000d42b: 49 8b 9d 48 02 00 00        	movq	0x248(%r13), %rbx
10000d432: 0f 57 c0                    	xorps	%xmm0, %xmm0
10000d435: 41 0f 11 85 40 02 00 00     	movups	%xmm0, 0x240(%r13)
10000d43d: 48 85 db                    	testq	%rbx, %rbx
10000d440: 74 23                       	je	0x10000d465 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x4c5>
10000d442: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
10000d449: f0                          	lock
10000d44a: 48 0f c1 43 08              	xaddq	%rax, 0x8(%rbx)
10000d44f: 48 85 c0                    	testq	%rax, %rax
10000d452: 75 11                       	jne	0x10000d465 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x4c5>
10000d454: 48 8b 03                    	movq	(%rbx), %rax
10000d457: 48 89 df                    	movq	%rbx, %rdi
10000d45a: ff 50 10                    	callq	*0x10(%rax)
10000d45d: 48 89 df                    	movq	%rbx, %rdi
10000d460: e8 ff 5e 1a 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
10000d465: 41 83 bd c4 00 00 00 ff     	cmpl	$-0x1, 0xc4(%r13)
10000d46d: 74 08                       	je	0x10000d477 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x4d7>
10000d46f: 4c 89 ef                    	movq	%r13, %rdi
10000d472: e8 09 43 00 00              	callq	0x100011780 <__ZN7GelView14openSampleViewEv>
10000d477: 49 8b 8d 88 02 00 00        	movq	0x288(%r13), %rcx
10000d47e: 48 8b 01                    	movq	(%rcx), %rax
10000d481: 4c 8b 79 08                 	movq	0x8(%rcx), %r15
10000d485: 4d 85 ff                    	testq	%r15, %r15
10000d488: 74 05                       	je	0x10000d48f <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x4ef>
10000d48a: f0                          	lock
10000d48b: 49 ff 47 08                 	incq	0x8(%r15)
10000d48f: 49 63 95 c8 00 00 00        	movslq	0xc8(%r13), %rdx
10000d496: 31 c9                       	xorl	%ecx, %ecx
10000d498: 48 85 d2                    	testq	%rdx, %rdx
10000d49b: 0f 88 eb 07 00 00           	js	0x10000dc8c <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xcec>
10000d4a1: 49 8b bd b0 00 00 00        	movq	0xb0(%r13), %rdi
10000d4a8: 48 85 ff                    	testq	%rdi, %rdi
10000d4ab: 0f 84 db 07 00 00           	je	0x10000dc8c <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xcec>
10000d4b1: 48 8b 37                    	movq	(%rdi), %rsi
10000d4b4: 48 8b 4f 08                 	movq	0x8(%rdi), %rcx
10000d4b8: 48 29 f1                    	subq	%rsi, %rcx
10000d4bb: 48 c1 f9 04                 	sarq	$0x4, %rcx
10000d4bf: 48 39 d1                    	cmpq	%rdx, %rcx
10000d4c2: 0f 86 c2 07 00 00           	jbe	0x10000dc8a <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xcea>
10000d4c8: 48 c1 e2 04                 	shlq	$0x4, %rdx
10000d4cc: 48 8b 0c 16                 	movq	(%rsi,%rdx), %rcx
10000d4d0: 4c 8b 74 16 08              	movq	0x8(%rsi,%rdx), %r14
10000d4d5: 4d 85 f6                    	testq	%r14, %r14
10000d4d8: 0f 84 ae 07 00 00           	je	0x10000dc8c <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xcec>
10000d4de: f0                          	lock
10000d4df: 49 ff 46 08                 	incq	0x8(%r14)
10000d4e3: 48 39 c8                    	cmpq	%rcx, %rax
10000d4e6: 0f 95 c3                    	setne	%bl
10000d4e9: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
10000d4f0: f0                          	lock
10000d4f1: 49 0f c1 46 08              	xaddq	%rax, 0x8(%r14)
10000d4f6: 48 85 c0                    	testq	%rax, %rax
10000d4f9: 0f 85 93 07 00 00           	jne	0x10000dc92 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xcf2>
10000d4ff: 49 8b 06                    	movq	(%r14), %rax
10000d502: 4c 89 f7                    	movq	%r14, %rdi
10000d505: ff 50 10                    	callq	*0x10(%rax)
10000d508: 4c 89 f7                    	movq	%r14, %rdi
10000d50b: e8 54 5e 1a 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
10000d510: 4d 85 ff                    	testq	%r15, %r15
10000d513: 0f 85 7e 07 00 00           	jne	0x10000dc97 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xcf7>
10000d519: e9 9c 07 00 00              	jmp	0x10000dcba <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xd1a>
10000d51e: 49 8b bd 50 02 00 00        	movq	0x250(%r13), %rdi
10000d525: 48 85 ff                    	testq	%rdi, %rdi
10000d528: 74 3f                       	je	0x10000d569 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x5c9>
10000d52a: e8 21 51 ff ff              	callq	0x100002650 <__ZN10SampleView5closeEv>
10000d52f: 49 8b 9d 58 02 00 00        	movq	0x258(%r13), %rbx
10000d536: 0f 57 c0                    	xorps	%xmm0, %xmm0
10000d539: 41 0f 11 85 50 02 00 00     	movups	%xmm0, 0x250(%r13)
10000d541: 48 85 db                    	testq	%rbx, %rbx
10000d544: 74 23                       	je	0x10000d569 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x5c9>
10000d546: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
10000d54d: f0                          	lock
10000d54e: 48 0f c1 43 08              	xaddq	%rax, 0x8(%rbx)
10000d553: 48 85 c0                    	testq	%rax, %rax
10000d556: 75 11                       	jne	0x10000d569 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x5c9>
10000d558: 48 8b 03                    	movq	(%rbx), %rax
10000d55b: 48 89 df                    	movq	%rbx, %rdi
10000d55e: ff 50 10                    	callq	*0x10(%rax)
10000d561: 48 89 df                    	movq	%rbx, %rdi
10000d564: e8 fb 5d 1a 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
10000d569: 0f 57 c0                    	xorps	%xmm0, %xmm0
10000d56c: f3 41 0f 2a 46 24           	cvtsi2ssl	0x24(%r14), %xmm0
10000d572: f3 0f 11 85 64 ff ff ff     	movss	%xmm0, -0x9c(%rbp)
10000d57a: 0f 57 c0                    	xorps	%xmm0, %xmm0
10000d57d: f3 41 0f 2a 46 28           	cvtsi2ssl	0x28(%r14), %xmm0
10000d583: f3 0f 11 85 6c ff ff ff     	movss	%xmm0, -0x94(%rbp)
10000d58b: 48 8d bd f0 fe ff ff        	leaq	-0x110(%rbp), %rdi
10000d592: 4c 89 ee                    	movq	%r13, %rsi
10000d595: e8 66 f0 05 00              	callq	0x10006c600 <__ZNK4View20getRootToChildMatrixEv>
10000d59a: f3 0f 10 85 f0 fe ff ff     	movss	-0x110(%rbp), %xmm0
10000d5a2: f3 0f 10 8d 64 ff ff ff     	movss	-0x9c(%rbp), %xmm1
10000d5aa: f3 0f 59 c1                 	mulss	%xmm1, %xmm0
10000d5ae: f3 0f 59 8d f4 fe ff ff     	mulss	-0x10c(%rbp), %xmm1
10000d5b6: 0f 28 d9                    	movaps	%xmm1, %xmm3
10000d5b9: f3 0f 10 8d 00 ff ff ff     	movss	-0x100(%rbp), %xmm1
10000d5c1: f3 0f 10 95 6c ff ff ff     	movss	-0x94(%rbp), %xmm2
10000d5c9: f3 0f 59 ca                 	mulss	%xmm2, %xmm1
10000d5cd: f3 0f 58 c8                 	addss	%xmm0, %xmm1
10000d5d1: f3 0f 59 95 04 ff ff ff     	mulss	-0xfc(%rbp), %xmm2
10000d5d9: f3 0f 58 d3                 	addss	%xmm3, %xmm2
10000d5dd: f3 0f 58 8d 20 ff ff ff     	addss	-0xe0(%rbp), %xmm1
10000d5e5: f3 0f 58 95 24 ff ff ff     	addss	-0xdc(%rbp), %xmm2
10000d5ed: f3 0f 11 8d b8 fe ff ff     	movss	%xmm1, -0x148(%rbp)
10000d5f5: f3 0f 11 95 bc fe ff ff     	movss	%xmm2, -0x144(%rbp)
10000d5fd: 48 8d bd f0 fe ff ff        	leaq	-0x110(%rbp), %rdi
10000d604: 48 8d 95 b8 fe ff ff        	leaq	-0x148(%rbp), %rdx
10000d60b: 4c 89 ee                    	movq	%r13, %rsi
10000d60e: e8 cd 10 00 00              	callq	0x10000e6e0 <__ZN7GelView8addLoupeEN3glm5tvec2IfLNS0_9precisionE0EEE>
10000d613: 0f 28 85 f0 fe ff ff        	movaps	-0x110(%rbp), %xmm0
10000d61a: 0f 57 c9                    	xorps	%xmm1, %xmm1
10000d61d: 0f 29 8d f0 fe ff ff        	movaps	%xmm1, -0x110(%rbp)
10000d624: 49 8b 9d 68 02 00 00        	movq	0x268(%r13), %rbx
10000d62b: 41 0f 11 85 60 02 00 00     	movups	%xmm0, 0x260(%r13)
10000d633: 48 85 db                    	testq	%rbx, %rbx
10000d636: 74 23                       	je	0x10000d65b <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x6bb>
10000d638: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
10000d63f: f0                          	lock
10000d640: 48 0f c1 43 08              	xaddq	%rax, 0x8(%rbx)
10000d645: 48 85 c0                    	testq	%rax, %rax
10000d648: 75 11                       	jne	0x10000d65b <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x6bb>
10000d64a: 48 8b 03                    	movq	(%rbx), %rax
10000d64d: 48 89 df                    	movq	%rbx, %rdi
10000d650: ff 50 10                    	callq	*0x10(%rax)
10000d653: 48 89 df                    	movq	%rbx, %rdi
10000d656: e8 09 5d 1a 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
10000d65b: 48 8b 9d f8 fe ff ff        	movq	-0x108(%rbp), %rbx
10000d662: 48 85 db                    	testq	%rbx, %rbx
10000d665: 74 23                       	je	0x10000d68a <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x6ea>
10000d667: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
10000d66e: f0                          	lock
10000d66f: 48 0f c1 43 08              	xaddq	%rax, 0x8(%rbx)
10000d674: 48 85 c0                    	testq	%rax, %rax
10000d677: 75 11                       	jne	0x10000d68a <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x6ea>
10000d679: 48 8b 03                    	movq	(%rbx), %rax
10000d67c: 48 89 df                    	movq	%rbx, %rdi
10000d67f: ff 50 10                    	callq	*0x10(%rax)
10000d682: 48 89 df                    	movq	%rbx, %rdi
10000d685: e8 da 5c 1a 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
10000d68a: 49 8b 85 60 02 00 00        	movq	0x260(%r13), %rax
10000d691: 48 85 c0                    	testq	%rax, %rax
10000d694: 0f 84 60 0f 00 00           	je	0x10000e5fa <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x165a>
10000d69a: c7 80 a4 00 00 00 03 00 00 00       	movl	$0x3, 0xa4(%rax)
10000d6a4: 41 c7 85 c0 00 00 00 02 00 00 00    	movl	$0x2, 0xc0(%r13)
10000d6af: e9 46 0f 00 00              	jmp	0x10000e5fa <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x165a>
10000d6b4: 0f 57 c0                    	xorps	%xmm0, %xmm0
10000d6b7: f3 41 0f 2a 46 24           	cvtsi2ssl	0x24(%r14), %xmm0
10000d6bd: f3 0f 11 85 c0 fe ff ff     	movss	%xmm0, -0x140(%rbp)
10000d6c5: 0f 57 c0                    	xorps	%xmm0, %xmm0
10000d6c8: f3 41 0f 2a 46 28           	cvtsi2ssl	0x28(%r14), %xmm0
10000d6ce: f3 0f 11 85 c4 fe ff ff     	movss	%xmm0, -0x13c(%rbp)
10000d6d6: 48 8d b5 c0 fe ff ff        	leaq	-0x140(%rbp), %rsi
10000d6dd: 4c 89 ef                    	movq	%r13, %rdi
10000d6e0: e8 cb 11 00 00              	callq	0x10000e8b0 <__ZN7GelView16newFragmentAtPosEN3glm5tvec2IfLNS0_9precisionE0EEE>
10000d6e5: 84 c0                       	testb	%al, %al
10000d6e7: 0f 84 0d 0f 00 00           	je	0x10000e5fa <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x165a>
10000d6ed: 4d 8d b5 e0 00 00 00        	leaq	0xe0(%r13), %r14
10000d6f4: 49 8b 9d b0 00 00 00        	movq	0xb0(%r13), %rbx
10000d6fb: 45 8b bd c4 00 00 00        	movl	0xc4(%r13), %r15d
10000d702: 49 8b bd 40 02 00 00        	movq	0x240(%r13), %rdi
10000d709: e8 12 74 ff ff              	callq	0x100004b20 <__ZNK10SampleView19getSelectedFragmentEv>
10000d70e: 48 89 df                    	movq	%rbx, %rdi
10000d711: 44 89 fe                    	movl	%r15d, %esi
10000d714: 89 c2                       	movl	%eax, %edx
10000d716: e8 65 dc 00 00              	callq	0x10001b380 <__ZNK3Gel24getSlowestBandInFragmentEii>
10000d71b: 48 89 c3                    	movq	%rax, %rbx
10000d71e: 49 8d bd 84 01 00 00        	leaq	0x184(%r13), %rdi
10000d725: ba a4 00 00 00              	movl	$0xa4, %edx
10000d72a: 48 89 de                    	movq	%rbx, %rsi
10000d72d: e8 78 5e 1a 00              	callq	0x1001b35aa <dyld_stub_binder+0x1001b35aa>
10000d732: ba a4 00 00 00              	movl	$0xa4, %edx
10000d737: 4c 89 f7                    	movq	%r14, %rdi
10000d73a: 48 89 de                    	movq	%rbx, %rsi
10000d73d: e8 6e 5e 1a 00              	callq	0x1001b35b0 <dyld_stub_binder+0x1001b35b0>
10000d742: 49 63 8d c4 00 00 00        	movslq	0xc4(%r13), %rcx
10000d749: 31 c0                       	xorl	%eax, %eax
10000d74b: 48 85 c9                    	testq	%rcx, %rcx
10000d74e: 0f 88 e0 04 00 00           	js	0x10000dc34 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xc94>
10000d754: 49 8b b5 b0 00 00 00        	movq	0xb0(%r13), %rsi
10000d75b: 48 85 f6                    	testq	%rsi, %rsi
10000d75e: 41 be 00 00 00 00           	movl	$0x0, %r14d
10000d764: 0f 84 cd 04 00 00           	je	0x10000dc37 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xc97>
10000d76a: 48 8b 16                    	movq	(%rsi), %rdx
10000d76d: 48 8b 76 08                 	movq	0x8(%rsi), %rsi
10000d771: 48 29 d6                    	subq	%rdx, %rsi
10000d774: 48 c1 fe 04                 	sarq	$0x4, %rsi
10000d778: 31 c0                       	xorl	%eax, %eax
10000d77a: 48 39 ce                    	cmpq	%rcx, %rsi
10000d77d: 41 be 00 00 00 00           	movl	$0x0, %r14d
10000d783: 0f 86 ae 04 00 00           	jbe	0x10000dc37 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xc97>
10000d789: 48 c1 e1 04                 	shlq	$0x4, %rcx
10000d78d: 48 8b 04 0a                 	movq	(%rdx,%rcx), %rax
10000d791: 4c 8b 74 0a 08              	movq	0x8(%rdx,%rcx), %r14
10000d796: 4d 85 f6                    	testq	%r14, %r14
10000d799: 0f 84 95 04 00 00           	je	0x10000dc34 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xc94>
10000d79f: f0                          	lock
10000d7a0: 49 ff 46 08                 	incq	0x8(%r14)
10000d7a4: e9 8e 04 00 00              	jmp	0x10000dc37 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xc97>
10000d7a9: 48 8b 03                    	movq	(%rbx), %rax
10000d7ac: 48 89 df                    	movq	%rbx, %rdi
10000d7af: f3 0f 11 95 60 ff ff ff     	movss	%xmm2, -0xa0(%rbp)
10000d7b7: ff 50 10                    	callq	*0x10(%rax)
10000d7ba: 48 89 df                    	movq	%rbx, %rdi
10000d7bd: e8 a2 5b 1a 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
10000d7c2: f3 0f 10 95 60 ff ff ff     	movss	-0xa0(%rbp), %xmm2
10000d7ca: 41 8b 07                    	movl	(%r15), %eax
10000d7cd: 83 f8 ff                    	cmpl	$-0x1, %eax
10000d7d0: 0f 85 34 fc ff ff           	jne	0x10000d40a <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x46a>
10000d7d6: f3 0f 11 95 b0 fe ff ff     	movss	%xmm2, -0x150(%rbp)
10000d7de: f3 0f 10 85 68 ff ff ff     	movss	-0x98(%rbp), %xmm0
10000d7e6: f3 0f 11 85 b4 fe ff ff     	movss	%xmm0, -0x14c(%rbp)
10000d7ee: 48 8d bd f0 fe ff ff        	leaq	-0x110(%rbp), %rdi
10000d7f5: 48 8d 95 b0 fe ff ff        	leaq	-0x150(%rbp), %rdx
10000d7fc: 4c 89 ee                    	movq	%r13, %rsi
10000d7ff: e8 fc 6a 00 00              	callq	0x100014300 <__ZNK7GelView9pickBandsEN3glm5tvec2IfLNS0_9precisionE0EEE>
10000d804: 48 8b bd f0 fe ff ff        	movq	-0x110(%rbp), %rdi
10000d80b: 48 8b 85 f8 fe ff ff        	movq	-0x108(%rbp), %rax
10000d812: 48 89 c2                    	movq	%rax, %rdx
10000d815: 48 39 c7                    	cmpq	%rax, %rdi
10000d818: 0f 84 19 06 00 00           	je	0x10000de37 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xe97>
10000d81e: 48 89 bd e0 fe ff ff        	movq	%rdi, -0x120(%rbp)
10000d825: 48 8d 8f a0 00 00 00        	leaq	0xa0(%rdi), %rcx
10000d82c: 44 0f 28 15 4c 70 1a 00     	movaps	0x1a704c(%rip), %xmm10  ## 0x1001b4880 <__ZTSNSt3__120__shared_ptr_emplaceI12FragmentViewNS_9allocatorIS1_EEEE+0xd0>
10000d834: 44 0f 28 2d 54 70 1a 00     	movaps	0x1a7054(%rip), %xmm13  ## 0x1001b4890 <__ZTSNSt3__120__shared_ptr_emplaceI12FragmentViewNS_9allocatorIS1_EEEE+0xe0>
10000d83c: 44 0f 28 0d ec 6f 1a 00     	movaps	0x1a6fec(%rip), %xmm9   ## 0x1001b4830 <__ZTSNSt3__120__shared_ptr_emplaceI12FragmentViewNS_9allocatorIS1_EEEE+0x80>
10000d844: f3 44 0f 10 05 c3 6f 1a 00  	movss	0x1a6fc3(%rip), %xmm8   ## 0x1001b4810 <__ZTSNSt3__120__shared_ptr_emplaceI12FragmentViewNS_9allocatorIS1_EEEE+0x60>
10000d84d: c7 85 3c ff ff ff 01 00 00 00       	movl	$0x1, -0xc4(%rbp)
10000d857: 31 db                       	xorl	%ebx, %ebx
10000d859: 45 0f 57 e4                 	xorps	%xmm12, %xmm12
10000d85d: f3 44 0f 10 1d 9a 6c 1a 00  	movss	0x1a6c9a(%rip), %xmm11  ## 0x1001b4500 <dyld_stub_binder+0x1001b4500>
10000d866: c7 85 6c ff ff ff 00 00 00 00       	movl	$0x0, -0x94(%rbp)
10000d870: c7 85 64 ff ff ff 00 00 00 00       	movl	$0x0, -0x9c(%rbp)
10000d87a: f3 44 0f 11 9d 68 ff ff ff  	movss	%xmm11, -0x98(%rbp)
10000d883: 0f 57 c0                    	xorps	%xmm0, %xmm0
10000d886: f3 0f 11 85 60 ff ff ff     	movss	%xmm0, -0xa0(%rbp)
10000d88e: c7 85 58 ff ff ff 00 00 00 00       	movl	$0x0, -0xa8(%rbp)
10000d898: c7 85 5c ff ff ff 00 00 00 00       	movl	$0x0, -0xa4(%rbp)
10000d8a2: 45 0f 57 ff                 	xorps	%xmm15, %xmm15
10000d8a6: c7 85 40 ff ff ff 00 00 00 00       	movl	$0x0, -0xc0(%rbp)
10000d8b0: 48 89 d7                    	movq	%rdx, %rdi
10000d8b3: 66 66 66 66 2e 0f 1f 84 00 00 00 00 00      	nopw	%cs:(%rax,%rax)
10000d8c0: 0f 10 89 60 ff ff ff        	movups	-0xa0(%rcx), %xmm1
10000d8c7: 44 8b 89 70 ff ff ff        	movl	-0x90(%rcx), %r9d
10000d8ce: 44 8b 91 74 ff ff ff        	movl	-0x8c(%rcx), %r10d
10000d8d5: 44 8b 99 78 ff ff ff        	movl	-0x88(%rcx), %r11d
10000d8dc: f3 0f 10 91 7c ff ff ff     	movss	-0x84(%rcx), %xmm2
10000d8e4: f3 0f 10 59 80              	movss	-0x80(%rcx), %xmm3
10000d8e9: 44 8b 79 84                 	movl	-0x7c(%rcx), %r15d
10000d8ed: 44 8b 41 88                 	movl	-0x78(%rcx), %r8d
10000d8f1: 8b 41 8c                    	movl	-0x74(%rcx), %eax
10000d8f4: 8b 51 a0                    	movl	-0x60(%rcx), %edx
10000d8f7: 89 55 c8                    	movl	%edx, -0x38(%rbp)
10000d8fa: 48 8b 51 98                 	movq	-0x68(%rcx), %rdx
10000d8fe: 48 89 55 c0                 	movq	%rdx, -0x40(%rbp)
10000d902: 48 8b 51 90                 	movq	-0x70(%rcx), %rdx
10000d906: 48 89 55 b8                 	movq	%rdx, -0x48(%rbp)
10000d90a: f3 0f 10 69 a4              	movss	-0x5c(%rcx), %xmm5
10000d90f: 44 8b 61 a8                 	movl	-0x58(%rcx), %r12d
10000d913: f3 0f 10 71 ac              	movss	-0x54(%rcx), %xmm6
10000d918: 48 8b 51 b8                 	movq	-0x48(%rcx), %rdx
10000d91c: 48 89 95 78 fe ff ff        	movq	%rdx, -0x188(%rbp)
10000d923: 48 8b 51 b0                 	movq	-0x50(%rcx), %rdx
10000d927: 48 89 95 70 fe ff ff        	movq	%rdx, -0x190(%rbp)
10000d92e: f3 0f 10 41 c0              	movss	-0x40(%rcx), %xmm0
10000d933: 0f 10 61 c4                 	movups	-0x3c(%rcx), %xmm4
10000d937: 48 8d 51 d4                 	leaq	-0x2c(%rcx), %rdx
10000d93b: 44 8b 71 e4                 	movl	-0x1c(%rcx), %r14d
10000d93f: 44 89 75 b0                 	movl	%r14d, -0x50(%rbp)
10000d943: 48 8b 71 dc                 	movq	-0x24(%rcx), %rsi
10000d947: 48 89 75 a8                 	movq	%rsi, -0x58(%rbp)
10000d94b: 48 8b 71 d4                 	movq	-0x2c(%rcx), %rsi
10000d94f: 48 89 75 a0                 	movq	%rsi, -0x60(%rbp)
10000d953: 0f 28 fe                    	movaps	%xmm6, %xmm7
10000d956: f3 0f 5c fd                 	subss	%xmm5, %xmm7
10000d95a: 41 0f 2e f8                 	ucomiss	%xmm8, %xmm7
10000d95e: 0f 83 bf 00 00 00           	jae	0x10000da23 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xa83>
10000d964: 8b 31                       	movl	(%rcx), %esi
10000d966: 89 b5 40 ff ff ff           	movl	%esi, -0xc0(%rbp)
10000d96c: f3 44 0f 10 79 fc           	movss	-0x4(%rcx), %xmm15
10000d972: 44 0f 10 51 ec              	movups	-0x14(%rcx), %xmm10
10000d977: f3 44 0f 10 59 e8           	movss	-0x18(%rcx), %xmm11
10000d97d: 8b 75 c8                    	movl	-0x38(%rbp), %esi
10000d980: 89 75 98                    	movl	%esi, -0x68(%rbp)
10000d983: 48 8b 75 b8                 	movq	-0x48(%rbp), %rsi
10000d987: 48 8b 5d c0                 	movq	-0x40(%rbp), %rbx
10000d98b: 48 89 5d 90                 	movq	%rbx, -0x70(%rbp)
10000d98f: 48 89 75 88                 	movq	%rsi, -0x78(%rbp)
10000d993: 48 8b b5 70 fe ff ff        	movq	-0x190(%rbp), %rsi
10000d99a: 48 8b 9d 78 fe ff ff        	movq	-0x188(%rbp), %rbx
10000d9a1: 48 89 b5 d0 fe ff ff        	movq	%rsi, -0x130(%rbp)
10000d9a8: 48 89 9d d8 fe ff ff        	movq	%rbx, -0x128(%rbp)
10000d9af: 48 8b 75 a0                 	movq	-0x60(%rbp), %rsi
10000d9b3: 48 8b 5d a8                 	movq	-0x58(%rbp), %rbx
10000d9b7: 48 89 b5 70 ff ff ff        	movq	%rsi, -0x90(%rbp)
10000d9be: 48 89 9d 78 ff ff ff        	movq	%rbx, -0x88(%rbp)
10000d9c5: 8b 75 b0                    	movl	-0x50(%rbp), %esi
10000d9c8: 89 75 80                    	movl	%esi, -0x80(%rbp)
10000d9cb: 44 0f 28 e0                 	movaps	%xmm0, %xmm12
10000d9cf: 44 0f 28 f6                 	movaps	%xmm6, %xmm14
10000d9d3: 44 89 a5 54 ff ff ff        	movl	%r12d, -0xac(%rbp)
10000d9da: f3 0f 11 ad 38 ff ff ff     	movss	%xmm5, -0xc8(%rbp)
10000d9e2: 89 c3                       	movl	%eax, %ebx
10000d9e4: 44 89 85 6c ff ff ff        	movl	%r8d, -0x94(%rbp)
10000d9eb: 44 89 bd 64 ff ff ff        	movl	%r15d, -0x9c(%rbp)
10000d9f2: f3 0f 11 9d 68 ff ff ff     	movss	%xmm3, -0x98(%rbp)
10000d9fa: f3 0f 11 95 60 ff ff ff     	movss	%xmm2, -0xa0(%rbp)
10000da02: 44 89 9d 58 ff ff ff        	movl	%r11d, -0xa8(%rbp)
10000da09: 44 89 95 5c ff ff ff        	movl	%r10d, -0xa4(%rbp)
10000da10: 44 89 8d 3c ff ff ff        	movl	%r9d, -0xc4(%rbp)
10000da17: 44 0f 28 c7                 	movaps	%xmm7, %xmm8
10000da1b: 44 0f 28 c9                 	movaps	%xmm1, %xmm9
10000da1f: 44 0f 28 ec                 	movaps	%xmm4, %xmm13
10000da23: 48 81 c1 a4 00 00 00        	addq	$0xa4, %rcx
10000da2a: 48 83 c2 30                 	addq	$0x30, %rdx
10000da2e: 48 39 fa                    	cmpq	%rdi, %rdx
10000da31: 0f 85 89 fe ff ff           	jne	0x10000d8c0 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x920>
10000da37: 41 89 df                    	movl	%ebx, %r15d
10000da3a: 41 b6 01                    	movb	$0x1, %r14b
10000da3d: 44 8b a5 54 ff ff ff        	movl	-0xac(%rbp), %r12d
10000da44: 48 8b bd e0 fe ff ff        	movq	-0x120(%rbp), %rdi
10000da4b: 48 85 ff                    	testq	%rdi, %rdi
10000da4e: 48 8b 9d c8 fe ff ff        	movq	-0x138(%rbp), %rbx
10000da55: 0f 84 84 00 00 00           	je	0x10000dadf <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xb3f>
10000da5b: 48 89 bd f8 fe ff ff        	movq	%rdi, -0x108(%rbp)
10000da62: 44 0f 29 8d e0 fe ff ff     	movaps	%xmm9, -0x120(%rbp)
10000da6a: 44 0f 29 95 80 fe ff ff     	movaps	%xmm10, -0x180(%rbp)
10000da72: f3 44 0f 11 9d 44 ff ff ff  	movss	%xmm11, -0xbc(%rbp)
10000da7b: f3 44 0f 11 a5 48 ff ff ff  	movss	%xmm12, -0xb8(%rbp)
10000da84: 44 0f 29 ad 90 fe ff ff     	movaps	%xmm13, -0x170(%rbp)
10000da8c: f3 44 0f 11 b5 4c ff ff ff  	movss	%xmm14, -0xb4(%rbp)
10000da95: f3 44 0f 11 bd 50 ff ff ff  	movss	%xmm15, -0xb0(%rbp)
10000da9e: e8 87 59 1a 00              	callq	0x1001b342a <dyld_stub_binder+0x1001b342a>
10000daa3: f3 44 0f 10 bd 50 ff ff ff  	movss	-0xb0(%rbp), %xmm15
10000daac: f3 44 0f 10 b5 4c ff ff ff  	movss	-0xb4(%rbp), %xmm14
10000dab5: 44 0f 28 ad 90 fe ff ff     	movaps	-0x170(%rbp), %xmm13
10000dabd: f3 44 0f 10 a5 48 ff ff ff  	movss	-0xb8(%rbp), %xmm12
10000dac6: f3 44 0f 10 9d 44 ff ff ff  	movss	-0xbc(%rbp), %xmm11
10000dacf: 44 0f 28 95 80 fe ff ff     	movaps	-0x180(%rbp), %xmm10
10000dad7: 44 0f 28 8d e0 fe ff ff     	movaps	-0x120(%rbp), %xmm9
10000dadf: 45 84 f6                    	testb	%r14b, %r14b
10000dae2: 0f 84 80 00 00 00           	je	0x10000db68 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xbc8>
10000dae8: f6 43 2c 10                 	testb	$0x10, 0x2c(%rbx)
10000daec: 0f 85 d9 03 00 00           	jne	0x10000decb <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xf2b>
10000daf2: 44 89 a5 54 ff ff ff        	movl	%r12d, -0xac(%rbp)
10000daf9: 44 8b b5 3c ff ff ff        	movl	-0xc4(%rbp), %r14d
10000db00: 44 8b a5 40 ff ff ff        	movl	-0xc0(%rbp), %r12d
10000db07: e9 16 08 00 00              	jmp	0x10000e322 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x1382>
10000db0c: 4d 8d bd c8 00 00 00        	leaq	0xc8(%r13), %r15
10000db13: 45 89 b5 c8 00 00 00        	movl	%r14d, 0xc8(%r13)
10000db1a: 31 c0                       	xorl	%eax, %eax
10000db1c: 45 85 f6                    	testl	%r14d, %r14d
10000db1f: 0f 88 a7 f8 ff ff           	js	0x10000d3cc <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x42c>
10000db25: 49 8b 8d b0 00 00 00        	movq	0xb0(%r13), %rcx
10000db2c: 48 85 c9                    	testq	%rcx, %rcx
10000db2f: 0f 84 97 f8 ff ff           	je	0x10000d3cc <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x42c>
10000db35: 48 8b 01                    	movq	(%rcx), %rax
10000db38: 48 8b 49 08                 	movq	0x8(%rcx), %rcx
10000db3c: 48 29 c1                    	subq	%rax, %rcx
10000db3f: 48 c1 f9 04                 	sarq	$0x4, %rcx
10000db43: 4c 39 f1                    	cmpq	%r14, %rcx
10000db46: 0f 86 7e f8 ff ff           	jbe	0x10000d3ca <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x42a>
10000db4c: 48 8b 4c 18 f8              	movq	-0x8(%rax,%rbx), %rcx
10000db51: 48 8b 04 18                 	movq	(%rax,%rbx), %rax
10000db55: 48 85 c0                    	testq	%rax, %rax
10000db58: 0f 84 70 f8 ff ff           	je	0x10000d3ce <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x42e>
10000db5e: f0                          	lock
10000db5f: 48 ff 40 08                 	incq	0x8(%rax)
10000db63: e9 66 f8 ff ff              	jmp	0x10000d3ce <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x42e>
10000db68: 0f 57 db                    	xorps	%xmm3, %xmm3
10000db6b: f3 0f 2a 5b 24              	cvtsi2ssl	0x24(%rbx), %xmm3
10000db70: f2 41 0f 10 45 28           	movsd	0x28(%r13), %xmm0
10000db76: 0f 2e c3                    	ucomiss	%xmm3, %xmm0
10000db79: 0f 87 9e 04 00 00           	ja	0x10000e01d <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x107d>
10000db7f: f2 41 0f 10 4d 30           	movsd	0x30(%r13), %xmm1
10000db85: 0f 2e cb                    	ucomiss	%xmm3, %xmm1
10000db88: 0f 82 8f 04 00 00           	jb	0x10000e01d <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x107d>
10000db8e: 0f 57 e4                    	xorps	%xmm4, %xmm4
10000db91: f3 0f 2a 63 28              	cvtsi2ssl	0x28(%rbx), %xmm4
10000db96: f3 0f 16 d0                 	movshdup	%xmm0, %xmm2            ## xmm2 = xmm0[1,1,3,3]
10000db9a: 0f 2e d4                    	ucomiss	%xmm4, %xmm2
10000db9d: 0f 87 7a 04 00 00           	ja	0x10000e01d <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x107d>
10000dba3: f3 0f 16 d1                 	movshdup	%xmm1, %xmm2            ## xmm2 = xmm1[1,1,3,3]
10000dba7: 0f 2e d4                    	ucomiss	%xmm4, %xmm2
10000dbaa: 0f 82 6d 04 00 00           	jb	0x10000e01d <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x107d>
10000dbb0: f2 41 0f 10 55 38           	movsd	0x38(%r13), %xmm2
10000dbb6: f3 0f 11 9d 6c ff ff ff     	movss	%xmm3, -0x94(%rbp)
10000dbbe: f2 41 0f 10 5d 40           	movsd	0x40(%r13), %xmm3
10000dbc4: 48 8d bd f0 fe ff ff        	leaq	-0x110(%rbp), %rdi
10000dbcb: f3 0f 11 a5 64 ff ff ff     	movss	%xmm4, -0x9c(%rbp)
10000dbd3: e8 98 e7 05 00              	callq	0x10006c370 <__Z22getRectMappingAsMatrixN6cinder5RectTIfEES1_>
10000dbd8: f3 0f 10 85 6c ff ff ff     	movss	-0x94(%rbp), %xmm0
10000dbe0: f3 0f 59 85 f0 fe ff ff     	mulss	-0x110(%rbp), %xmm0
10000dbe8: f3 0f 10 8d 64 ff ff ff     	movss	-0x9c(%rbp), %xmm1
10000dbf0: f3 0f 59 8d 00 ff ff ff     	mulss	-0x100(%rbp), %xmm1
10000dbf8: f3 0f 58 c8                 	addss	%xmm0, %xmm1
10000dbfc: f3 0f 58 8d 20 ff ff ff     	addss	-0xe0(%rbp), %xmm1
10000dc04: 49 8b 85 b0 00 00 00        	movq	0xb0(%r13), %rax
10000dc0b: f3 0f 5e 48 60              	divss	0x60(%rax), %xmm1
10000dc10: f3 0f 2c c9                 	cvttss2si	%xmm1, %ecx
10000dc14: 8b 58 64                    	movl	0x64(%rax), %ebx
10000dc17: ff cb                       	decl	%ebx
10000dc19: 39 cb                       	cmpl	%ecx, %ebx
10000dc1b: 0f 4f d9                    	cmovgl	%ecx, %ebx
10000dc1e: 85 c9                       	testl	%ecx, %ecx
10000dc20: 0f 88 11 03 00 00           	js	0x10000df37 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xf97>
10000dc26: 83 fb ff                    	cmpl	$-0x1, %ebx
10000dc29: 0f 85 0a 03 00 00           	jne	0x10000df39 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xf99>
10000dc2f: e9 e9 03 00 00              	jmp	0x10000e01d <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x107d>
10000dc34: 45 31 f6                    	xorl	%r14d, %r14d
10000dc37: 48 8b 58 08                 	movq	0x8(%rax), %rbx
10000dc3b: 48 2b 18                    	subq	(%rax), %rbx
10000dc3e: 4d 85 f6                    	testq	%r14, %r14
10000dc41: 74 23                       	je	0x10000dc66 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xcc6>
10000dc43: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
10000dc4a: f0                          	lock
10000dc4b: 49 0f c1 46 08              	xaddq	%rax, 0x8(%r14)
10000dc50: 48 85 c0                    	testq	%rax, %rax
10000dc53: 75 11                       	jne	0x10000dc66 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xcc6>
10000dc55: 49 8b 06                    	movq	(%r14), %rax
10000dc58: 4c 89 f7                    	movq	%r14, %rdi
10000dc5b: ff 50 10                    	callq	*0x10(%rax)
10000dc5e: 4c 89 f7                    	movq	%r14, %rdi
10000dc61: e8 fe 56 1a 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
10000dc66: 48 83 fb 50                 	cmpq	$0x50, %rbx
10000dc6a: 75 0e                       	jne	0x10000dc7a <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xcda>
10000dc6c: 41 8b 85 c4 00 00 00        	movl	0xc4(%r13), %eax
10000dc73: 41 89 85 28 02 00 00        	movl	%eax, 0x228(%r13)
10000dc7a: 41 c7 85 c0 00 00 00 01 00 00 00    	movl	$0x1, 0xc0(%r13)
10000dc85: e9 70 09 00 00              	jmp	0x10000e5fa <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x165a>
10000dc8a: 31 c9                       	xorl	%ecx, %ecx
10000dc8c: 48 39 c8                    	cmpq	%rcx, %rax
10000dc8f: 0f 95 c3                    	setne	%bl
10000dc92: 4d 85 ff                    	testq	%r15, %r15
10000dc95: 74 23                       	je	0x10000dcba <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xd1a>
10000dc97: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
10000dc9e: f0                          	lock
10000dc9f: 49 0f c1 47 08              	xaddq	%rax, 0x8(%r15)
10000dca4: 48 85 c0                    	testq	%rax, %rax
10000dca7: 75 11                       	jne	0x10000dcba <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xd1a>
10000dca9: 49 8b 07                    	movq	(%r15), %rax
10000dcac: 4c 89 ff                    	movq	%r15, %rdi
10000dcaf: ff 50 10                    	callq	*0x10(%rax)
10000dcb2: 4c 89 ff                    	movq	%r15, %rdi
10000dcb5: e8 aa 56 1a 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
10000dcba: 84 db                       	testb	%bl, %bl
10000dcbc: 4c 8b bd c8 fe ff ff        	movq	-0x138(%rbp), %r15
10000dcc3: 74 40                       	je	0x10000dd05 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xd65>
10000dcc5: 49 8b 9d 88 02 00 00        	movq	0x288(%r13), %rbx
10000dccc: 4c 8b 73 08                 	movq	0x8(%rbx), %r14
10000dcd0: 0f 57 c0                    	xorps	%xmm0, %xmm0
10000dcd3: 0f 11 03                    	movups	%xmm0, (%rbx)
10000dcd6: 4d 85 f6                    	testq	%r14, %r14
10000dcd9: 74 23                       	je	0x10000dcfe <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xd5e>
10000dcdb: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
10000dce2: f0                          	lock
10000dce3: 49 0f c1 46 08              	xaddq	%rax, 0x8(%r14)
10000dce8: 48 85 c0                    	testq	%rax, %rax
10000dceb: 75 11                       	jne	0x10000dcfe <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xd5e>
10000dced: 49 8b 06                    	movq	(%r14), %rax
10000dcf0: 4c 89 f7                    	movq	%r14, %rdi
10000dcf3: ff 50 10                    	callq	*0x10(%rax)
10000dcf6: 4c 89 f7                    	movq	%r14, %rdi
10000dcf9: e8 66 56 1a 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
10000dcfe: c7 43 10 ff ff ff ff        	movl	$0xffffffff, 0x10(%rbx) ## imm = 0xFFFFFFFF
10000dd05: 41 8b 85 c8 00 00 00        	movl	0xc8(%r13), %eax
10000dd0c: 41 89 85 28 02 00 00        	movl	%eax, 0x228(%r13)
10000dd13: 41 c7 85 c0 00 00 00 03 00 00 00    	movl	$0x3, 0xc0(%r13)
10000dd1e: 41 f6 47 2c 10              	testb	$0x10, 0x2c(%r15)
10000dd23: 0f 84 4f 03 00 00           	je	0x10000e078 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x10d8>
10000dd29: 4d 8b bd d0 00 00 00        	movq	0xd0(%r13), %r15
10000dd30: 4d 85 ff                    	testq	%r15, %r15
10000dd33: 0f 84 3f 03 00 00           	je	0x10000e078 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x10d8>
10000dd39: 41 c7 85 28 02 00 00 ff ff ff ff    	movl	$0xffffffff, 0x228(%r13) ## imm = 0xFFFFFFFF
10000dd44: bf 80 00 00 00              	movl	$0x80, %edi
10000dd49: e8 e8 56 1a 00              	callq	0x1001b3436 <dyld_stub_binder+0x1001b3436>
10000dd4e: 49 89 c6                    	movq	%rax, %r14
10000dd51: 49 c7 46 10 00 00 00 00     	movq	$0x0, 0x10(%r14)
10000dd59: 49 c7 46 08 00 00 00 00     	movq	$0x0, 0x8(%r14)
10000dd61: 48 8b 05 68 e0 22 00        	movq	0x22e068(%rip), %rax    ## 0x10023bdd0 <dyld_stub_binder+0x10023bdd0>
10000dd68: 48 83 c0 10                 	addq	$0x10, %rax
10000dd6c: 49 89 06                    	movq	%rax, (%r14)
10000dd6f: 4d 89 f4                    	movq	%r14, %r12
10000dd72: 49 83 c4 18                 	addq	$0x18, %r12
10000dd76: 4c 89 e7                    	movq	%r12, %rdi
10000dd79: 4c 89 fe                    	movq	%r15, %rsi
10000dd7c: e8 0f 75 00 00              	callq	0x100015290 <__ZN6SampleC2ERKS_>
10000dd81: 4c 89 a5 f0 fe ff ff        	movq	%r12, -0x110(%rbp)
10000dd88: 4c 89 b5 f8 fe ff ff        	movq	%r14, -0x108(%rbp)
10000dd8f: 48 8d bd f0 fe ff ff        	leaq	-0x110(%rbp), %rdi
10000dd96: 31 c0                       	xorl	%eax, %eax
10000dd98: 4c 89 e6                    	movq	%r12, %rsi
10000dd9b: 4c 89 e2                    	movq	%r12, %rdx
10000dd9e: e8 6d 8c 00 00              	callq	0x100016a10 <__ZNSt3__110shared_ptrI6SampleE18__enable_weak_thisEz>
10000dda3: 0f 28 85 f0 fe ff ff        	movaps	-0x110(%rbp), %xmm0
10000ddaa: 0f 57 c9                    	xorps	%xmm1, %xmm1
10000ddad: 0f 29 8d f0 fe ff ff        	movaps	%xmm1, -0x110(%rbp)
10000ddb4: 49 8b 9d d8 00 00 00        	movq	0xd8(%r13), %rbx
10000ddbb: 41 0f 11 85 d0 00 00 00     	movups	%xmm0, 0xd0(%r13)
10000ddc3: 48 85 db                    	testq	%rbx, %rbx
10000ddc6: 74 23                       	je	0x10000ddeb <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xe4b>
10000ddc8: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
10000ddcf: f0                          	lock
10000ddd0: 48 0f c1 43 08              	xaddq	%rax, 0x8(%rbx)
10000ddd5: 48 85 c0                    	testq	%rax, %rax
10000ddd8: 75 11                       	jne	0x10000ddeb <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xe4b>
10000ddda: 48 8b 03                    	movq	(%rbx), %rax
10000dddd: 48 89 df                    	movq	%rbx, %rdi
10000dde0: ff 50 10                    	callq	*0x10(%rax)
10000dde3: 48 89 df                    	movq	%rbx, %rdi
10000dde6: e8 79 55 1a 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
10000ddeb: 48 8b 9d f8 fe ff ff        	movq	-0x108(%rbp), %rbx
10000ddf2: 48 85 db                    	testq	%rbx, %rbx
10000ddf5: 0f 84 7d 02 00 00           	je	0x10000e078 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x10d8>
10000ddfb: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
10000de02: f0                          	lock
10000de03: 48 0f c1 43 08              	xaddq	%rax, 0x8(%rbx)
10000de08: 48 85 c0                    	testq	%rax, %rax
10000de0b: 0f 85 67 02 00 00           	jne	0x10000e078 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x10d8>
10000de11: 48 8b 03                    	movq	(%rbx), %rax
10000de14: 48 89 df                    	movq	%rbx, %rdi
10000de17: ff 50 10                    	callq	*0x10(%rax)
10000de1a: 48 89 df                    	movq	%rbx, %rdi
10000de1d: e8 42 55 1a 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
10000de22: 49 8b 85 40 02 00 00        	movq	0x240(%r13), %rax
10000de29: 48 85 c0                    	testq	%rax, %rax
10000de2c: 0f 85 56 02 00 00           	jne	0x10000e088 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x10e8>
10000de32: e9 c3 07 00 00              	jmp	0x10000e5fa <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x165a>
10000de37: 44 0f 28 15 41 6a 1a 00     	movaps	0x1a6a41(%rip), %xmm10  ## 0x1001b4880 <__ZTSNSt3__120__shared_ptr_emplaceI12FragmentViewNS_9allocatorIS1_EEEE+0xd0>
10000de3f: 44 0f 28 2d 49 6a 1a 00     	movaps	0x1a6a49(%rip), %xmm13  ## 0x1001b4890 <__ZTSNSt3__120__shared_ptr_emplaceI12FragmentViewNS_9allocatorIS1_EEEE+0xe0>
10000de47: c7 85 3c ff ff ff 01 00 00 00       	movl	$0x1, -0xc4(%rbp)
10000de51: 45 31 ff                    	xorl	%r15d, %r15d
10000de54: 45 0f 57 e4                 	xorps	%xmm12, %xmm12
10000de58: f3 44 0f 10 1d 9f 66 1a 00  	movss	0x1a669f(%rip), %xmm11  ## 0x1001b4500 <dyld_stub_binder+0x1001b4500>
10000de61: c7 85 6c ff ff ff 00 00 00 00       	movl	$0x0, -0x94(%rbp)
10000de6b: c7 85 64 ff ff ff 00 00 00 00       	movl	$0x0, -0x9c(%rbp)
10000de75: f3 44 0f 11 9d 68 ff ff ff  	movss	%xmm11, -0x98(%rbp)
10000de7e: 0f 57 c0                    	xorps	%xmm0, %xmm0
10000de81: f3 0f 11 85 60 ff ff ff     	movss	%xmm0, -0xa0(%rbp)
10000de89: c7 85 58 ff ff ff 00 00 00 00       	movl	$0x0, -0xa8(%rbp)
10000de93: c7 85 5c ff ff ff 00 00 00 00       	movl	$0x0, -0xa4(%rbp)
10000de9d: 45 0f 57 ff                 	xorps	%xmm15, %xmm15
10000dea1: c7 85 40 ff ff ff 00 00 00 00       	movl	$0x0, -0xc0(%rbp)
10000deab: 45 31 f6                    	xorl	%r14d, %r14d
10000deae: 44 0f 28 0d 7a 69 1a 00     	movaps	0x1a697a(%rip), %xmm9   ## 0x1001b4830 <__ZTSNSt3__120__shared_ptr_emplaceI12FragmentViewNS_9allocatorIS1_EEEE+0x80>
10000deb6: 48 85 ff                    	testq	%rdi, %rdi
10000deb9: 48 8b 9d c8 fe ff ff        	movq	-0x138(%rbp), %rbx
10000dec0: 0f 85 95 fb ff ff           	jne	0x10000da5b <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xabb>
10000dec6: e9 14 fc ff ff              	jmp	0x10000dadf <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xb3f>
10000decb: 66 45 0f 7e cf              	movd	%xmm9, %r15d
10000ded0: 31 db                       	xorl	%ebx, %ebx
10000ded2: 45 85 ff                    	testl	%r15d, %r15d
10000ded5: 78 58                       	js	0x10000df2f <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xf8f>
10000ded7: 49 8b 95 b0 00 00 00        	movq	0xb0(%r13), %rdx
10000dede: 48 85 d2                    	testq	%rdx, %rdx
10000dee1: 41 be 00 00 00 00           	movl	$0x0, %r14d
10000dee7: 0f 84 08 02 00 00           	je	0x10000e0f5 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x1155>
10000deed: 49 63 c7                    	movslq	%r15d, %rax
10000def0: 48 8b 0a                    	movq	(%rdx), %rcx
10000def3: 48 8b 52 08                 	movq	0x8(%rdx), %rdx
10000def7: 48 29 ca                    	subq	%rcx, %rdx
10000defa: 48 c1 fa 04                 	sarq	$0x4, %rdx
10000defe: 31 db                       	xorl	%ebx, %ebx
10000df00: 48 39 c2                    	cmpq	%rax, %rdx
10000df03: 41 be 00 00 00 00           	movl	$0x0, %r14d
10000df09: 0f 86 e6 01 00 00           	jbe	0x10000e0f5 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x1155>
10000df0f: 48 c1 e0 04                 	shlq	$0x4, %rax
10000df13: 4c 8b 34 01                 	movq	(%rcx,%rax), %r14
10000df17: 48 8b 5c 01 08              	movq	0x8(%rcx,%rax), %rbx
10000df1c: 48 85 db                    	testq	%rbx, %rbx
10000df1f: 0f 84 ce 01 00 00           	je	0x10000e0f3 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x1153>
10000df25: f0                          	lock
10000df26: 48 ff 43 08                 	incq	0x8(%rbx)
10000df2a: e9 c6 01 00 00              	jmp	0x10000e0f5 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x1155>
10000df2f: 45 31 f6                    	xorl	%r14d, %r14d
10000df32: e9 be 01 00 00              	jmp	0x10000e0f5 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x1155>
10000df37: 31 db                       	xorl	%ebx, %ebx
10000df39: 85 db                       	testl	%ebx, %ebx
10000df3b: 0f 88 dc 00 00 00           	js	0x10000e01d <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x107d>
10000df41: 48 85 c0                    	testq	%rax, %rax
10000df44: 0f 84 d3 00 00 00           	je	0x10000e01d <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x107d>
10000df4a: 48 63 cb                    	movslq	%ebx, %rcx
10000df4d: 48 8b 10                    	movq	(%rax), %rdx
10000df50: 48 8b 40 08                 	movq	0x8(%rax), %rax
10000df54: 48 29 d0                    	subq	%rdx, %rax
10000df57: 48 c1 f8 04                 	sarq	$0x4, %rax
10000df5b: 48 39 c8                    	cmpq	%rcx, %rax
10000df5e: 0f 86 b9 00 00 00           	jbe	0x10000e01d <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x107d>
10000df64: 48 c1 e1 04                 	shlq	$0x4, %rcx
10000df68: 4c 8b 3c 0a                 	movq	(%rdx,%rcx), %r15
10000df6c: 4c 8b 74 0a 08              	movq	0x8(%rdx,%rcx), %r14
10000df71: 4d 85 f6                    	testq	%r14, %r14
10000df74: 74 28                       	je	0x10000df9e <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xffe>
10000df76: f0                          	lock
10000df77: 49 ff 46 08                 	incq	0x8(%r14)
10000df7b: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
10000df82: f0                          	lock
10000df83: 49 0f c1 46 08              	xaddq	%rax, 0x8(%r14)
10000df88: 48 85 c0                    	testq	%rax, %rax
10000df8b: 75 11                       	jne	0x10000df9e <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0xffe>
10000df8d: 49 8b 06                    	movq	(%r14), %rax
10000df90: 4c 89 f7                    	movq	%r14, %rdi
10000df93: ff 50 10                    	callq	*0x10(%rax)
10000df96: 4c 89 f7                    	movq	%r14, %rdi
10000df99: e8 c6 53 1a 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
10000df9e: 4d 85 ff                    	testq	%r15, %r15
10000dfa1: 74 7a                       	je	0x10000e01d <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x107d>
10000dfa3: 41 89 9d c8 00 00 00        	movl	%ebx, 0xc8(%r13)
10000dfaa: 41 39 9d c4 00 00 00        	cmpl	%ebx, 0xc4(%r13)
10000dfb1: 0f 84 81 00 00 00           	je	0x10000e038 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x1098>
10000dfb7: 41 89 9d c4 00 00 00        	movl	%ebx, 0xc4(%r13)
10000dfbe: 49 8b bd 40 02 00 00        	movq	0x240(%r13), %rdi
10000dfc5: 48 85 ff                    	testq	%rdi, %rdi
10000dfc8: 74 49                       	je	0x10000e013 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x1073>
10000dfca: e8 81 46 ff ff              	callq	0x100002650 <__ZN10SampleView5closeEv>
10000dfcf: 49 8b 9d 48 02 00 00        	movq	0x248(%r13), %rbx
10000dfd6: 0f 57 c0                    	xorps	%xmm0, %xmm0
10000dfd9: 41 0f 11 85 40 02 00 00     	movups	%xmm0, 0x240(%r13)
10000dfe1: 48 85 db                    	testq	%rbx, %rbx
10000dfe4: 74 23                       	je	0x10000e009 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x1069>
10000dfe6: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
10000dfed: f0                          	lock
10000dfee: 48 0f c1 43 08              	xaddq	%rax, 0x8(%rbx)
10000dff3: 48 85 c0                    	testq	%rax, %rax
10000dff6: 75 11                       	jne	0x10000e009 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x1069>
10000dff8: 48 8b 03                    	movq	(%rbx), %rax
10000dffb: 48 89 df                    	movq	%rbx, %rdi
10000dffe: ff 50 10                    	callq	*0x10(%rax)
10000e001: 48 89 df                    	movq	%rbx, %rdi
10000e004: e8 5b 53 1a 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
10000e009: 41 83 bd c4 00 00 00 ff     	cmpl	$-0x1, 0xc4(%r13)
10000e011: 74 25                       	je	0x10000e038 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x1098>
10000e013: 4c 89 ef                    	movq	%r13, %rdi
10000e016: e8 65 37 00 00              	callq	0x100011780 <__ZN7GelView14openSampleViewEv>
10000e01b: eb 1b                       	jmp	0x10000e038 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x1098>
10000e01d: 48 8d 05 24 17 23 00        	leaq	0x231724(%rip), %rax    ## 0x10023f748 <_kConfig>
10000e024: 48 8b 00                    	movq	(%rax), %rax
10000e027: 80 78 35 00                 	cmpb	$0x0, 0x35(%rax)
10000e02b: 74 0b                       	je	0x10000e038 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x1098>
10000e02d: 41 c7 85 c0 00 00 00 04 00 00 00    	movl	$0x4, 0xc0(%r13)
10000e038: 49 8b 9d 88 02 00 00        	movq	0x288(%r13), %rbx
10000e03f: 4c 8b 73 08                 	movq	0x8(%rbx), %r14
10000e043: 0f 57 c0                    	xorps	%xmm0, %xmm0
10000e046: 0f 11 03                    	movups	%xmm0, (%rbx)
10000e049: 4d 85 f6                    	testq	%r14, %r14
10000e04c: 74 23                       	je	0x10000e071 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x10d1>
10000e04e: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
10000e055: f0                          	lock
10000e056: 49 0f c1 46 08              	xaddq	%rax, 0x8(%r14)
10000e05b: 48 85 c0                    	testq	%rax, %rax
10000e05e: 75 11                       	jne	0x10000e071 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x10d1>
10000e060: 49 8b 06                    	movq	(%r14), %rax
10000e063: 4c 89 f7                    	movq	%r14, %rdi
10000e066: ff 50 10                    	callq	*0x10(%rax)
10000e069: 4c 89 f7                    	movq	%r14, %rdi
10000e06c: e8 f3 52 1a 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
10000e071: c7 43 10 ff ff ff ff        	movl	$0xffffffff, 0x10(%rbx) ## imm = 0xFFFFFFFF
10000e078: 49 8b 85 40 02 00 00        	movq	0x240(%r13), %rax
10000e07f: 48 85 c0                    	testq	%rax, %rax
10000e082: 0f 84 72 05 00 00           	je	0x10000e5fa <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x165a>
10000e088: 49 8b 7d 70                 	movq	0x70(%r13), %rdi
10000e08c: 48 89 85 a0 fe ff ff        	movq	%rax, -0x160(%rbp)
10000e093: 49 8b 85 48 02 00 00        	movq	0x248(%r13), %rax
10000e09a: 48 89 85 a8 fe ff ff        	movq	%rax, -0x158(%rbp)
10000e0a1: 48 85 c0                    	testq	%rax, %rax
10000e0a4: 74 05                       	je	0x10000e0ab <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x110b>
10000e0a6: f0                          	lock
10000e0a7: 48 ff 40 08                 	incq	0x8(%rax)
10000e0ab: 48 8d b5 a0 fe ff ff        	leaq	-0x160(%rbp), %rsi
10000e0b2: e8 09 01 06 00              	callq	0x10006e1c0 <__ZN14ViewCollection20setKeyboardFocusViewENSt3__110shared_ptrI4ViewEE>
10000e0b7: 48 8b 9d a8 fe ff ff        	movq	-0x158(%rbp), %rbx
10000e0be: 48 85 db                    	testq	%rbx, %rbx
10000e0c1: 0f 84 33 05 00 00           	je	0x10000e5fa <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x165a>
10000e0c7: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
10000e0ce: f0                          	lock
10000e0cf: 48 0f c1 43 08              	xaddq	%rax, 0x8(%rbx)
10000e0d4: 48 85 c0                    	testq	%rax, %rax
10000e0d7: 0f 85 1d 05 00 00           	jne	0x10000e5fa <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x165a>
10000e0dd: 48 8b 03                    	movq	(%rbx), %rax
10000e0e0: 48 89 df                    	movq	%rbx, %rdi
10000e0e3: ff 50 10                    	callq	*0x10(%rax)
10000e0e6: 48 89 df                    	movq	%rbx, %rdi
10000e0e9: e8 76 52 1a 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
10000e0ee: e9 07 05 00 00              	jmp	0x10000e5fa <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x165a>
10000e0f3: 31 db                       	xorl	%ebx, %ebx
10000e0f5: 66 41 0f 70 c1 e5           	pshufd	$0xe5, %xmm9, %xmm0     ## xmm0 = xmm9[1,1,2,3]
10000e0fb: 66 0f 7e c6                 	movd	%xmm0, %esi
10000e0ff: 4c 89 f7                    	movq	%r14, %rdi
10000e102: e8 b9 bf 03 00              	callq	0x10004a0c0 <__ZN6Sample13cloneFragmentEi>
10000e107: 41 89 c4                    	movl	%eax, %r12d
10000e10a: 48 8d bd f0 fe ff ff        	leaq	-0x110(%rbp), %rdi
10000e111: 31 f6                       	xorl	%esi, %esi
10000e113: e8 88 4a 02 00              	callq	0x100032ba0 <__ZN12FragmentView25getRandomColorFromPaletteEPN6cinder4RandE>
10000e118: 49 63 c4                    	movslq	%r12d, %rax
10000e11b: 49 8b 0e                    	movq	(%r14), %rcx
10000e11e: 48 8d 04 80                 	leaq	(%rax,%rax,4), %rax
10000e122: 48 c1 e0 04                 	shlq	$0x4, %rax
10000e126: 8b 95 f8 fe ff ff           	movl	-0x108(%rbp), %edx
10000e12c: 89 54 01 34                 	movl	%edx, 0x34(%rcx,%rax)
10000e130: 48 8b 95 f0 fe ff ff        	movq	-0x110(%rbp), %rdx
10000e137: 48 89 54 01 2c              	movq	%rdx, 0x2c(%rcx,%rax)
10000e13c: 4c 89 b5 60 fe ff ff        	movq	%r14, -0x1a0(%rbp)
10000e143: 48 89 9d 68 fe ff ff        	movq	%rbx, -0x198(%rbp)
10000e14a: 48 85 db                    	testq	%rbx, %rbx
10000e14d: 74 05                       	je	0x10000e154 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x11b4>
10000e14f: f0                          	lock
10000e150: 48 ff 43 08                 	incq	0x8(%rbx)
10000e154: 48 8d b5 60 fe ff ff        	leaq	-0x1a0(%rbp), %rsi
10000e15b: 4c 89 ef                    	movq	%r13, %rdi
10000e15e: e8 7d 0f 00 00              	callq	0x10000f0e0 <__ZN7GelView15sampleDidChangeENSt3__110shared_ptrI6SampleEE>
10000e163: 48 85 db                    	testq	%rbx, %rbx
10000e166: 74 23                       	je	0x10000e18b <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x11eb>
10000e168: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
10000e16f: f0                          	lock
10000e170: 48 0f c1 43 08              	xaddq	%rax, 0x8(%rbx)
10000e175: 48 85 c0                    	testq	%rax, %rax
10000e178: 75 11                       	jne	0x10000e18b <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x11eb>
10000e17a: 48 8b 03                    	movq	(%rbx), %rax
10000e17d: 48 89 df                    	movq	%rbx, %rdi
10000e180: ff 50 10                    	callq	*0x10(%rax)
10000e183: 48 89 df                    	movq	%rbx, %rdi
10000e186: e8 d9 51 1a 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
10000e18b: 49 8b bd b0 00 00 00        	movq	0xb0(%r13), %rdi
10000e192: 44 89 fe                    	movl	%r15d, %esi
10000e195: 44 89 e2                    	movl	%r12d, %edx
10000e198: e8 e3 d1 00 00              	callq	0x10001b380 <__ZNK3Gel24getSlowestBandInFragmentEii>
10000e19d: 48 85 db                    	testq	%rbx, %rbx
10000e1a0: 44 0f 10 08                 	movups	(%rax), %xmm9
10000e1a4: 44 8b 70 10                 	movl	0x10(%rax), %r14d
10000e1a8: 8b 48 14                    	movl	0x14(%rax), %ecx
10000e1ab: 89 8d 5c ff ff ff           	movl	%ecx, -0xa4(%rbp)
10000e1b1: 8b 48 18                    	movl	0x18(%rax), %ecx
10000e1b4: 89 8d 58 ff ff ff           	movl	%ecx, -0xa8(%rbp)
10000e1ba: f3 0f 10 40 1c              	movss	0x1c(%rax), %xmm0
10000e1bf: f3 0f 11 85 60 ff ff ff     	movss	%xmm0, -0xa0(%rbp)
10000e1c7: f3 0f 10 40 20              	movss	0x20(%rax), %xmm0
10000e1cc: f3 0f 11 85 68 ff ff ff     	movss	%xmm0, -0x98(%rbp)
10000e1d4: 8b 48 24                    	movl	0x24(%rax), %ecx
10000e1d7: 89 8d 64 ff ff ff           	movl	%ecx, -0x9c(%rbp)
10000e1dd: 8b 48 28                    	movl	0x28(%rax), %ecx
10000e1e0: 89 8d 6c ff ff ff           	movl	%ecx, -0x94(%rbp)
10000e1e6: 44 8b 78 2c                 	movl	0x2c(%rax), %r15d
10000e1ea: 8b 48 40                    	movl	0x40(%rax), %ecx
10000e1ed: 89 4d 98                    	movl	%ecx, -0x68(%rbp)
10000e1f0: 48 8b 48 38                 	movq	0x38(%rax), %rcx
10000e1f4: 48 89 4d 90                 	movq	%rcx, -0x70(%rbp)
10000e1f8: 48 8b 48 30                 	movq	0x30(%rax), %rcx
10000e1fc: 48 89 4d 88                 	movq	%rcx, -0x78(%rbp)
10000e200: f3 0f 10 40 44              	movss	0x44(%rax), %xmm0
10000e205: f3 0f 11 85 38 ff ff ff     	movss	%xmm0, -0xc8(%rbp)
10000e20d: 8b 48 48                    	movl	0x48(%rax), %ecx
10000e210: 89 8d 54 ff ff ff           	movl	%ecx, -0xac(%rbp)
10000e216: f3 44 0f 10 70 4c           	movss	0x4c(%rax), %xmm14
10000e21c: 48 8b 48 58                 	movq	0x58(%rax), %rcx
10000e220: 48 89 8d d8 fe ff ff        	movq	%rcx, -0x128(%rbp)
10000e227: 48 8b 48 50                 	movq	0x50(%rax), %rcx
10000e22b: 48 89 8d d0 fe ff ff        	movq	%rcx, -0x130(%rbp)
10000e232: f3 44 0f 10 60 60           	movss	0x60(%rax), %xmm12
10000e238: 44 0f 10 68 64              	movups	0x64(%rax), %xmm13
10000e23d: 8b 88 84 00 00 00           	movl	0x84(%rax), %ecx
10000e243: 89 4d 80                    	movl	%ecx, -0x80(%rbp)
10000e246: 48 8b 48 7c                 	movq	0x7c(%rax), %rcx
10000e24a: 48 89 8d 78 ff ff ff        	movq	%rcx, -0x88(%rbp)
10000e251: 48 8b 48 74                 	movq	0x74(%rax), %rcx
10000e255: 48 89 8d 70 ff ff ff        	movq	%rcx, -0x90(%rbp)
10000e25c: f3 44 0f 10 98 88 00 00 00  	movss	0x88(%rax), %xmm11
10000e265: 44 0f 10 90 8c 00 00 00     	movups	0x8c(%rax), %xmm10
10000e26d: f3 44 0f 10 b8 9c 00 00 00  	movss	0x9c(%rax), %xmm15
10000e276: 44 8b a0 a0 00 00 00        	movl	0xa0(%rax), %r12d
10000e27d: 0f 84 9f 00 00 00           	je	0x10000e322 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x1382>
10000e283: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
10000e28a: f0                          	lock
10000e28b: 48 0f c1 43 08              	xaddq	%rax, 0x8(%rbx)
10000e290: 48 85 c0                    	testq	%rax, %rax
10000e293: 0f 85 89 00 00 00           	jne	0x10000e322 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x1382>
10000e299: 48 8b 03                    	movq	(%rbx), %rax
10000e29c: 48 89 df                    	movq	%rbx, %rdi
10000e29f: 44 0f 29 8d e0 fe ff ff     	movaps	%xmm9, -0x120(%rbp)
10000e2a7: 44 0f 29 95 80 fe ff ff     	movaps	%xmm10, -0x180(%rbp)
10000e2af: f3 44 0f 11 9d 44 ff ff ff  	movss	%xmm11, -0xbc(%rbp)
10000e2b8: f3 44 0f 11 a5 48 ff ff ff  	movss	%xmm12, -0xb8(%rbp)
10000e2c1: 44 0f 29 ad 90 fe ff ff     	movaps	%xmm13, -0x170(%rbp)
10000e2c9: f3 44 0f 11 b5 4c ff ff ff  	movss	%xmm14, -0xb4(%rbp)
10000e2d2: f3 44 0f 11 bd 50 ff ff ff  	movss	%xmm15, -0xb0(%rbp)
10000e2db: ff 50 10                    	callq	*0x10(%rax)
10000e2de: 48 89 df                    	movq	%rbx, %rdi
10000e2e1: e8 7e 50 1a 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
10000e2e6: f3 44 0f 10 bd 50 ff ff ff  	movss	-0xb0(%rbp), %xmm15
10000e2ef: f3 44 0f 10 b5 4c ff ff ff  	movss	-0xb4(%rbp), %xmm14
10000e2f8: 44 0f 28 ad 90 fe ff ff     	movaps	-0x170(%rbp), %xmm13
10000e300: f3 44 0f 10 a5 48 ff ff ff  	movss	-0xb8(%rbp), %xmm12
10000e309: f3 44 0f 10 9d 44 ff ff ff  	movss	-0xbc(%rbp), %xmm11
10000e312: 44 0f 28 95 80 fe ff ff     	movaps	-0x180(%rbp), %xmm10
10000e31a: 44 0f 28 8d e0 fe ff ff     	movaps	-0x120(%rbp), %xmm9
10000e322: 49 8d 85 10 01 00 00        	leaq	0x110(%r13), %rax
10000e329: 49 8d 8d 54 01 00 00        	leaq	0x154(%r13), %rcx
10000e330: 45 0f 11 8d e0 00 00 00     	movups	%xmm9, 0xe0(%r13)
10000e338: 45 89 b5 f0 00 00 00        	movl	%r14d, 0xf0(%r13)
10000e33f: 44 8b 8d 5c ff ff ff        	movl	-0xa4(%rbp), %r9d
10000e346: 45 89 8d f4 00 00 00        	movl	%r9d, 0xf4(%r13)
10000e34d: 44 8b 85 58 ff ff ff        	movl	-0xa8(%rbp), %r8d
10000e354: 45 89 85 f8 00 00 00        	movl	%r8d, 0xf8(%r13)
10000e35b: f3 0f 10 95 60 ff ff ff     	movss	-0xa0(%rbp), %xmm2
10000e363: f3 41 0f 11 95 fc 00 00 00  	movss	%xmm2, 0xfc(%r13)
10000e36c: f3 0f 10 8d 68 ff ff ff     	movss	-0x98(%rbp), %xmm1
10000e374: f3 41 0f 11 8d 00 01 00 00  	movss	%xmm1, 0x100(%r13)
10000e37d: 8b 9d 64 ff ff ff           	movl	-0x9c(%rbp), %ebx
10000e383: 41 89 9d 04 01 00 00        	movl	%ebx, 0x104(%r13)
10000e38a: 8b bd 6c ff ff ff           	movl	-0x94(%rbp), %edi
10000e390: 41 89 bd 08 01 00 00        	movl	%edi, 0x108(%r13)
10000e397: 45 89 bd 0c 01 00 00        	movl	%r15d, 0x10c(%r13)
10000e39e: 8b 55 98                    	movl	-0x68(%rbp), %edx
10000e3a1: 89 50 10                    	movl	%edx, 0x10(%rax)
10000e3a4: 48 8b 55 88                 	movq	-0x78(%rbp), %rdx
10000e3a8: 48 8b 75 90                 	movq	-0x70(%rbp), %rsi
10000e3ac: 48 89 70 08                 	movq	%rsi, 0x8(%rax)
10000e3b0: 48 89 10                    	movq	%rdx, (%rax)
10000e3b3: f3 0f 10 85 38 ff ff ff     	movss	-0xc8(%rbp), %xmm0
10000e3bb: f3 41 0f 11 85 24 01 00 00  	movss	%xmm0, 0x124(%r13)
10000e3c4: 8b b5 54 ff ff ff           	movl	-0xac(%rbp), %esi
10000e3ca: 41 89 b5 28 01 00 00        	movl	%esi, 0x128(%r13)
10000e3d1: f3 45 0f 11 b5 2c 01 00 00  	movss	%xmm14, 0x12c(%r13)
10000e3da: 48 8b 85 d0 fe ff ff        	movq	-0x130(%rbp), %rax
10000e3e1: 48 8b 95 d8 fe ff ff        	movq	-0x128(%rbp), %rdx
10000e3e8: 49 89 95 38 01 00 00        	movq	%rdx, 0x138(%r13)
10000e3ef: 49 89 85 30 01 00 00        	movq	%rax, 0x130(%r13)
10000e3f6: f3 45 0f 11 a5 40 01 00 00  	movss	%xmm12, 0x140(%r13)
10000e3ff: 45 0f 11 ad 44 01 00 00     	movups	%xmm13, 0x144(%r13)
10000e407: 8b 45 80                    	movl	-0x80(%rbp), %eax
10000e40a: 89 41 10                    	movl	%eax, 0x10(%rcx)
10000e40d: 48 8b 85 70 ff ff ff        	movq	-0x90(%rbp), %rax
10000e414: 48 8b 95 78 ff ff ff        	movq	-0x88(%rbp), %rdx
10000e41b: 48 89 51 08                 	movq	%rdx, 0x8(%rcx)
10000e41f: 48 89 01                    	movq	%rax, (%rcx)
10000e422: f3 45 0f 11 9d 68 01 00 00  	movss	%xmm11, 0x168(%r13)
10000e42b: 45 0f 11 95 6c 01 00 00     	movups	%xmm10, 0x16c(%r13)
10000e433: f3 45 0f 11 bd 7c 01 00 00  	movss	%xmm15, 0x17c(%r13)
10000e43c: 45 89 a5 80 01 00 00        	movl	%r12d, 0x180(%r13)
10000e443: 45 0f 11 8d 84 01 00 00     	movups	%xmm9, 0x184(%r13)
10000e44b: 45 89 b5 94 01 00 00        	movl	%r14d, 0x194(%r13)
10000e452: 45 89 8d 98 01 00 00        	movl	%r9d, 0x198(%r13)
10000e459: 45 89 85 9c 01 00 00        	movl	%r8d, 0x19c(%r13)
10000e460: f3 41 0f 11 95 a0 01 00 00  	movss	%xmm2, 0x1a0(%r13)
10000e469: f3 41 0f 11 8d a4 01 00 00  	movss	%xmm1, 0x1a4(%r13)
10000e472: 41 89 9d a8 01 00 00        	movl	%ebx, 0x1a8(%r13)
10000e479: 41 89 bd ac 01 00 00        	movl	%edi, 0x1ac(%r13)
10000e480: 45 89 bd b0 01 00 00        	movl	%r15d, 0x1b0(%r13)
10000e487: 8b 45 98                    	movl	-0x68(%rbp), %eax
10000e48a: 41 89 85 c4 01 00 00        	movl	%eax, 0x1c4(%r13)
10000e491: 48 8b 45 88                 	movq	-0x78(%rbp), %rax
10000e495: 48 8b 4d 90                 	movq	-0x70(%rbp), %rcx
10000e499: 49 89 8d bc 01 00 00        	movq	%rcx, 0x1bc(%r13)
10000e4a0: 49 89 85 b4 01 00 00        	movq	%rax, 0x1b4(%r13)
10000e4a7: f3 41 0f 11 85 c8 01 00 00  	movss	%xmm0, 0x1c8(%r13)
10000e4b0: 41 89 b5 cc 01 00 00        	movl	%esi, 0x1cc(%r13)
10000e4b7: f3 45 0f 11 b5 d0 01 00 00  	movss	%xmm14, 0x1d0(%r13)
10000e4c0: 48 8b 85 d0 fe ff ff        	movq	-0x130(%rbp), %rax
10000e4c7: 48 8b 8d d8 fe ff ff        	movq	-0x128(%rbp), %rcx
10000e4ce: 49 89 8d dc 01 00 00        	movq	%rcx, 0x1dc(%r13)
10000e4d5: 49 89 85 d4 01 00 00        	movq	%rax, 0x1d4(%r13)
10000e4dc: f3 45 0f 11 a5 e4 01 00 00  	movss	%xmm12, 0x1e4(%r13)
10000e4e5: 45 0f 11 ad e8 01 00 00     	movups	%xmm13, 0x1e8(%r13)
10000e4ed: 8b 45 80                    	movl	-0x80(%rbp), %eax
10000e4f0: 41 89 85 08 02 00 00        	movl	%eax, 0x208(%r13)
10000e4f7: 48 8b 85 70 ff ff ff        	movq	-0x90(%rbp), %rax
10000e4fe: 48 8b 8d 78 ff ff ff        	movq	-0x88(%rbp), %rcx
10000e505: 49 89 8d 00 02 00 00        	movq	%rcx, 0x200(%r13)
10000e50c: 49 89 85 f8 01 00 00        	movq	%rax, 0x1f8(%r13)
10000e513: f3 45 0f 11 9d 0c 02 00 00  	movss	%xmm11, 0x20c(%r13)
10000e51c: 45 0f 11 95 10 02 00 00     	movups	%xmm10, 0x210(%r13)
10000e524: f3 45 0f 11 bd 20 02 00 00  	movss	%xmm15, 0x220(%r13)
10000e52d: 45 89 a5 24 02 00 00        	movl	%r12d, 0x224(%r13)
10000e534: 41 c7 85 c0 00 00 00 01 00 00 00    	movl	$0x1, 0xc0(%r13)
10000e53f: 66 44 0f 7e c8              	movd	%xmm9, %eax
10000e544: 66 45 0f 7e 8d c8 00 00 00  	movd	%xmm9, 0xc8(%r13)
10000e54d: 41 39 85 c4 00 00 00        	cmpl	%eax, 0xc4(%r13)
10000e554: 74 7e                       	je	0x10000e5d4 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x1634>
10000e556: 41 89 85 c4 00 00 00        	movl	%eax, 0xc4(%r13)
10000e55d: 49 8b bd 40 02 00 00        	movq	0x240(%r13), %rdi
10000e564: 48 85 ff                    	testq	%rdi, %rdi
10000e567: 44 0f 29 8d e0 fe ff ff     	movaps	%xmm9, -0x120(%rbp)
10000e56f: 74 4e                       	je	0x10000e5bf <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x161f>
10000e571: e8 da 40 ff ff              	callq	0x100002650 <__ZN10SampleView5closeEv>
10000e576: 49 8b 9d 48 02 00 00        	movq	0x248(%r13), %rbx
10000e57d: 0f 57 c0                    	xorps	%xmm0, %xmm0
10000e580: 41 0f 11 85 40 02 00 00     	movups	%xmm0, 0x240(%r13)
10000e588: 48 85 db                    	testq	%rbx, %rbx
10000e58b: 74 23                       	je	0x10000e5b0 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x1610>
10000e58d: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
10000e594: f0                          	lock
10000e595: 48 0f c1 43 08              	xaddq	%rax, 0x8(%rbx)
10000e59a: 48 85 c0                    	testq	%rax, %rax
10000e59d: 75 11                       	jne	0x10000e5b0 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x1610>
10000e59f: 48 8b 03                    	movq	(%rbx), %rax
10000e5a2: 48 89 df                    	movq	%rbx, %rdi
10000e5a5: ff 50 10                    	callq	*0x10(%rax)
10000e5a8: 48 89 df                    	movq	%rbx, %rdi
10000e5ab: e8 b4 4d 1a 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
10000e5b0: 41 8b 85 c4 00 00 00        	movl	0xc4(%r13), %eax
10000e5b7: 44 0f 28 8d e0 fe ff ff     	movaps	-0x120(%rbp), %xmm9
10000e5bf: 83 f8 ff                    	cmpl	$-0x1, %eax
10000e5c2: 74 10                       	je	0x10000e5d4 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x1634>
10000e5c4: 4c 89 ef                    	movq	%r13, %rdi
10000e5c7: e8 b4 31 00 00              	callq	0x100011780 <__ZN7GelView14openSampleViewEv>
10000e5cc: 44 0f 28 8d e0 fe ff ff     	movaps	-0x120(%rbp), %xmm9
10000e5d4: 49 8b bd 40 02 00 00        	movq	0x240(%r13), %rdi
10000e5db: 66 41 0f 70 c1 e5           	pshufd	$0xe5, %xmm9, %xmm0     ## xmm0 = xmm9[1,1,2,3]
10000e5e1: 66 0f 7e c6                 	movd	%xmm0, %esi
10000e5e5: e8 86 54 ff ff              	callq	0x100003a70 <__ZN10SampleView14selectFragmentEi>
10000e5ea: 49 8b 85 40 02 00 00        	movq	0x240(%r13), %rax
10000e5f1: 48 85 c0                    	testq	%rax, %rax
10000e5f4: 0f 85 8e fa ff ff           	jne	0x10000e088 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x10e8>
10000e5fa: 48 8b 05 d7 d9 22 00        	movq	0x22d9d7(%rip), %rax    ## 0x10023bfd8 <dyld_stub_binder+0x10023bfd8>
10000e601: 48 8b 00                    	movq	(%rax), %rax
10000e604: 48 3b 45 d0                 	cmpq	-0x30(%rbp), %rax
10000e608: 75 12                       	jne	0x10000e61c <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x167c>
10000e60a: 48 81 c4 78 01 00 00        	addq	$0x178, %rsp            ## imm = 0x178
10000e611: 5b                          	popq	%rbx
10000e612: 41 5c                       	popq	%r12
10000e614: 41 5d                       	popq	%r13
10000e616: 41 5e                       	popq	%r14
10000e618: 41 5f                       	popq	%r15
10000e61a: 5d                          	popq	%rbp
10000e61b: c3                          	retq
10000e61c: e8 81 4e 1a 00              	callq	0x1001b34a2 <dyld_stub_binder+0x1001b34a2>
10000e621: eb 40                       	jmp	0x10000e663 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x16c3>
10000e623: 49 89 c7                    	movq	%rax, %r15
10000e626: 49 89 dc                    	movq	%rbx, %r12
10000e629: 48 85 db                    	testq	%rbx, %rbx
10000e62c: 0f 84 a6 00 00 00           	je	0x10000e6d8 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x1738>
10000e632: 4c 89 e1                    	movq	%r12, %rcx
10000e635: 48 8d 59 08                 	leaq	0x8(%rcx), %rbx
10000e639: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
10000e640: f0                          	lock
10000e641: 48 0f c1 41 08              	xaddq	%rax, 0x8(%rcx)
10000e646: 48 85 c0                    	testq	%rax, %rax
10000e649: 75 28                       	jne	0x10000e673 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x16d3>
10000e64b: 4d 89 e6                    	movq	%r12, %r14
10000e64e: 49 8b 06                    	movq	(%r14), %rax
10000e651: 4c 89 f7                    	movq	%r14, %rdi
10000e654: ff 50 10                    	callq	*0x10(%rax)
10000e657: 4c 89 f7                    	movq	%r14, %rdi
10000e65a: e8 05 4d 1a 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
10000e65f: eb 12                       	jmp	0x10000e673 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x16d3>
10000e661: eb 00                       	jmp	0x10000e663 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x16c3>
10000e663: 49 89 dc                    	movq	%rbx, %r12
10000e666: 49 89 c7                    	movq	%rax, %r15
10000e669: 4d 85 e4                    	testq	%r12, %r12
10000e66c: 74 6a                       	je	0x10000e6d8 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x1738>
10000e66e: 49 8d 5c 24 08              	leaq	0x8(%r12), %rbx
10000e673: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
10000e67a: f0                          	lock
10000e67b: 48 0f c1 03                 	xaddq	%rax, (%rbx)
10000e67f: 48 85 c0                    	testq	%rax, %rax
10000e682: 75 54                       	jne	0x10000e6d8 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x1738>
10000e684: 4c 89 e3                    	movq	%r12, %rbx
10000e687: eb 36                       	jmp	0x10000e6bf <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x171f>
10000e689: 49 89 c7                    	movq	%rax, %r15
10000e68c: 4c 89 f7                    	movq	%r14, %rdi
10000e68f: e8 e2 4c 1a 00              	callq	0x1001b3376 <dyld_stub_binder+0x1001b3376>
10000e694: 4c 89 f7                    	movq	%r14, %rdi
10000e697: e8 8e 4d 1a 00              	callq	0x1001b342a <dyld_stub_binder+0x1001b342a>
10000e69c: eb 3a                       	jmp	0x10000e6d8 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x1738>
10000e69e: 49 89 c7                    	movq	%rax, %r15
10000e6a1: 48 8b 9d a8 fe ff ff        	movq	-0x158(%rbp), %rbx
10000e6a8: 48 85 db                    	testq	%rbx, %rbx
10000e6ab: 74 2b                       	je	0x10000e6d8 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x1738>
10000e6ad: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
10000e6b4: f0                          	lock
10000e6b5: 48 0f c1 43 08              	xaddq	%rax, 0x8(%rbx)
10000e6ba: 48 85 c0                    	testq	%rax, %rax
10000e6bd: 75 19                       	jne	0x10000e6d8 <__ZN7GelView9mouseDownEN6cinder3app10MouseEventE+0x1738>
10000e6bf: 48 8b 03                    	movq	(%rbx), %rax
10000e6c2: 48 89 df                    	movq	%rbx, %rdi
10000e6c5: ff 50 10                    	callq	*0x10(%rax)
10000e6c8: 48 89 df                    	movq	%rbx, %rdi
10000e6cb: e8 94 4c 1a 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
10000e6d0: 4c 89 ff                    	movq	%r15, %rdi
10000e6d3: e8 22 4a 1a 00              	callq	0x1001b30fa <dyld_stub_binder+0x1001b30fa>
10000e6d8: 4c 89 ff                    	movq	%r15, %rdi
10000e6db: e8 1a 4a 1a 00              	callq	0x1001b30fa <dyld_stub_binder+0x1001b30fa>
