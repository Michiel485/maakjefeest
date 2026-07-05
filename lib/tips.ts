import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { remark } from "remark"
import remarkHtml from "remark-html"

const TIPS_DIR = path.join(process.cwd(), "content/tips")

export interface TipMeta {
  slug: string
  title: string
  date: string
  description: string
  image?: string
}

export interface Tip extends TipMeta {
  html: string
}

export function getAllTips(): TipMeta[] {
  const files = fs.readdirSync(TIPS_DIR).filter(f => f.endsWith(".md"))
  return files
    .map(filename => {
      const slug = filename.replace(/\.md$/, "")
      const raw = fs.readFileSync(path.join(TIPS_DIR, filename), "utf-8")
      const { data } = matter(raw)
      return { slug, title: data.title, date: data.date, description: data.description, image: data.image }
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export async function getTip(slug: string): Promise<Tip | null> {
  const filePath = path.join(TIPS_DIR, `${slug}.md`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, "utf-8")
  const { data, content } = matter(raw)
  const processed = await remark().use(remarkHtml).process(content)
  return {
    slug,
    title: data.title,
    date: data.date,
    description: data.description,
    image: data.image,
    html: processed.toString(),
  }
}
