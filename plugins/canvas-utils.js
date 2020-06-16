import Vue from 'vue'
import Konva from 'konva'
const MODE = {
  PEN: 'pen',
  FILL: 'fill',
  ERASER: 'eraser',
  UPLOAD: 'upload'
}
const STACK_MAX_SIZE = 5
const konvaConfig = {
  mode: MODE.PEN,
  stage: {
    container: null,
    width: 0,
    height: 0,
    scale: { x: 1, y: 1 },
    id: 'stage'
  },
  _layer: {},
  image: { width: 0, height: 0, fill: '', image: null },
  line: {
    stroke: 'black',
    strokeWidth: 1,
    lineCap: 'round',
    globalCompositeOperation: 'source-over', // 消しゴム：'destination-out'
    points: [],
    id: 'free-draw-line'
  },
  floodFill: {
    fillColor: 'rgba(0,0,0,1.0)',
    tolerance: 128,
    bounds: { top: 0, left: 0, right: 0, bottom: 0 }
  }
}
let _stage, _layer, _image
let _isDrawing = false
let _awaitFlush = ''
// Reactiveなスタックデータ
const stack = Vue.observable({ undo: [], redo: [] })

/**
 * scrollControl スクロール制御関数
 * @param {Event} event
 */
const scrollControl = (event) => {
  if (event.cancelable) {
    event.preventDefault()
  }
}
/**
 * removeScrollEvent スクロールイベントの抑止
 */
const removeScrollEvent = () => {
  // PCでのスクロール禁止
  document.addEventListener('mousewheel', scrollControl, { passive: false })
  // スマホでのタッチ操作でのスクロール禁止
  document.addEventListener('touchmove', scrollControl, { passive: false })
}
/**
 * undoScrollEvent スクロールイベントを元に戻す
 */
const undoScrollEvent = () => {
  // PCでのスクロール禁止解除
  document.removeEventListener('mousewheel', scrollControl, {
    passive: false
  })
  // スマホでのタッチ操作でのスクロール禁止解除
  document.removeEventListener('touchmove', scrollControl, {
    passive: false
  })
}
const _flush = async () => {
  // Transformerを削除
  _layer.find((node) => {
    if (node.getType() === 'Group') node.destroy()
  })
  // stageをimageに変換
  const img = await stageToImage()

  _clearAndSet(img)
}
const _clearAndSet = (img) => {
  konvaConfig.image.image = img
  _layer.destroyChildren()
  _layer.clear()
  _image = new Konva.Image(konvaConfig.image)
  _layer.add(_image)
  _layer.draw()
}

const stageToImage = async () => {
  const base64 = _stage.toDataURL({
    pixelRatio: window.devicePixelRatio,
    x: 0,
    y: 0,
    width: konvaConfig.stage.width,
    height: konvaConfig.stage.height
  })
  const img = await new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.src = base64
  })
  return img
}
const _stackUndo = async () => {
  stack.redo.splice(-stack.redo.length)
  const img = await stageToImage()
  if (stack.undo.length >= STACK_MAX_SIZE) {
    stack.undo.pop()
  }
  stack.undo.unshift(img)
}
const undo = async () => {
  if (stack.undo.length <= 0) return
  const img = await stageToImage()
  stack.redo.unshift(img)
  _clearAndSet(stack.undo.shift())
}
const redo = async () => {
  if (stack.redo.length <= 0) return
  const img = await stageToImage()
  stack.undo.unshift(img)
  _clearAndSet(stack.redo.shift())
}
const build = async (container) => {
  // 引数チェック
  if (!container) {
    // eslint-disable-next-line no-console
    console.error('[build] invlid argument.', container)
    return
  }
  // 既に作成済みの場合はリビルド
  if (_stage) _stage.destroy()
  konvaConfig.stage.container = container
  konvaConfig.stage.width = konvaConfig.stage.width || container.clientWidth
  konvaConfig.stage.height = konvaConfig.stage.height || container.clientHeight
  _stage = new Konva.Stage(konvaConfig.stage)
  _layer = new Konva.Layer(konvaConfig.layer)
  _layer.imageSmoothingEnabled(false)
  _stage.add(_layer)
  konvaConfig.image.width = konvaConfig.stage.width
  konvaConfig.image.height = konvaConfig.stage.height
  _image = new Konva.Image(konvaConfig.image)
  _layer.add(_image)
  _stage.draw()
  // イベント追加
  _stage.on('mousedown touchstart', _mousedown)
  _stage.on('mouseup touchend', _mouseup)
  _stage.on('mousemove touchmove', _mousemove)
  await _flush()
}
const _mousedown = async () => {
  if (_awaitFlush && _awaitFlush !== konvaConfig.mode) {
    await _flush()
    _awaitFlush = ''
  }
  if (konvaConfig.mode !== MODE.UPLOAD) await _stackUndo()
  if (konvaConfig.mode === MODE.PEN) {
    konvaConfig.line.globalCompositeOperation = 'source-over'
    _freeDrawStart()
  }
  if (konvaConfig.mode === MODE.ERASER) {
    konvaConfig.line.globalCompositeOperation = 'destination-out'
    _freeDrawStart()
  }
  if (konvaConfig.mode === MODE.FILL) await _floodFill()
}
const _mouseup = async () => {
  if (konvaConfig.mode === MODE.PEN) await _freeDrawEnd()
  if (konvaConfig.mode === MODE.ERASER) await _freeDrawEnd()
}
const _mousemove = () => {
  if (konvaConfig.mode === MODE.PEN) _freeDraw()
  if (konvaConfig.mode === MODE.ERASER) _freeDraw()
}
/**
 * freeDrawStart 手書き描画の開始処理
 */
const _freeDrawStart = () => {
  _isDrawing = true
  // スクロールイベントを抑止
  removeScrollEvent()
  // 新規ラインの追加
  const pos = _stage.getPointerPosition()
  const scale = _stage.getAbsoluteScale()
  konvaConfig.line.points = [pos.x / scale.x, pos.y / scale.y]
  const newLine = new Konva.Line(konvaConfig.line)
  _layer.add(newLine)
}
/**
 * freeDraw 手書き描画処理
 */
const _freeDraw = () => {
  if (!_isDrawing) return
  // 描画中のラインを取得
  const line = _layer.findOne(`#${konvaConfig.line.id}`)
  if (!line) return

  const pos = _stage.getPointerPosition()
  const scale = _stage.getAbsoluteScale()
  const newPoints = line.points().concat([pos.x / scale.x, pos.y / scale.y])
  line.points(newPoints)
  _layer.batchDraw()
}
/**
 * freeDrawEnd 手書き描画の終了
 */
const _freeDrawEnd = async () => {
  _isDrawing = false
  undoScrollEvent()
  await _flush()
}
const _floodFill = async () => {
  const pointerPos = {
    x: Math.round(_stage.getPointerPosition().x),
    y: Math.round(_stage.getPointerPosition().y)
  }
  // CanvasのImageDataを取得
  // 仮想Canvas生成
  const canvas = await _convertVirtualCanvas()
  const ctx = canvas.getContext('2d')
  fillContext(
    ctx,
    pointerPos.x * window.devicePixelRatio,
    pointerPos.y * window.devicePixelRatio,
    konvaConfig.floodFill.tolerance,
    konvaConfig.floodFill.bounds.left,
    konvaConfig.floodFill.bounds.top,
    konvaConfig.floodFill.bounds.right,
    konvaConfig.floodFill.bounds.bottom
  )
  _layer.destroyChildren()
  _layer.clear()
  konvaConfig.image.image = canvas
  _image = new Konva.Image(konvaConfig.image)
  _layer.add(_image)
  _stage.draw()
}
/**
 * konva stageを仮想Canvasに変換する
 */
const _convertVirtualCanvas = async () => {
  const scale = window.devicePixelRatio
  // stageをbase64に変換
  const base64 = _stage.toDataURL({
    pixelRatio: scale,
    x: 0,
    y: 0,
    width: konvaConfig.stage.width,
    height: konvaConfig.stage.height
  })
  // 仮想Canvas生成
  const canvas = document.createElement('canvas')
  canvas.style.width = konvaConfig.stage.width + 'px'
  canvas.style.height = konvaConfig.stage.height + 'px'
  canvas.width = konvaConfig.stage.width * scale
  canvas.height = konvaConfig.stage.height * scale
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)
  // base64を仮想Canvasに描画
  const img = await new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.src = base64
  })
  ctx.drawImage(img, 0, 0, konvaConfig.stage.width, konvaConfig.stage.height)
  return canvas
}

// Copyright(c) Max Irwin - 2011, 2015, 2016
// MIT License
// https://github.com/binarymax/floodfill.js
function floodfill(data, x, y, fillcolor, tolerance, width, height) {
  const length = data.length
  const Q = []
  let i = (x + y * width) * 4
  let e = i
  let w = i
  let me
  let mw
  const w2 = width * 4

  const targetcolor = [data[i], data[i + 1], data[i + 2], data[i + 3]]

  if (!pixelCompare(i, targetcolor, fillcolor, data, length, tolerance)) {
    return false
  }
  Q.push(i)
  while (Q.length) {
    i = Q.pop()
    if (
      pixelCompareAndSet(i, targetcolor, fillcolor, data, length, tolerance)
    ) {
      e = i
      w = i
      mw = parseInt(i / w2) * w2 // left bound
      me = mw + w2 // right bound
      while (
        mw <= w &&
        mw <= (w -= 4) &&
        pixelCompareAndSet(w, targetcolor, fillcolor, data, length, tolerance)
      ); // go left until edge hit
      while (
        me >= e &&
        me >= (e += 4) &&
        pixelCompareAndSet(e, targetcolor, fillcolor, data, length, tolerance)
      ); // go right until edge hit
      for (let j = w + 4; j < e; j += 4) {
        if (
          j - w2 >= 0 &&
          pixelCompare(j - w2, targetcolor, fillcolor, data, length, tolerance)
        )
          Q.push(j - w2) // queue y-1
        if (
          j + w2 < length &&
          pixelCompare(j + w2, targetcolor, fillcolor, data, length, tolerance)
        )
          Q.push(j + w2) // queue y+1
      }
    }
  }
  return data
}

function pixelCompare(i, targetcolor, fillcolor, data, length, tolerance) {
  if (i < 0 || i >= length) return false // out of bounds
  if (data[i + 3] === 0 && targetcolor[3] === 0 && fillcolor.a > 0) return true // surface is invisible and fill is visible
  if (
    targetcolor[3] === fillcolor.a &&
    targetcolor[0] === fillcolor.r &&
    targetcolor[1] === fillcolor.g &&
    targetcolor[2] === fillcolor.b
  )
    return false // target is same as fill

  if (
    targetcolor[3] === data[i + 3] &&
    targetcolor[0] === data[i] &&
    targetcolor[1] === data[i + 1] &&
    targetcolor[2] === data[i + 2]
  )
    return true // target matches surface

  if (
    targetcolor[3] > 0 &&
    Math.abs(targetcolor[3] - data[i + 3]) <= 255 - tolerance &&
    Math.abs(targetcolor[0] - data[i]) <= tolerance &&
    Math.abs(targetcolor[1] - data[i + 1]) <= tolerance &&
    Math.abs(targetcolor[2] - data[i + 2]) <= tolerance
  )
    return true // target to surface within tolerance

  return false // no match
}

function pixelCompareAndSet(
  i,
  targetcolor,
  fillcolor,
  data,
  length,
  tolerance
) {
  if (pixelCompare(i, targetcolor, fillcolor, data, length, tolerance)) {
    // fill the color
    data[i] = fillcolor.r
    data[i + 1] = fillcolor.g
    data[i + 2] = fillcolor.b
    data[i + 3] = fillcolor.a
    return true
  }
  return false
}

function fillUint8ClampedArray(data, x, y, color, tolerance, width, height) {
  if (!(data instanceof Uint8ClampedArray))
    throw new Error('data must be an instance of Uint8ClampedArray')
  if (isNaN(width) || width < 1)
    throw new Error("argument 'width' must be a positive integer")
  if (isNaN(height) || height < 1)
    throw new Error("argument 'height' must be a positive integer")
  if (isNaN(x) || x < 0)
    throw new Error("argument 'x' must be a positive integer")
  if (isNaN(y) || y < 0)
    throw new Error("argument 'y' must be a positive integer")
  if (width * height * 4 !== data.length)
    throw new Error('width and height do not fit Uint8ClampedArray dimensions')

  const xi = Math.floor(x)
  const yi = Math.floor(y)

  // eslint-disable-next-line no-console
  if (xi !== x) console.warn('x truncated from', x, 'to', xi)
  // eslint-disable-next-line no-console
  if (yi !== y) console.warn('y truncated from', y, 'to', yi)

  // Maximum tolerance of 254, Default to 0
  tolerance = !isNaN(tolerance)
    ? Math.min(Math.abs(Math.round(tolerance)), 254)
    : 0

  return floodfill(data, xi, yi, color, tolerance, width, height)
}

const getComputedColor = function(c) {
  const temp = document.createElement('div')
  const color = { r: 0, g: 0, b: 0, a: 0 }
  temp.style.color = c
  temp.style.display = 'none'
  document.body.appendChild(temp)
  // Use native window.getComputedStyle to parse any CSS color pattern
  const style = window.getComputedStyle(temp, null).color
  document.body.removeChild(temp)

  const recol = /([.\d]+)/g
  const vals = style.match(recol)
  if (vals && vals.length > 2) {
    // Coerce the string value into an rgba object
    color.r = parseInt(vals[0]) || 0
    color.g = parseInt(vals[1]) || 0
    color.b = parseInt(vals[2]) || 0
    color.a = Math.round((parseFloat(vals[3]) || 1.0) * 255)
  }
  return color
}

function fillContext(ctx, x, y, tolerance, left, top, right, bottom) {
  // Gets the rgba color from the context fillStyle
  const color = getComputedColor(konvaConfig.floodFill.fillColor)
  // Defaults and type checks for image boundaries
  left = isNaN(left) ? 0 : left
  top = isNaN(top) ? 0 : top
  right =
    !isNaN(right) && right
      ? Math.min(Math.abs(right), ctx.canvas.width)
      : ctx.canvas.width
  bottom =
    !isNaN(bottom) && bottom
      ? Math.min(Math.abs(bottom), ctx.canvas.height)
      : ctx.canvas.height

  const image = ctx.getImageData(left, top, right, bottom)

  const data = image.data
  const width = image.width
  const height = image.height

  if (width > 0 && height > 0) {
    fillUint8ClampedArray(data, x, y, color, tolerance, width, height)
    ctx.putImageData(image, left, top)
  }
}
const addImageFile = (img) => {
  konvaConfig.mode = MODE.UPLOAD
  const stageSize = {
    width: _stage.width() - 10,
    height: _stage.height() - 10
  }
  const scale = Math.min(
    img.width > stageSize.width ? stageSize.width / img.width : 1,
    img.height > stageSize.height ? stageSize.height / img.height : 1
  )
  const uploadImage = new Konva.Image({
    x: 5,
    y: 5,
    image: img,
    width: img.width * scale,
    height: img.height * scale,
    draggable: true
  })
  _layer.add(uploadImage)
  const tr = new Konva.Transformer({
    nodes: [uploadImage],
    keepRatio: false,
    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
  })
  _layer.add(tr)
  _layer.batchDraw()
  _awaitFlush = MODE.UPLOAD
}
export default ({ app }, inject) => {
  inject('konva', {
    get config() {
      return konvaConfig
    },
    get dataURL() {
      return _stage.toDataURL({
        pixelRatio: window.devicePixelRatio,
        x: 0,
        y: 0,
        width: konvaConfig.stage.width,
        height: konvaConfig.stage.height
      })
    },
    get canUndo() {
      return stack.undo.length > 0
    },
    get canRedo() {
      return stack.redo.length > 0
    },
    build,
    addImageFile,
    undo,
    redo
  })
}
