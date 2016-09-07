wviz - a Virtual Watershed Visualizer
=====================================

I wrote wviz as a visualization tool for use when I give presentations
about watersheds, in particular when talking about my
[watersheds](http://github.com/embeepea/watersheds) project
[watersheds.fernleafinteractive.com](http://watersheds.fernleafinteractive.com).

It uses the [three.js](threejs.org) WebGL library to display a patch
of virtual terrain, giving the user the ability to change the point
of view, watch a drop of water flow downhill across the surface, and
compute and display upstream areas.

I wrote wviz for my own personal use in one specific context --- it isn't
intended to be generally useful outside of this context, or really by
anyone other than me.  That said, the code is open source and is
available to anyone who wants to take a look at it.  Just keep in mind
that I don't consider this to be my best code --- it's the result of
a long sequence of feature additions without much attention to overall
design.

Development Setup
=================

```
npm install
npm run dev
```

Production Setup
================

```
npm run build
npm run build-all
```

Keyboard Commands
=================

  * ' '    - advance drop once
  * '.'    - advance drop all the way
  * 'aa'   - toggle arrows
  * 'ac'   - toggle axes
  * 'ad'   - toggle dots (points in 2d grid)
  * 'ae'   - toggle terrain edges
  * 'af'   - toggle terrain faces
  * 'ah'   - toggle drop height line
  * 'am'   - toggle display of messages
  * 'ar'   - toggle 2D
  * 'at'   - toggle 3D

  * 'ccc'  - full reset
  * 'ct'   - clear trails

  * 'dt'   - define target: next shift-click will set yellow dot location

  * '#fr'  - set drop advance frame rate to #
  * '#fs'  - set drop advance frame speed to #

  * 'h'    - toggle drop neighbor height lines

  * 'n'    - toggle drop neighbors

  * 'r'    - rotate mode
  * 't'    - translate mode

  * 'sss'  - display modal dialog with current snapshot state details
  * 'sn'   - go to next snapshot
  * 'sp'   - go to prev snapshot
  * '#sj'  - jump to snapshot #
  * 'sw'   - scale world
  * 'sd'   - scale blue drop

  * 'uc'   - clear upstream areas
  * 'uu'   - draw current upstream area

  * 'x'    - toggle number labels on dots
