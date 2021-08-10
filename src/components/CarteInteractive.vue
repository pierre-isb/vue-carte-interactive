<template>
  <figure class="carte-pays" ref="conteneur" @mousemove="deplacerLegende">
    <div class="carte-pays__boutons">
      <button aria-label="Zoomer sur la carte" @click="zoomPlus">+</button>
      <button aria-label="Dézoomer sur la carte" @click="zoomMoins">-</button>
    </div>
    <svg
      class="carte-pays__carte"
      focusable="false"
      ref="carte-pays"
      role="img"
      :viewBox="`0 0 ${width} ${height}`"
    >
      <g ref="groupe-pays"></g>
    </svg>
    <div
      v-show="paysSelectionne.code"
      class="carte-pays__legende"
      ref="carte-legende"
    >
      <span v-if="paysSelectionne.code" class="drapeau-pays">
        <img
          alt=""
          class="carte-pays__legende-drapeau"
          height="24"
          :src="`https://flagcdn.com/${paysSelectionne.code.toLowerCase()}.svg`"
          width="36"
        />
      </span>
      <span class="carte-pays__legende-nom">{{ paysSelectionne.nom }}</span>
    </div>
    <figcaption class="carte-pays__titre">{{ titre }}</figcaption>
  </figure>
</template>

<script>
import { geoMercator, geoPath, json, select, zoom } from "d3"

const DÉCALAGE_LÉGENDE_PAR_RAPPORT_AU_CURSEUR = 16
const FACTEUR_ZOOM = 2
const HAUTEUR_PAR_DEFAUT = 600
const LARGEUR_PAR_DEFAUT = 800

export default {
  name: "CarteInteractive",
  data() {
    return {
      d3: {
        geoMercator,
        geoPath,
        json,
        select,
        zoom,
      },
      carte: undefined,
      conteneur: undefined,
      groupePays: undefined,
      legende: undefined,
      paysSelectionne: { code: "", nom: "" },
      height: HAUTEUR_PAR_DEFAUT,
      width: LARGEUR_PAR_DEFAUT,
    }
  },
  async mounted() {
    this.conteneur = this.$refs["conteneur"]
    this.legende = this.$refs["carte-legende"]

    this.carte = this.d3.select(this.$refs["carte-pays"])
    this.groupePays = this.d3.select(this.$refs["groupe-pays"])

    const projection = this.d3
      .geoMercator()
      .scale(1)
      .translate([0, 0])

    const path = this.d3.geoPath().projection(projection)

    await this.initialiserCarte(projection, path)
  },
  props: ["listesPaysCarte", "couleurs", "titre"],
  methods: {
    async initialiserCarte(projection, path) {
      // DEVNOTE: ISPI : 2021-08-03
      // Données provenant de : https://data.opendatasoft.com/explore/dataset/natural-earth-countries-1_110m%40public/information/ (Domaine public)
      const listePays = await this.d3.json("/monde.geojson")

      this.initialiserFondCarte(listePays, projection, path)
      this.initialiserPaysCarte(listePays, path)
      this.colorerPaysCarte()
      this.appliquerEvenementsPaysSelectionnables()
      this.appliquerZoomAuScroll()
    },
    initialiserFondCarte(listePays, projection, path) {
      const limites = path.bounds(listePays)
      const échelle =
        1.3 /
        Math.max(
          (limites[1][0] - limites[0][0]) / this.width,
          (limites[1][1] - limites[0][1]) / this.height
        )
      const translation = [
        (this.width - échelle * (limites[1][0] + limites[0][0])) / 2,
        (this.height - échelle * (limites[1][1] + limites[0][1])) / 2,
      ]
      projection.scale(échelle).translate(translation)
    },
    initialiserPaysCarte(listePays, path) {
      this.groupePays
        .selectAll("path")
        .data(listePays.features)

        .enter()
        .append("path")
        .attr("d", path)

        .attr("id", this.appliquerIdPays)
        .attr("class", this.appliquerClassesPays)
    },
    colorerPaysCarte() {
      this.couleurs.forEach((couleur, index) => {
        this.groupePays.selectAll(`.categorie-${index}`).attr("fill", couleur)
      })
    },
    appliquerEvenementsPaysSelectionnables() {
      this.groupePays
        .selectAll(".pays.selectionnable")
        .on("click", this.envoyerPays)
        .on("mouseover", this.auSurvol)
        .on("mouseleave", this.auSortirDuSurvol)
    },
    appliquerZoomAuScroll() {
      this.carte.call(this.d3zoom())
    },
    appliquerIdPays(donnee) {
      return `${donnee.properties.iso_a2}_${donnee.properties.name_fr}`
    },
    appliquerClassesPays(donnee) {
      let classe = "pays"
      this.listesPaysCarte.forEach((listePays, index) => {
        if (listePays.find((pays) => pays.code === donnee.properties.iso_a2)) {
          classe += ` ${
            this.survolActif ? "survol-actif" : ""
          } selectionnable categorie-${index}`
        }
      })
      return classe
    },
    envoyerPays() {
      this.$emit("selection-pays", this.paysSelectionne.code)
    },
    auSurvol(event) {
      const [code, nom] = event.target.id.split("_")
      this.paysSelectionne = {
        nom,
        code,
      }
    },
    auSortirDuSurvol() {
      this.paysSelectionne = { code: "", nom: "" }
    },
    d3zoom() {
      return this.d3
        .zoom()
        .scaleExtent([1, 5])
        .translateExtent([
          [0, -50],
          [this.width, this.height + 50],
        ])
        .on("zoom", (event) =>
          this.groupePays.attr("transform", event.transform)
        )
    },
    deplacerLegende(event) {
      this.legende.style.left =
        event.pageX +
        DÉCALAGE_LÉGENDE_PAR_RAPPORT_AU_CURSEUR -
        this.conteneur.offsetLeft +
        "px"
      this.legende.style.top =
        event.pageY +
        DÉCALAGE_LÉGENDE_PAR_RAPPORT_AU_CURSEUR -
        this.conteneur.offsetTop +
        "px"
    },
    zoomPlus() {
      this.carte.transition().call(this.d3zoom().scaleBy, FACTEUR_ZOOM)
    },
    zoomMoins() {
      this.carte.transition().call(this.d3zoom().scaleBy, 1 / FACTEUR_ZOOM)
    },
  },
}
</script>

<style scoped>
.carte-pays {
  border: 1px solid gray;
  border-radius: 0.25rem;
  position: relative;
}

.carte-pays__legende {
  align-items: center;
  display: flex;
  font-size: 14px;
  padding: 0.5rem;
  position: absolute;
  z-index: 10;
}

.carte-pays__legende-drapeau {
  box-sizing: border-box;
  height: 1.5rem;
  margin-right: 0.5rem;
  overflow: hidden;
  width: 2.5rem;
}

.carte-pays__legende-drapeau-nom {
  color: #2c3e50;
  font-weight: bold;
  margin: 0;
}

.carte-pays__boutons {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: 1rem;
  position: absolute;
  right: 0;
  top: 0;
  width: fit-content;
  z-index: 1;
}

.carte-pays__boutons > button {
  border: none;
  background-color: transparent;
  color: gray;
  cursor: pointer;
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1.5rem;
  height: 2rem;
  position: relative;
  transition: color ease-out 0.1s;
  width: 2rem;
}

.carte-pays__boutons > button:hover {
  color: #2c3e50;
}

.carte-pays__boutons > button:first-of-type:after {
  content: "";
  height: 1px;
  width: 2rem - 2 * 0.5rem;
  bottom: 0;
  left: 0.5rem;
  position: absolute;
}

.carte-pays__legende,
.carte-pays__boutons {
  background-color: white;
  border: 1px solid gray;
  border-radius: 0.25rem;
  box-shadow: 1px 1px 2px 0 gray;
}

.carte-pays__carte {
  height: 100%;
  width: 100%;
}

.carte-pays__titre {
  font-style: italic;
  text-align: center;
}

.carte-pays:active {
  cursor: grab;
}

::v-deep .pays {
  stroke: gray;
  stroke-width: 1px;
}

::v-deep .pays:not(.selectionnable) {
  fill: white;
}

::v-deep .selectionnable {
  cursor: pointer;
}

::v-deep .survol-actif:hover {
  filter: brightness(0.9);
}
</style>
