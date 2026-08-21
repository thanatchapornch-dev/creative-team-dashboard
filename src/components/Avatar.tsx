function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

export function Avatar({
  name,
  src,
  size = 40,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  const style = { width: size, height: size, fontSize: size * 0.4 };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className="avatar" style={style} />;
  }
  return (
    <div className="avatar" style={style}>
      {initials(name)}
    </div>
  );
}
