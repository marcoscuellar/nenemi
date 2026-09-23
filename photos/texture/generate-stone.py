import math, random, sys
random.seed(7)
def stone_svg(W, H, cx, cy, R):
    """Carved-stone disc: rings, glyph blocks, step-frets, rays. Drawn white as a height map, then lit."""
    out=[]
    def ring(r, w): out.append(f"<circle cx='{cx:.1f}' cy='{cy:.1f}' r='{r:.1f}' fill='none' stroke='#fff' stroke-width='{w:.1f}'/>")
    def polar(r,a): return cx+r*math.cos(a), cy+r*math.sin(a)
    # outer band: glyph blocks (rounded squares with an inner step or dot motif)
    def block_band(r0, r1, n, kind):
        for i in range(n):
            a=(i+.5)/n*2*math.pi
            rm=(r0+r1)/2; size=(r1-r0)*0.78; x,y=polar(rm,a); deg=math.degrees(a)+90
            g=f"<g transform='translate({x:.1f} {y:.1f}) rotate({deg:.1f})'>"
            s=size/2
            g+=f"<rect x='{-s:.1f}' y='{-s:.1f}' width='{size:.1f}' height='{size:.1f}' rx='{size*.18:.1f}' fill='none' stroke='#fff' stroke-width='{size*.07:.1f}'/>"
            k=(i+kind)%4
            if k==0:   # stepped fret inside
                u=size*.14
                g+=f"<path d='M{-2*u:.1f} {2*u:.1f} H{-u:.1f} V{u:.1f} H0 V0 H{u:.1f} V{-u:.1f} H{2*u:.1f} V{-2*u:.1f}' fill='none' stroke='#fff' stroke-width='{size*.07:.1f}'/>"
            elif k==1: # two dots
                g+=f"<circle cx='{-s*.35:.1f}' cy='0' r='{s*.2:.1f}' fill='#fff'/><circle cx='{s*.35:.1f}' cy='0' r='{s*.2:.1f}' fill='#fff'/>"
            elif k==2: # square spiral
                u=size*.12
                g+=f"<path d='M{-3*u:.1f} {3*u:.1f} V{-3*u:.1f} H{3*u:.1f} V{2*u:.1f} H{-u:.1f} V{-u:.1f} H{u:.1f}' fill='none' stroke='#fff' stroke-width='{size*.07:.1f}'/>"
            else:      # bars
                for j in (-1,0,1): g+=f"<rect x='{-s*.55:.1f}' y='{j*s*.38-s*.07:.1f}' width='{s*1.1:.1f}' height='{s*.14:.1f}' rx='{s*.05:.1f}' fill='#fff'/>"
            out.append(g+"</g>")
    # step-fret band (continuous stepped zig-zag around a ring)
    def fret_band(r0, r1, n):
        pts=[]
        for i in range(n):
            a0=i/n*2*math.pi; a1=(i+.5)/n*2*math.pi; a2=(i+1)/n*2*math.pi
            for (r,a) in ((r0,a0),(r1,a0),(r1,a1),(r0,a1),(r0,a2)): pts.append(polar(r,a))
        d="M"+" L".join(f"{x:.1f} {y:.1f}" for x,y in pts)+" Z"
        out.append(f"<path d='{d}' fill='none' stroke='#fff' stroke-width='{(r1-r0)*.16:.1f}' stroke-linejoin='miter'/>")
    # rays: 8 long points + 8 short, generic sun rays
    def rays(r_in, r_out, n, width):
        for i in range(n):
            a=i/n*2*math.pi
            x1,y1=polar(r_in,a-width); x2,y2=polar(r_out,a); x3,y3=polar(r_in,a+width)
            out.append(f"<path d='M{x1:.1f} {y1:.1f} L{x2:.1f} {y2:.1f} L{x3:.1f} {y3:.1f}' fill='none' stroke='#fff' stroke-width='{R*.006:.1f}' stroke-linejoin='round'/>")
    # dots band
    def dots(r, n, rr):
        for i in range(n):
            x,y=polar(r,(i+.5)/n*2*math.pi); out.append(f"<circle cx='{x:.1f}' cy='{y:.1f}' r='{rr:.1f}' fill='#fff'/>")

    ring(R, R*.012); block_band(R*.86, R*.985, 44, 0); ring(R*.855, R*.008)
    fret_band(R*.77, R*.83, 64); ring(R*.765, R*.008)
    dots(R*.735, 72, R*.009); ring(R*.705, R*.006)
    block_band(R*.585, R*.69, 28, 1); ring(R*.575, R*.008)
    rays(R*.36, R*.57, 8, .16); rays(R*.40, R*.52, 8, .1)
    for i in range(8):  # offset the short rays between the long ones
        pass
    ring(R*.36, R*.01); fret_band(R*.30, R*.345, 32); ring(R*.29, R*.007)
    block_band(R*.17, R*.28, 12, 2); ring(R*.165, R*.008)
    # quiet centre: a stepped square, no face, no deity
    u=R*.04
    out.append(f"<path d='M{cx-3*u:.1f} {cy+3*u:.1f} V{cy-3*u:.1f} H{cx+3*u:.1f} V{cy+2*u:.1f} H{cx-u:.1f} V{cy-u:.1f} H{cx+u:.1f}' fill='none' stroke='#fff' stroke-width='{R*.012:.1f}'/>")
    heights="".join(out)
    return f"""<svg xmlns='http://www.w3.org/2000/svg' width='{W}' height='{H}' viewBox='0 0 {W} {H}'>
<defs>
 <filter id='emb' filterUnits='userSpaceOnUse' x='0' y='0' width='{W}' height='{H}' color-interpolation-filters='sRGB'>
  <feGaussianBlur in='SourceAlpha' stdDeviation='{max(1.4,R*.0028):.2f}' result='b'/>
  <feTurbulence type='fractalNoise' baseFrequency='.55' numOctaves='3' seed='11' result='n'/>
  <feColorMatrix in='n' type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  .9 0 0 0 0' result='na'/>
  <feComposite in='b' in2='na' operator='arithmetic' k1='0' k2='1' k3='.22' k4='0' result='h'/>
  <feDiffuseLighting in='h' surfaceScale='{max(3.0,R*.005):.2f}' diffuseConstant='1' lighting-color='#fff' result='lit'><feDistantLight azimuth='235' elevation='38'/></feDiffuseLighting>
  <feComponentTransfer in='lit'><feFuncR type='linear' slope='.085' intercept='-.028'/><feFuncG type='linear' slope='.085' intercept='-.028'/><feFuncB type='linear' slope='.085' intercept='-.026'/></feComponentTransfer>
 </filter>
 <filter id='grain' filterUnits='userSpaceOnUse' x='0' y='0' width='{W}' height='{H}' color-interpolation-filters='sRGB'>
  <feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' seed='4'/>
  <feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .02 0'/>
 </filter>
 <radialGradient id='vig' cx='{cx/W:.3f}' cy='{cy/H:.3f}' r='{max(W,H)/min(W,H)*.75:.2f}'>
  <stop offset='0' stop-color='#000' stop-opacity='0'/><stop offset='.55' stop-color='#000' stop-opacity='.25'/><stop offset='1' stop-color='#000' stop-opacity='.85'/>
 </radialGradient>
</defs>
<rect width='{W}' height='{H}' fill='#030403'/>
<g filter='url(#emb)'>{heights}</g>
<rect width='{W}' height='{H}' filter='url(#grain)'/>
<rect width='{W}' height='{H}' fill='url(#vig)'/>
</svg>"""
S=sys.argv[1]
# tall: sign-up panel (disc off to the lower right so the copy sits on the quieter part)
open(S+'/tall.svg','w').write(stone_svg(1440,1800,1240,1320,1150))
# wide: footer (disc centred, cropped top and bottom like the reference banner)
open(S+'/wide.svg','w').write(stone_svg(2400,900,1200,450,1250))
