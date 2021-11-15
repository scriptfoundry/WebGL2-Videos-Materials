# WebGL 2
### A video series for learning WebGL 2 concepts
=====================================================

This repository contains all the final code files we've written in my series on WebGL 2 on YouTube. More will be added as new videos go up.

#### Episode list
1. Hello World   [link to come](#)
2. Uniforms 1  [link to come](#)
3. Attributes 1  [link to come](#)
4. Precision  [link to come](#)
5. Attributes 2  [link to come](#)
6. drawElements  [link to come](#)
7. Targets  [link to come](#)

#### About the series
Every video will attempt to demonstrate some aspect of WebGL 2 in isolation. We're avoiding all 3rd party dependencies. We're not building up to a grand application at the end. We're not even building our own WebGL library. All code will exist in a single page and, as much as possible, will focus on a single, isolated concept.

Please don't get distracted by my set-up. I'm writing to TypeScript files, but you'll probably just use JavaScript files. I'm using VSCode with the GLSL Lint extension, but you should use whatever you are most comfortable using. I'm using Parcel.js for hot-reloading and TypeScript transpilation, but you can use whatever system you like (even if that's just writing to a file on your desktop and hitting Ctrl+R.) If you spend more than a minute setting your environment up, that's a minute wasted that you could be learning WebGL.

I really hope you enjoy this series.

#### Wait! Hang on! Why bother?
Yeah. That's a great question. There are a lot of really, really, **really** good WebGL and OpenGL video tutorials out there. And I am pretty new to WebGL. I'm certainly no guru. So what on earth do I hope to offer other beginners?

Well, for one: what I want to offer are lessons that aren't immediately confusing. The truth is I'm trying to make the tutorial series I wish I had when I was starting out.

The problem with every tutorial series I found was that each one was in reality a tutorial in building a custom state-management API for WebGL. To get a program, you would call a utility function and get back an object of... things. To set a uniform, you would call another function that would return another object of... things. To get around WebGL's punishing verbosity, most tutorials would quickly construct a library of utility functions that built programs, collated state requirements, managed state mutations, managed draw calls and so on. And every series had its own custom API.  So to understand their lesson on, say, `vertexAttribPointer()` or **mipmaps** or `ModelViewPerspective` matrices, you had to first understand how their unique API worked. And if you went to another tutorial, you'd have to learn another unique API.

This is super important: There is *nothing* wrong with this approach. In fact, if you ever plan to build your own game or graphics application, you'll absolutely need your own system for abstraction or WebGL will make you go insane. But this abstraction is deadly for someone new to the series who wants to learn just one intermediate topic.

So the goal of this series is to introduce single WebGL concepts as directly and immediately as possible. No abstractions unless absolutely required. No external dependencies unless absolutely required.

That's my goal anyways.

Feedback is appreciated. You can leave comments in the videos or file pull requests here.

I'd make a video about this but honestly I hate YouTubers who insist on giving their life story. Nobody needs to hear mine.