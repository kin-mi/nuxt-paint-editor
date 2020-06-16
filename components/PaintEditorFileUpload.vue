<template>
  <div class="container-upload">
    <div class="w-full text-center">
      <input
        v-show="false"
        ref="imageInput"
        type="file"
        accept="image/png,image/jpeg,image/gif"
        @change="upload"
      />
      <button
        class="bg-gray-300 hover:bg-gray-500 text-gray-800 font-bold text-sm py-1 px-2 mt-2 rounded inline-flex items-center"
        @click="select"
      >
        画像をアップロード
      </button>
    </div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      imageURL: ''
    }
  },
  methods: {
    select() {
      this.$refs.imageInput.click()
    },
    async upload(e) {
      e.preventDefault()
      // nothing to do when 'files' is empty
      if (e.target.files.length === 0) {
        return null
      }
      const file = e.target.files[0]
      this.imageURL = URL.createObjectURL(file)
      const img = await new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          URL.revokeObjectURL(file)
          resolve(img)
        }
        img.onerror = (e) => reject(e)
        img.src = URL.createObjectURL(file)
      })
      this.$emit('image', img)
    }
  }
}
</script>
<style scoped>
.container-upload {
  @apply flex-col;
}
</style>
