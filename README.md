# Hackathon_Bdx_Metropole
Hackathon Bordeaux Métropole – Simulation interactive de résilience urbaine : Application web interactive permettant de visualiser les îlots de chaleur à Bordeaux et de simuler l’impact d’actions citoyennes (végétalisation, accès à l’eau) sur le confort thermique urbain.

---
## 1. Contexte
**Hackathon Bordeaux Métropole – Simulation interactive de résilience urbaine**

Application web interactive permettant de visualiser les îlots de chaleur à Bordeaux et de simuler l’impact d’actions citoyennes (végétalisation, accès à l’eau) sur le confort thermique urbain.

---
## 2. Objectif du projet
Ce projet vise à **transformer des données territoriales en une expérience interactive** permettant :
- de visualiser les îlots de chaleur et de fraîcheur à Bordeaux
- de comprendre les facteurs qui influencent le confort thermique urbain
- de simuler l’impact d’actions d’aménagement (arbres, fontaines, ...)
- d’impliquer les citoyens dans une réflexion collective autour de la résilience urbaine

L'utilisateur peut également interragir avec une carte virtuelle collaborative de bordeaux en :
- plantant virtuellement des arbres
- intallant des fontaines d'eau potable
Ces actions alimentent une simulation collective permettant de **visualiser un impact hypothétique sur le confort thermique**.

---
## 3. Utilisation des données
Le projet s’appuie sur plusieurs jeux de données open data :
- îlots de chaleur / fraîcheur
- patrimoine arboré
- fontaines publiques
- vulnérabilité à la chaleur

Ces données sont visualisables sur une carte et agrégées dans une grille spatiale (hexagonale ou pixellisée) afin de :

- créer une lecture simplifiée du territoire  
- permettre la simulation d’actions localisées  
- générer de nouveaux indicateurs (confort thermique, priorité d’intervention, etc.)  

---
## 4. Concept de l’application
L’application se structure autour de **deux vues complémentaires** :

### 4.1. Carte réelle (exploration des données)
Une carte interactive de Bordeaux permet de visualiser les données réelles du territoire :
- îlots de chaleur et de fraîcheur  
- délimitations des parcs et espaces verts  
- localisation des fontaines d’eau potable  
- grille hexagonale indiquant le nombre d’arbres par zone  

Cette vue permet à l’utilisateur de **comprendre l’état actuel du territoire** et d’identifier les zones critiques.


### 4.2. Carte simulée (interaction et projection)
Une seconde carte, basée sur une représentation pixellisée de Bordeaux, permet à l’utilisateur d’interagir :
- planter des arbres  
- installer des fontaines  

Ces actions alimentent une **simulation collective** où les données évoluent progressivement.

L’utilisateur peut ainsi observer :
- l’amélioration progressive du confort thermique  
- la réduction hypothétique des îlots de chaleur  
- l’impact cumulé des actions des utilisateurs  

---
## 5. Flow de l’application

### Parcours principal utilisateur

1. L’utilisateur arrive sur l’application
2. Il accède à la **carte réelle**
3. Il explore les données :
   - zones chaudes / fraîches
   - présence d’arbres
   - fontaines disponibles
4. Il identifie une zone d’intérêt

---

5. L'utilisateur bascule sur la **carte simulée**
6. Il sélectionne une zone (pixel / cellule)
7. Il effectue une action :
   - planter un arbre
   - installer une fontaine

---

8. Les données de la zone sont mises à jour  
9. La simulation recalculée affiche :
   - une évolution du niveau thermique
   - un indicateur d’amélioration

---

10. L’utilisateur observe :
   - l’impact local de son action
   - l’impact global (effet collectif)
   - les zones les plus améliorées

---
## 6. Fonctionnalités principales
- Visualisation des données réelles du territoire  
- Superposition de couches (îlots, arbres, fontaines, parcs)  
- Carte interactive pixellisée  
- Actions utilisateur (plantation, installation)  
- Simulation collective et évolutive  
- Comparaison implicite entre état réel et état simulé  
- Identification des zones prioritaires  

---
## 7. Approche
Le projet adopte une approche :
- **data-driven** : les simulations reposent sur des données réelles  
- **pédagogique** : simplifier la compréhension des enjeux climatiques  
- **interactive** : impliquer l’utilisateur dans les décisions  
- **collective** : valoriser l’impact des actions cumulées  

---
## 8. Limites
Les résultats proposés sont des **simulations simplifiées** basées sur des ordres de grandeur, et ne constituent pas des prédictions physiques exactes.

---
## 9. Objectif hackathon
Prototyper une solution permettant de :
- valoriser les données territoriales  
- simuler des actions d’adaptation climatique  
- sensibiliser aux enjeux de résilience urbaine  
- proposer une expérience interactive et engageante  

---
## 10. Stack technique (prévisionnelle)
- Frontend : JavaScript ?
- Cartographie : ?
- Traitement spatial : ?
- Données :
  - [DataHUB - Ilot de chaleur ou de fraicheur urbain](https://datahub.bordeaux-metropole.fr/explore/dataset/ri_icu_ifu_s/information/?disjunctive.insee&disjunctive.dimension)
  - [DataHUB - Végétation urbaine de Bordeaux Métropole](https://datahub.bordeaux-metropole.fr/explore/dataset/met_vegetation_urbaine/information/?disjunctive.insee&disjunctive.nom)
  - [DataHUB - Fontaines d'eau potable de la ville de Bordeaux](https://datahub.bordeaux-metropole.fr/explore/dataset/bor_fontaines_eau_potable/information/?disjunctive.etat&disjunctive.modele_fontaine)
  - [DataHUB - Indice de confort thermique urbain](https://datahub.bordeaux-metropole.fr/explore/dataset/ri_ictu_s/information/)
 
---
## 11. Authors
- Félix Besançon
- Ilan Cornibé
- Laëtitia Grondin
- Frédéric Iglesias Montero
