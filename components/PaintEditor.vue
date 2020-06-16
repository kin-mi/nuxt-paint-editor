<template>
  <div class="flex flex-col justify-center items-center mt-3">
    <div
      ref="container"
      class="feed-in flex-none border border-gray-500 drawbox bg-img-transparent"
    />
    <ul class="flex border-b mt-3">
      <li class="-mb-px mr-1">
        <a
          class="menu-icon"
          :disabled="mode === 'pen'"
          @click="changeMode('pen')"
        >
          <fa-layers class="fa-1x">
            <fa-icon icon="pencil-alt" />
          </fa-layers>
        </a>
      </li>
      <li class="-mb-px mr-1">
        <a
          class="menu-icon"
          :disabled="mode === 'fill'"
          @click="changeMode('fill')"
          ><fa-layers class="fa-1x">
            <fa-icon icon="paint-roller" />
          </fa-layers>
        </a>
      </li>
      <li class="-mb-px mr-1">
        <a
          class="menu-icon"
          :disabled="mode === 'eraser'"
          @click="changeMode('eraser')"
          ><fa-layers class="fa-1x">
            <fa-icon icon="eraser" />
          </fa-layers>
        </a>
      </li>
      <li class="-mb-px mr-1">
        <a
          class="menu-icon"
          :disabled="mode === 'upload'"
          @click="changeMode('upload')"
          ><fa-layers class="fa-1x">
            <fa-icon icon="upload" />
          </fa-layers>
        </a>
      </li>
      <li class="mr-1">
        <a
          class="menu-icon-undo"
          :disabled="!$konva.canUndo"
          @click="$konva.undo"
        >
          <fa-layers class="fa-sm">
            <fa-icon icon="undo-alt" />
          </fa-layers>
        </a>
      </li>
      <li class="mr-1">
        <a
          class="menu-icon-undo"
          :disabled="!$konva.canRedo"
          @click="$konva.redo"
        >
          <fa-layers class="fa-sm">
            <fa-icon icon="redo-alt" />
          </fa-layers>
        </a>
      </li>
    </ul>
    <PaintEditorPenSetting
      v-if="mode === 'pen'"
      :color.sync="lineColor"
      :width.sync="lineWidth"
      :cap.sync="lineCap"
    />
    <PaintEditorFillSetting v-if="mode === 'fill'" :color.sync="fillColor" />
    <PaintEditorEraserSetting
      v-if="mode === 'eraser'"
      :width.sync="lineWidth"
      :cap.sync="lineCap"
    />
    <PaintEditorFileUpload v-if="mode === 'upload'" @image="imageUpload" />

    <div class="mb-1 absolute bottom-0 mx-auto">
      <button
        class="bg-gray-300 hover:bg-gray-500 text-gray-800 text-xs py-1 px-2 rounded inline-flex items-center"
        @click="download"
      >
        <fa-layers class="fa-1x">
          <fa-icon icon="download" />
        </fa-layers>
        ダウンロード
      </button>
    </div>
  </div>
</template>

<script>
import PaintEditorPenSetting from '~/components/PaintEditorPenSetting'
import PaintEditorFillSetting from '~/components/PaintEditorFillSetting'
import PaintEditorEraserSetting from '~/components/PaintEditorEraserSetting'
import PaintEditorFileUpload from '~/components/PaintEditorFileUpload'

export default {
  components: {
    PaintEditorPenSetting,
    PaintEditorFillSetting,
    PaintEditorEraserSetting,
    PaintEditorFileUpload
  },
  data() {
    return {
      mode: 'pen',
      lineColor: { r: 0, g: 0, b: 0, a: 1 },
      lineWidth: 1,
      lineCap: 'round',
      fillColor: { r: 0, g: 0, b: 0, a: 1 }
    }
  },
  watch: {
    lineColor() {
      const rgba = `rgba(${this.lineColor.r},${this.lineColor.g},${this.lineColor.b},${this.lineColor.a})`
      this.$konva.config.line.stroke = rgba
    },
    lineWidth() {
      this.$konva.config.line.strokeWidth = this.lineWidth
    },
    lineCap() {
      this.$konva.config.line.lineCap = this.lineCap
    },
    fillColor() {
      const rgba = `rgba(${this.fillColor.r},${this.fillColor.g},${this.fillColor.b},${this.fillColor.a})`
      this.$konva.config.floodFill.fillColor = rgba
    },
    fillTolerance() {
      this.$konva.config.floodFill.tolerance = this.fillTolerance
    }
  },
  async mounted() {
    await this.$konva.build(this.$refs.container)
  },
  methods: {
    changeMode(mode) {
      this.$konva.config.mode = mode
      this.mode = mode
    },
    imageUpload(img) {
      this.$konva.addImageFile(img)
    },
    download() {
      const name = 'canvas.png'
      const link = document.createElement('a')
      link.download = name
      link.href = this.$konva.dataURL
      link.click()
      // console.log(this.$konva.dataURL)
    }
  }
}
</script>
<style>
.drawbox {
  width: 250px;
  height: 250px;
}
.feed-in {
  animation: 1s appear;
  margin: auto;
}
@keyframes appear {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
.bg-img-transparent {
  margin: 0;
  background-position: 0px 0px, 8px 8px;
  background-size: 16px 16px;
  background-image: -webkit-linear-gradient(
      45deg,
      #eee 25%,
      transparent 25%,
      transparent 75%,
      #ccc 75%,
      #ccc 100%
    ),
    -webkit-linear-gradient(45deg, #ccc 25%, white 25%, white 75%, #ccc 75%, #eee
          100%);
  background-image: linear-gradient(
      45deg,
      #ccc 25%,
      transparent 25%,
      transparent 75%,
      #ccc 75%,
      #ccc 100%
    ),
    linear-gradient(45deg, #ccc 25%, white 25%, white 75%, #ccc 75%, #ccc 100%);
}
.menu-icon {
  @apply bg-white inline-block py-1 px-2 text-orange-500 font-semibold cursor-pointer;
}
.menu-icon:hover {
  @apply text-orange-800;
}
.menu-icon[disabled] {
  @apply border-l border-t border-r rounded-t text-orange-700 cursor-default;
}
.menu-icon-undo {
  @apply bg-white inline-block py-1 px-2 text-indigo-500 font-semibold cursor-pointer;
}
.menu-icon-undo:hover {
  @apply text-indigo-800;
}
.menu-icon-undo[disabled] {
  @apply text-gray-400 cursor-default;
}
</style>
