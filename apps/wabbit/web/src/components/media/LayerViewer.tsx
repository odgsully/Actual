import { useState } from 'react'
import type { LayerEntry } from '@/types/app'

interface Props {
  layers: LayerEntry[]
  imageUrl: string
}

export function LayerViewer({ layers: initialLayers, imageUrl }: Props) {
  const [layers, setLayers] = useState(
    initialLayers.map((l, i) => ({ ...l, id: i }))
  )

  function toggleLayer(index: number) {
    setLayers((prev) =>
      prev.map((l, i) => (i === index ? { ...l, visible: !l.visible } : l))
    )
  }

  const allVisible = layers.every((l) => l.visible)

  return (
    <div className="flex gap-3">
      {/* Layer list */}
      <div className="w-48 space-y-1 flex-shrink-0">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-xs text-white/40 uppercase tracking-wider">Layers</span>
          <button
            onClick={() =>
              setLayers((prev) => prev.map((l) => ({ ...l, visible: !allVisible })))
            }
            className="text-[10px] text-white/30 hover:text-white/60 transition-colors duration-700"
          >
            {allVisible ? 'Hide All' : 'Show All'}
          </button>
        </div>

        {layers.map((layer, i) => (
          <button
            key={i}
            onClick={() => toggleLayer(i)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-700 ${
              layer.visible
                ? 'text-white/80 hover:bg-white/5'
                : 'text-white/30 hover:bg-white/5'
            }`}
          >
            {/* Eye icon */}
            <svg
              className={`w-4 h-4 flex-shrink-0 transition-opacity duration-700 ${
                layer.visible ? 'opacity-100' : 'opacity-30'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {layer.visible ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              )}
            </svg>
            <span className="text-sm truncate">{layer.name}</span>
          </button>
        ))}
      </div>

      {/* Preview — layers as CSS opacity */}
      <div className="flex-1 relative bg-white/5 rounded-xl overflow-hidden">
        <img
          src={imageUrl}
          alt="Base"
          className="w-full h-full object-contain"
        />
        {/* In a real implementation, each layer would be a separate image overlay */}
      </div>
    </div>
  )
}
