<template>
  <div class="container-pen">
    <div class="w-full text-left">
      <span
        class="inline-block bg-orange-200 text-orange-800 text-xs px-1 rounded-md uppercase font-semibold tracking-wide"
        >先っちょ</span
      >
    </div>
    <div class="flex flex-row w-full">
      <div
        class="cap rounded-full"
        :current="cap === 'round'"
        @click="$emit('update:cap', 'round')"
      />
      <div
        class="cap"
        :current="cap === 'square'"
        @click="$emit('update:cap', 'square')"
      />
    </div>
    <div class="w-full text-left">
      <span
        class="inline-block bg-orange-200 text-orange-800 text-xs px-1 rounded-md uppercase font-semibold tracking-wide"
        >太さ</span
      >
    </div>
    <div class="vc-compact text-left flex-row mx-auto">
      <input
        :value="width"
        class="rounded-lg overflow-hidden appearance-none bg-gray-400 h-3 w-3/5"
        type="range"
        min="1"
        max="30"
        step="1"
        @input="$emit('update:width', Number($event.target.value))"
      />
      <input
        :value="width"
        class="appearance-none px-1 py-1 text-xs w-1/5 bg-white text-gray-700 border border-gray-400 shadow-inner rounded-md leading-3 focus:outline-none  focus:border-gray-500"
        type="number"
        min="1"
        max="30"
        @input="$emit('update:width', Number($event.target.value))"
      />
    </div>
    <div class="w-full text-left">
      <span
        class="inline-block bg-orange-200 text-orange-800 text-xs px-1 rounded-md uppercase font-semibold tracking-wide"
        >色</span
      >
    </div>
    <compact :value="color" @input="updateColor" />
    <div class="w-full text-left">
      <span
        class="inline-block bg-orange-200 text-orange-800 text-xs px-1 rounded-md uppercase font-semibold tracking-wide"
        >あるふぁ</span
      >
    </div>
    <div class="vc-compact text-left flex-row mx-auto">
      <input
        :value="color.a"
        class="rounded-lg overflow-hidden appearance-none bg-gray-400 h-3 w-3/5"
        type="range"
        min="0"
        max="1"
        step="0.1"
        @input="updateAlpha"
      />
      <input
        :value="color.a"
        class="appearance-none px-1 py-1 text-xs w-1/5 bg-white text-gray-700 border border-gray-400 shadow-inner rounded-md leading-3 focus:outline-none  focus:border-gray-500"
        type="number"
        @input="updateAlpha"
      />
    </div>
  </div>
</template>
<script>
import { Compact } from 'vue-color'
export default {
  components: {
    Compact
  },
  props: {
    color: { type: Object, required: true },
    width: { type: Number, required: true },
    cap: { type: String, required: true }
  },
  methods: {
    updateColor(value) {
      this.$emit('update:color', {
        r: value.rgba.r,
        g: value.rgba.g,
        b: value.rgba.b,
        a: this.color.a
      })
    },
    updateAlpha(value) {
      this.$emit('update:color', {
        r: this.color.r,
        g: this.color.g,
        b: this.color.b,
        a: Number(value.target.value)
      })
    }
  }
}
</script>
<style scoped>
.container-pen {
  @apply flex-col;
}
.container-pen >>> .vc-compact {
  @apply shadow-none mx-auto;
  padding-top: 5px;
  padding-left: 5px;
  width: 245px;
  border-radius: 2px;
  box-sizing: border-box;
  background-color: #fff;
}
.cap {
  @apply bg-gray-600 w-px h-px mx-2 mb-2 mt-1 p-2 cursor-pointer;
}
.cap:hover {
  @apply bg-gray-800;
}
.cap[current] {
  @apply bg-black cursor-default;
}
.plus {
  @apply mr-0 mb-0 !important;
}
.plus-layer {
  display: block !important;
}
input[type='range']::-webkit-slider-thumb {
  width: 15px;
  -webkit-appearance: none;
  appearance: none;
  height: 15px;
  cursor: ew-resize;
  background: #fff;
  box-shadow: -405px 0 0 400px #605e5c;
  border-radius: 50%;
}
</style>
