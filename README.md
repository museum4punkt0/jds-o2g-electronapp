# O2G - OBJ to GLTF
> Electron Anwendung für die Umwandlung von OBJ zu GLTF/GLB Modelle inkl. DRACO komprimierte Version und Vorschaubild.

Verpacken von Versionen

`npm run package` (Zielplatform = Entwicklungsplatform)

`npm run package -- --platform win32` (Zielplatform selber definieren)


# Junge Digitale Sammlung

## Inhaltsverzeichnis
1. Kurzbeschreibung
2. Finanzierung
3. Voraussetzungen und Skills 
4. Empfohlenes Server Setup 
5. Installation
6. Entwicklung
7. Nutzung
8. Contributing
9. Über das Projekt
10. Lizenz

## Kurzbeschreibung
Das Deutsche Auswandererhaus ist ein kulturhistorisches Museum zum Thema Migration in Bremerhaven. Im Rahmen des deutschlandweiten Förderprojekts »museum4punkt0« sollen neue Formen der digitalen Kommunikation, Partizipation, Bildung und Vermittlung in Museen entwickelt, umgesetzt und evaluiert werden. Das Projektteam des DAHs erarbeitete unter dem Titel »Junge Digitale Sammlung« JDS ein museumspädagogisches Workshop-Angebot für Schulklassen. Der Workshop setzt sich inhaltlich mit den Themenkomplexen Identität und Diversität auseinander sowie mit der Bedeutung und Handhabung von Objekten im Museum. Teilnehmende Schüler:innen können dabei ihre Alltagsobjekte, die sowohl physisch als auch digital sein können, in 3D scannen oder fotografieren. Diese und weitere Daten zum Objekt werden in eine Datenbank eingegeben und später auf einer Plattform veröffentlicht. Durch die Workshops wird die JDS zu einer umfangreichen Sammlung anwachsen.

Diese Anwendung ist im Rahmen der JDS Web-Platform entstanden.

## Finanzierung
[Bitte Input von BB]


## Voraussetzungen und Skills

Die Installation der Platform ist relativ leicht durchzuführen und kann grundsätzlich ohne große technische Kentnisse erfolgen.

Für die Weiterentwicklung und/oder Anpassungen der verschiedenen Teile des Systems wird Personal mit guten Kenntnissen in PHP, JS und CSS, und mittleren Kenntnissen in der Serveradministration empfohlen.

Bevor Sie beginnen, stellen Sie sicher, dass Sie die folgenden Anforderungen erfüllt haben:
<!--- These are just example requirements. Add, duplicate or remove as required --->
* Ein Server steht Ihnen zur Verfügung.
* Sie haben eine [Kirby](https://getkirby.com) Version heruntergeladen. Das ursprüngliche Projekt wurde mit [Kirby 3.8.3](https://github.com/getkirby/kirby/releases/tag/3.8.3) erstellt. Um eventuelle Fehler zu vermeiden bitte am besten diese Version verwenden.
* Sie haben eine Kopie dieses Repositorys.

## Empfohlenes Server Setup 
- Ubuntu 20.04
- Apache 2.4.x
- PHP 8.1 mit Standard-Modulen (OPCache optimalerweise deaktivieren)
- Genug Speicherplatz auf langer Sicht


## Installation
Die JDS Platform basiert auf [Kirby CMS](https://getkirby.com). Vor der Installation bitte [Kirby herunterladen](https://github.com/getkirby/kirby/releases). Aus Kompatibilitätsgründen der Plugins wird es empfohlen [Kirby 3.8.3](https://github.com/getkirby/kirby/releases/tag/3.8.3) zu verwenden.

Nachdem man die ZIP dieses Repositories heruntergeladen hat kann der Ordner

`www`

auf den Server hochladen und mit der gewünschten Domain verknüpft werden. Wichtig dabei ist, dass der komplette Ordner inkl. versteckten Dateien, bspw. .htaccess, hochgeladen wird.

Anschliessend im Browser die ausgewählte Domain besuchen. Die Sammlung sollte erscheinen. Um das Backend von Kirby zu installieren, bitte die Unterseite '/panel' besuchen, z.B.

`https://meinedomain.de/panel`

An dieser Stelle kann der erste Admin-User angelegt werden.

## Entwicklung
There are 4 build systems included. 

## Nutzung
Das System besteht aus 3 Bereichen:

- Sammlung-Bereich für Besucher der Platform (öffentlich zugänglich)
- Workshop-Bereich für Teilnehmer des Workshops (nicht öffentlich zugänglich)
- Admin-Bereich für Personal (nicht öffentlich zugänglich)

---

### Sammlung-Bereich
In der Sammlung werden Objekte und Ausstellungen öffentlich präsentiert. Bevor Inhalte, die während eines Workshops von Teilnehmern vorbereitet wurden, in diesem Bereich erscheinen müssen sie von einem Administrator (z.B. Museumsmitarbeiter, Personal) überprüft, kuratiert und freigegeben werden.

---

### Workshop-Bereich
In den Workshops können sich Teilnehmer und Leiter (z.B. Lehrer) einloggen und ihre Inhalte vorbereiten. Teilnehmer können hier Daten zu ihrer Person und ihrem Objekt eingeben. Eine Teilnehmer-Gruppe besitzt eine Benutzername und Passwort Kombination. Diese werden von einem Administrator vor Workshop-Start definiert und weiter gegeben. Jeder Teilnehmer besitzt eine eigene ID und kann bei der ersten Anmeldung eine PIN vergeben. So können kommunale und private Bereiche innerhalb eines Workshoraumes getrennt werden.

Teilnehmer stehen 3 Objekttypen zur Verfügung: physisch, digital-embed und born-digital.

#### *Physische Objekte*
Diese Objekte wurden während des Workshops mittels eines 3D Scanners eingescannt. Es ist vorausgesehen, dass dies vor Ort gemeinsam mit Personal erfolgt. Dementsprechend ist das System so konzipiert, dass Mitarbeiter die 3D Modelle und dessen Vorschaubilder hochladen. Das System erlaubt ausschliesslich GLTF oder GLB Dateien, da diese für Web optimiert sind.

#### *Digital-embed*
[----TODO----]

#### *Born-digital*
Für Teilnehmer die eigene Bilder oder Videos hochladen und präsentieren wollen. Das System erlaubt übliche Bildformate (png, jpg, heic) und MP4 als Videoformat.

---

### Admin-Bereich
[----TODO----]

---

## Contributing
If you'd like to contribute, please fork the repository and use a feature branch. Pull requests are warmly welcome.

## Über das Projekt
[----TODO----]

### Team 2av
- Jens Döring (Projektkoordination)
- Santiago Duque (Projektleitung and Entwicklung)

### Team Deutsches Auswandererhaus
- Birgit Burghart (Projektkoordination)
- Jasper Stephan-Beneker (Wissenschaft)
- Astrid Bormann (Museumspädagogik)
- Marcel Leukel (Technik)

### Team Studio Andreas Heller Architects & Designers
- Dirk Kühne (Projektkoordination und Design)

## Lizenz
GNU GENERAL PUBLIC LICENSE <br>
Copyright © 2022, 2av GmbH <br>
Please also see the LICENSE file provided within this repository

