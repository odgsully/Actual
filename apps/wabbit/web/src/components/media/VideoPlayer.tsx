import { useRef, useState, useEffect } from 'react'
import type { VideoChapter } from '@/types/app'

interface Props {
  src: string
  chapters?: VideoChapter[]
}

export function VideoPlayer({ src, chapters = [] }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    function onTimeUpdate() { setCurrentTime(video!.currentTime) }
    function onLoaded() { setDuration(video!.duration) }
    function onPlay() { setPlaying(true) }
    function onPause() { setPlaying(false) }

    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('loadedmetadata', onLoaded)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('loadedmetadata', onLoaded)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
    }
  }, [])

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (playing) video.pause()
    else video.play()
  }

  function seekTo(time: number) {
    const video = videoRef.current
    if (!video) return
    video.currentTime = time
  }

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    seekTo(pct * duration)
  }

  function toggleFullscreen() {
    const video = videoRef.current
    if (!video) return
    if (document.fullscreenElement) document.exitFullscreen()
    else video.requestFullscreen()
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="relative group">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain bg-black rounded-xl"
        playsInline
      />

      {/* Controls overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-md rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        {/* Progress bar */}
        <div
          className="relative h-1 cursor-pointer mx-3 mt-2"
          onClick={handleProgressClick}
        >
          <div className="absolute inset-0 bg-white/20 rounded-full" />
          <div
            className="absolute inset-y-0 left-0 bg-white/60 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
          {/* Chapter markers */}
          {chapters.map((ch, i) => {
            const pct = duration > 0 ? (ch.time / duration) * 100 : 0
            return (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); seekTo(ch.time) }}
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/80 hover:bg-white hover:scale-150 transition-all duration-300"
                style={{ left: `${pct}%` }}
                title={ch.label}
              />
            )
          })}
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3 px-3 py-2">
          {/* Play/Pause */}
          <button onClick={togglePlay} className="text-white/80 hover:text-white transition-colors">
            {playing ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Time */}
          <span className="text-xs text-white/50 tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Volume */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              setVolume(v)
              if (videoRef.current) videoRef.current.volume = v
            }}
            className="w-16 accent-white/60"
          />

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="text-white/60 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          </button>
        </div>

        {/* Chapter labels */}
        {chapters.length > 0 && (
          <div className="flex gap-1 px-3 pb-2 overflow-x-auto">
            {chapters.map((ch, i) => (
              <button
                key={i}
                onClick={() => seekTo(ch.time)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50 hover:bg-white/20 hover:text-white/80 transition-all duration-300 whitespace-nowrap"
              >
                {formatTime(ch.time)} {ch.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
