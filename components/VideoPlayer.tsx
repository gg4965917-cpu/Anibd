type Props = {
  /** AniHub ID — Ashdi.vip indexes anime by AniHub's internal ID. */
  anihubId: number;
  title: string;
};

// Single, canonical video source for the whole site. Ashdi.vip provides its
// own UI for selecting episode + dubbing group inside the iframe, so we do
// not build custom controls around it.
export function VideoPlayer({ anihubId, title }: Props) {
  const src = `https://ashdi.vip/vod/${anihubId}`;
  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
      <iframe
        src={src}
        title={`Дивитися ${title} українською онлайн`}
        width="100%"
        height="100%"
        allowFullScreen
        allow="autoplay; encrypted-media"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}
