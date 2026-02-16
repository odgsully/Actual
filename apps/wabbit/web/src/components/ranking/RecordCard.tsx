import { VideoPlayer } from '@/components/media/VideoPlayer'
import { AudioPlayer } from '@/components/media/AudioPlayer'
import { LayerViewer } from '@/components/media/LayerViewer'
import type { Database } from '@/types/database'
import type { VideoChapter, LayerEntry } from '@/types/app'

type RecordRow = Database['public']['Tables']['records']['Row']

interface Props {
  record: RecordRow
  outputType: string
}

export function RecordCard({ record, outputType }: Props) {
  const metadata = record.metadata as { [key: string]: unknown } | null
  const imageUrl = metadata?.image_url as string | undefined
  const textContent = metadata?.text_content as string | undefined
  const audioUrl = metadata?.audio_url as string | undefined
  const videoUrl = metadata?.video_url as string | undefined
  const chapters = metadata?.chapters as VideoChapter[] | undefined
  const layers = metadata?.layers as LayerEntry[] | undefined

  // If record has layers, show layer viewer alongside content
  if (layers && layers.length > 0 && imageUrl) {
    return (
      <div className="glass-card overflow-hidden">
        <div className="p-4">
          <LayerViewer layers={layers} imageUrl={imageUrl} />
        </div>
        <RecordInfo record={record} />
      </div>
    )
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Media area */}
      <div className="aspect-[4/3] bg-white/5 flex items-center justify-center">
        {outputType === 'image' && imageUrl ? (
          <img
            src={imageUrl}
            alt={record.title}
            className="w-full h-full object-contain"
          />
        ) : outputType === 'video' && videoUrl ? (
          <VideoPlayer src={videoUrl} chapters={chapters} />
        ) : outputType === 'video' ? (
          <div className="text-white/30 text-sm">No video URL provided</div>
        ) : outputType === 'text' && textContent ? (
          <div className="p-6 overflow-y-auto h-full w-full">
            <p className="text-white/80 whitespace-pre-wrap">{textContent}</p>
          </div>
        ) : outputType === 'audio' && audioUrl ? (
          <div className="p-6 w-full">
            <AudioPlayer src={audioUrl} title={record.title} />
          </div>
        ) : outputType === '3d' ? (
          <div className="text-white/30 text-sm">3D Viewer — Phase 2</div>
        ) : outputType === 'deck' ? (
          <div className="text-white/30 text-sm">Deck Viewer — Phase 2</div>
        ) : (
          <div className="text-white/30 text-sm">No preview available</div>
        )}
      </div>

      <RecordInfo record={record} />
    </div>
  )
}

function RecordInfo({ record }: { record: RecordRow }) {
  return (
    <div className="p-4">
      <h3 className="font-medium text-white mb-1">{record.title}</h3>
      {record.description && (
        <p className="text-white/50 text-sm line-clamp-2">
          {record.description}
        </p>
      )}
    </div>
  )
}
