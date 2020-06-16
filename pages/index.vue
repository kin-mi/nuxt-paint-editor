<template>
  <div class="container">
    <PaintEditor />
  </div>
</template>

<script>
import PaintEditor from '~/components/PaintEditor.vue'

export default {
  components: {
    PaintEditor
  },
  data() {
    return {
      mode: 'pen'
    }
  }
}
</script>

<style>
.container {
  @apply min-h-screen  flex-col flex-1 justify-center items-center text-center mx-auto;
}
</style>
