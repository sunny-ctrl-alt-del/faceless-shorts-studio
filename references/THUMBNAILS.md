# Thumbnails: what the 14 reference channels do, and our rules (studied 2026-11-11)

Grids: `references/_thumbs/A.jpg` (Ricks, Zack, GeoGlobe, AlexDiarys, wobbly, WhatIfMakes, afterhour) and `B.jpg`
(KAKAROTOx7, HidbenMechanics, ItsTimeForTACOS, Sized Understood, AfrimaxEnglish, itscoltrain, dindin.inparis): the 12
most-viewed Shorts each, as YouTube shows them on the channel's Shorts shelf (vertical 9:16).

## What they actually do
- **Almost nobody designs a poster.** 12 of 14 channels use a frame from the video (YouTube's pick or a chosen frame), so
  the frame is the thumbnail, and the burned-in caption word is often visible in it ("past", "end", "a cannonball").
  The real work is making the video's key frames thumbnail-worthy.
- **One big subject, centred.** Ricks, wobblybusiness, ItsTimeForTACOS and itscoltrain: a character's face in the middle
  60 % mid-reaction (wide eyes, open mouth, smirk). Zack D. Films and AfrimaxEnglish: a striking close-up (a face,
  a hand, a deer, a pumped-up giant). The cat channel: the cat's face or the food tray, tight.
- **Readable at stamp size.** High contrast, saturated (Ricks warm sets, wobbly pastels, Zack bright skies), plain
  backgrounds behind the subject, nothing small that matters.
- **Text, when there is any, is a hook, not the title.** HidbenMechanics: dark navy slide, 3-6 words, the key words in
  orange caps ("THAT KIND OF FORCE", "DOES NOTHING", "CUTTING IN LINE"). Sized Understood: a big readout (a clock,
  T+5.3 s, "$34", "1,100") does the job of text. KAKAROTOx7 (the only landscape thumbnails): the quote banner on top.
- **Maps and data are their own hook**: GeoGlobeTales' bold flat-colour countries; Sized Understood's HUD panels.
- **Bottom 20 % is wasted**: the Shorts UI covers it; nothing important sits there.

## Our rules (`pipeline.sh thumb <slug> <t> "<2-5 words with *accent*>" --y <px> [--crop-top 130] [--style dark|light|map|data]`)
1. Pick `t` where ONE subject fills the middle: the hero's face mid-reaction (Tall Tale, Doodle, parables), the key
   object/x-ray (Inside Out, Deep Dive), the map at its boldest (Paper Atlas), the biggest readout (Sim HUD), the
   strongest close-up (Classic Cuts; crop off the banner with `--crop-top 130`).
2. Headline = the curiosity gap in 2-5 words, never the title repeated: "IT'S NOT YOUR *BONES*", "ONE IS *5× FASTER*",
   "THEY CALLED IT *GLORY*". One or two accent words in orange (`dark`/`data`) or gold (`light`/`map`).
3. Put the headline in empty space: top band (y ≈ 110-300) when the face is lower, lower middle (y ≈ 1100-1450) when
   the face is high; never on a face, never below 1530 px.
4. Keep the frame bright and saturated (the tool lifts gamma/saturation and adds a light vignette); 1080×1920 JPEG < 2 MB.
5. Look at `renders/thumbnail.jpg` before posting. It's uploaded with Zapier YouTube "Update Video Thumbnail" after the
   video is posted (needs a phone-verified channel; if YouTube refuses, the post stands with YouTube's own frame).
6. Also make the frame at ~1-3 s and at the mid-point strong in the video itself (YouTube may still show its own pick in
   some places).
