<template>
  <div id="app">
    <carte-interactive
      class="carte-interactive"
      :couleurs="['#3778e7']"
      :listesPaysCarte="[[{ code: 'FR' }, { code: 'DE' }]]"
      titre="Carte interactive"
    />
  </div>
</template>

<script>
import CarteInteractive from "./components/CarteInteractive.vue"

export default {
  name: "App",
  components: {
    CarteInteractive,
  },
}
</script>

<style>
@import url("http://fonts.cdnfonts.com/css/made-evolve-sans");

body {
  margin: 0;
}
#app {
  font-family: "MADE Evolve Sans", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #ebebeb;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.carte-interactive {
  height: 40rem;
  width: 60rem;
}
</style>
