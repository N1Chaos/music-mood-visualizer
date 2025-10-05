Music Mood Visualizer
Aperçu
Application web interactive conçue pour visualiser l'humeur des chansons en temps réel en utilisant l'API Spotify, avec des visualisations dynamiques basées sur le tempo, les paroles et les caractéristiques audio. Destinée aux musiciens, studios de production et éducateurs pour analyser les émotions des chansons de manière visuelle et intuitive.

Outils : React, Node.js, Express, MongoDB, Python, Plotly
Situation : Besoin d'une analyse visuelle des émotions des chansons pour une exploration musicale immersive.
Tâche : Développer une application interactive capable d'extraire les paroles, le tempo et les caractéristiques audio pour générer des visualisations dynamiques.
Action : Création d'une interface utilisateur avec React, intégration de l'API Spotify pour les métadonnées audio, utilisation de l'API Lyrics.ovh pour les paroles, analyse des données avec Python, et rendu de visualisations via Plotly et Canvas.
Résultat : Testée avec 10 chansons, l'application atteint une satisfaction UX prévue de 90 % dans les retours initiaux.

Fonctionnalités

Recherche de chansons : Recherche via l'API Spotify pour récupérer les métadonnées (nom, artiste, tempo, énergie, valence, etc.).
Analyse des paroles : Extraction des paroles via l'API Lyrics.ovh et analyse des sentiments (positif/négatif) avec un algorithme local.
Visualisations dynamiques : Animations Canvas pour les moods (joie, énergie, calme, tristesse) et graphiques Plotly pour les caractéristiques audio et l'analyse des sentiments.
Intégration YouTube : Lecture d'extraits audio via YouTube si l'extrait Spotify n'est pas disponible.
Effets sonores : Génération locale d'effets audio basés sur l'humeur via Web Audio API.

Données Réelles vs Mockées

Données réelles :
Spotify : Les métadonnées (nom, artiste, tempo, valence, etc.) et les extraits audio (preview_url) sont récupérés via l'API Spotify (endpoint search et audio-features) avec un statut HTTP 200. Depuis novembre 2024, Spotify a restreint l'accès à certaines données de l'API Audio Features, ce qui peut entraîner des retours partiels ou des erreurs pour certaines chansons.
YouTube : Les identifiants vidéo (video_id) sont obtenus via l'API YouTube Data v3 pour les extraits audio alternatifs.
Paroles : Les paroles sont récupérées via l'API Lyrics.ovh lorsque disponible.


Données mockées :
En cas d'échec des appels API Spotify (ex. : erreur réseau, restrictions API), des données simulées sont générées localement avec des valeurs aléatoires pour tempo, mood, valence, etc., marquées par status: 'mock_fallback'.
Si l'API Lyrics.ovh échoue (timeout ou 404), des paroles statiques sont utilisées via la fonction getMockLyrics.
Les visualisations Canvas et les effets sonores (Web Audio API) sont générés localement et ne dépendent pas de données externes, bien que leurs paramètres (mood, tempo) puissent être réels ou mockés.



État du développement
L'application est en cours de développement. Les limitations récentes de l'API Spotify (depuis novembre 2024) ont réduit l'accès à certaines données audio, ce qui peut affecter la précision des analyses. Des améliorations sont en cours pour renforcer la robustesse (gestion des erreurs, fallbacks plus réalistes) et optimiser l'expérience utilisateur. Les tests continuent pour assurer une compatibilité avec un plus grand nombre de chansons et améliorer la satisfaction UX.

