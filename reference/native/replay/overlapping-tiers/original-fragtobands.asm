
/Applications/Gelbox.app/Contents/MacOS/Gelbox:	file format mach-o 64-bit x86-64

Disassembly of section __TEXT,__text:

0000000100057b60 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE>:
100057b60: 55                          	pushq	%rbp
100057b61: 48 89 e5                    	movq	%rsp, %rbp
100057b64: 41 57                       	pushq	%r15
100057b66: 41 56                       	pushq	%r14
100057b68: 41 55                       	pushq	%r13
100057b6a: 41 54                       	pushq	%r12
100057b6c: 53                          	pushq	%rbx
100057b6d: 48 81 ec a8 04 00 00        	subq	$0x4a8, %rsp            ## imm = 0x4A8
100057b74: 0f 29 8d 00 fe ff ff        	movaps	%xmm1, -0x200(%rbp)
100057b7b: 0f 29 85 10 fe ff ff        	movaps	%xmm0, -0x1f0(%rbp)
100057b82: 49 89 ff                    	movq	%rdi, %r15
100057b85: 49 b8 ff ff ff ff ff ff ff 3f       	movabsq	$0x3fffffffffffffff, %r8 ## imm = 0x3FFFFFFFFFFFFFFF
100057b8f: 89 55 cc                    	movl	%edx, -0x34(%rbp)
100057b92: 48 63 c2                    	movslq	%edx, %rax
100057b95: 48 8b 16                    	movq	(%rsi), %rdx
100057b98: 48 8d 34 80                 	leaq	(%rax,%rax,4), %rsi
100057b9c: 48 c1 e6 04                 	shlq	$0x4, %rsi
100057ba0: 49 c7 47 10 00 00 00 00     	movq	$0x0, 0x10(%r15)
100057ba8: 49 c7 47 08 00 00 00 00     	movq	$0x0, 0x8(%r15)
100057bb0: 49 c7 07 00 00 00 00        	movq	$0x0, (%r15)
100057bb7: 4c 89 bd 58 fd ff ff        	movq	%r15, -0x2a8(%rbp)
100057bbe: 89 4d c8                    	movl	%ecx, -0x38(%rbp)
100057bc1: 89 8d 60 fd ff ff           	movl	%ecx, -0x2a0(%rbp)
100057bc7: 89 85 64 fd ff ff           	movl	%eax, -0x29c(%rbp)
100057bcd: 48 8b 04 32                 	movq	(%rdx,%rsi), %rax
100057bd1: 48 8b 4c 32 08              	movq	0x8(%rdx,%rsi), %rcx
100057bd6: 48 89 8d 70 fd ff ff        	movq	%rcx, -0x290(%rbp)
100057bdd: 48 89 85 68 fd ff ff        	movq	%rax, -0x298(%rbp)
100057be4: 4c 8d 64 32 10              	leaq	0x10(%rdx,%rsi), %r12
100057be9: 48 c7 85 88 fd ff ff 00 00 00 00    	movq	$0x0, -0x278(%rbp)
100057bf4: 48 c7 85 80 fd ff ff 00 00 00 00    	movq	$0x0, -0x280(%rbp)
100057bff: 48 c7 85 78 fd ff ff 00 00 00 00    	movq	$0x0, -0x288(%rbp)
100057c0a: 48 8b 7c 32 18              	movq	0x18(%rdx,%rsi), %rdi
100057c0f: 48 89 55 b0                 	movq	%rdx, -0x50(%rbp)
100057c13: 48 89 75 a0                 	movq	%rsi, -0x60(%rbp)
100057c17: 48 2b 7c 32 10              	subq	0x10(%rdx,%rsi), %rdi
100057c1c: 48 89 fb                    	movq	%rdi, %rbx
100057c1f: 48 c1 fb 02                 	sarq	$0x2, %rbx
100057c23: 4c 89 7d d0                 	movq	%r15, -0x30(%rbp)
100057c27: 74 51                       	je	0x100057c7a <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0x11a>
100057c29: 4c 39 c3                    	cmpq	%r8, %rbx
100057c2c: 0f 87 a8 0c 00 00           	ja	0x1000588da <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xd7a>
100057c32: e8 ff b7 15 00              	callq	0x1001b3436 <dyld_stub_binder+0x1001b3436>
100057c37: 49 89 c5                    	movq	%rax, %r13
100057c3a: 4c 89 ad 80 fd ff ff        	movq	%r13, -0x280(%rbp)
100057c41: 4c 89 ad 78 fd ff ff        	movq	%r13, -0x288(%rbp)
100057c48: 49 8d 44 9d 00              	leaq	(%r13,%rbx,4), %rax
100057c4d: 48 89 85 88 fd ff ff        	movq	%rax, -0x278(%rbp)
100057c54: 49 8b 34 24                 	movq	(%r12), %rsi
100057c58: 49 8b 5c 24 08              	movq	0x8(%r12), %rbx
100057c5d: 48 29 f3                    	subq	%rsi, %rbx
100057c60: 48 85 db                    	testq	%rbx, %rbx
100057c63: 7e 15                       	jle	0x100057c7a <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0x11a>
100057c65: 4c 89 ef                    	movq	%r13, %rdi
100057c68: 48 89 da                    	movq	%rbx, %rdx
100057c6b: e8 3a b9 15 00              	callq	0x1001b35aa <dyld_stub_binder+0x1001b35aa>
100057c70: 49 01 dd                    	addq	%rbx, %r13
100057c73: 4c 89 ad 80 fd ff ff        	movq	%r13, -0x280(%rbp)
100057c7a: 4c 8d 75 10                 	leaq	0x10(%rbp), %r14
100057c7e: 48 8b 4d b0                 	movq	-0x50(%rbp), %rcx
100057c82: 48 8b 55 a0                 	movq	-0x60(%rbp), %rdx
100057c86: 48 8d 34 11                 	leaq	(%rcx,%rdx), %rsi
100057c8a: 0f 10 44 11 28              	movups	0x28(%rcx,%rdx), %xmm0
100057c8f: 0f 11 85 90 fd ff ff        	movups	%xmm0, -0x270(%rbp)
100057c96: 48 8b 44 11 38              	movq	0x38(%rcx,%rdx), %rax
100057c9b: 48 89 85 a0 fd ff ff        	movq	%rax, -0x260(%rbp)
100057ca2: 48 8b 44 11 40              	movq	0x40(%rcx,%rdx), %rax
100057ca7: 48 89 85 a8 fd ff ff        	movq	%rax, -0x258(%rbp)
100057cae: 48 85 c0                    	testq	%rax, %rax
100057cb1: 74 05                       	je	0x100057cb8 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0x158>
100057cb3: f0                          	lock
100057cb4: 48 ff 40 08                 	incq	0x8(%rax)
100057cb8: 8b 44 11 48                 	movl	0x48(%rcx,%rdx), %eax
100057cbc: 89 85 b0 fd ff ff           	movl	%eax, -0x250(%rbp)
100057cc2: 49 8b 46 28                 	movq	0x28(%r14), %rax
100057cc6: 48 89 85 e0 fd ff ff        	movq	%rax, -0x220(%rbp)
100057ccd: 49 8b 46 20                 	movq	0x20(%r14), %rax
100057cd1: 48 89 85 d8 fd ff ff        	movq	%rax, -0x228(%rbp)
100057cd8: 49 8b 46 18                 	movq	0x18(%r14), %rax
100057cdc: 48 89 85 d0 fd ff ff        	movq	%rax, -0x230(%rbp)
100057ce3: 49 8b 46 10                 	movq	0x10(%r14), %rax
100057ce7: 48 89 85 c8 fd ff ff        	movq	%rax, -0x238(%rbp)
100057cee: 49 8b 06                    	movq	(%r14), %rax
100057cf1: 49 8b 4e 08                 	movq	0x8(%r14), %rcx
100057cf5: 48 89 8d c0 fd ff ff        	movq	%rcx, -0x240(%rbp)
100057cfc: 48 89 85 b8 fd ff ff        	movq	%rax, -0x248(%rbp)
100057d03: 0f 28 85 10 fe ff ff        	movaps	-0x1f0(%rbp), %xmm0
100057d0a: 0f 13 85 e8 fd ff ff        	movlps	%xmm0, -0x218(%rbp)
100057d11: 0f 28 85 00 fe ff ff        	movaps	-0x200(%rbp), %xmm0
100057d18: 0f 13 85 f0 fd ff ff        	movlps	%xmm0, -0x210(%rbp)
100057d1f: 4c 89 bd b8 fc ff ff        	movq	%r15, -0x348(%rbp)
100057d26: 8b 45 c8                    	movl	-0x38(%rbp), %eax
100057d29: 89 85 c0 fc ff ff           	movl	%eax, -0x340(%rbp)
100057d2f: 8b 45 cc                    	movl	-0x34(%rbp), %eax
100057d32: 89 85 c4 fc ff ff           	movl	%eax, -0x33c(%rbp)
100057d38: 48 8b 06                    	movq	(%rsi), %rax
100057d3b: 48 89 b5 f8 fd ff ff        	movq	%rsi, -0x208(%rbp)
100057d42: 48 8b 4e 08                 	movq	0x8(%rsi), %rcx
100057d46: 48 89 8d d0 fc ff ff        	movq	%rcx, -0x330(%rbp)
100057d4d: 48 89 85 c8 fc ff ff        	movq	%rax, -0x338(%rbp)
100057d54: 48 c7 85 e8 fc ff ff 00 00 00 00    	movq	$0x0, -0x318(%rbp)
100057d5f: 48 c7 85 e0 fc ff ff 00 00 00 00    	movq	$0x0, -0x320(%rbp)
100057d6a: 48 c7 85 d8 fc ff ff 00 00 00 00    	movq	$0x0, -0x328(%rbp)
100057d75: 49 8b 7c 24 08              	movq	0x8(%r12), %rdi
100057d7a: 49 2b 3c 24                 	subq	(%r12), %rdi
100057d7e: 48 89 fb                    	movq	%rdi, %rbx
100057d81: 48 c1 fb 02                 	sarq	$0x2, %rbx
100057d85: 74 5b                       	je	0x100057de2 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0x282>
100057d87: 48 b8 ff ff ff ff ff ff ff 3f       	movabsq	$0x3fffffffffffffff, %rax ## imm = 0x3FFFFFFFFFFFFFFF
100057d91: 48 39 c3                    	cmpq	%rax, %rbx
100057d94: 0f 87 4c 0b 00 00           	ja	0x1000588e6 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xd86>
100057d9a: e8 97 b6 15 00              	callq	0x1001b3436 <dyld_stub_binder+0x1001b3436>
100057d9f: 49 89 c5                    	movq	%rax, %r13
100057da2: 4c 89 ad e0 fc ff ff        	movq	%r13, -0x320(%rbp)
100057da9: 4c 89 ad d8 fc ff ff        	movq	%r13, -0x328(%rbp)
100057db0: 49 8d 44 9d 00              	leaq	(%r13,%rbx,4), %rax
100057db5: 48 89 85 e8 fc ff ff        	movq	%rax, -0x318(%rbp)
100057dbc: 49 8b 34 24                 	movq	(%r12), %rsi
100057dc0: 49 8b 5c 24 08              	movq	0x8(%r12), %rbx
100057dc5: 48 29 f3                    	subq	%rsi, %rbx
100057dc8: 48 85 db                    	testq	%rbx, %rbx
100057dcb: 7e 15                       	jle	0x100057de2 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0x282>
100057dcd: 4c 89 ef                    	movq	%r13, %rdi
100057dd0: 48 89 da                    	movq	%rbx, %rdx
100057dd3: e8 d2 b7 15 00              	callq	0x1001b35aa <dyld_stub_binder+0x1001b35aa>
100057dd8: 49 01 dd                    	addq	%rbx, %r13
100057ddb: 4c 89 ad e0 fc ff ff        	movq	%r13, -0x320(%rbp)
100057de2: 48 8b 45 b0                 	movq	-0x50(%rbp), %rax
100057de6: 48 8b 4d a0                 	movq	-0x60(%rbp), %rcx
100057dea: 4c 8d 7c 08 28              	leaq	0x28(%rax,%rcx), %r15
100057def: 41 0f 10 07                 	movups	(%r15), %xmm0
100057df3: 0f 11 85 f0 fc ff ff        	movups	%xmm0, -0x310(%rbp)
100057dfa: 49 8b 47 10                 	movq	0x10(%r15), %rax
100057dfe: 48 89 85 00 fd ff ff        	movq	%rax, -0x300(%rbp)
100057e05: 49 8b 47 18                 	movq	0x18(%r15), %rax
100057e09: 48 89 85 08 fd ff ff        	movq	%rax, -0x2f8(%rbp)
100057e10: 48 85 c0                    	testq	%rax, %rax
100057e13: 74 05                       	je	0x100057e1a <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0x2ba>
100057e15: f0                          	lock
100057e16: 48 ff 40 08                 	incq	0x8(%rax)
100057e1a: 41 8b 47 20                 	movl	0x20(%r15), %eax
100057e1e: 89 85 10 fd ff ff           	movl	%eax, -0x2f0(%rbp)
100057e24: 49 8b 46 28                 	movq	0x28(%r14), %rax
100057e28: 48 89 85 40 fd ff ff        	movq	%rax, -0x2c0(%rbp)
100057e2f: 49 8b 46 20                 	movq	0x20(%r14), %rax
100057e33: 48 89 85 38 fd ff ff        	movq	%rax, -0x2c8(%rbp)
100057e3a: 49 8b 46 18                 	movq	0x18(%r14), %rax
100057e3e: 48 89 85 30 fd ff ff        	movq	%rax, -0x2d0(%rbp)
100057e45: 49 8b 46 10                 	movq	0x10(%r14), %rax
100057e49: 48 89 85 28 fd ff ff        	movq	%rax, -0x2d8(%rbp)
100057e50: 49 8b 06                    	movq	(%r14), %rax
100057e53: 49 8b 4e 08                 	movq	0x8(%r14), %rcx
100057e57: 48 89 8d 20 fd ff ff        	movq	%rcx, -0x2e0(%rbp)
100057e5e: 48 89 85 18 fd ff ff        	movq	%rax, -0x2e8(%rbp)
100057e65: 0f 28 85 10 fe ff ff        	movaps	-0x1f0(%rbp), %xmm0
100057e6c: 0f 13 85 48 fd ff ff        	movlps	%xmm0, -0x2b8(%rbp)
100057e73: 0f 28 85 00 fe ff ff        	movaps	-0x200(%rbp), %xmm0
100057e7a: 0f 13 85 50 fd ff ff        	movlps	%xmm0, -0x2b0(%rbp)
100057e81: 48 8b 45 d0                 	movq	-0x30(%rbp), %rax
100057e85: 48 89 85 28 fe ff ff        	movq	%rax, -0x1d8(%rbp)
100057e8c: 48 8b 8d f8 fd ff ff        	movq	-0x208(%rbp), %rcx
100057e93: 48 8b 01                    	movq	(%rcx), %rax
100057e96: 48 8b 49 08                 	movq	0x8(%rcx), %rcx
100057e9a: 48 89 8d 38 fe ff ff        	movq	%rcx, -0x1c8(%rbp)
100057ea1: 48 89 85 30 fe ff ff        	movq	%rax, -0x1d0(%rbp)
100057ea8: 48 c7 85 50 fe ff ff 00 00 00 00    	movq	$0x0, -0x1b0(%rbp)
100057eb3: 48 c7 85 48 fe ff ff 00 00 00 00    	movq	$0x0, -0x1b8(%rbp)
100057ebe: 48 c7 85 40 fe ff ff 00 00 00 00    	movq	$0x0, -0x1c0(%rbp)
100057ec9: 49 8b 7c 24 08              	movq	0x8(%r12), %rdi
100057ece: 49 2b 3c 24                 	subq	(%r12), %rdi
100057ed2: 48 89 fb                    	movq	%rdi, %rbx
100057ed5: 48 c1 fb 02                 	sarq	$0x2, %rbx
100057ed9: 74 5b                       	je	0x100057f36 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0x3d6>
100057edb: 48 b8 ff ff ff ff ff ff ff 3f       	movabsq	$0x3fffffffffffffff, %rax ## imm = 0x3FFFFFFFFFFFFFFF
100057ee5: 48 39 c3                    	cmpq	%rax, %rbx
100057ee8: 0f 87 04 0a 00 00           	ja	0x1000588f2 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xd92>
100057eee: e8 43 b5 15 00              	callq	0x1001b3436 <dyld_stub_binder+0x1001b3436>
100057ef3: 49 89 c5                    	movq	%rax, %r13
100057ef6: 4c 89 ad 48 fe ff ff        	movq	%r13, -0x1b8(%rbp)
100057efd: 4c 89 ad 40 fe ff ff        	movq	%r13, -0x1c0(%rbp)
100057f04: 49 8d 44 9d 00              	leaq	(%r13,%rbx,4), %rax
100057f09: 48 89 85 50 fe ff ff        	movq	%rax, -0x1b0(%rbp)
100057f10: 49 8b 34 24                 	movq	(%r12), %rsi
100057f14: 49 8b 5c 24 08              	movq	0x8(%r12), %rbx
100057f19: 48 29 f3                    	subq	%rsi, %rbx
100057f1c: 48 85 db                    	testq	%rbx, %rbx
100057f1f: 7e 15                       	jle	0x100057f36 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0x3d6>
100057f21: 4c 89 ef                    	movq	%r13, %rdi
100057f24: 48 89 da                    	movq	%rbx, %rdx
100057f27: e8 7e b6 15 00              	callq	0x1001b35aa <dyld_stub_binder+0x1001b35aa>
100057f2c: 49 01 dd                    	addq	%rbx, %r13
100057f2f: 4c 89 ad 48 fe ff ff        	movq	%r13, -0x1b8(%rbp)
100057f36: 41 0f 10 07                 	movups	(%r15), %xmm0
100057f3a: 0f 11 85 58 fe ff ff        	movups	%xmm0, -0x1a8(%rbp)
100057f41: 49 8b 47 10                 	movq	0x10(%r15), %rax
100057f45: 48 89 85 68 fe ff ff        	movq	%rax, -0x198(%rbp)
100057f4c: 49 8b 47 18                 	movq	0x18(%r15), %rax
100057f50: 48 89 85 70 fe ff ff        	movq	%rax, -0x190(%rbp)
100057f57: 48 85 c0                    	testq	%rax, %rax
100057f5a: 74 05                       	je	0x100057f61 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0x401>
100057f5c: f0                          	lock
100057f5d: 48 ff 40 08                 	incq	0x8(%rax)
100057f61: 41 8b 47 20                 	movl	0x20(%r15), %eax
100057f65: 89 85 78 fe ff ff           	movl	%eax, -0x188(%rbp)
100057f6b: 8b 45 c8                    	movl	-0x38(%rbp), %eax
100057f6e: 89 85 80 fe ff ff           	movl	%eax, -0x180(%rbp)
100057f74: 8b 45 cc                    	movl	-0x34(%rbp), %eax
100057f77: 89 85 84 fe ff ff           	movl	%eax, -0x17c(%rbp)
100057f7d: 49 8b 46 28                 	movq	0x28(%r14), %rax
100057f81: 48 89 85 b0 fe ff ff        	movq	%rax, -0x150(%rbp)
100057f88: 49 8b 46 20                 	movq	0x20(%r14), %rax
100057f8c: 48 89 85 a8 fe ff ff        	movq	%rax, -0x158(%rbp)
100057f93: 49 8b 46 18                 	movq	0x18(%r14), %rax
100057f97: 48 89 85 a0 fe ff ff        	movq	%rax, -0x160(%rbp)
100057f9e: 49 8b 46 10                 	movq	0x10(%r14), %rax
100057fa2: 48 89 85 98 fe ff ff        	movq	%rax, -0x168(%rbp)
100057fa9: 49 8b 06                    	movq	(%r14), %rax
100057fac: 49 8b 4e 08                 	movq	0x8(%r14), %rcx
100057fb0: 48 89 8d 90 fe ff ff        	movq	%rcx, -0x170(%rbp)
100057fb7: 48 89 85 88 fe ff ff        	movq	%rax, -0x178(%rbp)
100057fbe: 0f 28 85 10 fe ff ff        	movaps	-0x1f0(%rbp), %xmm0
100057fc5: 0f 13 85 b8 fe ff ff        	movlps	%xmm0, -0x148(%rbp)
100057fcc: 0f 28 85 00 fe ff ff        	movaps	-0x200(%rbp), %xmm0
100057fd3: 0f 13 85 c0 fe ff ff        	movlps	%xmm0, -0x140(%rbp)
100057fda: 49 8b 04 24                 	movq	(%r12), %rax
100057fde: 49 8b 4c 24 08              	movq	0x8(%r12), %rcx
100057fe3: 48 39 c8                    	cmpq	%rcx, %rax
100057fe6: 74 58                       	je	0x100058040 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0x4e0>
100057fe8: 48 8d 51 fc                 	leaq	-0x4(%rcx), %rdx
100057fec: 48 29 c2                    	subq	%rax, %rdx
100057fef: 48 c1 ea 02                 	shrq	$0x2, %rdx
100057ff3: 48 ff c2                    	incq	%rdx
100057ff6: 0f 57 c9                    	xorps	%xmm1, %xmm1
100057ff9: 48 83 fa 08                 	cmpq	$0x8, %rdx
100057ffd: 48 89 c6                    	movq	%rax, %rsi
100058000: 4c 8b 75 d0                 	movq	-0x30(%rbp), %r14
100058004: 0f 82 e6 00 00 00           	jb	0x1000580f0 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0x590>
10005800a: 49 b8 f8 ff ff ff ff ff ff 7f       	movabsq	$0x7ffffffffffffff8, %r8 ## imm = 0x7FFFFFFFFFFFFFF8
100058014: 49 21 d0                    	andq	%rdx, %r8
100058017: 49 8d 70 f8                 	leaq	-0x8(%r8), %rsi
10005801b: 48 89 f3                    	movq	%rsi, %rbx
10005801e: 48 c1 eb 03                 	shrq	$0x3, %rbx
100058022: 8d 7b 01                    	leal	0x1(%rbx), %edi
100058025: 83 e7 03                    	andl	$0x3, %edi
100058028: 48 83 fe 18                 	cmpq	$0x18, %rsi
10005802c: 73 1e                       	jae	0x10005804c <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0x4ec>
10005802e: 0f 57 c0                    	xorps	%xmm0, %xmm0
100058031: 31 db                       	xorl	%ebx, %ebx
100058033: 0f 57 c9                    	xorps	%xmm1, %xmm1
100058036: 48 85 ff                    	testq	%rdi, %rdi
100058039: 75 73                       	jne	0x1000580ae <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0x54e>
10005803b: e9 96 00 00 00              	jmp	0x1000580d6 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0x576>
100058040: 0f 57 c9                    	xorps	%xmm1, %xmm1
100058043: 4c 8b 75 d0                 	movq	-0x30(%rbp), %r14
100058047: e9 b1 00 00 00              	jmp	0x1000580fd <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0x59d>
10005804c: 48 8d 77 ff                 	leaq	-0x1(%rdi), %rsi
100058050: 48 29 de                    	subq	%rbx, %rsi
100058053: 0f 57 c0                    	xorps	%xmm0, %xmm0
100058056: 31 db                       	xorl	%ebx, %ebx
100058058: 0f 57 c9                    	xorps	%xmm1, %xmm1
10005805b: 0f 1f 44 00 00              	nopl	(%rax,%rax)
100058060: 0f 10 14 98                 	movups	(%rax,%rbx,4), %xmm2
100058064: 0f 58 d0                    	addps	%xmm0, %xmm2
100058067: 0f 10 44 98 10              	movups	0x10(%rax,%rbx,4), %xmm0
10005806c: 0f 58 c1                    	addps	%xmm1, %xmm0
10005806f: 0f 10 4c 98 20              	movups	0x20(%rax,%rbx,4), %xmm1
100058074: 0f 10 5c 98 30              	movups	0x30(%rax,%rbx,4), %xmm3
100058079: 0f 10 64 98 40              	movups	0x40(%rax,%rbx,4), %xmm4
10005807e: 0f 58 e1                    	addps	%xmm1, %xmm4
100058081: 0f 58 e2                    	addps	%xmm2, %xmm4
100058084: 0f 10 54 98 50              	movups	0x50(%rax,%rbx,4), %xmm2
100058089: 0f 58 d3                    	addps	%xmm3, %xmm2
10005808c: 0f 58 d0                    	addps	%xmm0, %xmm2
10005808f: 0f 10 44 98 60              	movups	0x60(%rax,%rbx,4), %xmm0
100058094: 0f 58 c4                    	addps	%xmm4, %xmm0
100058097: 0f 10 4c 98 70              	movups	0x70(%rax,%rbx,4), %xmm1
10005809c: 0f 58 ca                    	addps	%xmm2, %xmm1
10005809f: 48 83 c3 20                 	addq	$0x20, %rbx
1000580a3: 48 83 c6 04                 	addq	$0x4, %rsi
1000580a7: 75 b7                       	jne	0x100058060 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0x500>
1000580a9: 48 85 ff                    	testq	%rdi, %rdi
1000580ac: 74 28                       	je	0x1000580d6 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0x576>
1000580ae: 48 8d 74 98 10              	leaq	0x10(%rax,%rbx,4), %rsi
1000580b3: 48 f7 df                    	negq	%rdi
1000580b6: 66 2e 0f 1f 84 00 00 00 00 00       	nopw	%cs:(%rax,%rax)
1000580c0: 0f 10 56 f0                 	movups	-0x10(%rsi), %xmm2
1000580c4: 0f 58 c2                    	addps	%xmm2, %xmm0
1000580c7: 0f 10 16                    	movups	(%rsi), %xmm2
1000580ca: 0f 58 ca                    	addps	%xmm2, %xmm1
1000580cd: 48 83 c6 20                 	addq	$0x20, %rsi
1000580d1: 48 ff c7                    	incq	%rdi
1000580d4: 75 ea                       	jne	0x1000580c0 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0x560>
1000580d6: 0f 58 c1                    	addps	%xmm1, %xmm0
1000580d9: 0f 28 c8                    	movaps	%xmm0, %xmm1
1000580dc: 0f 12 c9                    	movhlps	%xmm1, %xmm1            ## xmm1 = xmm1[1,1]
1000580df: 0f 58 c8                    	addps	%xmm0, %xmm1
1000580e2: f2 0f 7c c9                 	haddps	%xmm1, %xmm1
1000580e6: 4c 39 c2                    	cmpq	%r8, %rdx
1000580e9: 74 12                       	je	0x1000580fd <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0x59d>
1000580eb: 4a 8d 34 80                 	leaq	(%rax,%r8,4), %rsi
1000580ef: 90                          	nop
1000580f0: f3 0f 58 0e                 	addss	(%rsi), %xmm1
1000580f4: 48 83 c6 04                 	addq	$0x4, %rsi
1000580f8: 48 39 f1                    	cmpq	%rsi, %rcx
1000580fb: 75 f3                       	jne	0x1000580f0 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0x590>
1000580fd: 48 8b 55 b0                 	movq	-0x50(%rbp), %rdx
100058101: 48 8b 75 a0                 	movq	-0x60(%rbp), %rsi
100058105: 83 7c 32 0c 00              	cmpl	$0x0, 0xc(%rdx,%rsi)
10005810a: 0f 88 a1 03 00 00           	js	0x1000584b1 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0x951>
100058110: 0f 57 c9                    	xorps	%xmm1, %xmm1
100058113: 0f 2e 4c 32 04              	ucomiss	0x4(%rdx,%rsi), %xmm1
100058118: 0f 83 be 06 00 00           	jae	0x1000587dc <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xc7c>
10005811e: 48 8d 8d b8 fd ff ff        	leaq	-0x248(%rbp), %rcx
100058125: 8b 95 60 fd ff ff           	movl	-0x2a0(%rbp), %edx
10005812b: 8b b5 64 fd ff ff           	movl	-0x29c(%rbp), %esi
100058131: 48 63 85 74 fd ff ff        	movslq	-0x28c(%rbp), %rax
100058138: f3 0f 10 85 6c fd ff ff     	movss	-0x294(%rbp), %xmm0
100058140: f2 0f 10 95 e8 fd ff ff     	movsd	-0x218(%rbp), %xmm2
100058148: 0f 29 55 b0                 	movaps	%xmm2, -0x50(%rbp)
10005814c: f2 0f 10 95 f0 fd ff ff     	movsd	-0x210(%rbp), %xmm2
100058154: 0f 29 55 a0                 	movaps	%xmm2, -0x60(%rbp)
100058158: 48 8b 79 28                 	movq	0x28(%rcx), %rdi
10005815c: 48 89 7d 98                 	movq	%rdi, -0x68(%rbp)
100058160: 48 8b 79 20                 	movq	0x20(%rcx), %rdi
100058164: 48 89 7d 90                 	movq	%rdi, -0x70(%rbp)
100058168: 48 8b 79 18                 	movq	0x18(%rcx), %rdi
10005816c: 48 89 7d 88                 	movq	%rdi, -0x78(%rbp)
100058170: 48 8b 79 10                 	movq	0x10(%rcx), %rdi
100058174: 48 89 7d 80                 	movq	%rdi, -0x80(%rbp)
100058178: 48 8b 39                    	movq	(%rcx), %rdi
10005817b: 48 8b 49 08                 	movq	0x8(%rcx), %rcx
10005817f: 48 89 8d 78 ff ff ff        	movq	%rcx, -0x88(%rbp)
100058186: 48 89 bd 70 ff ff ff        	movq	%rdi, -0x90(%rbp)
10005818d: 48 c7 85 d8 fe ff ff 01 00 00 00    	movq	$0x1, -0x128(%rbp)
100058198: c7 85 e0 fe ff ff 00 00 00 00       	movl	$0x0, -0x120(%rbp)
1000581a2: c7 85 e8 fe ff ff 00 00 80 3f       	movl	$0x3f800000, -0x118(%rbp) ## imm = 0x3F800000
1000581ac: 0f 28 15 8d c6 15 00        	movaps	0x15c68d(%rip), %xmm2   ## 0x1001b4840 <__ZTSNSt3__120__shared_ptr_emplaceI12FragmentViewNS_9allocatorIS1_EEEE+0x90>
1000581b3: 0f 11 95 28 ff ff ff        	movups	%xmm2, -0xd8(%rbp)
1000581ba: c7 85 38 ff ff ff 00 00 80 3f       	movl	$0x3f800000, -0xc8(%rbp) ## imm = 0x3F800000
1000581c4: 48 c7 85 44 ff ff ff 00 00 00 00    	movq	$0x0, -0xbc(%rbp)
1000581cf: 48 c7 85 3c ff ff ff 00 00 00 00    	movq	$0x0, -0xc4(%rbp)
1000581da: 48 c7 85 60 ff ff ff 00 00 00 00    	movq	$0x0, -0xa0(%rbp)
1000581e5: c7 85 68 ff ff ff 00 00 00 00       	movl	$0x0, -0x98(%rbp)
1000581ef: 89 95 c8 fe ff ff           	movl	%edx, -0x138(%rbp)
1000581f5: 89 b5 cc fe ff ff           	movl	%esi, -0x134(%rbp)
1000581fb: 89 85 d0 fe ff ff           	movl	%eax, -0x130(%rbp)
100058201: 48 8d 0d a8 ff 15 00        	leaq	0x15ffa8(%rip), %rcx    ## 0x1001b81b0 <__ZN3DyeL5kBPLoE>
100058208: 8b 0c 81                    	movl	(%rcx,%rax,4), %ecx
10005820b: 89 8d d4 fe ff ff           	movl	%ecx, -0x12c(%rbp)
100058211: f3 0f 11 85 e4 fe ff ff     	movss	%xmm0, -0x11c(%rbp)
100058219: 48 8d 04 40                 	leaq	(%rax,%rax,2), %rax
10005821d: 48 8d 0d ec 91 25 00        	leaq	0x2591ec(%rip), %rcx    ## 0x1002b1410 <__ZN3DyeL7kColorsE>
100058224: 8b 54 81 08                 	movl	0x8(%rcx,%rax,4), %edx
100058228: 89 95 5c ff ff ff           	movl	%edx, -0xa4(%rbp)
10005822e: 48 8b 04 81                 	movq	(%rcx,%rax,4), %rax
100058232: 48 89 85 54 ff ff ff        	movq	%rax, -0xac(%rbp)
100058239: f3 0f 5e 05 8f 0e 1f 00     	divss	0x1f0e8f(%rip), %xmm0   ## 0x1002490d0 <__ZN6GelSim7gTuningE>
100058241: f3 0f 10 15 b7 c2 15 00     	movss	0x15c2b7(%rip), %xmm2   ## 0x1001b4500 <dyld_stub_binder+0x1001b4500>
100058249: f3 0f 5d d0                 	minss	%xmm0, %xmm2
10005824d: f3 0f c2 c1 01              	cmpltss	%xmm1, %xmm0
100058252: 0f 55 c2                    	andnps	%xmm2, %xmm0
100058255: f3 0f 10 0d 3f ff 15 00     	movss	0x15ff3f(%rip), %xmm1   ## 0x1001b819c <__ZTSZN9FileWatch10loadShaderEN5boost10filesystem4pathES2_NSt3__18functionIFvNS3_10shared_ptrIN6cinder2gl8GlslProgEEEEEEE3$_3+0xdc>
10005825d: e8 a8 b3 15 00              	callq	0x1001b360a <dyld_stub_binder+0x1001b360a>
100058262: f3 0f 11 85 50 ff ff ff     	movss	%xmm0, -0xb0(%rbp)
10005826a: 8b 85 54 ff ff ff           	movl	-0xac(%rbp), %eax
100058270: f3 0f 10 85 58 ff ff ff     	movss	-0xa8(%rbp), %xmm0
100058278: f3 0f 10 8d 5c ff ff ff     	movss	-0xa4(%rbp), %xmm1
100058280: 66 0f 6e d8                 	movd	%eax, %xmm3
100058284: f3 0f 10 15 a8 c2 15 00     	movss	0x15c2a8(%rip), %xmm2   ## 0x1001b4534 <dyld_stub_binder+0x1001b4534>
10005828c: f3 0f 59 da                 	mulss	%xmm2, %xmm3
100058290: 0f 28 e0                    	movaps	%xmm0, %xmm4
100058293: f3 0f 59 e2                 	mulss	%xmm2, %xmm4
100058297: f3 0f 59 d1                 	mulss	%xmm1, %xmm2
10005829b: f3 0f 11 9d ec fe ff ff     	movss	%xmm3, -0x114(%rbp)
1000582a3: f3 0f 11 a5 f0 fe ff ff     	movss	%xmm4, -0x110(%rbp)
1000582ab: f3 0f 11 95 f4 fe ff ff     	movss	%xmm2, -0x10c(%rbp)
1000582b3: f3 0f 10 ad 70 ff ff ff     	movss	-0x90(%rbp), %xmm5
1000582bb: f3 0f 10 b5 74 ff ff ff     	movss	-0x8c(%rbp), %xmm6
1000582c3: f3 0f 59 35 e1 fe 15 00     	mulss	0x15fee1(%rip), %xmm6   ## 0x1001b81ac <__ZTSZN9FileWatch10loadShaderEN5boost10filesystem4pathES2_NSt3__18functionIFvNS3_10shared_ptrIN6cinder2gl8GlslProgEEEEEEE3$_3+0xec>
1000582cb: 0f 54 2d 5e db 15 00        	andps	0x15db5e(%rip), %xmm5   ## 0x1001b5e30 <__ZTSZN15GelSettingsView11makeSlidersEvE4$_12+0x50>
1000582d2: f3 0f 5e 2d 42 0e 1f 00     	divss	0x1f0e42(%rip), %xmm5   ## 0x10024911c <__ZN6GelSim7gTuningE+0x4c>
1000582da: f3 0f 59 ee                 	mulss	%xmm6, %xmm5
1000582de: f3 0f 5f 2d 1a c2 15 00     	maxss	0x15c21a(%rip), %xmm5   ## 0x1001b4500 <dyld_stub_binder+0x1001b4500>
1000582e6: f3 0f 2c cd                 	cvttss2si	%xmm5, %ecx
1000582ea: 89 8d 4c ff ff ff           	movl	%ecx, -0xb4(%rbp)
1000582f0: 8b 8d e8 fe ff ff           	movl	-0x118(%rbp), %ecx
1000582f6: 89 8d 88 fb ff ff           	movl	%ecx, -0x478(%rbp)
1000582fc: 48 8b 8d e0 fe ff ff        	movq	-0x120(%rbp), %rcx
100058303: 48 89 8d 80 fb ff ff        	movq	%rcx, -0x480(%rbp)
10005830a: 48 8b 8d d8 fe ff ff        	movq	-0x128(%rbp), %rcx
100058311: 48 89 8d 78 fb ff ff        	movq	%rcx, -0x488(%rbp)
100058318: 48 8b 8d c8 fe ff ff        	movq	-0x138(%rbp), %rcx
10005831f: 48 8b 95 d0 fe ff ff        	movq	-0x130(%rbp), %rdx
100058326: 48 89 95 70 fb ff ff        	movq	%rdx, -0x490(%rbp)
10005832d: 48 89 8d 68 fb ff ff        	movq	%rcx, -0x498(%rbp)
100058334: f3 0f 11 9d 8c fb ff ff     	movss	%xmm3, -0x474(%rbp)
10005833c: f3 0f 11 a5 90 fb ff ff     	movss	%xmm4, -0x470(%rbp)
100058344: f3 0f 11 95 94 fb ff ff     	movss	%xmm2, -0x46c(%rbp)
10005834c: 48 8d bd 98 fb ff ff        	leaq	-0x468(%rbp), %rdi
100058353: 48 8d 9d f8 fe ff ff        	leaq	-0x108(%rbp), %rbx
10005835a: b9 17 00 00 00              	movl	$0x17, %ecx
10005835f: 48 89 de                    	movq	%rbx, %rsi
100058362: f3 a5                       	rep		movsl	(%rsi), %es:(%rdi)
100058364: 89 85 f4 fb ff ff           	movl	%eax, -0x40c(%rbp)
10005836a: f3 0f 11 85 f8 fb ff ff     	movss	%xmm0, -0x408(%rbp)
100058372: f3 0f 11 8d fc fb ff ff     	movss	%xmm1, -0x404(%rbp)
10005837a: 48 8b 85 60 ff ff ff        	movq	-0xa0(%rbp), %rax
100058381: 48 89 85 00 fc ff ff        	movq	%rax, -0x400(%rbp)
100058388: 8b 85 68 ff ff ff           	movl	-0x98(%rbp), %eax
10005838e: 89 85 08 fc ff ff           	movl	%eax, -0x3f8(%rbp)
100058394: f3 0f 10 15 3c 0d 1f 00     	movss	0x1f0d3c(%rip), %xmm2   ## 0x1002490d8 <__ZN6GelSim7gTuningE+0x8>
10005839c: 48 8b 45 98                 	movq	-0x68(%rbp), %rax
1000583a0: 48 89 44 24 28              	movq	%rax, 0x28(%rsp)
1000583a5: 48 8b 45 90                 	movq	-0x70(%rbp), %rax
1000583a9: 48 89 44 24 20              	movq	%rax, 0x20(%rsp)
1000583ae: 48 8b 45 88                 	movq	-0x78(%rbp), %rax
1000583b2: 48 89 44 24 18              	movq	%rax, 0x18(%rsp)
1000583b7: 48 8b 45 80                 	movq	-0x80(%rbp), %rax
1000583bb: 48 89 44 24 10              	movq	%rax, 0x10(%rsp)
1000583c0: 48 8b 85 70 ff ff ff        	movq	-0x90(%rbp), %rax
1000583c7: 48 8b 8d 78 ff ff ff        	movq	-0x88(%rbp), %rcx
1000583ce: 48 89 4c 24 08              	movq	%rcx, 0x8(%rsp)
1000583d3: 48 89 04 24                 	movq	%rax, (%rsp)
1000583d7: 48 8d bd 10 fc ff ff        	leaq	-0x3f0(%rbp), %rdi
1000583de: 48 8d b5 68 fb ff ff        	leaq	-0x498(%rbp), %rsi
1000583e5: 0f 28 45 b0                 	movaps	-0x50(%rbp), %xmm0
1000583e9: 0f 28 4d a0                 	movaps	-0x60(%rbp), %xmm1
1000583ed: e8 fe ee ff ff              	callq	0x1000572f0 <__ZN6GelSim16calcBandGeometryENS_7ContextE4BandN6cinder5RectTIfEEf>
1000583f2: 48 8d bd c8 fe ff ff        	leaq	-0x138(%rbp), %rdi
1000583f9: 48 8d b5 10 fc ff ff        	leaq	-0x3f0(%rbp), %rsi
100058400: ba a4 00 00 00              	movl	$0xa4, %edx
100058405: e8 a0 b1 15 00              	callq	0x1001b35aa <dyld_stub_binder+0x1001b35aa>
10005840a: 49 8b 46 08                 	movq	0x8(%r14), %rax
10005840e: 49 3b 46 10                 	cmpq	0x10(%r14), %rax
100058412: 0f 83 b5 03 00 00           	jae	0x1000587cd <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xc6d>
100058418: 48 8d 95 60 ff ff ff        	leaq	-0xa0(%rbp), %rdx
10005841f: 8b 8d e8 fe ff ff           	movl	-0x118(%rbp), %ecx
100058425: 89 48 20                    	movl	%ecx, 0x20(%rax)
100058428: 48 8b 8d e0 fe ff ff        	movq	-0x120(%rbp), %rcx
10005842f: 48 89 48 18                 	movq	%rcx, 0x18(%rax)
100058433: 48 8b 8d d8 fe ff ff        	movq	-0x128(%rbp), %rcx
10005843a: 48 89 48 10                 	movq	%rcx, 0x10(%rax)
10005843e: 48 8b 8d c8 fe ff ff        	movq	-0x138(%rbp), %rcx
100058445: 48 8b b5 d0 fe ff ff        	movq	-0x130(%rbp), %rsi
10005844c: 48 89 70 08                 	movq	%rsi, 0x8(%rax)
100058450: 48 89 08                    	movq	%rcx, (%rax)
100058453: 8b 8d ec fe ff ff           	movl	-0x114(%rbp), %ecx
100058459: 89 48 24                    	movl	%ecx, 0x24(%rax)
10005845c: 8b 8d f0 fe ff ff           	movl	-0x110(%rbp), %ecx
100058462: 89 48 28                    	movl	%ecx, 0x28(%rax)
100058465: 8b 8d f4 fe ff ff           	movl	-0x10c(%rbp), %ecx
10005846b: 89 48 2c                    	movl	%ecx, 0x2c(%rax)
10005846e: 48 8d 78 30                 	leaq	0x30(%rax), %rdi
100058472: b9 17 00 00 00              	movl	$0x17, %ecx
100058477: 48 89 de                    	movq	%rbx, %rsi
10005847a: f3 a5                       	rep		movsl	(%rsi), %es:(%rdi)
10005847c: 8b 8d 54 ff ff ff           	movl	-0xac(%rbp), %ecx
100058482: 89 88 8c 00 00 00           	movl	%ecx, 0x8c(%rax)
100058488: 8b 8d 58 ff ff ff           	movl	-0xa8(%rbp), %ecx
10005848e: 89 88 90 00 00 00           	movl	%ecx, 0x90(%rax)
100058494: 8b 8d 5c ff ff ff           	movl	-0xa4(%rbp), %ecx
10005849a: 89 88 94 00 00 00           	movl	%ecx, 0x94(%rax)
1000584a0: 8b 4a 08                    	movl	0x8(%rdx), %ecx
1000584a3: 89 88 a0 00 00 00           	movl	%ecx, 0xa0(%rax)
1000584a9: 48 8b 0a                    	movq	(%rdx), %rcx
1000584ac: e9 ff 02 00 00              	jmp	0x1000587b0 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xc50>
1000584b1: 0f 57 c0                    	xorps	%xmm0, %xmm0
1000584b4: 0f 2e c8                    	ucomiss	%xmm0, %xmm1
1000584b7: 0f 84 db 01 00 00           	je	0x100058698 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xb38>
1000584bd: 48 39 c8                    	cmpq	%rcx, %rax
1000584c0: 0f 84 d2 01 00 00           	je	0x100058698 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xb38>
1000584c6: 48 8b 85 40 fe ff ff        	movq	-0x1c0(%rbp), %rax
1000584cd: 48 8b 8d 48 fe ff ff        	movq	-0x1b8(%rbp), %rcx
1000584d4: 48 39 c1                    	cmpq	%rax, %rcx
1000584d7: 0f 84 ff 02 00 00           	je	0x1000587dc <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xc7c>
1000584dd: 4c 8d a5 30 fe ff ff        	leaq	-0x1d0(%rbp), %r12
1000584e4: f3 0f 10 05 14 c0 15 00     	movss	0x15c014(%rip), %xmm0   ## 0x1001b4500 <dyld_stub_binder+0x1001b4500>
1000584ec: f3 0f 5e c1                 	divss	%xmm1, %xmm0
1000584f0: f3 0f 11 45 b0              	movss	%xmm0, -0x50(%rbp)
1000584f5: 31 db                       	xorl	%ebx, %ebx
1000584f7: 0f 57 c9                    	xorps	%xmm1, %xmm1
1000584fa: 4c 8d ad 10 fc ff ff        	leaq	-0x3f0(%rbp), %r13
100058501: 66 66 66 66 66 66 2e 0f 1f 84 00 00 00 00 00	nopw	%cs:(%rax,%rax)
100058510: f3 0f 10 04 98              	movss	(%rax,%rbx,4), %xmm0
100058515: 0f 2e c8                    	ucomiss	%xmm0, %xmm1
100058518: 0f 83 32 01 00 00           	jae	0x100058650 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xaf0>
10005851e: f3 0f 59 45 b0              	mulss	-0x50(%rbp), %xmm0
100058523: 4c 8b bd 28 fe ff ff        	movq	-0x1d8(%rbp), %r15
10005852a: 8b b5 80 fe ff ff           	movl	-0x180(%rbp), %esi
100058530: 8b 95 84 fe ff ff           	movl	-0x17c(%rbp), %edx
100058536: 48 ff c3                    	incq	%rbx
100058539: f2 0f 10 8d b8 fe ff ff     	movsd	-0x148(%rbp), %xmm1
100058541: f2 0f 10 95 c0 fe ff ff     	movsd	-0x140(%rbp), %xmm2
100058549: 49 8b 84 24 80 00 00 00     	movq	0x80(%r12), %rax
100058551: 48 89 44 24 28              	movq	%rax, 0x28(%rsp)
100058556: 49 8b 44 24 78              	movq	0x78(%r12), %rax
10005855b: 48 89 44 24 20              	movq	%rax, 0x20(%rsp)
100058560: 49 8b 44 24 70              	movq	0x70(%r12), %rax
100058565: 48 89 44 24 18              	movq	%rax, 0x18(%rsp)
10005856a: 49 8b 44 24 68              	movq	0x68(%r12), %rax
10005856f: 48 89 44 24 10              	movq	%rax, 0x10(%rsp)
100058574: 49 8b 44 24 58              	movq	0x58(%r12), %rax
100058579: 49 8b 4c 24 60              	movq	0x60(%r12), %rcx
10005857e: 48 89 4c 24 08              	movq	%rcx, 0x8(%rsp)
100058583: 48 89 04 24                 	movq	%rax, (%rsp)
100058587: 4c 89 ef                    	movq	%r13, %rdi
10005858a: 4c 89 e1                    	movq	%r12, %rcx
10005858d: 41 89 d8                    	movl	%ebx, %r8d
100058590: e8 1b f1 ff ff              	callq	0x1000576b0 <__ZN6GelSim19fragAggregateToBandEiiRKN6Sample8FragmentEifNS_7ContextEN6cinder5RectTIfEE>
100058595: 49 8b 47 08                 	movq	0x8(%r15), %rax
100058599: 49 3b 47 10                 	cmpq	0x10(%r15), %rax
10005859d: 0f 83 bd 00 00 00           	jae	0x100058660 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xb00>
1000585a3: 8b 8d 30 fc ff ff           	movl	-0x3d0(%rbp), %ecx
1000585a9: 89 48 20                    	movl	%ecx, 0x20(%rax)
1000585ac: 48 8b 8d 28 fc ff ff        	movq	-0x3d8(%rbp), %rcx
1000585b3: 48 89 48 18                 	movq	%rcx, 0x18(%rax)
1000585b7: 48 8b 8d 20 fc ff ff        	movq	-0x3e0(%rbp), %rcx
1000585be: 48 89 48 10                 	movq	%rcx, 0x10(%rax)
1000585c2: 48 8b 8d 10 fc ff ff        	movq	-0x3f0(%rbp), %rcx
1000585c9: 48 8b 95 18 fc ff ff        	movq	-0x3e8(%rbp), %rdx
1000585d0: 48 89 50 08                 	movq	%rdx, 0x8(%rax)
1000585d4: 48 89 08                    	movq	%rcx, (%rax)
1000585d7: 8b 8d 34 fc ff ff           	movl	-0x3cc(%rbp), %ecx
1000585dd: 89 48 24                    	movl	%ecx, 0x24(%rax)
1000585e0: 8b 8d 38 fc ff ff           	movl	-0x3c8(%rbp), %ecx
1000585e6: 89 48 28                    	movl	%ecx, 0x28(%rax)
1000585e9: 8b 8d 3c fc ff ff           	movl	-0x3c4(%rbp), %ecx
1000585ef: 89 48 2c                    	movl	%ecx, 0x2c(%rax)
1000585f2: 48 8d 78 30                 	leaq	0x30(%rax), %rdi
1000585f6: b9 17 00 00 00              	movl	$0x17, %ecx
1000585fb: 48 8d 95 40 fc ff ff        	leaq	-0x3c0(%rbp), %rdx
100058602: 48 89 d6                    	movq	%rdx, %rsi
100058605: f3 a5                       	rep		movsl	(%rsi), %es:(%rdi)
100058607: 8b 8d 9c fc ff ff           	movl	-0x364(%rbp), %ecx
10005860d: 89 88 8c 00 00 00           	movl	%ecx, 0x8c(%rax)
100058613: 8b 8d a0 fc ff ff           	movl	-0x360(%rbp), %ecx
100058619: 89 88 90 00 00 00           	movl	%ecx, 0x90(%rax)
10005861f: 8b 8d a4 fc ff ff           	movl	-0x35c(%rbp), %ecx
100058625: 89 88 94 00 00 00           	movl	%ecx, 0x94(%rax)
10005862b: 8b 4a 70                    	movl	0x70(%rdx), %ecx
10005862e: 89 88 a0 00 00 00           	movl	%ecx, 0xa0(%rax)
100058634: 48 8b 4a 68                 	movq	0x68(%rdx), %rcx
100058638: 48 89 88 98 00 00 00        	movq	%rcx, 0x98(%rax)
10005863f: 49 81 47 08 a4 00 00 00     	addq	$0xa4, 0x8(%r15)
100058647: eb 22                       	jmp	0x10005866b <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xb0b>
100058649: 0f 1f 80 00 00 00 00        	nopl	(%rax)
100058650: 48 ff c3                    	incq	%rbx
100058653: eb 2b                       	jmp	0x100058680 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xb20>
100058655: 66 66 2e 0f 1f 84 00 00 00 00 00    	nopw	%cs:(%rax,%rax)
100058660: 4c 89 ff                    	movq	%r15, %rdi
100058663: 4c 89 ee                    	movq	%r13, %rsi
100058666: e8 d5 03 00 00              	callq	0x100058a40 <__ZNSt3__16vectorI4BandNS_9allocatorIS1_EEE21__push_back_slow_pathIS1_EEvOT_>
10005866b: 48 8b 85 40 fe ff ff        	movq	-0x1c0(%rbp), %rax
100058672: 48 8b 8d 48 fe ff ff        	movq	-0x1b8(%rbp), %rcx
100058679: 4c 8b 75 d0                 	movq	-0x30(%rbp), %r14
10005867d: 0f 57 c9                    	xorps	%xmm1, %xmm1
100058680: 48 89 ca                    	movq	%rcx, %rdx
100058683: 48 29 c2                    	subq	%rax, %rdx
100058686: 48 c1 fa 02                 	sarq	$0x2, %rdx
10005868a: 48 39 da                    	cmpq	%rbx, %rdx
10005868d: 0f 87 7d fe ff ff           	ja	0x100058510 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0x9b0>
100058693: e9 44 01 00 00              	jmp	0x1000587dc <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xc7c>
100058698: 48 8d 8d c8 fc ff ff        	leaq	-0x338(%rbp), %rcx
10005869f: 8b b5 c0 fc ff ff           	movl	-0x340(%rbp), %esi
1000586a5: 8b 95 c4 fc ff ff           	movl	-0x33c(%rbp), %edx
1000586ab: f2 0f 10 8d 48 fd ff ff     	movsd	-0x2b8(%rbp), %xmm1
1000586b3: f2 0f 10 95 50 fd ff ff     	movsd	-0x2b0(%rbp), %xmm2
1000586bb: 48 8b 41 78                 	movq	0x78(%rcx), %rax
1000586bf: 48 89 44 24 28              	movq	%rax, 0x28(%rsp)
1000586c4: 48 8b 41 70                 	movq	0x70(%rcx), %rax
1000586c8: 48 89 44 24 20              	movq	%rax, 0x20(%rsp)
1000586cd: 48 8b 41 68                 	movq	0x68(%rcx), %rax
1000586d1: 48 89 44 24 18              	movq	%rax, 0x18(%rsp)
1000586d6: 48 8b 41 60                 	movq	0x60(%rcx), %rax
1000586da: 48 89 44 24 10              	movq	%rax, 0x10(%rsp)
1000586df: 48 8b 41 50                 	movq	0x50(%rcx), %rax
1000586e3: 48 8b 79 58                 	movq	0x58(%rcx), %rdi
1000586e7: 48 89 7c 24 08              	movq	%rdi, 0x8(%rsp)
1000586ec: 48 89 04 24                 	movq	%rax, (%rsp)
1000586f0: 48 8d bd 10 fc ff ff        	leaq	-0x3f0(%rbp), %rdi
1000586f7: f3 0f 10 05 01 be 15 00     	movss	0x15be01(%rip), %xmm0   ## 0x1001b4500 <dyld_stub_binder+0x1001b4500>
1000586ff: 41 b8 01 00 00 00           	movl	$0x1, %r8d
100058705: e8 a6 ef ff ff              	callq	0x1000576b0 <__ZN6GelSim19fragAggregateToBandEiiRKN6Sample8FragmentEifNS_7ContextEN6cinder5RectTIfEE>
10005870a: 49 8b 46 08                 	movq	0x8(%r14), %rax
10005870e: 49 3b 46 10                 	cmpq	0x10(%r14), %rax
100058712: 0f 83 ae 01 00 00           	jae	0x1000588c6 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xd66>
100058718: 8b 8d 30 fc ff ff           	movl	-0x3d0(%rbp), %ecx
10005871e: 89 48 20                    	movl	%ecx, 0x20(%rax)
100058721: 48 8b 8d 28 fc ff ff        	movq	-0x3d8(%rbp), %rcx
100058728: 48 89 48 18                 	movq	%rcx, 0x18(%rax)
10005872c: 48 8b 8d 20 fc ff ff        	movq	-0x3e0(%rbp), %rcx
100058733: 48 89 48 10                 	movq	%rcx, 0x10(%rax)
100058737: 48 8b 8d 10 fc ff ff        	movq	-0x3f0(%rbp), %rcx
10005873e: 48 8b 95 18 fc ff ff        	movq	-0x3e8(%rbp), %rdx
100058745: 48 89 50 08                 	movq	%rdx, 0x8(%rax)
100058749: 48 89 08                    	movq	%rcx, (%rax)
10005874c: 8b 8d 34 fc ff ff           	movl	-0x3cc(%rbp), %ecx
100058752: 89 48 24                    	movl	%ecx, 0x24(%rax)
100058755: 8b 8d 38 fc ff ff           	movl	-0x3c8(%rbp), %ecx
10005875b: 89 48 28                    	movl	%ecx, 0x28(%rax)
10005875e: 8b 8d 3c fc ff ff           	movl	-0x3c4(%rbp), %ecx
100058764: 89 48 2c                    	movl	%ecx, 0x2c(%rax)
100058767: 48 8d 78 30                 	leaq	0x30(%rax), %rdi
10005876b: 48 8d b5 40 fc ff ff        	leaq	-0x3c0(%rbp), %rsi
100058772: b9 17 00 00 00              	movl	$0x17, %ecx
100058777: f3 a5                       	rep		movsl	(%rsi), %es:(%rdi)
100058779: 8b 8d 9c fc ff ff           	movl	-0x364(%rbp), %ecx
10005877f: 89 88 8c 00 00 00           	movl	%ecx, 0x8c(%rax)
100058785: 8b 8d a0 fc ff ff           	movl	-0x360(%rbp), %ecx
10005878b: 89 88 90 00 00 00           	movl	%ecx, 0x90(%rax)
100058791: 8b 8d a4 fc ff ff           	movl	-0x35c(%rbp), %ecx
100058797: 89 88 94 00 00 00           	movl	%ecx, 0x94(%rax)
10005879d: 8b 8d b0 fc ff ff           	movl	-0x350(%rbp), %ecx
1000587a3: 89 88 a0 00 00 00           	movl	%ecx, 0xa0(%rax)
1000587a9: 48 8b 8d a8 fc ff ff        	movq	-0x358(%rbp), %rcx
1000587b0: 48 89 88 98 00 00 00        	movq	%rcx, 0x98(%rax)
1000587b7: 49 81 46 08 a4 00 00 00     	addq	$0xa4, 0x8(%r14)
1000587bf: 48 8b 9d 70 fe ff ff        	movq	-0x190(%rbp), %rbx
1000587c6: 48 85 db                    	testq	%rbx, %rbx
1000587c9: 75 1d                       	jne	0x1000587e8 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xc88>
1000587cb: eb 3e                       	jmp	0x10005880b <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xcab>
1000587cd: 48 8d b5 c8 fe ff ff        	leaq	-0x138(%rbp), %rsi
1000587d4: 4c 89 f7                    	movq	%r14, %rdi
1000587d7: e8 64 02 00 00              	callq	0x100058a40 <__ZNSt3__16vectorI4BandNS_9allocatorIS1_EEE21__push_back_slow_pathIS1_EEvOT_>
1000587dc: 48 8b 9d 70 fe ff ff        	movq	-0x190(%rbp), %rbx
1000587e3: 48 85 db                    	testq	%rbx, %rbx
1000587e6: 74 23                       	je	0x10005880b <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xcab>
1000587e8: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
1000587ef: f0                          	lock
1000587f0: 48 0f c1 43 08              	xaddq	%rax, 0x8(%rbx)
1000587f5: 48 85 c0                    	testq	%rax, %rax
1000587f8: 75 11                       	jne	0x10005880b <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xcab>
1000587fa: 48 8b 03                    	movq	(%rbx), %rax
1000587fd: 48 89 df                    	movq	%rbx, %rdi
100058800: ff 50 10                    	callq	*0x10(%rax)
100058803: 48 89 df                    	movq	%rbx, %rdi
100058806: e8 59 ab 15 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
10005880b: 48 8b bd 40 fe ff ff        	movq	-0x1c0(%rbp), %rdi
100058812: 48 85 ff                    	testq	%rdi, %rdi
100058815: 74 0c                       	je	0x100058823 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xcc3>
100058817: 48 89 bd 48 fe ff ff        	movq	%rdi, -0x1b8(%rbp)
10005881e: e8 07 ac 15 00              	callq	0x1001b342a <dyld_stub_binder+0x1001b342a>
100058823: 48 8b 9d 08 fd ff ff        	movq	-0x2f8(%rbp), %rbx
10005882a: 48 85 db                    	testq	%rbx, %rbx
10005882d: 74 23                       	je	0x100058852 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xcf2>
10005882f: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
100058836: f0                          	lock
100058837: 48 0f c1 43 08              	xaddq	%rax, 0x8(%rbx)
10005883c: 48 85 c0                    	testq	%rax, %rax
10005883f: 75 11                       	jne	0x100058852 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xcf2>
100058841: 48 8b 03                    	movq	(%rbx), %rax
100058844: 48 89 df                    	movq	%rbx, %rdi
100058847: ff 50 10                    	callq	*0x10(%rax)
10005884a: 48 89 df                    	movq	%rbx, %rdi
10005884d: e8 12 ab 15 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
100058852: 48 8b bd d8 fc ff ff        	movq	-0x328(%rbp), %rdi
100058859: 48 85 ff                    	testq	%rdi, %rdi
10005885c: 74 0c                       	je	0x10005886a <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xd0a>
10005885e: 48 89 bd e0 fc ff ff        	movq	%rdi, -0x320(%rbp)
100058865: e8 c0 ab 15 00              	callq	0x1001b342a <dyld_stub_binder+0x1001b342a>
10005886a: 48 8b 9d a8 fd ff ff        	movq	-0x258(%rbp), %rbx
100058871: 48 85 db                    	testq	%rbx, %rbx
100058874: 74 23                       	je	0x100058899 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xd39>
100058876: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
10005887d: f0                          	lock
10005887e: 48 0f c1 43 08              	xaddq	%rax, 0x8(%rbx)
100058883: 48 85 c0                    	testq	%rax, %rax
100058886: 75 11                       	jne	0x100058899 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xd39>
100058888: 48 8b 03                    	movq	(%rbx), %rax
10005888b: 48 89 df                    	movq	%rbx, %rdi
10005888e: ff 50 10                    	callq	*0x10(%rax)
100058891: 48 89 df                    	movq	%rbx, %rdi
100058894: e8 cb aa 15 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
100058899: 48 8b bd 78 fd ff ff        	movq	-0x288(%rbp), %rdi
1000588a0: 48 85 ff                    	testq	%rdi, %rdi
1000588a3: 74 0c                       	je	0x1000588b1 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xd51>
1000588a5: 48 89 bd 80 fd ff ff        	movq	%rdi, -0x280(%rbp)
1000588ac: e8 79 ab 15 00              	callq	0x1001b342a <dyld_stub_binder+0x1001b342a>
1000588b1: 4c 89 f0                    	movq	%r14, %rax
1000588b4: 48 81 c4 a8 04 00 00        	addq	$0x4a8, %rsp            ## imm = 0x4A8
1000588bb: 5b                          	popq	%rbx
1000588bc: 41 5c                       	popq	%r12
1000588be: 41 5d                       	popq	%r13
1000588c0: 41 5e                       	popq	%r14
1000588c2: 41 5f                       	popq	%r15
1000588c4: 5d                          	popq	%rbp
1000588c5: c3                          	retq
1000588c6: 48 8d b5 10 fc ff ff        	leaq	-0x3f0(%rbp), %rsi
1000588cd: 4c 89 f7                    	movq	%r14, %rdi
1000588d0: e8 6b 01 00 00              	callq	0x100058a40 <__ZNSt3__16vectorI4BandNS_9allocatorIS1_EEE21__push_back_slow_pathIS1_EEvOT_>
1000588d5: e9 02 ff ff ff              	jmp	0x1000587dc <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xc7c>
1000588da: 48 8d bd 78 fd ff ff        	leaq	-0x288(%rbp), %rdi
1000588e1: e8 34 a9 15 00              	callq	0x1001b321a <dyld_stub_binder+0x1001b321a>
1000588e6: 48 8d bd d8 fc ff ff        	leaq	-0x328(%rbp), %rdi
1000588ed: e8 28 a9 15 00              	callq	0x1001b321a <dyld_stub_binder+0x1001b321a>
1000588f2: 48 8d bd 40 fe ff ff        	leaq	-0x1c0(%rbp), %rdi
1000588f9: e8 1c a9 15 00              	callq	0x1001b321a <dyld_stub_binder+0x1001b321a>
1000588fe: 49 89 c7                    	movq	%rax, %r15
100058901: 48 8b bd 40 fe ff ff        	movq	-0x1c0(%rbp), %rdi
100058908: 48 85 ff                    	testq	%rdi, %rdi
10005890b: 75 72                       	jne	0x10005897f <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xe1f>
10005890d: eb 7c                       	jmp	0x10005898b <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xe2b>
10005890f: 49 89 c7                    	movq	%rax, %r15
100058912: 48 8b bd d8 fc ff ff        	movq	-0x328(%rbp), %rdi
100058919: 48 85 ff                    	testq	%rdi, %rdi
10005891c: 0f 85 a4 00 00 00           	jne	0x1000589c6 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xe66>
100058922: e9 ab 00 00 00              	jmp	0x1000589d2 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xe72>
100058927: 49 89 c7                    	movq	%rax, %r15
10005892a: 48 8b bd 78 fd ff ff        	movq	-0x288(%rbp), %rdi
100058931: 48 85 ff                    	testq	%rdi, %rdi
100058934: 0f 85 d3 00 00 00           	jne	0x100058a0d <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xead>
10005893a: e9 da 00 00 00              	jmp	0x100058a19 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xeb9>
10005893f: eb 00                       	jmp	0x100058941 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xde1>
100058941: 49 89 c7                    	movq	%rax, %r15
100058944: 48 8b 9d 70 fe ff ff        	movq	-0x190(%rbp), %rbx
10005894b: 48 85 db                    	testq	%rbx, %rbx
10005894e: 74 23                       	je	0x100058973 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xe13>
100058950: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
100058957: f0                          	lock
100058958: 48 0f c1 43 08              	xaddq	%rax, 0x8(%rbx)
10005895d: 48 85 c0                    	testq	%rax, %rax
100058960: 75 11                       	jne	0x100058973 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xe13>
100058962: 48 8b 03                    	movq	(%rbx), %rax
100058965: 48 89 df                    	movq	%rbx, %rdi
100058968: ff 50 10                    	callq	*0x10(%rax)
10005896b: 48 89 df                    	movq	%rbx, %rdi
10005896e: e8 f1 a9 15 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
100058973: 48 8b bd 40 fe ff ff        	movq	-0x1c0(%rbp), %rdi
10005897a: 48 85 ff                    	testq	%rdi, %rdi
10005897d: 74 0c                       	je	0x10005898b <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xe2b>
10005897f: 48 89 bd 48 fe ff ff        	movq	%rdi, -0x1b8(%rbp)
100058986: e8 9f aa 15 00              	callq	0x1001b342a <dyld_stub_binder+0x1001b342a>
10005898b: 48 8b 9d 08 fd ff ff        	movq	-0x2f8(%rbp), %rbx
100058992: 48 85 db                    	testq	%rbx, %rbx
100058995: 74 23                       	je	0x1000589ba <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xe5a>
100058997: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
10005899e: f0                          	lock
10005899f: 48 0f c1 43 08              	xaddq	%rax, 0x8(%rbx)
1000589a4: 48 85 c0                    	testq	%rax, %rax
1000589a7: 75 11                       	jne	0x1000589ba <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xe5a>
1000589a9: 48 8b 03                    	movq	(%rbx), %rax
1000589ac: 48 89 df                    	movq	%rbx, %rdi
1000589af: ff 50 10                    	callq	*0x10(%rax)
1000589b2: 48 89 df                    	movq	%rbx, %rdi
1000589b5: e8 aa a9 15 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
1000589ba: 48 8b bd d8 fc ff ff        	movq	-0x328(%rbp), %rdi
1000589c1: 48 85 ff                    	testq	%rdi, %rdi
1000589c4: 74 0c                       	je	0x1000589d2 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xe72>
1000589c6: 48 89 bd e0 fc ff ff        	movq	%rdi, -0x320(%rbp)
1000589cd: e8 58 aa 15 00              	callq	0x1001b342a <dyld_stub_binder+0x1001b342a>
1000589d2: 48 8b 9d a8 fd ff ff        	movq	-0x258(%rbp), %rbx
1000589d9: 48 85 db                    	testq	%rbx, %rbx
1000589dc: 74 23                       	je	0x100058a01 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xea1>
1000589de: 48 c7 c0 ff ff ff ff        	movq	$-0x1, %rax
1000589e5: f0                          	lock
1000589e6: 48 0f c1 43 08              	xaddq	%rax, 0x8(%rbx)
1000589eb: 48 85 c0                    	testq	%rax, %rax
1000589ee: 75 11                       	jne	0x100058a01 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xea1>
1000589f0: 48 8b 03                    	movq	(%rbx), %rax
1000589f3: 48 89 df                    	movq	%rbx, %rdi
1000589f6: ff 50 10                    	callq	*0x10(%rax)
1000589f9: 48 89 df                    	movq	%rbx, %rdi
1000589fc: e8 63 a9 15 00              	callq	0x1001b3364 <dyld_stub_binder+0x1001b3364>
100058a01: 48 8b bd 78 fd ff ff        	movq	-0x288(%rbp), %rdi
100058a08: 48 85 ff                    	testq	%rdi, %rdi
100058a0b: 74 0c                       	je	0x100058a19 <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xeb9>
100058a0d: 48 89 bd 80 fd ff ff        	movq	%rdi, -0x280(%rbp)
100058a14: e8 11 aa 15 00              	callq	0x1001b342a <dyld_stub_binder+0x1001b342a>
100058a19: 48 8b 45 d0                 	movq	-0x30(%rbp), %rax
100058a1d: 48 8b 38                    	movq	(%rax), %rdi
100058a20: 48 85 ff                    	testq	%rdi, %rdi
100058a23: 74 09                       	je	0x100058a2e <__ZN6GelSim11fragToBandsERK6SampleiN6cinder5RectTIfEEiNS_7ContextE+0xece>
100058a25: 48 89 78 08                 	movq	%rdi, 0x8(%rax)
100058a29: e8 fc a9 15 00              	callq	0x1001b342a <dyld_stub_binder+0x1001b342a>
100058a2e: 4c 89 ff                    	movq	%r15, %rdi
100058a31: e8 c4 a6 15 00              	callq	0x1001b30fa <dyld_stub_binder+0x1001b30fa>
100058a36: 66 2e 0f 1f 84 00 00 00 00 00       	nopw	%cs:(%rax,%rax)
