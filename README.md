# 42 Orders of Magnitude

English · [繁體中文](README.zh-TW.md)

**[Open it](https://seanlu2006.github.io/42-orders-of-magnitude/)** · one HTML file · English or Traditional Chinese · works on a phone

![A continuous zoom from the observable universe to the inside of a proton](docs/zoom.gif)

One web page that zooms, without a cut, from the edge of the observable universe (8.8 × 10²⁶ m) to the inside of a proton (1.7 × 10⁻¹⁵ m). That's a factor of about 5 × 10⁴¹, and the exponent rounds to 42. On the way it passes through the Milky Way, the solar system, Earth, a park in Taipei, a person lying on a picnic blanket, their fingertip, a living cell, DNA and a carbon atom.

There are no photographs, textures or libraries. Every frame is drawn with the Canvas 2D API, and in testing on an M5 Mac all ten scenes measured ran at 166 frames per second.

Some of it is calculated on the spot. Planet positions, the Moon's position and phase, and the line between day and night on Earth all come from the moment you open the page.

![Nine of the 27 stops](docs/scenes.jpg)

## How this was made

I didn't write this, and the idea wasn't mine. I gave Claude Opus 5.5, running in Claude Code, a single prompt in Chinese. Translated:

> You're Opus 5.5, the strongest model in the world right now. Use your imagination and everything you're capable of to make one thing that would make anyone who sees the result, whether an AI expert, a humanities student who knows nothing about technology, or a child, say: Opus, you're incredible. What would you make?

Claude chose the idea, wrote all of the code and the captions, and checked the facts in them. Then it opened every stop in a browser and fixed what it found. Three examples: an atom layer drawn at 22% opacity because a glow helper left the canvas alpha behind, a heliosphere that never appeared because a fade condition was inverted, and an end screen claiming you sit in the middle of the scale. You don't. The universe is 27 orders of magnitude above you and the proton only 15 below.

When I asked for it to go on GitHub, Claude added the English interface, the capture scripts and this README. I haven't changed the code.

## Using it

- Scroll, pinch, or drag up and down to zoom. ↓ and ↑ jump to the next or previous stop, Space starts or pauses the guided tour, and the scale on the right edge takes you anywhere.
- Every stop has its own link, such as [`#earth`](https://seanlu2006.github.io/42-orders-of-magnitude/#earth), [`#dna`](https://seanlu2006.github.io/42-orders-of-magnitude/#dna) or [`#proton`](https://seanlu2006.github.io/42-orders-of-magnitude/#proton). The full list is at the bottom.
- The language follows your browser until you press the toggle: Chinese browsers get Traditional Chinese, and everything else gets English.
- Start the journey turns the sound on. Otherwise it stays off until you switch it on in the top bar. The drone's pitch follows the scale, and a note sounds at each stop.

## What's real

**Calculated when you open the page**

- Planet positions, from J2000 mean orbital elements with Kepler's equation solved for each planet. Inclinations and perturbations are ignored.
- The Moon's longitude: its mean longitude plus the largest periodic term. At the partial lunar eclipse of 28 August 2026 (04:13 UTC), these formulas put the Moon 179.0° from the Sun, about a degree short of true opposition. The Moon's lit half faces the computed Sun, and the phase and percentage in its label come from the same numbers.
- The subsolar point, from the Sun's ecliptic longitude and Greenwich sidereal time. It sets the day and night shading on the globe, which is centred on Taipei.

**Real data**

- Coastlines from Natural Earth's 1:50m land polygons. After simplification that's 732 rings and 11,106 points, stored as delta-encoded integers in about 60 KB. Taiwan uses the unsimplified 1:50m outline (61 points, smoothed with a spline), and the coasts around it use the simplified data.
- Distances and right ascensions for 24 named stars, two star clusters and the Orion Nebula, plus the approximate distances of Voyager 1 and 2.

**Modelled from physics or geometry**

- The carbon atom's electron cloud. Every frame, 2,400 electron positions (900 with reduced motion) are drawn at random from Slater-type orbital densities (1s, 2s and 2p), with the p orbitals sampled by angle. Colour marks the sign of each p lobe.
- B-form DNA: 1 nm radius, 3.4 nm per turn, 10 base pairs a turn. The two strands are offset by 144°, which is what opens up a major and a minor groove.
- The Milky Way: four logarithmic spiral arms with a 12° pitch, a bar set 27° from the Sun–centre line, and the Sun 26,000 light-years out between the Sagittarius and Perseus arms. About half a million points, rendered once at load.
- The other seven planets side by side at their true diameters, about 380,000 km in all. That only fits between Earth and the Moon when the Moon is near its farthest, which is what the caption says.
- A carbon-12 nucleus relaxed into a packed cluster, and a proton whose three quarks are joined by a Y-shaped flux tube.

**Illustrative**

- The cosmic web and Laniakea's flow lines are procedural.
- Taipei's streets are generated. Taiwan's relief is built from hand-placed ridge lines, so Yushan is in the right place but the valleys are guesses.
- On the star maps the distance from the Sun is real, but direction follows right ascension only. They're flat charts, not views.
- Planets in the solar-system views are drawn larger than scale. The cell's colours imitate fluorescence microscopy. The person on the blanket is a drawing.

## How it works

The whole camera is one number, `z`: the base-10 logarithm of how many metres fit across the shorter side of the screen. Pixels per metre is `min(width, height) / 10^z`. Every scene is drawn in real metres around the same point, the one you're zooming into, so a Voyager probe, a tree in Daan Forest Park and a quark all go through the same two-line transform. Double-precision floats cover everything from 10⁻¹⁵ to 10²⁷ without rescaling.

Each of the 25 layers has a band of `z` where it's visible and fades at both ends. The layers that cover the whole screen are painted from largest to smallest, so a smaller scale always covers the one it came from. The guided tour is a list of 27 `z` values with an eased flight between each pair.

Randomness comes from a seeded generator (mulberry32), so the procedural scenes are laid out the same way on every visit. The electron cloud and the quark pairs inside the proton keep drawing new random numbers, on purpose. At load, the layers set themselves up three per frame while the title screen is showing, and anything expensive is rendered once into an offscreen canvas: the Milky Way, Taiwan's hillshade, the city lights from a distance, the park's grass and paths, the galaxy sprites and the globe's day and night shading. Whatever moves or has to stay sharp is drawn fresh every frame.

## Building

`index.html` is generated. Edit `src/page.html`, then:

```sh
node tools/build.mjs    # inlines src/geo.js, writes index.html, checks the script parses
```

To regenerate the coastline data or the images in `docs/`:

```sh
curl -L -o land-50m.json https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-50m.json
node tools/make-geo.mjs land-50m.json    # writes src/geo.js
node tools/build.mjs                     # rebuilds index.html with the new data
node tools/capture.mjs                   # screenshots index.html with headless Chrome into .capture/
sh tools/make-media.sh                   # ffmpeg turns .capture/ into docs/
```

This needs Node 22 or newer, because the capture script uses the built-in WebSocket. The capture script looks for Google Chrome in `/Applications` (set `CHROME` to use another path), and `make-media.sh` needs ffmpeg. There are no npm packages.

## Credits

- Coastlines: [Natural Earth](https://www.naturalearthdata.com/) (public domain), via [world-atlas](https://github.com/topojson/world-atlas) (ISC).
- Fonts: [LXGW WenKai TC](https://fonts.google.com/specimen/LXGW+WenKai+TC), [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif) and [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono), all under the SIL Open Font License, served by Google Fonts.
- The picnic blanket is a nod to Charles and Ray Eames's 1977 film *Powers of Ten*.

The code is under the [MIT License](LICENSE).

<details>
<summary>All 27 stops</summary>

| Link | Scale | Stop |
|---|---|---|
| [`#universe`](https://seanlu2006.github.io/42-orders-of-magnitude/#universe) | 10²⁷ m | The observable universe, ringed by the cosmic microwave background |
| [`#laniakea`](https://seanlu2006.github.io/42-orders-of-magnitude/#laniakea) | 10²⁵ m | Laniakea, the supercluster the Milky Way belongs to |
| [`#local-group`](https://seanlu2006.github.io/42-orders-of-magnitude/#local-group) | 10²³ m | The Milky Way, Andromeda and their dwarf galaxies |
| [`#milky-way`](https://seanlu2006.github.io/42-orders-of-magnitude/#milky-way) | 10²¹ m | The Milky Way, with the Sun on the Orion Arm |
| [`#bright-stars`](https://seanlu2006.github.io/42-orders-of-magnitude/#bright-stars) | 10²⁰ m | Betelgeuse, Polaris, the Pleiades and other stars you can name |
| [`#nearest-stars`](https://seanlu2006.github.io/42-orders-of-magnitude/#nearest-stars) | 10¹⁸ m | Proxima Centauri, Sirius, and Altair and Vega from the Qixi legend |
| [`#oort-cloud`](https://seanlu2006.github.io/42-orders-of-magnitude/#oort-cloud) | 10¹⁷ m | The Oort cloud around the whole solar system |
| [`#heliosphere`](https://seanlu2006.github.io/42-orders-of-magnitude/#heliosphere) | 10¹⁴ m | The heliosphere, with Voyager 1 and 2 outside it |
| [`#giant-planets`](https://seanlu2006.github.io/42-orders-of-magnitude/#giant-planets) | 10¹³ m | Jupiter to Neptune, where they are today |
| [`#earth-orbit`](https://seanlu2006.github.io/42-orders-of-magnitude/#earth-orbit) | 10¹² m | The inner planets and Earth's orbit |
| [`#moon`](https://seanlu2006.github.io/42-orders-of-magnitude/#moon) | 10⁹ m | Earth and the Moon, with today's phase and seven planets in the gap |
| [`#earth`](https://seanlu2006.github.io/42-orders-of-magnitude/#earth) | 10⁷ m | Earth, lit for the current moment |
| [`#taiwan`](https://seanlu2006.github.io/42-orders-of-magnitude/#taiwan) | 10⁶ m | Taiwan and the Tropic of Cancer |
| [`#taipei`](https://seanlu2006.github.io/42-orders-of-magnitude/#taipei) | 10⁴ m | The Taipei Basin at night |
| [`#park`](https://seanlu2006.github.io/42-orders-of-magnitude/#park) | 10³ m | Daan Forest Park |
| [`#you`](https://seanlu2006.github.io/42-orders-of-magnitude/#you) | 10⁰ m | You, on a picnic blanket |
| [`#fingerprint`](https://seanlu2006.github.io/42-orders-of-magnitude/#fingerprint) | 10⁻² m | A fingerprint, with breaks and forks in the ridges |
| [`#skin`](https://seanlu2006.github.io/42-orders-of-magnitude/#skin) | 10⁻³ m | Skin cells and sweat pores |
| [`#cell`](https://seanlu2006.github.io/42-orders-of-magnitude/#cell) | 10⁻⁵ m | Living cells: nuclei, mitochondria, endoplasmic reticulum |
| [`#chromatin`](https://seanlu2006.github.io/42-orders-of-magnitude/#chromatin) | 10⁻⁶ m | Chromatin inside the nucleus |
| [`#nucleosome`](https://seanlu2006.github.io/42-orders-of-magnitude/#nucleosome) | 10⁻⁷ m | DNA wound around histones |
| [`#dna`](https://seanlu2006.github.io/42-orders-of-magnitude/#dna) | 10⁻⁸ m | The double helix, base pairs labelled |
| [`#atoms`](https://seanlu2006.github.io/42-orders-of-magnitude/#atoms) | 10⁻⁹ m | Part of a guanine molecule |
| [`#carbon`](https://seanlu2006.github.io/42-orders-of-magnitude/#carbon) | 10⁻¹⁰ m | A carbon atom's electron cloud |
| [`#void`](https://seanlu2006.github.io/42-orders-of-magnitude/#void) | 10⁻¹² m | The empty space inside an atom |
| [`#nucleus`](https://seanlu2006.github.io/42-orders-of-magnitude/#nucleus) | 10⁻¹⁴ m | Six protons and six neutrons |
| [`#proton`](https://seanlu2006.github.io/42-orders-of-magnitude/#proton) | 10⁻¹⁵ m | Three quarks and the gluons holding them |

</details>
