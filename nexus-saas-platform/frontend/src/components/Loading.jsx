function Loading({ fullScreen = false, text = "Loading..." }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <div className="absolute h-12 w-12 animate-ping rounded-full bg-violet-600/30" />
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-violet-500 border-t-transparent shadow-lg shadow-violet-500/50" />
      </div>
      {text && (
        <p className="text-xs font-medium tracking-wider uppercase text-slate-400">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07080d]/90 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return <div className="py-12">{content}</div>;
}

export default Loading;
