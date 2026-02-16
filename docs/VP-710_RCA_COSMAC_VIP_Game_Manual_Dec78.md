RCA COSMAC VIP Game Manual

|  0200 | A584 | I=0584  |
| --- | --- | --- |
|  0202 | 6100 | V1=00  |
|  0204 | 6219 | V2=19  |
|  0206 | D125 | SHOW 5MI@V1V2  |
|  0208 | A588 | I=0588  |
|  020A | 620D | V2=0D  |
|  020C | D125 | SHOW 5MI@V1V2  |
|  020E | A441 | I=0441  |
|  0210 | 6201 | V2=01  |
|  0212 | D125 | SHOW 5MI@V1V2  |
|  0214 | A513 | I=0513  |
|  0216 | 6131 | V1=31  |
|  0218 | 620E | V2=0E  |
|  021A | D124 | SHOW 4MI@V1V2  |
|  021C | A444 | I=0444  |
|  021E | 6209 | V2=09  |
|  0220 | 61FF | V1=FF  |
|  0222 | 7107 | V1+07  |
|  0224 | D122 | SHOW 2MI@V1V2  |
|  0226 | 3122 | SKIP;V1 EQ 22  |
|  0228 | 1222 | GO 0222  |
|  022A | 3209 | SKIP;V2 EQ 09  |
|  022C | 1232 | GO 0232  |
|  022E | 6215 | V2=15  |
|  0230 | 1220 | GO 0220  |
|  0232 | 6300 | V3=00  |
|  0234 | 6500 | V5=00  |
|  0236 | 6600 | V6=00  |
|  0238 | 2500 | DO 0500  |
|  023A | 2518 | DO 0518  |
|  023C | 6000 | V0=00  |
|  023E | 4400 | SKIP;V4 NE 00  |
|  0240 | 1248 | GO 0248  |
|  0242 | 700A | V0+0A  |
|  0244 | 74FF | V4+FF  |
|  0246 | 123E | GO 023E  |
|  0248 | A608 | I=0608  |
|  024A | F055 | MI=V0:V0  |
|  024C | 2500 | DO 0500  |
|  024E | 2518 | DO 0518  |
|  0250 | A608 | I=0608  |
|  0252 | F065 | V0:V0=MI  |
|  0254 | 8044 | V0=V0+V4  |
|  0256 | A600 | I=0600  |
|  0258 | F31E | I=I+V3  |
|  025A | F055 | MI=V0:V0  |
|  025C | 7301 | V3+01  |
|  025E | 3308 | SKIP;V3 EQ 08  |
|  0260 | 1238 | GO 0238  |
|  0262 | A600 | I=0600  |
|  0264 | F765 | V0:V7=MI  |
|  0266 | 4000 | SKIP;V0 NE 00  |
|  0268 | 12B2 | GO 02B2  |
|  026A | 4100 | SKIP;V1 NE 00  |
|  026C | 12B2 | GO 02B2  |
|  026E | 4400 | SKIP;V4 | NE | 00  |
| --- | --- | --- | --- | --- |
|  0270 | 12B2 | GO | 02B2 |   |
|  0272 | 4500 | SKIP;V5 | NE | 00  |
|  0274 | 12B2 | GO | 02B2 |   |
|  0276 | 680C | V8=0C |  |   |
|  0278 | 8805 | V8=V8-V0 |  |   |
|  027A | 4F00 | SKIP;VF | NE | 00  |
|  027C | 12B2 | GO | 02B2 |   |
|  027E | 680C | V8=0C |  |   |
|  0280 | 8845 | V8=V8-V4 |  |   |
|  0282 | 4F00 | SKIP;VF | NE | 00  |
|  0284 | 12B2 | GO | 02B2 |   |
|  0286 | 8860 | V8=V6 |  |   |
|  0288 | 8825 | V8=V8-V2 |  |   |
|  028A | 4F00 | SKIP;VF | NE | 00  |
|  028C | 12B2 | GO | 02B2 |   |
|  028E | 5620 | SKIP;V6 | EQ | V2  |
|  0290 | 12B8 | GO | 02B8 |   |
|  0292 | 8870 | V8=V7 |  |   |
|  0294 | 8835 | V8=V8-V3 |  |   |
|  0296 | 4F00 | SKIP;VF | NE | 00  |
|  0298 | 12B2 | GO | 02B2 |   |
|  029A | 5730 | SKIP;V7 | EQ | V3  |
|  029C | 12B8 | GO | 02B8 |   |
|  029E | 8840 | V8=V4 |  |   |
|  02A0 | 8805 | V8=V8-V0 |  |   |
|  02A2 | 4F00 | SKIP;VF | NE | 00  |
|  02A4 | 12B2 | GO | 02B2 |   |
|  02A6 | 5400 | SKIP;V4 | EQ | V0  |
|  02A8 | 12B8 | GO | 02B8 |   |
|  02AA | 8850 | V8=V5 |  |   |
|  02AC | 8815 | V8=V8-V1 |  |   |
|  02AE | 3F00 | SKIP;VF | EQ | 00  |
|  02B0 | 12B8 | GO | 02B8 |   |
|  02B2 | F518 | TONE=V5 |  |   |
|  02B4 | 00E0 | ERASE |  |   |
|  02B6 | 1200 | GO | 0200 |   |
|  02B8 | 8800 | V8=V0 |  |   |
|  02BA | 8910 | V9=V1 |  |   |
|  02BC | 8A80 | VA=V8 |  |   |
|  02BE | 253C | DO | 053C |   |
|  02C0 | 4B00 | SKIP;VB | NE | 00  |
|  02C2 | 12D2 | GO | 02D2 |   |
|  02C4 | 3B29 | SKIP;VB | EQ | 29  |
|  02C6 | 12B2 | GO | 02B2 |   |
|  02C8 | 8920 | V9=V2 |  |   |
|  02CA | 8A30 | VA=V3 |  |   |
|  02CC | 2554 | DO | 0554 |   |
|  02CE | 3B03 | SKIP;VB | EQ | 03  |
|  02D0 | 12B2 | GO | 02B2 |   |
|  02D2 | 8950 | V9=V5 |  |   |
|  02D4 | 8A40 | VA=V4 |  |   |
|  02D6 | 253C | DO | 053C |   |
|  02D8 | 4B00 | SKIP;VB | NE | 00  |
|  02DA | 12EA | GO | 02EA |   |

13. VIP Biorhythm

|  02DC | 3B29 | SKIP;VB | EQ | 29 | 034A | 0714  |
| --- | --- | --- | --- | --- | --- | --- |
|  02DE | 12B2 | GO | 02B2 |  | 034C | 1BD4  |
|  02E0 | 8960 | V9=V6 |  |  | 034E | 2448 DO 0448  |
|  02E2 | 8A70 | VA=V7 |  |  | 0350 | A600 I=0600  |
|  02E4 | 2554 | DO | 0554 |  | 0352 | F765 V0:V7=MI  |
|  02E6 | 3B03 | SKIP;VB | EQ | 03 | 0354 | 75FF V5+FF  |
|  02E8 | 12B2 | GO | 02B2 |  | 0356 | 3500 SKIP;V5 EQ 00  |
|  02EA | 6C00 | VC=00 |  |  | 0358 | 137C GO 037C  |
|  02EC | 6D00 | VD=00 |  |  | 035A | 74FF V4+FF  |
|  02EE | 6E00 | VE=00 |  |  | 035C | 3400 SKIP;V4 EQ 00  |
|  02F0 | 24F2 | DO | 04F2 |  | 035E | 1370 GO 0370  |
|  02F2 | 8050 | V0=V5 |  |  | 0360 | 640C V4=0C  |
|  02F4 | 39AA | SKIP;V9 | EQ | AA | 0362 | 77FF V7+FF  |
|  02F6 | 12FE | GO | 02FE |  | 0364 | 37FF SKIP;V7 EQ FF  |
|  02F8 | 8015 | V0=V0-V1 |  |  | 0366 | 1370 GO 0370  |
|  02FA | 24B6 | DO | 04B6 |  | 0368 | 6763 V7=63  |
|  02FC | 132A | GO | 032A |  | 036A | 76FF V6+FF  |
|  02FE | 24B6 | DO | 04B6 |  | 036C | 46FF SKIP;V6 NE FF  |
|  0300 | 24DC | DO | 04DC |  | 036E | 1392 GO 0392  |
|  0302 | 8015 | V0=V0-V1 |  |  | 0370 | 8840 V8=V4  |
|  0304 | 1308 | GO | 0308 |  | 0372 | 8150 V1=V5  |
|  0306 | 24DC | DO | 04DC |  | 0374 | 8260 V2=V6  |
|  0308 | 24B6 | DO | 04B6 |  | 0376 | 8370 V3=V7  |
|  030A | 7801 | V8+01 |  |  | 0378 | 24DC DO 04DC  |
|  030C | 380D | SKIP;V8 | EQ | 0D | 037A | 8500 V5=V0  |
|  030E | 131C | GO | 031C |  | 037C | 7CFF VC+FF  |
|  0310 | 6801 | V8=01 |  |  | 037E | 4CFF SKIP;VC NE FF  |
|  0312 | 7301 | V3+01 |  |  | 0380 | 6C16 VC=16  |
|  0314 | 3364 | SKIP;V3 | EQ | 64 | 0382 | 7DFF VD+FF  |
|  0316 | 131C | GO | 031C |  | 0384 | 4DFF SKIP;VD NE FF  |
|  0318 | 6300 | V3=00 |  |  | 0386 | 6D1B VD=1B  |
|  031A | 7201 | V2+01 |  |  | 0388 | 7EFF VE+FF  |
|  031C | 24F2 | DO | 04F2 |  | 038A | 4EFF SKIP;VE NE FF  |
|  031E | 49AA | SKIP;V9 | NE | AA | 038C | 6E20 VE=20  |
|  0320 | 132A | GO | 032A |  | 038E | A600 I=0600  |
|  0322 | 6003 | V0=03 |  |  | 0390 | F755 MI=V0:V7  |
|  0324 | 80E2 | V0=V0&VE |  |  | 0392 | 2448 DO 0448  |
|  0326 | F018 | TONE=V0 |  |  | 0394 | 680B V8=0B  |
|  0328 | 1306 | GO | 0306 |  | 0396 | E8A1 SKIP;V8 NE KEY  |
|  032A | 246A | DO | 046A |  | 0398 | 1342 GO 0342  |
|  032C | 680B | V8=0B |  |  | 039A | 680F V8=0F  |
|  032E | E8A1 | SKIP;V8 | NE | KEY | 039C | E8A1 SKIP;V8 NE KEY  |
|  0330 | 1340 | GO | 0340 |  | 039E | 1342 GO 0342  |
|  0332 | 680F | V8=0F |  |  | 03A0 | 132A GO 032A  |
|  0334 | E8A1 | SKIP;V8 | NE | KEY | 03A2 | 7F00 VF+00  |
|  0336 | 1340 | GO | 0340 |  | 03A4 | 2448 DO 0448  |
|  0338 | 6800 | V8=00 |  |  | 03A6 | A600 I=0600  |
|  033A | E8A1 | SKIP;V8 | NE | KEY | 03A8 | F765 V0:V7=MI  |
|  033C | 12B2 | GO | 02B2 |  | 03AA | 8840 V8=V4  |
|  033E | 132C | GO | 032C |  | 03AC | 8260 V2=V6  |
|  0340 | 246A | DO | 046A |  | 03AE | 8370 V3=V7  |
|  0342 | 480B | SKIP;V8 | NE | 0B | 03B0 | 24DC DO 04DC  |
|  0344 | 134E | GO | 034E |  | 03B2 | 9050 SKIP;V0 NE V5  |
|  0346 | 13A4 | GO | 03A4 |  | 03B4 | 6500 V5=00  |
|  0348 | 0100 |  |  |  | 03B6 | 7501 V5+01  |

RCA COSMAC VIP Game Manual

|  03B8 4501 SKIP#V5 NE 01 | 0426 8080  |
| --- | --- |
|  03BA 7401 V4+01 | 0428 8000  |
|  03BC 340D SKIP#V4 EQ 0D | 042A 0000  |
|  03BE 13D0 GO 03D0 | 042C 001F  |
|  03C0 6401 V4=01 | 042E 1C1F  |
|  03C2 7701 V7+01 | 0430 1E1F  |
|  03C4 3764 SKIP#V7 EQ 64 | 0432 1E1F  |
|  03C6 13D0 GO 03D0 | 0434 1F1E  |
|  03C8 6700 V7=00 | 0436 1F1E  |
|  03CA 7601 V6+01 | 0438 1F29  |
|  03CC 4664 SKIP#V6 NE 64 | 043A 2E37  |
|  03CE 1392 GO 0392 | 043C 3C2B  |
|  03D0 7C01 VC+01 | 043E 3035  |
|  03D2 7D01 VD+01 | 0440 3AE0  |
|  03D4 7E01 VE+01 | 0442 A0E0  |
|  03D6 24C2 DO 04C2 | 0444 8080  |
|  03D8 138E GO 038E | 0446 D4D4  |
|  03DA 0107 | 0448 6500 V5=00  |
|  03DC 0E0E | 044A 6602 V6=02  |
|  03DE 1616 | 044C 6304 V3=04  |
|  03E0 160E | 044E A600 I=0600  |
|  03E2 0E07 | 0450 F31E I=I+V3  |
|  03E4 0100 | 0452 F065 V0:V0=MI  |
|  03E6 050B | 0454 A609 I=0609  |
|  03E8 0B12 | 0456 F033 MI=V0(3DD)  |
|  03EA 1212 | 0458 F265 V0:V2=MI  |
|  03EC 120B | 045A 8410 V4=V1  |
|  03EE 0B05 | 045C 2518 DO 0518  |
|  03F0 00EE | 045E 8420 V4=V2  |
|  03F2 0107 | 0460 2518 DO 0518  |
|  03F4 0E0E | 0462 7301 V3+01  |
|  03F6 1616 | 0464 3308 SKIP#V3 EQ 08  |
|  03F8 1616 | 0466 144E GO 044E  |
|  03FA 1616 | 0468 00EE RET  |
|  03FC 0E0E | 046A 6420 V4=20  |
|  03FE 0701 | 046C 6506 V5=06  |
|  0400 0005 | 046E 6600 V6=00  |
|  0402 0B0B | 0470 87C0 V7=VC  |
|  0404 1212 | 0472 A3DA I=03DA  |
|  0406 1212 | 0474 249C DO 049C  |
|  0408 1212 | 0476 3400 SKIP#V4 EQ 00  |
|  040A 0B0B | 0478 1472 GO 0472  |
|  040C 0500 | 047A 6420 V4=20  |
|  040E EE00 | 047C 6506 V5=06  |
|  0410 0000 | 047E 660C V6=0C  |
|  0412 0080 | 0480 87D0 V7=VD  |
|  0414 0000 | 0482 A3F2 I=03F2  |
|  0416 0000 | 0484 249C DO 049C  |
|  0418 8080 | 0486 3400 SKIP#V4 EQ 00  |
|  041A 0000 | 0488 1482 GO 0482  |
|  041C 0000 | 048A 6420 V4=20  |
|  041E 8080 | 048C 6506 V5=06  |
|  0420 8000 | 048E 6618 V6=18  |
|  0422 0000 | 0490 87E0 V7=VE  |
|  0424 0080 | 0492 A562 I=0562  |

13. VIP Biorhythm

|  0494 | 249C | DO | 049C  |
| --- | --- | --- | --- |
|  0496 | 3400 | SKIP | I V4 EQ 00  |
|  0498 | 1492 | GO | 0492  |
|  049A | 00EE | RET |   |
|  049C | F71E | I=I+V7 |   |
|  049E | F065 | V0:V0=MI |   |
|  04A0 | 30EE | SKIP | I V0 EQ EE  |
|  04A2 | 14A8 | GO | 04A8  |
|  04A4 | 6700 | V7=00 |   |
|  04A6 | 00EE | RET |   |
|  04A8 | A40F | I=040F |   |
|  04AA | F01E | I=I+V0 |   |
|  04AC | D568 | SHOW | 8MI@V5V6  |
|  04AE | 74FF | V4+FF |   |
|  04B0 | 7501 | V5+01 |   |
|  04B2 | 7701 | V7+01 |   |
|  04B4 | 00EE | RET |   |
|  04B6 | 8C04 | VC=VC+V0 |   |
|  04B8 | 8D04 | VD=VD+V0 |   |
|  04BA | 8E04 | VE=VE+V0 |   |
|  04BC | 24C2 | DO | 04C2  |
|  04BE | 24C2 | DO | 04C2  |
|  04C0 | 00EE | RET |   |
|  04C2 | 6B17 | VB=17 |   |
|  04C4 | 8CB5 | VC=VC-VB |   |
|  04C6 | 4F00 | SKIP | I VF NE 00  |
|  04C8 | 7C17 | VC+17 |   |
|  04CA | 6B1C | VB=1C |   |
|  04CC | 8DB5 | VD=VD-VB |   |
|  04CE | 4F00 | SKIP | I VF NE 00  |
|  04D0 | 7D1C | VD+1C |   |
|  04D2 | 6B21 | VB=21 |   |
|  04D4 | 8EB5 | VE=VE-VB |   |
|  04D6 | 4F00 | SKIP | I VF NE 00  |
|  04D8 | 7E21 | VE+21 |   |
|  04DA | 00EE | RET |   |
|  04DC | A42C | I=042C |   |
|  04DE | F81E | I=I+V8 |   |
|  04E0 | F065 | V0:V0=MI |   |
|  04E2 | 3802 | SKIP | I V8 EQ 02  |
|  04E4 | 00EE | RET |   |
|  04E6 | 8920 | V9=V2 |   |
|  04E8 | 8A30 | VA=V3 |   |
|  04EA | 2554 | DO | 0554  |
|  04EC | 4B03 | SKIP | I V8 NE 03  |
|  04EE | 7001 | V0+01 |   |
|  04F0 | 00EE | RET |   |
|  04F2 | 69AA | V9=AA |   |
|  04F4 | 9260 | SKIP | I V2 NE V6  |
|  04F6 | 5370 | SKIP | I V3 EQ V7  |
|  04F8 | 6900 | V9=00 |   |
|  04FA | 5840 | SKIP | I V8 EQ V4  |
|  04FC | 6900 | V9=00 |   |
|  04FE | 00EE | RET |   |
|  0500 | 6400 | V4=00 |   |
|  0502 | E4A1 | SKIP | I V4 NE KEY  |
| --- | --- | --- | --- |
|  0504 | 150E | GO | 050E  |
|  0506 | 7401 | V4+01 |   |
|  0508 | 340A | SKIP | I V4 EQ 0A  |
|  050A | 1502 | GO | 0502  |
|  050C | 1500 | GO | 0500  |
|  050E | F40A | V4=KEY |   |
|  0510 | 00EE | RET |   |
|  0512 | 010C |  |   |
|  0514 | 1290 |  |   |
|  0516 | 60D4 |  |   |
|  0518 | A438 | I=0438 |   |
|  051A | F51E | I=I+V5 |   |
|  051C | F165 | V0:V1=MI |   |
|  051E | A349 | I=0349 |   |
|  0520 | F61E | I=I+V6 |   |
|  0522 | F065 | V0:V0=MI |   |
|  0524 | F429 | I=V4(LSDP) |   |
|  0526 | D105 | SHOW 5MI@V1V0 |   |
|  0528 | 4503 | SKIP | I V5 NE 03  |
|  052A | 7601 | V6+01 |   |
|  052C | 4507 | SKIP | I V5 NE 07  |
|  052E | 7601 | V6+01 |   |
|  0530 | 7501 | V5+01 |   |
|  0532 | 4508 | SKIP | I V5 NE 08  |
|  0534 | 6500 | V5=00 |   |
|  0536 | 00EE | RET |   |
|  0538 | 416A | SKIP | I V1 NE 6A  |
|  053A | 7E51 | VE+51 |   |
|  053C | 6B00 | VB=00 |   |
|  053E | A42C | I=042C |   |
|  0540 | FA1E | I=I+VA |   |
|  0542 | F065 | V0:V0=MI |   |
|  0544 | 8095 | V0=V0-V9 |   |
|  0546 | 4F01 | SKIP | I VF NE 01  |
|  0548 | 00EE | RET |   |
|  054A | 6B29 | VB=29 |   |
|  054C | 491D | SKIP | I V9 NE 1D  |
|  054E | 3A02 | SKIP | I VA EQ 02  |
|  0550 | 6B39 | VB=39 |   |
|  0552 | 00EE | RET |   |
|  0554 | 4A00 | SKIP | I VA NE 00  |
|  0556 | 8A90 | VA=V9 |   |
|  0558 | 6B03 | VB=03 |   |
|  055A | 8AB2 | VA=VA&VB |   |
|  055C | 3A00 | SKIP | I VA EQ 00  |
|  055E | 6B00 | VB=00 |   |
|  0560 | 00EE | RET |   |
|  0562 | 0107 |  |   |
|  0564 | 070E |  |   |
|  0566 | 0E16 |  |   |
|  0568 | 1616 |  |   |
|  056A | 1616 |  |   |
|  056C | 160E |  |   |
|  056E | 0E07 |  |   |

RCA COSMAC VIP Game Manual

|  0570 | 0701 | 0580 | 0505  |
| --- | --- | --- | --- |
|  0572 | 0005 | 0582 | 00EE  |
|  0574 | 050B | 0584 | E040  |
|  0576 | 0B12 | 0586 | 4040  |
|  0578 | 1212 | 0588 | E080  |
|  057A | 1212 | 058A | E080  |
|  057C | 1212 | 058C | E0D4  |
|  057E | 0B0B |  |   |

67

# 14. VIP Programmable Spacefighters

Programmable Spacefighters is a combat game involving 2 to 8 spaceships competing for the domination of a contained field in space. The field of play is a two-dimensional representation of the surface of an oblong spheroid.

The movement and fire of each spacefighter is controlled by programming a series of commands into each fighter's instruction storage table. Once all the spacefighters are programmed they carry out their commands by sequentially executing a single step at a time. The play of the game is divided into rounds. Each spacefighter may execute between 1 and 15 commands per round.

The fighters all have the same appearance and capabilities. Players distinguish between fighters by examining the defense strength and position of their fighter at the beginning of every round.

Each fighter may face in any of 8 directions. All firing and forward movement occurs in the direction a fighter is currently facing. As a spacefighter crosses outside the two-dimensional field of play it wraps around and re-enters on the opposite side of the field. Laser bursts terminate when they travel outside the field or hit a target.

Each round consists of a selected number of steps. Each step is executed in 2 parts. During the first part, every spacefighter wishing to fire may execute a fire operation. The defense strength of any fighter which is hit by a laser burst is reduced by 1 and a small flash appears.

After all fighters have had an opportunity to execute fire instructions, the movement part of the step begins. Any fighter which has had its defense strength reduced to 0 is destroyed and a longer flash appears. The defense strength is changed to a special code so that the fighter will no longer be programmable or take part in the execution phase. The destroyed fighter will still be open to examination during the Defense/Position Check phase. Fighters having a defense strength greater than 0 may execute a movement command if there is one. Breaking each step into 2 such parts removes any strategic advantage to moving first.

The nature of the game, in that there are variable parameters and no fixed victory conditions, allows the players a lot of freedom. Two to eight players can command single fighters. Four or less players can each command multiple fighters. Two fleets could compete to destroy their opponents' flagship first. Handicaps can be implemented through an imbalance of fighters in different fleets. An odd number of players can play in a free-for-all or team game. In a non-combat approach, a full complement of spacefighters could be programmed to perform in kaleidoscopic or other type formations.

## How To Play VIP Programmable Spacefighters

1. Load the CHIP-8 interpreter at 0000-01FF and the game starting at 0200.

2. Turn RUN switch on.

3. Initialization of Game.

Various parameters are entered at the start of the game to determine the number of spacefighters and other aspects of play.

S: Enter number of spacefighters. 1 to 8 spacefighters may be used. The program will adjust invalid entries to the nearest valid number.

D: Enter defense strength. A spacefighter may be hit from 1 to F times by laser fire before being destroyed.

E: Enter number of command entries. A spacefighter may be programmed with 1 to F commands during the programming phase of each round.

C: Enter clock duration/no clock. A timer clock 1 to F phorseks in duration may be selected. Each phorsek equals 4 seconds. The clock is not enabled if a 0 is entered. The clock time is the time allowed for each fighter to be set up.

F: Enter fire power available. A spacefighter may be allowed to fire 1 to F laser bursts per round.

A: Enter accumulation/no accumulation. A spacefighter may be allowed to accumulate all unused laser bursts by entering 1 to F. Accumulation is not allowed if a 0 is entered.

4. Presentation of Field and Spacefighters.

The two-dimensional representation of the playing field consists of 10 vertical by 15 horizontal positions indicated by grid markings around the perimeter. The spacefighters will be in their initial positions.

5. Defense/Position Check.

Enter number of spacefighter to be examined.

S: Current spacefighter being examined.

D: Defense strength of current spacefighter.

Enter 0 to end defense/position check phase.

6. Program Spacefighters.

Surviving spacefighters are programmed in ascending order. Enter 0 to begin programming first spacefighter. Defense strength and position are shown during programming.

E: Indicates number of entries left after current command.

C: Indicates time remaining to program current fighter if clock was selected.