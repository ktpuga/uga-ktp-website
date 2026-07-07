export default function PhotoMedia({ photo }) {
  const src = `/api/photos/${photo.id}/media`;
  if (photo.media_type === 'video') {
    return <video src={src} controls className="h-full w-full object-cover" />;
  }
  return <img src={src} alt={photo.title || 'Photo'} className="h-full w-full object-cover" />;
}
