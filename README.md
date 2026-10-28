# Barcelona 3D

A low-poly maquette of Barcelona you can spin in the browser. Drag to turn the city, click a landmark for its story, follow a tram along the real Trambaix and Trambesòs tracks, and walk the Ruta Gaudí.

It is a static site: `index.html` at the repository root, no build step. Three.js is loaded from jsDelivr. Open `index.html` with any static server (modules will not load from `file://`).

The live site will be deployed on Vercel from this repository.

## License

The code is [MIT](LICENSE), copyright Antoni Bassols López.

Photographs in `img/` keep their own Wikimedia Commons licenses. They are not MIT. Each card credits the author, the license and the Commons file page. Map geometry (coast, rivers, parks, port, avenues, tram tracks, metro entrances and station positions) is derived from OpenStreetMap and simplified for the maquette.

© OpenStreetMap contributors, [ODbL](https://www.openstreetmap.org/copyright).

## What's on the maquette

- 32 landmarks at OpenStreetMap coordinates, including eight Gaudí works with extra low-poly models and trencadís colour: Sagrada Família, Park Güell, Casa Batlló, Casa Milà, Casa Vicens, Palau Güell, Bellesguard and the Pavellons Güell.
- A **Gaudí** filter in the monument list and a **Ruta Gaudí** that visits them in chronological order.
- Coastline, Port Vell, Ciutadella, Montjuïc, Park Güell, La Rambla, Diagonal, Gran Via, Passeig de Gràcia, and the Besòs and Llobregat.
- Trams T1, T2 and T4 animated on the street-level tracks. T4 in this extract runs the Diagonal link and ends at Verdaguer. Click a tram to follow it.
- Metro and rail entrances as an optional layer (off by default), coloured by line where the entrance name matches a stop. No underground tracks are drawn. The main stations marked are Sants, Passeig de Gràcia, Plaça Catalunya, França, El Clot and La Sagrera.

Spanish is the default language. English, day and night, and a lighter mode for phones (no depth of field, no shadows) are built in.

## Photo credits

| Place | File | Author | License |
| --- | --- | --- | --- |
| Sagrada Família | [Nativity façade](https://commons.wikimedia.org/wiki/File:Barcelona_-_Avinguda_de_Gaud%C3%AD_-_View_South_on_La_Sagrada_Fam%C3%ADlia_-_Nativity_fa%C3%A7ade.jpg) | Txllxt TxllxT | CC BY-SA 4.0 |
| Park Güell | [Park Güell 01](https://commons.wikimedia.org/wiki/File:Park_G%C3%BCell_01.jpg) | Bernard Gagnon | CC BY-SA 3.0 |
| Casa Batlló | [Rear facade](https://commons.wikimedia.org/wiki/File:Rear_facade_of_Casa_Batll%C3%B3_-_Barcelona_2014.JPG) | José Luiz | CC BY-SA 3.0 |
| Casa Milà | [La Pedrera](https://commons.wikimedia.org/wiki/File:Casa_Mil%C3%A0_(La_Pedrera)_de_Gaud%C3%AD_-_Barcelona,_Spain_-_August_14,_2007.jpg) | Giorgio Galeotti | CC BY 4.0 |
| Casa Vicens | [Casa Vicens](https://commons.wikimedia.org/wiki/File:Barcelona_-_Carrer_de_les_Carolines_-_Casa_Vicens_I.jpg) | Txllxt TxllxT | CC BY-SA 4.0 |
| Palau Güell | [Palau Güell](https://commons.wikimedia.org/wiki/File:Palau_G%C3%BCell,_Barcelona_-_panoramio.jpg) | Carlos Cunha | CC BY-SA 3.0 |
| Bellesguard | [Torre Bellesguard](https://commons.wikimedia.org/wiki/File:Barcelona,_torre_Bellesguard,_d%27Antoni_Gaud%C3%AD_(1900-1909)_(12726232735).jpg) | Catalan Art & Architecture Gallery (Josep Bracons) | CC BY-SA 2.0 |
| Pavellons Güell | [Pavellons Güell](https://commons.wikimedia.org/wiki/File:Pavellons_G%C3%BCell_-_7.jpg) | Jaume Meneses | CC BY-SA 2.0 |
| Cathedral | [Catedral](https://commons.wikimedia.org/wiki/File:Barcelona_-_Catedral_042.jpg) | Zarateman | CC0 |
| Plaça Sant Jaume | [Sant Jaume](https://commons.wikimedia.org/wiki/File:Pla%C3%A7a_Sant_Jaume_Barcelona_Nadal_2021_-_3.jpg) | Judesba | CC BY-SA 4.0 |
| La Rambla | [La Rambla](https://commons.wikimedia.org/wiki/File:La_Rambla,_Barcelona.jpg) | Stanislav Kozlovskiy | CC BY-SA 3.0 |
| Plaça Catalunya | [Plaça de Catalunya](https://commons.wikimedia.org/wiki/File:Pla%C3%A7a_de_Catalunya,_Barcelona.jpg) | Nicholas Gemini | CC BY-SA 4.0 |
| Arc de Triomf | [Arc de Triomf](https://commons.wikimedia.org/wiki/File:Barcelona_-_Arc_de_Triomf_1888_-_View_NE.jpg) | Txllxt TxllxT | CC BY-SA 4.0 |
| Castell de Montjuïc | [Castell](https://commons.wikimedia.org/wiki/File:Barcelona_August_2014_-_Castell_de_Montjuic_034.jpg) | Mummelgrummel | CC BY-SA 4.0 |
| MNAC | [MNAC](https://commons.wikimedia.org/wiki/File:Museu_Nacional_d%27Art_de_Catalunya_(MNAC)_National_Art_Museum_of_Catalonia.jpg) | Baetulonense | CC BY-SA 3.0 |
| Estadi Olímpic | [Rellotge](https://commons.wikimedia.org/wiki/File:187_Estadi_Ol%C3%ADmpic_Llu%C3%ADs_Companys_(Barcelona),_rellotge.jpg) | Enric | CC BY-SA 4.0 |
| Camp Nou | [Camp Nou](https://commons.wikimedia.org/wiki/File:Camp_Nou_-_panoramio.jpg) | Pablo Costa Tirado | CC BY-SA 3.0 |
| Port Vell | [Maremàgnum](https://commons.wikimedia.org/wiki/File:149_Marem%C3%A0gnum,_moll_d%27Espanya_del_Port_Vell_(Barcelona),_Gingerland,_Nadal_2025.jpg) | Enric | CC BY-SA 4.0 |
| Barceloneta | [Platja](https://commons.wikimedia.org/wiki/File:Platja_de_la_Barceloneta.jpg) | Nicholas Gemini | CC BY-SA 4.0 |
| Torre Glòries | [Torre Glòries](https://commons.wikimedia.org/wiki/File:Barcelona_March_2015-16b.jpg) | Alvesgaspar | CC BY-SA 4.0 |
| Sant Pau | [Hospital de Sant Pau](https://commons.wikimedia.org/wiki/File:Barcelona-_Hospital_de_la_Santa_Creu_i_Sant_Pau.jpg) | Jorge Franganillo | CC BY 2.0 |
| Palau de la Música | [Terrace mosaics](https://commons.wikimedia.org/wiki/File:Palau_de_la_M%C3%BAsica_Catalana,_terrazza,_con_colonne_e_mosaici_sulla_flora_catalana_di_Llu%C3%ADs_Bru,_1909_ca.,_06.jpg) | Francesco Bini | CC BY-SA 4.0 |
| Ciutadella | [Lake](https://commons.wikimedia.org/wiki/File:Barcelona_371.JPG) | JoJan | CC BY 3.0 |
| Boqueria | [Market](https://commons.wikimedia.org/wiki/File:La_Boqueria_Market,_Barcelona_(64912504).jpg) | Bryan Ledgard | CC BY 2.0 |
| Tibidabo | [Sagrat Cor](https://commons.wikimedia.org/wiki/File:Sagrat_Cor_del_Tibidabo_-_Josep_Miret.JPG) | HitchHikersHandbook.com | CC BY-SA 3.0 es |
| Santa Maria del Mar | [Basilica](https://commons.wikimedia.org/wiki/File:Santa_Maria_del_Mar_Barcelona_September_2026-2.jpg) | Alvesgaspar | CC BY-SA 4.0 |
| Hotel W | [Sail hotel](https://commons.wikimedia.org/wiki/File:Sail_hotel_-_panoramio.jpg) | Evgeniy Metyolkin | CC BY-SA 3.0 |
| Monument a Colom | [Colom](https://commons.wikimedia.org/wiki/File:Monument_a_Colom,_Barcelona,_Spain_-_Jan_07.jpg) | Diliff | CC BY-SA 3.0 |
| Font Màgica | [Fountain](https://commons.wikimedia.org/wiki/File:Barcelona_3793.JPG) | Freepenguin | CC BY-SA 3.0 |
| Búnkers del Carmel | [Bunkers](https://commons.wikimedia.org/wiki/File:Bunkers_del_Carmel_Barcelona.jpg) | Barcelonatips | CC BY-SA 4.0 |
| Plaça d'Espanya | [Plaça Espanya](https://commons.wikimedia.org/wiki/File:Pla%C3%A7a_Espanya,_Barcelona_-_panoramio_(13).jpg) | Nikolai Karaneschev | CC BY 3.0 |
| Rambla del Poblenou | [Rambla](https://commons.wikimedia.org/wiki/File:Hostal_Poblenou,_Rambla_del_Poblenou,_Barcelona_(2023).JPG) | Benoît Prieur | CC0 |
