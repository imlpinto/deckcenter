'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Camera, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { uploadAvatar } from '@/lib/actions/profile'

interface AvatarUploadProps {
  currentUrl: string | null
  displayName: string
}

const MAX_SIZE = 1024 * 1024 // 1 MB

export function AvatarUpload({ currentUrl, displayName }: AvatarUploadProps) {
  const router = useRouter()
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (selected.size > MAX_SIZE) {
      setError('La imagen no puede superar 1 MB')
      e.target.value = ''
      return
    }
    setError(null)
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
  }

  async function handleSave() {
    if (!file) return
    setIsPending(true)
    const formData = new FormData()
    formData.append('avatar', file)
    const result = await uploadAvatar(formData)
    setIsPending(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setPreview(null)
      setFile(null)
      router.refresh()
    }
  }

  function handleCancel() {
    setPreview(null)
    setFile(null)
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const initials = displayName.slice(0, 2).toUpperCase()
  const imgSrc = preview ?? currentUrl

  return (
    <div className="flex items-center gap-5">
      {/* Círculo de avatar */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="relative flex-shrink-0 group cursor-pointer"
      >
        <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={displayName}
              width={80}
              height={80}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <span className="text-xl font-bold text-muted-foreground select-none">{initials}</span>
          )}
        </div>
        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="h-5 w-5 text-white" />
        </div>
      </button>

      {/* Info y acciones */}
      <div className="space-y-1.5">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="text-sm font-medium hover:text-yellow-400 transition-colors block"
        >
          {imgSrc ? 'Cambiar foto de perfil' : 'Subir foto de perfil'}
        </button>
        <p className="text-xs text-muted-foreground">JPG, PNG o WEBP · máx. 1 MB</p>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {preview && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 text-xs bg-yellow-400 text-slate-900 rounded-md px-3 py-1.5 font-medium hover:bg-yellow-300 disabled:opacity-60 transition-colors"
            >
              {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              {isPending ? 'Subiendo...' : 'Guardar foto'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
