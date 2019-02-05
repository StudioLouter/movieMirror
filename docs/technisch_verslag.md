# Technisch Verslag

*The Movie Mirror* is een softwarematig prototype dat een database van films doorzoekbaar maakt op een niet semantische wijze. Dit prototype zoekt door een verzameling van films die zijn geanalyseerd op houdingen van acteurs en hun positie op het beeld. Dezelfde analyse word live gedaan op een gebruiker die voor de camera staat en het programma zoekt dan de meest vergelijkbare houding en compositie op uit de database. Om die database te kunnen doorzoeken, moet hij logischerwijs ook bestaan. Die database is eerst aangemaakt in het analyse traject van dit project. Hoe we de database hebben opgemaakt wordt uitgelicht hieronder onder **Analyse** maar is niet toegevoegd in de open source code, en zal zelf moeten worden geherproduceerd. <br>Het vervolg op het analyse traject, namelijk de presentatie, is wel geheel open source. 

## <a name="#analyse">Analyse</a>
#### PySceneDetect

Voordat *The Movie Mirror* een houding kan reflecteren moest er een database worden aangemaakt met houdingen om te tonen. Het Eye Filmmuseum heeft 66 films geleverd die we hebben gebruikt in dit project. De gehele films zijn te groot om voor het programma (snel) in  1 keer in te laden wanneer het programma *live* wordt gebruikt. Daarom hebben we voordat we de analyses zijn begonnen de films opgedeeld in de scenes die voorkwamen in de film. Dit hebben we gedaan met behulp van [PySceneDetect](py.scenedetect.com)

Dit is een Python script die een film als input neemt, en losse scenes exporteert via ```ffmpeg```. Een *content aware* detectie methode is gebruikt om scenes te splitsen. De *content aware* methode betekent, in dit geval, dat een verschil in het HSV kleurenspectrum een *fast cut* inhoudt, en dus een volgende scene aankondigt. 

#### PoseNet

De volgende stap is de pose analyse uitvoeren op de geëxporteerde scenes. Daarvoor is  [PoseNet](https://github.com/tensorflow/tfjs-models/tree/master/posenet) gebruikt. ```PoseNet``` is een voorgetrained model dat kan worden gebruikt in [TensorFlow.js](https://github.com/tensorflow/tensorflow) om houdingen van mensen in *realtime* te vinden.

```PoseNet``` is geïntegreerd in onze eigen software, draaiende in ```NodeJS``` die de geëxporteerde scenes van ```PySceneDetect``` een voor een analyseert. Op elke frame wordt gezocht of er een houding in aanwezig is. Als dit het geval is, slaat hij informatie over de houding en frame op in de database.

#### MongoDB

In een vroeg stadium is gekozen voor `MongoDB` om de data in te bewaren door voordelen als: lage inspanningen om de database horizontaal te kunnen schalen (```sharding```), performance, data flexibiliteit & open source. Elk geanalyseerd frame waarin houdingen zijn gedetecteerd worden opgeslagen als een *document* in `MongoDB`. 

Een voorbeeld van een document:

```json
{
    "_id":1532533309411,
    "poses":[
        {
            "score":0.38,
            "medianPosition": {
                "x":536,
                "y":190
            },
            "keypoints":{
                "nose":{
                    "score":0.19,
                    "position":{
                        "x":514,
                        "y":134
                    }
                },
                "leftEye":{
                    "score":0.23,
                    "position":{
                        "x":513,
                        "y":128
                    }
                },
                "rightEye":{
                    "score":0.27,
                    "position":{
                        "x":515,
                        "y":129
                    }
                },
                "leftEar":{
                    "score":0.08,
                    "position":{
                        "x":500,
                        "y":129
                    }
                },
                "rightEar":{
                    "score":0.37,
                    "position":{
                        "x":510,
                        "y":132
                    }
                },
                "leftShoulder":{
                    "score":0.41,
                    "position":{
                        "x":509,
                        "y":141
                    }
                },
                "rightShoulder":{
                    "score":0.70,
                    "position":{
                        "x":502,
                        "y":142
                    }
                },
                "leftElbow":{
                    "score":0.62,
                    "position":{
                        "x":529,
                        "y":167
                    }
                },
                "rightElbow":{
                    "score":0.62,
                    "position":{
                        "x":537,
                        "y":179
                    }
                },
                "leftWrist":{
                    "score":0.32,
                    "position":{
                        "x":590,
                        "y":185
                    }
                },
                "rightWrist":{
                    "score":0.72,
                    "position":{
                        "x":559,
                        "y":188
                    }
                },
                "leftHip":{
                    "score":0.54,
                    "position":{
                        "x":490,
                        "y":217
                    }
                },
                "rightHip":{
                    "score":0.54,
                    "position":{
                        "x":500,
                        "y":224
                    }
                },
                "leftKnee":{
                    "score":0.27,
                    "position":{
                        "x":557,
                        "y":229
                    }
                },
                "rightKnee":{
                    "score":0.16,
                    "position":{
                        "x":577,
                        "y":226
                    }
                },
                "leftAnkle":{
                    "score":0.14,
                    "position":{
                        "x":600,
                        "y":317
                    }
                },
                "rightAnkle":{
                    "score":0.24,
                    "position":{
                        "x":615,
                        "y":353
                    }
                }
            }
        }
    ],
    "allMedian":{
        "x":536,
        "y":190
    },
    "meta":{
        "amountOfPoses":1,
        "sceneCount":1,
        "movie":"secondWarHats",
        "timeInScene":2.021,
        "progressInScene":3.5
    }
}
```

Dit document bestaat uit 1 houding, af te lezen aan
```json
{
    ...,
    "meta":{
        "amountOfPoses":1,
        ...
    },
    ...
}
```

Deze houding wordt weergegeven in ```document.poses[0]```. Als er meerdere houdingen zijn gevonden in 1 frame, vertaalt zich dat in de *integer* in ```document.meta.amountOfPoses``` en de hoeveelheid objecten in de ```document.poses[]``` array.
Elk object in deze array bestaat uit de meetpunten die ```PoseNet``` terug geeft. Deze objecten bestaan weer uit 2 onderdelen, een ```score``` en een ```position```. De score geeft de zekerheid aan van het gevonden punt: 0 is heel onzeker of het *floats*: een ```x``` en een ```y``` positie. Dit is de positie van het punt vergeleken met de linkerbovenhoek van het frame waar de houding in gevonden is. 

Tijdens de analyse wordt er een gemiddelde berekend van alle meetpunten en opgeslagen in een los object als ```document.allMedian```. Dit is een performance gerelateerd object. Deze waarde is efficiënter op te vragen door ```MongoDB```. Het nadeel is dat door van alle punten een gemiddelde te nemen deze waarde heel abstract en bruut is. Zo wordt hij alleen gebruikt om een primaire filter te hebben voor de *search query* om een groot gedeelte van de database uit te sluiten bij een vraag naar een specifieke houding.

Ten slotte wordt er metadata opgeslagen die te maken heeft met het tonen van een filmfragment zoals: 
- In welke film de houding in gevonden is ( ```document.meta.movie``` )
- In welke scene ( ```document.meta.sceneCount``` )
- Hoeveel seconde *diep* de houding is gevonden in de scene ( ```document.meta.timeInScene``` in seconden )
- Een aanduiding voor hoeveel procent is afgespeeld van de scene wanneer de houding gevonden is ( ```document.meta.progressInScene``` waar 0 het begin is en 100 het einde )

## Presentatie

*The Movie Mirror* applicatie is een visualisatie die kan communiceren met de eerder gecreëerde database. Zoals tijdens de analyse van de films, gebruikt ook *The Movie Mirror* ```PoseNet``` om houdingen te vinden, maar ditmaal in live webcam beeld. Als er een houding wordt gevonden, wordt een vergelijkbare houding gezocht in de database, en de best passende 3 houdingen (de scenes waar ze in worden vertoond) worden getoond.

### Algoritme

Het algoritme dat de meest passende houdingen vindt is vrij dynamisch. Verschillende parameters springen aan of uit aan de hand van wat (een) gebruiker(s) doet, en wat ```PoseNet``` vindt. Tijdens de productie van *The Movie Mirror* kwamen we er al achter dat een streng en precieze match moeilijk te vinden was in (wat bleek) een gelimiteerde database van houdingen.


> Als we het hebben over *overeenkomst* van posities bedoelen we daar een overeenkomst in coördinaten mee.
> Dat wil zeggen dat alle punten zijn opgeslagen in de database als coördinaten ```x``` en ```y```, en dat de zoekopdracht bestaat uit ```x``` en ```y``` coördinaten.

#### Aantal houdingen
Eerst wordt bekeken hoeveel houdingen zijn gedecteerd door ```PoseNet``` in het webcam beeld. Als er maar 1 persoon in beeld is, wordt alleen gezocht naar frames met 1 persoon in beeld.


#### Als 1 persoon
Als er 1 persoon is gedetecteerd, wordt er een ander algoritme gebruikt dan bij 2 of meer mensen.

Eerst wordt er een preliminaire filter gecreëerd. Deze filter zoekt naar houdingen(in de database) waar het gemiddelde lichaamspunt dichtbij het gemiddelde lichaamspunt van de gebruiker staat. Deze preliminaire filter is heel efficient (vanuit database oogpunt) en zorgt voor een snellere afhandeling van het vinden van een passende houding.

Vervolgens wordt er bekeken of de handen een significante afstand hebben tot de heupen. Als een gebruiker zijn/haar handen niet gebruikt ( handen in de zakken, of 'gewoon' langs het lichaam ) hoeft deze niet mee genomen hoeft te worden in de zoekopdracht omdat het blijkt van desinterrese in een arm specifieke houding. Pas als handen verder weg zijn bij de heupen worden deze (per stuk) meegenomen in de zoekopdracht.
Vervolgens worden de posities van de ogen, de schouders en de neus in de zoekopdracht meegenomen.

#### Als twee of meer personen
Als er twee of meer personen in beeld zijn is het zoek algoritme anders. In plaats van de specifieke houding van een enkele persoon wordt er gezocht naar een soortgelijke compositie van mensen in het frame. 
Hier wordt er alleen gezocht naar vergelijking in het gemiddelde van de personen in beeld.

#### Onzekerheidsfactor
Tot nu toe hebben we het de hele tijd gehad over een overeenkomst van punten. Echter, er wordt niet op de decimaal af gefilterd naar overeenkomende houdingen. Sterker nog, de marge waartussen punten worden gezocht kan best groot zijn. Zo heeft elk punt een eigen onzekerheidsfactor, die van de ogen zijn veel kleiner dan die van de handen. Dat betekent dat in de zoekopdracht wordt omschreven dat de houdingen die worden gezocht coordinaten heeft die tussen een minimum en maximum waarde liggen en dat per punt. Om een voorbeeld te geven:

Stel ```PoseNet``` detecteert een persoon met de volgende gegevens voor zijn/haar neus:
```json
{
    ...,
    "poses":[
        {
            ...,
            "keypoints":{
                "nose":{
                    "score":0.79,
                    "position":{
                        "x":514,
                        "y":134
                    }
                },
                ...
            }
        }
    ]
}
```
De neus van de gebruiker is gevonden op de x coördinaat 514. De onzekerheid die de positie van een neus mag hebben is 25 pixels. Dat betekend dat de neus minimaal 489 als x coördinaat heeft en maximaal 539.

> De onzekerheid die de neus mag hebben is in dit geval 25 pixels. Dit is een waarde die proefondervindelijk is gevonden, en per lichaamsdeel kan verschillen. Zo is de onzekerheid van een schouder 30 pixels.

#### Zoekopdracht uitgeschreven, klaar om te zenden
Deze zoekopdracht wordt naar ```MongoDB``` gestuurd en geeft gevonden bijpassende houdingen terug. Als er meer dan 1 houding is gevonden, worden deze gesorteerd op de gemiddelde positie die het meest dichtbij is bij het gemiddelde van de gebruiker. De beste wordt opgeslagen. Dezelfde zoekopdracht wordt nog een keer uitgevoerd met een toegevoegde restrictie: de eerder gevonden film wordt deze keer niet meegenomen. Dit doet het nog eenmaal totdat er een lijst is van 3 verschillende films, gerangschikt op best passend.

#### Geen resultaat
Stel dat de zoekopdracht geen resultaten terug geeft probeert het algoritme alsnog een passende houding te vinden zodat de gebruiker wordt beloond met een blijkbaar creatieve houding. Dit doet het door de onzekerheidsfactor te vergroten door het te vermenigvuldigen met 2. Dit betekent dat alle punten een twee keer zo groot oppervlak hebben om in te kunnen bevinden, en dus een grotere kans hebben een houding te vinden met de vergrootte zoekopdracht.


### Weergave
De weergave van *The Movie Mirror* is onderverdeeld in twee vormen, een *Attract* en een *Engage*



#### Attract
De *Attract* begint met spelen als er geen houdingen in beeld zijn gedetecteerd en functioneert als uitnodigende visualisatie van het project en legt, op een visuele wijze, het interactie principe uit van *The Movie Mirror*.
Terwijl dit filmpje afspeelt checkt `PoseNet` elke 2 seconden of er een houding in het webcam beeld is gevonden. Als dit het geval is, begint het zoekalgoritme en bekijkt het of er een overeenkomende houding is gevonden. Als dit het geval is wordt de *Attract* modus verbroken en gaat het over naar de *Engage*.

#### Engage
De *Engage* loop blijft zichzelf herhalen totdat er 3 keer geen houding in beeld is gevonden (er staat dus niemand voor de webcam) en schakelt de applicatie over naar de *Attract* modus.
Als er wel een houding in beeld wordt gevonden is de loop als volgt opgebouwd.

##### Fade out oude fragmenten
Fade eerst de oude scenes uit

##### Fade In webcambeeld
Het camera beeld is altijd zichtbaar tijdens het gebruik van de applicatie. Echter is het tijdens het afspelen van scenes van eerder gevonden houdingen wat transparanter. Als het moment is aangebroken om een nieuwe houding vast te leggen wordt het webcam beeld steeds minder transparant om aan te kondigen dat er een houding wordt vastgelegd. 

#### Start `PoseNet` analyse
Er wordt een analyse gedaan op een frame van het webcam beeld.
Als er niks wordt gevonden fade het webcam weer langzaam in om vervolgens weer een analyse te doen.

#### Houding gevonden
Als er een houding is gevonden wordt er een *stickman* figuur getekend bovenop het webcam beeld dat de gevonden houding illustreerd. Er worden bolletjes getekend op de punten die worden meegenomen in de houding vergelijking. Er wordt dus een zoekopdracht gedaan naar de database en vergelijkbare houdingen gezocht. Als er niks wordt gevonden fade het webcam weer langzaam in om vervolgens weer een analyse te doen.

#### Vergelijkbare houding gevonden
1. Het webcam beeld wordt half transparant.
2. De scenes worden ingeladen. 
3. De scenes faden langzaam in, terwijl ze niet spelen
4. De titels van de films faden in
5. De film speelt de scene 6 seconde af
6. Terug naar stap 1

## Huidige *features* en *roadmap*

*The Movie Mirror* is een mijlpaal in de ontwikkeling naar een lichamelijke cinematische zoekmachine. Dit prototype wordt dan ook *as is* geleverd, zonder de database, en zonder de analyse tool. Dit prototype toont een database wanneer deze door de gebruiker zelf is gekoppeld.
Dit project kan worden gebruikt als lanceerplatform voor een eigen project, of als praktisch voorbeeld van een niet semantische zoekmethode in een database.
Dit project dient als *case in point*, en zal worden bevroren in deze huidige stand. Het zal enkel als referentie dienen. Het project loopt hoogstwaarschijnlijk verder, maar zal ontspringen vanuit een nieuwe codebase die zijn grondslag vindt in dit project, maar niet in zijn totaliteit wordt herbruikt. 
