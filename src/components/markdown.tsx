import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Perender isi tulisan/proyek.
 *
 * react-markdown tidak mengeksekusi HTML mentah secara bawaan, jadi isi yang
 * ditulis lewat panel admin tidak bisa menyelipkan skrip. Jangan menambahkan
 * rehype-raw di sini tanpa penyaring.
 */
export function Markdown({
  children,
  className,
}: {
  children?: string | null;
  className?: string;
}) {
  if (!children?.trim()) return null;

  return (
    <div className={cn("prose-body", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children: isi }) => {
            const eksternal = Boolean(href && /^https?:\/\//.test(href));
            return (
              <a
                href={href}
                target={eksternal ? "_blank" : undefined}
                rel={eksternal ? "noopener noreferrer" : undefined}
              >
                {isi}
              </a>
            );
          },
          // Tabel lebar menggulir di dalam wadahnya sendiri; halaman tidak
          // pernah ikut melebar ke samping.
          table: ({ children: isi }) => (
            <div className="table-scroll">
              <table>{isi}</table>
            </div>
          ),
          img: ({ src, alt }) =>
            typeof src === "string" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={alt ?? ""} loading="lazy" decoding="async" />
            ) : null,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
