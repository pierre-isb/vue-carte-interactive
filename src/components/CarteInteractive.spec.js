import { shallowMount } from "@vue/test-utils"
import CarteInteractive from "./CarteInteractive.vue"

const paysPrioritaires = [
  {
    nom: "France",
    code: "FR",
  },
]
const paysChallengers = [
  {
    nom: "Bresil",
    code: "BR",
  },
]
const paysAutresMarches = [
  {
    nom: "Guinée",
    code: "GN",
  },
]
const propsData = {
  listesPaysCarte: [paysPrioritaires, paysChallengers, paysAutresMarches],
  couleurs: ["#90E3CB", "#FF9C9C", "#AABAC6"],
}

const carteGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [1, 2],
          [3, 4],
        ],
      },
      properties: {
        name: "DE",
      },
    },
  ],
}

const carteD3 = {
  call: jest.fn(),
  transition: jest.fn().mockReturnValue({
    call: jest.fn(),
  }),
}

const groupePaysD3 = {
  selectAll: jest.fn().mockReturnValue({
    data: jest.fn().mockReturnValue({
      enter: jest.fn().mockReturnValue({
        append: jest.fn().mockReturnValue({
          attr: jest.fn().mockReturnValue({
            attr: jest.fn().mockReturnValue({
              attr: jest.fn(),
            }),
          }),
        }),
      }),
    }),
    attr: jest.fn(),
    on: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnValue({
        on: jest.fn(),
      }),
    }),
  }),
}

const path = {
  bounds: jest.fn().mockReturnValue([
    [0, 0],
    [0, 0],
  ]),
}

const d3 = {
  select: jest.fn(),
  geoMercator: jest.fn().mockReturnValue({
    scale: jest.fn().mockReturnValue({
      translate: jest.fn().mockReturnValue({
        scale: jest.fn().mockReturnValue({
          translate: jest.fn(),
        }),
      }),
    }),
  }),
  geoPath: jest.fn().mockReturnValue({
    projection: jest.fn().mockReturnValue(path),
  }),
  json: jest.fn().mockResolvedValue(carteGeoJSON),
  zoom: jest.fn().mockReturnValue({
    transition: () => ({
      call: jest.fn(),
    }),
    scaleExtent: () => ({
      translateExtent: () => ({
        on: jest.fn(),
      }),
    }),
  }),
}

const paysNonSélectionné = { code: "", nom: "" }
const paysSélectionné = { code: "FR", nom: "France" }
const [pageX, pageY] = [33, -12]

let carte
let d3zoom
let groupePays
let wrapper
describe("CarteInteractive", () => {
  beforeEach(() => {
    d3.select.mockReturnValueOnce(carteD3).mockReturnValueOnce(groupePaysD3)
    wrapper = shallowMount(CarteInteractive, {
      data() {
        return { d3 }
      },
      propsData,
    })
    carte = wrapper.vm.$refs["carte-pays"]
    groupePays = wrapper.vm.$refs["groupe-pays"]
  })

  describe("Lorsque le composant est monté", () => {
    it("monte le composant", () => {
      expect(wrapper.exists()).toBe(true)
    })
    it("initialise la carte et le groupe pays", () => {
      expect(d3.select).toHaveBeenNthCalledWith(1, carte)
      expect(d3.select).toHaveBeenNthCalledWith(2, groupePays)
      expect(wrapper.vm.carte).toEqual(carteD3)
    })
    it("initialise la projection et le path", () => {
      expect(d3.geoMercator).toHaveBeenCalled()
      expect(d3.geoPath).toHaveBeenCalled()
    })
    it("récupère les données des pays de la carte", () => {
      expect(d3.json).toHaveBeenCalled()
    })
    it("injecte les données à la carte", () => {
      expect(groupePaysD3.selectAll().data).toHaveBeenCalledWith(
        carteGeoJSON.features
      )
    })
    it("injecte le path dans le svg", () => {
      expect(
        groupePaysD3
          .selectAll()
          .data()
          .enter().append
      ).toHaveBeenCalledWith("path")
      expect(
        groupePaysD3
          .selectAll()
          .data()
          .enter()
          .append().attr
      ).toHaveBeenCalledWith("d", path)
    })
    it("attribue un id et une ou plusieurs classes pour chaque pays", () => {
      expect(
        groupePaysD3
          .selectAll()
          .data()
          .enter()
          .append()
          .attr().attr
      ).toHaveBeenCalledWith("id", wrapper.vm.appliquerIdPays)
      expect(
        groupePaysD3
          .selectAll()
          .data()
          .enter()
          .append()
          .attr()
          .attr().attr
      ).toHaveBeenCalledWith("class", wrapper.vm.appliquerClassesPays)
    })
    it("remplit les pays concernés avec la couleur associée", () => {
      for (let index = 0; index++; index < propsData.couleurs.length) {
        expect(groupePaysD3.selectAll).toHaveBeenNthCalledWith(
          index + 1,
          `.categorie-${index}`
        )
        expect(groupePaysD3.selectAll().attr).toHaveBeenNthCalledWith(
          index + 1,
          propsData.couleurs[index]
        )
      }
    })
    it("applique les eventlisteners au click, mouseover, et mouseleave pour les pays sélectionnables", () => {
      expect(groupePaysD3.selectAll).toHaveBeenLastCalledWith(
        ".pays.selectionnable"
      )
      expect(groupePaysD3.selectAll().on).toHaveBeenCalledWith(
        "click",
        wrapper.vm.envoyerPays
      )
      expect(groupePaysD3.selectAll().on().on).toHaveBeenCalledWith(
        "mouseover",
        wrapper.vm.auSurvol
      )
      expect(
        groupePaysD3
          .selectAll()
          .on()
          .on().on
      ).toHaveBeenCalledWith("mouseleave", wrapper.vm.auSortirDuSurvol)
    })
    it("applique le zoom au scroll", () => {
      expect(carteD3.call).toHaveBeenCalledWith(wrapper.vm.d3zoom())
    })
  })

  describe("Au survol d'un pays sélectionnable", () => {
    it("définit le pays sélectionné avec le code et le nom contenus dans l'id du pays survolé", () => {
      const event = {
        target: { id: `${paysSélectionné.code}_${paysSélectionné.nom}` },
      }
      expect(wrapper.vm.paysSelectionne).toEqual(paysNonSélectionné)

      wrapper.vm.auSurvol(event)
      expect(wrapper.vm.paysSelectionne).toEqual(paysSélectionné)
    })
  })

  describe("Au sortir du survol d'un pays sélectionnable", () => {
    it("réinitialise le pays sélectionné", async () => {
      await wrapper.setData({
        paysSelectionne: paysSélectionné,
      })

      wrapper.vm.auSortirDuSurvol()
      expect(wrapper.vm.paysSelectionne).toEqual(paysNonSélectionné)
    })
  })

  describe("Zoom sur la carte", () => {
    beforeEach(() => {
      d3zoom = jest
        .spyOn(wrapper.vm, "d3zoom")
        .mockReturnValue({ scaleBy: "scaleBy" })
    })
    describe("Au clic sur le bouton '+'", () => {
      beforeEach(async () => {
        await wrapper
          .findAll(".carte-pays__boutons > button")
          .at(0)
          .trigger("click")
      })
      it("zoome (x2) sur la carte", () => {
        expect(carteD3.transition().call).toHaveBeenLastCalledWith(
          d3zoom().scaleBy,
          2
        )
      })
    })
    describe("Au clic sur le bouton '-'", () => {
      beforeEach(async () => {
        await wrapper
          .findAll(".carte-pays__boutons > button")
          .at(1)
          .trigger("click")
      })
      it("dézoome (x0.5) sur la carte", () => {
        expect(carteD3.transition().call).toHaveBeenLastCalledWith(
          d3zoom().scaleBy,
          0.5
        )
      })
    })
  })

  describe("Légende", () => {
    describe("Si on ne survole aucun pays sélectionnable", () => {
      beforeEach(async () => {
        await wrapper.setData({
          paysSelectionne: paysNonSélectionné,
        })
      })
      it("n'affiche pas la légende", () => {
        const legende = wrapper.find(".carte-pays__legende")
        expect(legende.isVisible()).toBe(false)
      })
    })
    describe("Si on survole un pays sélectionnable", () => {
      beforeEach(async () => {
        await wrapper.setData({
          paysSelectionne: paysSélectionné,
        })
      })
      it("affiche la légende", () => {
        const legende = wrapper.find(".carte-pays__legende")
        expect(legende.isVisible()).toBe(true)
      })
      it("Elle contient le drapeau et le nom du pays", () => {
        const drapeau = wrapper.find(".carte-pays__legende-drapeau")
        const nom = wrapper.find(".carte-pays__legende-nom")

        expect(drapeau.attributes("src")).toEqual(
          `https://flagcdn.com/${paysSélectionné.code.toLowerCase()}.svg`
        )
        expect(nom.text()).toEqual(paysSélectionné.nom)
      })
    })
    describe("Au mouvement du curseur sur la carte", () => {
      beforeEach(async () => {
        const evenement = {
          pageX,
          pageY,
        }
        await wrapper.trigger("mousemove", evenement)
      })
      it("modifie la position de la légende pour suivre le curseur", () => {
        expect(wrapper.vm.$refs["carte-legende"].style).toMatchObject({
          left: pageX + 16 + "px",
          top: pageY + 16 + "px",
        })
      })
    })
  })
})
